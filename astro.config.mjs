import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
    site: 'https://ccam.world',
    integrations: [tailwind(), mdx(), sitemap(), svelte()],
    output: 'hybrid',
    adapter: netlify(),
});
