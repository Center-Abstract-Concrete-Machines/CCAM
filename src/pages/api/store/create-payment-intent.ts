export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { z } from 'astro/zod';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

const schema = z.object({
    priceId: z.string().startsWith('price_'),
    quantity: z.number().int().min(1).max(10),
    variantSize: z.string().trim().min(1).max(30).optional(),
    variantLabel: z.string().trim().min(1).max(40).optional(),
});

export const POST: APIRoute = async ({ request }) => {
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

    const { priceId, quantity, variantSize, variantLabel } = parsed.data;

    // Fetch the price from Stripe so the amount is always authoritative server-side
    let price: Stripe.Price;
    try {
        price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    } catch {
        return new Response(JSON.stringify({ error: 'Price not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!price.unit_amount || price.type !== 'one_time') {
        return new Response(JSON.stringify({ error: 'Invalid price' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const product = price.product as Stripe.Product;
    if (!product.active) {
        return new Response(JSON.stringify({ error: 'Product unavailable' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Prefer per-price inventory for size variants, fallback to product-level inventory.
    const inventoryValue =
        price.metadata.inventory_count ?? product.metadata.inventory_count;
    if (inventoryValue) {
        const inventoryCount = Number.parseInt(inventoryValue, 10);
        if (Number.isNaN(inventoryCount) || inventoryCount < 0) {
            return new Response(
                JSON.stringify({
                    error: 'Product inventory is misconfigured',
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        if (quantity > inventoryCount) {
            return new Response(
                JSON.stringify({
                    error: 'Not enough inventory available',
                    available: inventoryCount,
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }
    }

    const resolvedVariantSize =
        variantSize ?? price.metadata.size ?? product.metadata.size;
    const resolvedVariantLabel =
        variantLabel ?? price.metadata.size_label ?? resolvedVariantSize;
    const inventoryLevel = price.metadata.inventory_count ? 'price' : 'product';

    const paymentIntent = await stripe.paymentIntents.create({
        amount: price.unit_amount * quantity,
        currency: price.currency,
        automatic_payment_methods: { enabled: true },
        description: resolvedVariantLabel
            ? `${product.name} (${resolvedVariantLabel})`
            : product.name,
        metadata: {
            priceId,
            productId: product.id,
            productName: product.name,
            quantity: String(quantity),
            inventoryTracked: inventoryValue ? 'true' : 'false',
            inventoryLevel,
            inventoryAdjusted: 'false',
            confirmationEmailSent: 'false',
            variantSize: resolvedVariantSize ?? '',
            variantLabel: resolvedVariantLabel ?? '',
        },
    });

    return new Response(
        JSON.stringify({ clientSecret: paymentIntent.client_secret }),
        { headers: { 'Content-Type': 'application/json' } }
    );
};
