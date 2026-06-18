import { getCollection } from 'astro:content';

export async function getAllGalleryImages() {
    const allGalleries = await getCollection('galleries');
    const allPrograms = await getCollection('programs');
    const allResources = await getCollection('resources');
    const allProjects = await getCollection('projects');
    const allImages = [];
    
    for (const gallery of allGalleries) {
        if (gallery.data.images && gallery.data.images.length > 0) {
            // Find associated program, resource, or project
            let associatedLink = null;
            let associatedType = null;
            
            // Check programs first (most common)
            const matchingProgram = allPrograms.find(p => 
                p.data.gallery === gallery.id || 
                p.id.includes(gallery.id) ||
                gallery.id.includes(p.id.split('/').pop())
            );
            
            if (matchingProgram) {
                associatedLink = `/programs/${matchingProgram.id}/`;
                associatedType = 'program';
            } else {
                // Check resources
                const matchingResource = allResources.find(r => 
                    r.data.gallery === gallery.id ||
                    r.id.includes(gallery.id) ||
                    gallery.id.includes(r.id.split('/').pop())
                );
                
                if (matchingResource) {
                    associatedLink = `/resources/${matchingResource.id}/`;
                    associatedType = 'resource';
                } else {
                    // Check projects
                    const matchingProject = allProjects.find(p => 
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
            
            // If no direct association found, try gallery view
            if (!associatedLink && matchingProgram) {
                associatedLink = `/programs/${matchingProgram.id}-gallery/`;
                associatedType = 'gallery';
            }
            
            for (const imageObj of gallery.data.images) {
                allImages.push({
                    src: imageObj.image.src,
                    alt: imageObj.caption || gallery.data.title || 'Gallery image',
                    gallery: gallery.id,
                    link: associatedLink,
                    type: associatedType,
                    title: gallery.data.title || gallery.id,
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