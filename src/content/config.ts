import { z, defineCollection } from 'astro:content';

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
            tags: z.array(
                z.enum(['Course', 'Working Group', 'Event', 'Workshop'])
            ),
            featured: z.boolean().optional(),
        }),
});

const resourcesCollection = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            author: z.string(),
            type: z.string(),
            year: z.number(),
            image: z.object({
                url: image(),
                alt: z.string(),
            }),
            dateAdded: z.date(),
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
        }),
});

const aboutCollection = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            name: z.string(),
            description: z.string(),
            image: z.object({
                url: image(),
                alt: z.string(),
            }),
        }),
});

export const collections = {
    programs: programsCollection,
    resources: resourcesCollection,
    projects: projectsCollection,
    about: aboutCollection,
};
