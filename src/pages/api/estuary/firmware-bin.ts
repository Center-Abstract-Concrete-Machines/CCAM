export const prerender = false;

import type { APIRoute } from 'astro';

// GitHub release downloads don't send CORS headers, so the browser can't fetch
// firmware binaries directly. This proxies them server-side. Only URLs from the
// CCAM-Earth-CPP releases are allowed so this can't be used as an open proxy.
const ALLOWED_PREFIX =
    'https://github.com/Center-Abstract-Concrete-Machines/CCAM-Earth-CPP/releases/download/';
const MAX_BYTES = 4 * 1024 * 1024;

export const GET: APIRoute = async ({ url }) => {
    const target = url.searchParams.get('url') ?? '';
    if (!target.startsWith(ALLOWED_PREFIX) || !target.endsWith('.bin') || target.includes('..')) {
        return new Response('Invalid firmware URL', { status: 400 });
    }

    try {
        const res = await fetch(target, { redirect: 'follow' });
        if (!res.ok) {
            return new Response(`Upstream error: ${res.status}`, { status: 502 });
        }
        const body = await res.arrayBuffer();
        if (body.byteLength > MAX_BYTES) {
            return new Response('Firmware too large', { status: 502 });
        }
        return new Response(body, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Cache-Control': 'public, max-age=300',
            },
        });
    } catch (e: any) {
        return new Response(`Proxy error: ${e?.message ?? e}`, { status: 502 });
    }
};
