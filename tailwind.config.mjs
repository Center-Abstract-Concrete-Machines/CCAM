const defaultTheme = require('tailwindcss/defaultTheme');

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
                backgroundColor: 'hsl(var(--backgroundColor) / <alpha-value>)',
                backgroundHover: 'hsl(var(--backgroundHover) / <alpha-value>)',
                textColor: 'hsl(var(--textColor) / <alpha-value>)',
                linkColor: 'hsl(var(--link) / <alpha-value>)',
                borderColor: 'hsl(var(--borders) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['denim', ...defaultTheme.fontFamily.sans],
                serif: [...defaultTheme.fontFamily.serif],
                moonbase: ['moonbase', ...defaultTheme.fontFamily.sans],
                mono: ['matter-reg', ...defaultTheme.fontFamily.mono],
            },
            typography: {
                DEFAULT: {
                    css: {
                        'blockquote p:first-of-type::before': {
                            content: 'none',
                        },
                        'blockquote p:first-of-type::after': {
                            content: 'none',
                        },
                        cite: {
                            color: 'var(--tw-prose-captions)',
                            fontSize: '0.9em',
                            fontWeight: 'lighter',
                        },
                    },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
};
