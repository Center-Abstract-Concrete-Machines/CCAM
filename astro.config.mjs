import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
    site: 'https://ccam.world',
    integrations: [mdx(), sitemap(), svelte()],
    vite: {
        plugins: [tailwindcss()],
    },
    adapter: netlify(),
});
