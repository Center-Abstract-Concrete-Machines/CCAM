import { getCollection } from 'astro:content';
import { filterDraftsAndPubDate } from '@utils/programFilters';

const allPrograms = await getCollection('programs', filterDraftsAndPubDate);
const allResources = await getCollection('resources');
const allProjects = await getCollection('projects');
const allPeople = await getCollection('people');

export function personSlugInEvent(event, personSlug) {
    const categoryArray = event.data.people;
    if (!categoryArray) return false;
    const [bool] = categoryArray.map((category) =>
        category.list.includes(personSlug)
    );
    return bool;
}

export function hasAssociatedMaterials(personSlug) {
    const filteredPrograms = allPrograms
        .filter(
            (program) =>
                program.data.tags.includes(personSlug) ||
                personSlugInEvent(program, personSlug)
        )
        .map((obj) => ({
            ...obj,
            metaType: 'Program',
            metaSlug: 'programs',
        }));
    const filteredResources = allResources
        .filter((resource) => resource.data.tags.includes(personSlug))
        .map((obj) => ({
            ...obj,
            metaType: 'Resource',
            metaSlug: 'resources',
        }));
    const filteredProjects = allProjects
        .filter(
            (project) =>
                project.data.tags.includes(personSlug) ||
                personSlugInEvent(project, personSlug)
        )
        .map((obj) => ({
            ...obj,
            metaType: 'Project',
            metaSlug: 'projects',
        }));

    const allResults = [
        ...filteredProjects,
        ...filteredPrograms,
        ...filteredResources,
    ];

    if (allResults.length > 0) {
        return true;
    } else {
        return false;
    }
}
