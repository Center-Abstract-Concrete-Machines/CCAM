#!/usr/bin/env node

import fs from 'node:fs/promises';

function parseArgs(argv) {
    const [command, ...rest] = argv;
    const flags = new Map();

    for (let i = 0; i < rest.length; i += 1) {
        const current = rest[i];
        if (!current.startsWith('--')) continue;

        const key = current.slice(2);
        const next = rest[i + 1];
        if (!next || next.startsWith('--')) {
            flags.set(key, 'true');
        } else {
            flags.set(key, next);
            i += 1;
        }
    }

    return { command, flags };
}

function printUsage() {
    console.log(`Usage:
  node scripts/admin-variant-stock.mjs list --content-id <id> [--base-url <url>] [--token <token>]
  node scripts/admin-variant-stock.mjs list --stripe-product-id <prod_...> [--base-url <url>] [--token <token>]
  node scripts/admin-variant-stock.mjs set --price-id <price_...> --count <number> [--base-url <url>] [--token <token>]
  node scripts/admin-variant-stock.mjs bulk --file <path.json> [--base-url <url>] [--token <token>]

Notes:
  - Default base URL: http://localhost:4321
  - Token falls back to STORE_ADMIN_TOKEN env var
  - Bulk file format: [{"priceId":"price_...","inventoryCount":12}]`);
}

function getToken(flags) {
    const token = flags.get('token') ?? process.env.STORE_ADMIN_TOKEN;
    if (!token) {
        throw new Error('Missing admin token. Pass --token or set STORE_ADMIN_TOKEN.');
    }
    return token;
}

function getBaseUrl(flags) {
    return (flags.get('base-url') ?? 'http://localhost:4321').replace(/\/$/, '');
}

async function requestJson(url, init) {
    const res = await fetch(url, init);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        throw new Error(data?.error ?? `Request failed with status ${res.status}`);
    }

    return data;
}

async function run() {
    const { command, flags } = parseArgs(process.argv.slice(2));

    if (!command || command === 'help' || command === '--help') {
        printUsage();
        return;
    }

    const token = getToken(flags);
    const baseUrl = getBaseUrl(flags);
    const endpoint = `${baseUrl}/api/store/admin/variant-stock`;

    if (command === 'list') {
        const contentId = flags.get('content-id');
        const stripeProductId = flags.get('stripe-product-id');

        if (!contentId && !stripeProductId) {
            throw new Error('Provide --content-id or --stripe-product-id for list command.');
        }

        const query = new URLSearchParams();
        if (contentId) query.set('contentId', contentId);
        if (stripeProductId) query.set('stripeProductId', stripeProductId);

        const data = await requestJson(`${endpoint}?${query.toString()}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log(JSON.stringify(data, null, 2));
        return;
    }

    if (command === 'set') {
        const priceId = flags.get('price-id');
        const countRaw = flags.get('count');
        const inventoryCount = Number.parseInt(countRaw ?? '', 10);

        if (!priceId || !countRaw || Number.isNaN(inventoryCount) || inventoryCount < 0) {
            throw new Error('set requires --price-id <price_...> and --count <0+ integer>.');
        }

        const data = await requestJson(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                updates: [{ priceId, inventoryCount }],
            }),
        });

        console.log(JSON.stringify(data, null, 2));
        return;
    }

    if (command === 'bulk') {
        const filePath = flags.get('file');
        if (!filePath) {
            throw new Error('bulk requires --file <path.json>.');
        }

        const fileContent = await fs.readFile(filePath, 'utf8');
        const updates = JSON.parse(fileContent);

        if (!Array.isArray(updates)) {
            throw new Error('Bulk file must be an array of { priceId, inventoryCount }.');
        }

        const data = await requestJson(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ updates }),
        });

        console.log(JSON.stringify(data, null, 2));
        return;
    }

    throw new Error(`Unknown command: ${command}`);
}

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
