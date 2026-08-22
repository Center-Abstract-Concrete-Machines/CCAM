import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';

const DEFAULT_HOMEPAGE_IMAGE_POOL_SIZE = 24;
const DEFAULT_HOMEPAGE_IMAGE_WIDTH = 960;
const DEFAULT_HOMEPAGE_IMAGE_QUALITY = 60;

// Optional manual splash image set.
// If this array has items, the homepage rotators will only use these images.
// Path format must match the keys from import.meta.glob (start with /src/...).
// Example path: /src/content/galleries/2026-maddie-brucker/IMG_1234.jpg
const MANUAL_HOMEPAGE_IMAGES = [
    // {
    //     path: '/src/content/galleries/2026-maddie-brucker/your-image.jpg',
    //     alt: 'Descriptive alt text',
    //     link: '/programs/26-07-02-maddie-brucker-almanac/',
    //     type: 'program',
    //     title: 'Maddie Brucker Workshop',
    // },
];

const manualImageModules = {
    ...import.meta.glob('/src/content/galleries/**/*.{jpg,jpeg,png,webp,avif,gif}'),
    ...import.meta.glob('/src/images/**/*.{jpg,jpeg,png,webp,avif,gif}'),
    ...import.meta.glob('/src/content/programs/images/**/*.{jpg,jpeg,png,webp,avif,gif}'),
};

const directorySplashImageModules = import.meta.glob(
    '/src/images/splash-rotator/*.{jpg,jpeg,png,webp,avif,gif}'
);

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function toFallbackTitle(path) {
    return path.split('/').pop() || 'Splash image';
}

async function optimizeHomepageImages(images, { width, quality }) {
    const optimizedImages = [];

    for (const image of images) {
        const transformed = await getImage({
            src: image.source,
            format: 'webp',
            width,
            quality,
        });

        optimizedImages.push({
            src: transformed.src,
            alt: image.alt,
            gallery: image.gallery,
            link: image.link,
            type: image.type,
            title: image.title,
        });
    }

    return optimizedImages;
}

async function getDirectoryHomepageImages({ width, quality }) {
    const modulePaths = Object.keys(directorySplashImageModules).sort();

    if (modulePaths.length === 0) {
        return [];
    }

    const candidates = [];

    for (const path of modulePaths) {
        const loaded = await directorySplashImageModules[path]();
        const source = loaded.default ?? loaded;

        candidates.push({
            source,
            alt: toFallbackTitle(path),
            gallery: 'splash-rotator-dir',
            link: null,
            type: 'manual',
            title: toFallbackTitle(path),
        });
    }

    return optimizeHomepageImages(candidates, { width, quality });
}

async function getManualHomepageImages({ width, quality }) {
    const manualCandidates = [];

    for (const entry of MANUAL_HOMEPAGE_IMAGES) {
        const loader = manualImageModules[entry.path];

        if (!loader) {
            console.warn(
                `[splash] Manual splash image not found: ${entry.path}. Check the path in MANUAL_HOMEPAGE_IMAGES.`
            );
            continue;
        }

        const loaded = await loader();
        const source = loaded.default ?? loaded;

        manualCandidates.push({
            source,
            alt: entry.alt || toFallbackTitle(entry.path),
            gallery: 'manual',
            link: entry.link || null,
            type: entry.type || 'manual',
            title: entry.title || toFallbackTitle(entry.path),
        });
    }

    return optimizeHomepageImages(manualCandidates, { width, quality });
}

export async function getAllGalleryImages(options = {}) {
    const {
        limit = DEFAULT_HOMEPAGE_IMAGE_POOL_SIZE,
        width = DEFAULT_HOMEPAGE_IMAGE_WIDTH,
        quality = DEFAULT_HOMEPAGE_IMAGE_QUALITY,
    } = options;

    const directoryImages = await getDirectoryHomepageImages({ width, quality });
    if (directoryImages.length > 0) {
        return directoryImages;
    }

    if (MANUAL_HOMEPAGE_IMAGES.length > 0) {
        return getManualHomepageImages({ width, quality });
    }

    const allGalleries = await getCollection('galleries');
    const allPrograms = await getCollection('programs');
    const allResources = await getCollection('resources');
    const allProjects = await getCollection('projects');

    const candidates = [];

    for (const gallery of allGalleries) {
        if (gallery.data.images && gallery.data.images.length > 0) {
            let associatedLink = null;
            let associatedType = null;

            const matchingProgram = allPrograms.find((p) =>
                p.data.gallery === gallery.id ||
                p.id.includes(gallery.id) ||
                gallery.id.includes(p.id.split('/').pop())
            );

            if (matchingProgram) {
                associatedLink = `/programs/${matchingProgram.id}/`;
                associatedType = 'program';
            } else {
                const matchingResource = allResources.find((r) =>
                    r.data.gallery === gallery.id ||
                    r.id.includes(gallery.id) ||
                    gallery.id.includes(r.id.split('/').pop())
                );

                if (matchingResource) {
                    associatedLink = `/resources/${matchingResource.id}/`;
                    associatedType = 'resource';
                } else {
                    const matchingProject = allProjects.find((p) =>
                        p.data.gallery === gallery.id ||
                        p.id.includes(gallery.id) ||
                        gallery.id.includes(p.id.split('/').pop())
                    );

                    if (matchingProject) {
                        associatedLink = `/projects/${matchingProject.id}/`;
                        associatedType = 'project';
                    }
                }
            }

            for (const imageObj of gallery.data.images) {
                candidates.push({
                    source: imageObj.image,
                    alt: imageObj.caption || gallery.data.title || 'Gallery image',
                    gallery: gallery.id,
                    link: associatedLink,
                    type: associatedType,
                    title: gallery.data.title || gallery.id,
                });
            }
        }
    }

    const selected = shuffleArray(candidates).slice(0, limit);
    const optimizedImages = [];

    for (const image of selected) {
        const transformed = await getImage({
            src: image.source,
            format: 'webp',
            width,
            quality,
        });

        optimizedImages.push({
            src: transformed.src,
            alt: image.alt,
            gallery: image.gallery,
            link: image.link,
            type: image.type,
            title: image.title,
        });
    }

    return optimizedImages;
}

export function getRandomImage(images) {
    if (!images || images.length === 0) return null;
    return images[Math.floor(Math.random() * images.length)];
}