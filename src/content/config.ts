import { z, defineCollection } from 'astro:content';
import { slug } from 'github-slugger';

const programsCollection = defineCollection({
    type: 'content',
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
        }),
});

const resourcesCollection = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            author: z.string().optional(),
            type: z.string().toLowerCase(),
            year: z.number().optional(),
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
    type: 'content',
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
    type: 'content',
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
    type: 'content',
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

export const collections = {
    programs: programsCollection,
    resources: resourcesCollection,
    projects: projectsCollection,
    people: peopleCollection,
    galleries: galleryCollection,
};
