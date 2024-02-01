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
            type: z.enum(['Event', 'Workshop', 'Study']),
            featured: z.boolean().optional(),
            tags: z.array(z.string().trim()),
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
        }),
});

const resourcesCollection = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            author: z.string().optional(),
            type: z.string(),
            year: z.number().optional(),
            image: z
                .object({
                    url: image(),
                    alt: z.string(),
                })
                .optional(),
            dateAdded: z.date(),
            tags: z.array(z.string().trim()),
            url: z.string().optional(),
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
            tags: z.array(z.string().trim()),
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

export const collections = {
    programs: programsCollection,
    resources: resourcesCollection,
    projects: projectsCollection,
    people: peopleCollection,
};
