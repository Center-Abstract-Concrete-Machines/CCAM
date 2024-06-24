import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';

export async function getOptimizedImagesForGallery(gallery) {
    const allGalleries = await getCollection('galleries');

    const [thisGallery] = allGalleries.filter(
        (galleryEntry) => galleryEntry.slug === gallery.toLowerCase() // slugs are always lowercase
    );
    if (!thisGallery) {
        throw new Error(
            'Gallery not found! For new galleries make sure you run `npm run gallery` to scaffold new gallery template files.'
        );
    }
    const images = thisGallery.data.images;
    const optimizedImages = await Promise.all(
        images.map(async (obj) => ({
            ...obj,
            optimized: await getImage({
                src: obj.image,
                format: 'webp',
                width: 1600,
            }),
        }))
    );
    return optimizedImages;
}

// No longer used?
// function sortByFileName(stringA, stringB) {
//     const [nameA, nameB] = [
//         stringA.split('/').at(-1).split('.').at(0),
//         stringB.split('/').at(-1).split('.').at(0),
//     ];
//     return nameA - nameB;
// }
