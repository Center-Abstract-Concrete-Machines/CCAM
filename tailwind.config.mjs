/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                Blue: '#74acff',
                Green: '#a5f91d',
                Orange: '#ff7a1a',
                Purple: '#747fef',
                Sand: '#fffbf1',
                Yellow: '#ffd400',
                Black: '#121212',
                'Black-30': '#1212124d',
                'Black-50': '#00000080',
                White: '#E6E6E6',
                backgroundColor: 'hsl(var(--background) / <alpha-value>)',
                textColor: 'hsl(var(--text) / <alpha-value>)',
                linkColor: 'hsl(var(--link) / <alpha-value>)',
                borderColor: 'hsl(var(--borders) / <alpha-value>)',
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
