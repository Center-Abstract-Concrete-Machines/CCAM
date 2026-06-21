/**
 * Export workshop registrations to CSV.
 *
 * Usage:
 *   node scripts/export-registrations.mjs --product prod_xxxx
 *   node scripts/export-registrations.mjs --product prod_xxxx --out registrants.csv
 */

import Stripe from 'stripe';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env manually
const envPath = resolve(process.cwd(), '.env');
const envVars = Object.fromEntries(
    readFileSync(envPath, 'utf8')
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))
        .map((line) => {
            const idx = line.indexOf('=');
            return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
        })
);

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);

// Parse CLI args
const args = process.argv.slice(2);
const productId = args[args.indexOf('--product') + 1];
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;

if (!productId?.startsWith('prod_')) {
    console.error('Usage: node scripts/export-registrations.mjs --product prod_xxxx [--out file.csv]');
    process.exit(1);
}

console.log(`Fetching registrations for ${productId}…`);

// Get the product so we can find its prices
const product = await stripe.products.retrieve(productId);
const prices = await stripe.prices.list({ product: productId, limit: 100 });
const priceIds = new Set(prices.data.map((p) => p.id));

console.log(`Product: ${product.name}`);
console.log(`Scanning checkout sessions…`);

// Page through all completed checkout sessions tagged as registrations
const registrants = [];
let hasMore = true;
let startingAfter = undefined;

while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        expand: ['data.line_items'],
    });

    for (const session of sessions.data) {
        if (session.payment_status !== 'paid' && session.status !== 'complete') continue;
        if (session.metadata?.isRegistration !== 'true') continue;

        // Match by product name or line items containing one of this product's prices
        const lineItems = session.line_items?.data ?? [];
        const matchesProduct =
            session.metadata?.workshopName === product.name ||
            lineItems.some((item) => item.price && priceIds.has(item.price.id));

        if (!matchesProduct) continue;

        const name = session.customer_details?.name ?? '';
        const email = session.customer_details?.email ?? '';
        const date = new Date(session.created * 1000).toLocaleDateString('en-US');

        registrants.push({ name, email, date });
    }

    hasMore = sessions.has_more;
    if (hasMore) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
    }
}

if (registrants.length === 0) {
    console.log('No registrations found.');
    process.exit(0);
}

console.log(`\nFound ${registrants.length} registrant(s):\n`);
console.log('Name'.padEnd(30) + 'Email'.padEnd(35) + 'Registered');
console.log('-'.repeat(75));
for (const r of registrants) {
    console.log(r.name.padEnd(30) + r.email.padEnd(35) + r.date);
}

// Write CSV
const csvLines = [
    'Name,Email,Registered',
    ...registrants.map((r) => `"${r.name}","${r.email}","${r.date}"`),
];
const csv = csvLines.join('\n');

if (outFile) {
    writeFileSync(outFile, csv, 'utf8');
    console.log(`\nSaved to ${outFile}`);
} else {
    const defaultFile = `registrations-${productId}.csv`;
    writeFileSync(defaultFile, csv, 'utf8');
    console.log(`\nSaved to ${defaultFile}`);
}
