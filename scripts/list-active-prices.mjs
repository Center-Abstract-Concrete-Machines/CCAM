import Stripe from 'stripe';
import { loadScriptEnv } from './_env.mjs';

const env = loadScriptEnv();

if (!env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY in .env.local or .env');
    process.exit(1);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const prices = await stripe.prices.list({
    active: true,
    limit: 100,
    expand: ['data.product'],
});

for (const price of prices.data) {
    if (!price.unit_amount || price.type !== 'one_time') continue;

    const product = price.product;
    if (!product || typeof product === 'string' || !product.active) continue;

    const fulfillment = product.metadata.fulfillment ?? '';
    console.log(
        [
            price.id,
            product.id,
            product.name,
            fulfillment,
            price.currency,
            String(price.unit_amount),
        ].join(' | ')
    );
}
