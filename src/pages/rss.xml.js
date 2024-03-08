import rss from '@astrojs/rss';
import metadata from 'src/metadata';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
    const projects = await getCollection('projects');
    const programs = await getCollection('programs');
    const resources = await getCollection('resources');
    const items = [
        ...projects.map((project) => ({
            title: '[PROJECT] ' + project.data.title,
            pubDate: project.data.dateAdded,
            description: project.data.description,
            // content: sanitizeHtml(parser.render(project.body)),
            link: `/projects/${project.slug}`,
        })),
        ...programs.map((program) => ({
            title: '[PROGRAM] ' + program.data.title,
            pubDate: program.data.pubDate,
            // content: sanitizeHtml(parser.render(program.body)),
            link: `/programs/${program.slug}`,
        })),
        ...resources.map((resource) => ({
            title: '[RESOURCE] ' + resource.data.title,
            pubDate: resource.data.dateAdded,
            // content: sanitizeHtml(parser.render(resource.body)),
            link: `/resources/${resource.slug}`,
        })),
    ];

    return rss({
        // `<title>` field in output xml
        title: metadata.subtitle,
        // `<description>` field in output xml
        description: metadata.description,
        // Pull in your project "site" from the endpoint context
        // https://docs.astro.build/en/reference/api-reference/#contextsite
        site: context.site,
        // Array of `<item>`s in output xml
        // See "Generating items" section for examples using content collections and glob imports
        items: items,
        // (optional) inject custom xml
        customData: `<language>en-us</language>`,
    });
}
