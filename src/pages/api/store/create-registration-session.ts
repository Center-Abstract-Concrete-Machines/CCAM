export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import Stripe from 'stripe';
import { getStripeServerClient } from '@utils/stripeServer';

const stripe = getStripeServerClient();

const schema = z.object({
    priceId: z.string().startsWith('price_'),
    quantity: z.number().int().min(1).max(20),
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

    const { priceId, quantity } = parsed.data;

    let price: Stripe.Price;
    try {
        price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    } catch {
        return new Response(JSON.stringify({ error: 'Price not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (price.type !== 'one_time') {
        return new Response(JSON.stringify({ error: 'Invalid price' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const product = price.product as Stripe.Product;
    if (!product.active) {
        return new Response(JSON.stringify({ error: 'Registration unavailable' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Check inventory (capacity) if tracked
    const inventoryCount = parseInventoryCount(
        price.metadata.inventory_count ?? product.metadata.inventory_count
    );
    if (typeof inventoryCount === 'number' && quantity > inventoryCount) {
        return new Response(
            JSON.stringify({
                error: `Not enough spots available. ${inventoryCount} remaining.`,
                available: inventoryCount,
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    const isFree = !price.unit_amount || price.unit_amount === 0;
    const origin = url.origin;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        line_items: [{ price: priceId, quantity }],
        success_url: `${origin}/store/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/register/${product.metadata.contentId ?? product.id}`,
        customer_creation: 'always',
        // Tag as a workshop registration so the webhook sends the right email
        metadata: {
            isRegistration: 'true',
            workshopName: product.name,
        },
    };

    // Skip payment method for free registrations
    if (isFree) {
        sessionParams.payment_method_collection = 'if_required';
    } else {
        sessionParams.allow_promotion_codes = true;
    }

    let session: Stripe.Checkout.Session;
    try {
        session = await stripe.checkout.sessions.create(sessionParams);
    } catch (err) {
        console.error('Failed to create registration session:', err);
        return new Response(JSON.stringify({ error: 'Failed to create registration' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ url: session.url }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
