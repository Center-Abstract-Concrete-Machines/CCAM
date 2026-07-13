import Stripe from 'stripe';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
    readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
        .map((line) => {
            const idx = line.indexOf('=');
            return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
        })
);

if (!env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY in .env');
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
