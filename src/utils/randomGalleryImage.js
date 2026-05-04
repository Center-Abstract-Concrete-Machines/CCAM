import { getCollection } from 'astro:content';

export async function getAllGalleryImages() {
    const allGalleries = await getCollection('galleries');
    const allImages = [];
    
    for (const gallery of allGalleries) {
        if (gallery.data.images && gallery.data.images.length > 0) {
            for (const imageObj of gallery.data.images) {
                allImages.push({
                    src: imageObj.image.src,
                    alt: imageObj.caption || gallery.data.title || 'Gallery image',
                    gallery: gallery.id,
                });
            }
        }
    }
    
    return allImages;
}

export function getRandomImage(images) {
    if (!images || images.length === 0) return null;
    return images[Math.floor(Math.random() * images.length)];
}