// Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';

// Define a `type` and `schema` for each collection
const programsCollection = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            subtitle: z.string(),
            pubDate: z.date(),
            dates: z.string(),
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
// Export a single `collections` object to register your collection(s)
export const collections = {
    programs: programsCollection,
};
