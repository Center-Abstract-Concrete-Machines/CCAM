import type { APIRoute } from 'astro';

const GITHUB_RELEASES_URL =
    'https://api.github.com/repos/Center-Abstract-Concrete-Machines/CCAM-Earth-CPP/releases/latest';

export const GET: APIRoute = async () => {
    try {
        const releaseRes = await fetch(GITHUB_RELEASES_URL);
        if (!releaseRes.ok) {
            return json({ error: `GitHub API error: ${releaseRes.status}` }, releaseRes.status);
        }
        const release = await releaseRes.json();

        const manifestAsset = (release.assets ?? []).find((a: any) => a.name === 'firmware-manifest.json');
        if (!manifestAsset) {
            return json({ error: 'No firmware-manifest.json found in latest release.' }, 404);
        }

        const manifestRes = await fetch(manifestAsset.browser_download_url);
        if (!manifestRes.ok) {
            return json({ error: `Failed to fetch manifest: ${manifestRes.status}` }, manifestRes.status);
        }
        const manifest = await manifestRes.json();

        // manifest shape: { firmwares: [{id, name, hardware, file, url, description, io}] }
        const firmwares: any[] = manifest.firmwares ?? [];
        const byHardware = (hw: string) =>
            firmwares
                .filter((f) => f.hardware === hw)
                .map((f) => ({
                    name: f.file,
                    label: f.name,
                    download_url: f.url,
                    description: f.description ?? '',
                    io: f.io ?? null,
                }));

        return json({
            earth: byHardware('earth'),
            estuary: byHardware('estuary'),
        });
    } catch (e: any) {
        return json({ error: e.message ?? 'Unknown error' }, 500);
    }
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}
