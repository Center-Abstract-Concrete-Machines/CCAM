// Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';

// Define a `type` and `schema` for each collection
const programsCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        metadata: z.object({
            dates: z.string(),
            time: z.string(),
            location: z.string(),
        }),
        imageUrl: z.string(),
        imageAlt: z.string(),
        tags: z.array(z.string()),
        featured: z.boolean().optional(),
    }),
});
// Export a single `collections` object to register your collection(s)
export const collections = {
    programs: programsCollection,
};
