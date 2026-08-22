export const prerender = false;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { z } from 'astro/zod';
import Stripe from 'stripe';
import { getStripeServerClient } from '@utils/stripeServer';

const stripe = getStripeServerClient();

const listQuerySchema = z
    .object({
        contentId: z.string().trim().min(1).optional(),
        stripeProductId: z.string().startsWith('prod_').optional(),
    })
    .refine((value) => Boolean(value.contentId) || Boolean(value.stripeProductId), {
        message: 'Provide contentId or stripeProductId',
    });

const updateSchema = z.object({
    updates: z
        .array(
            z.object({
                priceId: z.string().startsWith('price_'),
                inventoryCount: z.number().int().min(0),
            })
        )
        .min(1)
        .max(100),
    dryRun: z.boolean().optional().default(false),
});

function getIncomingAdminToken(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
        return authHeader.slice(7).trim();
    }

    return request.headers.get('x-admin-token')?.trim() ?? null;
}

function authorize(request: Request) {
    const configuredToken = import.meta.env.STORE_ADMIN_TOKEN;
    if (!configuredToken) {
        return new Response(
            JSON.stringify({
                error: 'STORE_ADMIN_TOKEN is not configured on the server',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    const incomingToken = getIncomingAdminToken(request);
    if (!incomingToken || incomingToken !== configuredToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return null;
}

function parseInventoryCount(value: string | undefined) {
    if (!value) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

export const GET: APIRoute = async ({ request, url }) => {
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    const parsedQuery = listQuerySchema.safeParse({
        contentId: url.searchParams.get('contentId') ?? undefined,
        stripeProductId: url.searchParams.get('stripeProductId') ?? undefined,
    });

    if (!parsedQuery.success) {
        return new Response(
            JSON.stringify({ error: parsedQuery.error.issues[0]?.message ?? 'Invalid query' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    const storeEntries = await getCollection('storeProducts');

    const contentEntry = parsedQuery.data.contentId
        ? storeEntries.find((entry) => entry.id === parsedQuery.data.contentId)
        : storeEntries.find(
            (entry) => entry.data.stripeProductId === parsedQuery.data.stripeProductId
        );

    const stripeProductId =
        parsedQuery.data.stripeProductId ?? contentEntry?.data.stripeProductId;

    if (!stripeProductId) {
        return new Response(
            JSON.stringify({
                error: 'Could not resolve Stripe product. Provide a valid contentId or stripeProductId.',
            }),
            {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    const stripeProduct = await stripe.products.retrieve(stripeProductId);
    const prices = await stripe.prices.list({
        product: stripeProductId,
        active: true,
        limit: 100,
    });

    const sizeByPriceId = new Map(
        (contentEntry?.data.sizeVariants ?? []).map((variant) => [
            variant.stripePriceId,
            {
                size: variant.size,
                label: variant.label ?? variant.size,
            },
        ])
    );

    const variants = prices.data
        .filter((price) => Boolean(price.unit_amount) && price.type === 'one_time')
        .map((price) => {
            const variantFromContent = sizeByPriceId.get(price.id);
            const size =
                variantFromContent?.size ?? price.metadata.size ?? price.metadata.variantSize;
            const sizeLabel =
                variantFromContent?.label ??
                price.metadata.size_label ??
                price.metadata.variantLabel ??
                size ??
                '';

            return {
                priceId: price.id,
                nickname: price.nickname,
                unitAmount: price.unit_amount,
                currency: price.currency,
                size,
                sizeLabel,
                inventoryCount: parseInventoryCount(
                    price.metadata.inventory_count ?? stripeProduct.metadata.inventory_count
                ),
                inventoryLevel: price.metadata.inventory_count ? 'price' : 'product',
                active: price.active,
            };
        })
        .sort((a, b) => a.sizeLabel.localeCompare(b.sizeLabel));

    return new Response(
        JSON.stringify({
            contentId: contentEntry?.id ?? null,
            stripeProductId,
            productName: stripeProduct.name,
            variants,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
};

export const POST: APIRoute = async ({ request }) => {
    const authFailure = authorize(request);
    if (authFailure) return authFailure;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const parsedBody = updateSchema.safeParse(body);
    if (!parsedBody.success) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const results: Array<{
        priceId: string;
        previousInventoryCount: number | null;
        newInventoryCount: number;
        inventoryLevel: 'price';
    }> = [];

    for (const update of parsedBody.data.updates) {
        const price = await stripe.prices.retrieve(update.priceId);
        const previousInventoryCount = parseInventoryCount(
            price.metadata.inventory_count
        );

        if (!parsedBody.data.dryRun) {
            await stripe.prices.update(update.priceId, {
                metadata: {
                    ...price.metadata,
                    inventory_count: String(update.inventoryCount),
                },
            });
        }

        results.push({
            priceId: update.priceId,
            previousInventoryCount,
            newInventoryCount: update.inventoryCount,
            inventoryLevel: 'price',
        });
    }

    return new Response(
        JSON.stringify({
            updated: results,
            dryRun: parsedBody.data.dryRun,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
};
