/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
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
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
