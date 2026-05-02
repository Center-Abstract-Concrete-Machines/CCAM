import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';

function shuffleArray(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export async function getOptimizedImagesForGallery(gallery, randomize = true) {
    const allGalleries = await getCollection('galleries');

    const [thisGallery] = allGalleries.filter(
        (galleryEntry) => galleryEntry.id === gallery.toLowerCase() // slugs are always lowercase
    );
    if (!thisGallery) {
        throw new Error(
            'Gallery not found! For new galleries make sure you run `npm run gallery` to scaffold new gallery template files.'
        );
    }
    const defaultCredit = thisGallery.data.defaultCredit ?? null;
    const images = randomize
        ? shuffleArray(thisGallery.data.images)
        : thisGallery.data.images;
    const optimizedImages = await Promise.all(
        images.map(async (obj) => ({
            ...obj,
            credit: obj.credit ?? defaultCredit,
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
