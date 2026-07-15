import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripeServerClient() {
    if (stripe) return stripe;

    const apiKey = import.meta.env.STRIPE_SECRET_KEY?.trim();

    if (!apiKey) {
        throw new Error(
            'Missing STRIPE_SECRET_KEY. Update your local .env and restart the Astro dev server.'
        );
    }

    stripe = new Stripe(apiKey);
    return stripe;
}