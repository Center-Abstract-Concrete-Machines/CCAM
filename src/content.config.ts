import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { slug } from 'github-slugger';
import { glob } from 'astro/loaders';

const programsCollection = defineCollection({
    loader: glob({
        pattern: '**/*.{md,mdx}',
        base: './src/content/programs',
    }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            subtitle: z.string().optional(),
            pubDate: z.date(),
            endDate: z.date().or(z.literal('ongoing')),
            presentationalDates: z.string(),
            time: z.string(),
            location: z.string(),
            image: z.object({
                url: image(),
                alt: z.string(),
            }),
            type: z.enum(['Event', 'Workshop', 'Study']),
            featured: z.boolean().optional(),
            tags: z.array(
                z
                    .string()
                    .trim()
                    .toLowerCase()
                    .transform((tag) => slug(tag))
            ),
            gallery: z.string().optional(),
            draft: z.boolean().default(false),
            people: z
                .array(
                    z.object({
                        label: z.string(),
                        list: z.array(z.string()),
                    })
                )
                .optional(),
            assProjectId: z.string().optional(),
            displayResources: z.string().optional(),
            stripeRegistrationId: z.string().startsWith('prod_').optional(),
        }),
});

const resourcesCollection = defineCollection({
    loader: glob({
        pattern: '**/*.{md,mdx}',
        base: './src/content/resources',
    }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            author: z.string().optional(),
            type: z.string().toLowerCase(),
            year: z.number().optional(),
            assProjectId: z.string().optional(),
            image: z
                .object({
                    url: image(),
                    alt: z.string(),
                })
                .optional(),
            dateAdded: z.date(),
            tags: z.array(
                z
                    .string()
                    .trim()
                    .toLowerCase()
                    .transform((tag) => slug(tag))
            ),
            url: z.string().url().optional(),
        }),
});

const projectsCollection = defineCollection({
    loader: glob({
        pattern: '**/*.{md,mdx}',
        base: './src/content/projects',
    }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            image: z.object({
                url: image(),
                alt: z.string(),
            }),
            dateAdded: z.date(),
            tags: z.array(
                z
                    .string()
                    .trim()
                    .toLowerCase()
                    .transform((tag) => slug(tag))
            ),
            projectId: z.string(),
            people: z
                .array(
                    z.object({
                        label: z.string(),
                        list: z.array(z.string()),
                    })
                )
                .optional(),
        }),
});

const peopleCollection = defineCollection({
    loader: glob({
        pattern: '**/*.{md,mdx}',
        base: './src/content/people',
    }),
    schema: ({ image }) =>
        z.object({
            name: z.string(),
            subtitle: z.string().optional(),
            cardBlurb: z.string().optional(),
            image: image().optional(),
            social: z
                .object({
                    display: z.string(),
                    url: z.string(),
                })
                .optional(),
            website: z
                .object({
                    display: z.string(),
                    url: z.string(),
                })
                .optional(),
        }),
});

const galleryCollection = defineCollection({
    loader: glob({
        pattern: '**/*.{md,mdx}',
        base: './src/content/galleries',
    }),
    schema: ({ image }) =>
        z.object({
            images: z.array(
                z.object({
                    image: image(),
                    caption: z.string().nullable(),
                    credit: z.string().nullable(),
                    includeInAssProject: z.boolean(),
                })
            ),
        }),
});

const storeProductsCollection = defineCollection({
    loader: glob({
        pattern: '**/*.{md,mdx}',
        base: './src/content/store',
    }),
    schema: ({ image }) =>
        z.object({
            title: z.string().optional(),
            stripeProductId: z.string().startsWith('prod_'),
            stripePriceId: z.string().startsWith('price_').optional(),
            excerpt: z.string().optional(),
            heroImage: image().optional(),
            heroImageAlt: z.string().optional(),
            galleryImages: z
                .array(
                    z.object({
                        image: image(),
                        alt: z.string(),
                        caption: z.string().optional(),
                    })
                )
                .optional(),
            videoEmbedUrl: z.string().url().optional(),
            specs: z
                .array(
                    z.object({
                        label: z.string(),
                        value: z.string(),
                    })
                )
                .optional(),
            featured: z.boolean().optional(),
            category: z
                .enum(['synth', 'printed-matter', 'apparel', 'accessory', 'other'])
                .optional(),
            tags: z
                .array(
                    z
                        .string()
                        .trim()
                        .toLowerCase()
                        .transform((tag) => slug(tag))
                )
                .optional(),
            sizeVariants: z
                .array(
                    z.object({
                        size: z.string().trim(),
                        label: z.string().trim().optional(),
                        stripePriceId: z.string().startsWith('price_'),
                    })
                )
                .optional(),
            workshopRegistration: z.boolean().optional(),
            programId: z.string().optional(),
        }),
});

export const collections = {
    programs: programsCollection,
    resources: resourcesCollection,
    projects: projectsCollection,
    people: peopleCollection,
    galleries: galleryCollection,
    storeProducts: storeProductsCollection,
};
