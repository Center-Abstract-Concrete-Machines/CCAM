export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

const schema = z.object({
    items: z
        .array(
            z.object({
                priceId: z.string().startsWith('price_'),
                quantity: z.number().int().min(1).max(10),
                variantSize: z.string().trim().min(1).max(30).optional(),
                variantLabel: z.string().trim().min(1).max(40).optional(),
            })
        )
        .min(1)
        .max(20),
});

function parseInventoryCount(value: string | undefined) {
    if (!value) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

export const POST: APIRoute = async ({ request, url }) => {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const quantityByPriceAndSize = new Map<string, {
        priceId: string;
        quantity: number;
        variantSize?: string;
        variantLabel?: string;
    }>();
    for (const item of parsed.data.items) {
        const key = `${item.priceId}::${item.variantSize ?? ''}`;
        const existing = quantityByPriceAndSize.get(key);
        if (existing) {
            existing.quantity += item.quantity;
        } else {
            quantityByPriceAndSize.set(key, {
                priceId: item.priceId,
                quantity: item.quantity,
                variantSize: item.variantSize,
                variantLabel: item.variantLabel,
            });
        }
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of quantityByPriceAndSize.values()) {
        const price = await stripe.prices.retrieve(item.priceId, {
            expand: ['product'],
        });

        if (!price.active || !price.unit_amount || price.type !== 'one_time') {
            return new Response(
                JSON.stringify({ error: `Invalid or inactive price: ${item.priceId}` }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const product = price.product as Stripe.Product;
        if (!product.active) {
            return new Response(
                JSON.stringify({ error: `Product unavailable: ${product.name}` }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const inventoryCount = parseInventoryCount(
            price.metadata.inventory_count ?? product.metadata.inventory_count
        );
        if (typeof inventoryCount === 'number' && item.quantity > inventoryCount) {
            return new Response(
                JSON.stringify({
                    error: `Not enough inventory for ${product.name}. ${inventoryCount} left.`,
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const resolvedVariantSize =
            item.variantSize ?? price.metadata.size ?? product.metadata.size;
        const resolvedVariantLabel =
            item.variantLabel ?? price.metadata.size_label ?? resolvedVariantSize;
        const displayName = resolvedVariantLabel
            ? `${product.name} (${resolvedVariantLabel})`
            : product.name;

        lineItems.push({
            quantity: item.quantity,
            price_data: {
                currency: price.currency,
                unit_amount: price.unit_amount,
                metadata: {
                    sourcePriceId: price.id,
                    sourceProductId: product.id,
                    variantSize: resolvedVariantSize ?? '',
                    variantLabel: resolvedVariantLabel ?? '',
                    inventoryLevel: price.metadata.inventory_count ? 'price' : 'product',
                },
                product_data: {
                    name: displayName,
                },
            },
        });
    }

    const origin = url.origin;

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/store/cart`,
        shipping_address_collection: {
            allowed_countries: ['US', 'CA'],
        },
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
