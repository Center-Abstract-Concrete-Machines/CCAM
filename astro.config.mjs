import { defineConfig, passthroughImageService } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import svelte from '@astrojs/svelte';

const usePassthroughImages = process.env.CCAM_PASSTHROUGH_IMAGES === '1';
const disableNetlifyAdapter = process.env.CCAM_DISABLE_NETLIFY_ADAPTER === '1';

// https://astro.build/config
export default defineConfig({
    site: 'https://ccam.world',
    integrations: [mdx(), sitemap(), svelte()],
    image: usePassthroughImages
        ? {
            service: passthroughImageService(),
        }
        : undefined,
    vite: {
        plugins: [tailwindcss()],
    },
    adapter: disableNetlifyAdapter ? undefined : netlify(),
});
