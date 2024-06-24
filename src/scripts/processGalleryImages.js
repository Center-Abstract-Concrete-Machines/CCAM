import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import mime from 'mime-types';
import yaml from 'js-yaml';
import heicConvert from 'heic-convert';

function getGalleryNames() {
    const galleriesPath = path.join('src', 'content', 'galleries');
    try {
        const files = fs.readdirSync(galleriesPath, { withFileTypes: true });
        const galleries = files
            .filter((file) => file.isDirectory())
            .map((file) => file.name);
        return galleries;
    } catch (error) {
        console.error(error);
    }
}

async function processDirectory(directoryName) {
    const galleriesPath = path.join('src', 'content', 'galleries');
    const directoryPath = path.join(galleriesPath, directoryName);

    try {
        const files = await fs.promises.readdir(directoryPath);

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            if (await isAnImage(filePath)) {
                await processImage(directoryPath, file);
            }
        }

        const updatedFiles = await fs.promises.readdir(directoryPath);
        const fullPathFileList = updatedFiles
            .sort((a, b) => a.localeCompare(b, 'en-us', { numeric: true }))
            .map((filename) => path.join(directoryPath, filename));

        await createGalleryTemplate(directoryName, fullPathFileList);
    } catch (error) {
        console.error('Unable to scan directory', error);
    }
}

async function isAnImage(filePath) {
    const stat = await fs.promises.lstat(filePath);
    if (!stat.isDirectory()) {
        const mimeType = mime.lookup(filePath);
        if (mimeType && mimeType.startsWith('image')) return true;
    }
    return false;
}

async function createGalleryTemplate(galleryName, fileList) {
    const galleryDirectory = path.join('src', 'content', 'galleries');
    const galleryTemplatePath = path.join(
        galleryDirectory,
        `${galleryName}.md`
    );

    try {
        // If galleries directory doesn't exist, create it
        if (!fs.existsSync(galleryDirectory)) {
            fs.mkdirSync(galleryDirectory);
        }
        // If template exists, leave it
        if (fs.existsSync(galleryTemplatePath)) return;

        // If it doesn't, create it
        let data = {
            images: [],
        };
        // Add all files to the images array
        for (let file of fileList) {
            if (await isAnImage(file)) {
                data.images.push({
                    image: file,
                    caption: null,
                    credit: null,
                    includeInAssProject: false,
                });
            }
        }
        // Convert to yaml
        const yamlString = yaml.dump(data, { lineWidth: -1 });
        // Add to markdown frontmatter
        const content = '---\n' + yamlString + '---\n';
        // Write to file
        await fs.promises.writeFile(galleryTemplatePath, content);
    } catch (error) {
        console.error(`Error creating template file for ${galleryName}`, error);
    }
}

async function processImage(parentDir, file) {
    // MAX WIDTH OPTION
    const maxWidth = 2000;

    const filePath = path.join(parentDir, file);

    try {
        const metadata = await sharp(filePath).metadata();

        if (metadata.format === 'heif') {
            const newFileName = `${path.basename(file, path.extname(file))}.jpg`;
            const newFilePath = path.join(parentDir, newFileName);
            const inputBuffer = await fs.promises.readFile(filePath);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: 'JPEG',
                quality: 1,
            });
            await sharp(outputBuffer)
                .resize({ width: maxWidth })
                .toFile(newFilePath);
            console.log(
                `Converted ${file} from HEIC to JPG and resized to ${maxWidth}px wide as ${newFileName}`
            );
            await fs.promises.unlink(filePath);
            console.log(`Deleted original file ${filePath}`);
        } else if (metadata.width > maxWidth) {
            const newFilePath = path.join(
                parentDir,
                `${path.basename(file, path.extname(file))}-resized${path.extname(file)}`
            );
            await sharp(filePath)
                .resize({ width: maxWidth })
                .toFile(newFilePath);
            console.log(`Resized ${file} to ${maxWidth}px wide`);
            // Delete original image
            await fs.promises.unlink(filePath);
            // Rename resized image to original image name
            await fs.promises.rename(newFilePath, filePath);
        }
    } catch (error) {
        console.error(`Error processing image ${filePath}: \n`, error);
    }
}

// Run the scripts!
async function runScript() {
    try {
        const galleries = getGalleryNames();
        for (let gallery of galleries) {
            await processDirectory(gallery);
        }
        console.log('Completed gallery processing');
    } catch (error) {
        console.error(error);
    }
}

runScript();
