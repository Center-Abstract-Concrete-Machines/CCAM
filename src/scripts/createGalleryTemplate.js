import path from 'node:path';
// import fs from 'node:fs/promises';
// import { readdirSync } from 'node:fs';
import fs from 'node:fs';

function getGalleryNames() {
    try {
        const galleriesPath = path.join('src', 'content', 'programs', 'images');
        const files = fs.readdirSync(galleriesPath, { withFileTypes: true });
        const galleries = files
            .filter((file) => file.isDirectory())
            .map((file) => file.name);
        return galleries;
    } catch (error) {
        console.error(error);
    }
}

console.log(getGalleryNames());
