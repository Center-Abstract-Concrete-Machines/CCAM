import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import * as yaml from 'js-yaml';
import heicConvert from 'heic-convert';

// On Windows/Git Bash, a globally installed libvips can cause GLib warnings.
// Force sharp to use its bundled libvips implementation for consistent behavior.
if (!process.env.SHARP_IGNORE_GLOBAL_LIBVIPS) {
    process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = '1';
}

const { default: sharp } = await import('sharp');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

        // Process flat images (no photographer folder)
        for (const entry of entries) {
            if (entry.isFile()) {
                const filePath = path.join(directoryPath, entry.name);
                if (await isAnImage(filePath)) {
                    await processImage(directoryPath, entry.name);
                }
            }
        }

        // Process photographer subfolders — folder name becomes the credit
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subDirPath = path.join(directoryPath, entry.name);
                const subFiles = await fs.promises.readdir(subDirPath);
                for (const file of subFiles) {
                    const filePath = path.join(subDirPath, file);
                    if (await isAnImage(filePath)) {
                        await processImage(subDirPath, file);
                    }
                }
            }
        }

        // Build ordered image entry list: flat images first, then per-photographer subfolder images
        const imageEntries = [];

        const updatedEntries = await fs.promises.readdir(directoryPath, { withFileTypes: true });

        const flatFiles = updatedEntries
            .filter((e) => e.isFile())
            .sort((a, b) => a.name.localeCompare(b.name, 'en-us', { numeric: true }));

        for (const entry of flatFiles) {
            const filePath = path.join(directoryPath, entry.name);
            if (await isAnImage(filePath)) {
                imageEntries.push({ file: filePath, credit: null });
            }
        }

        const subDirs = updatedEntries
            .filter((e) => e.isDirectory())
            .sort((a, b) => a.name.localeCompare(b.name, 'en-us', { numeric: true }));

        for (const subDir of subDirs) {
            const subDirPath = path.join(directoryPath, subDir.name);
            // Convert folder name from kebab-case or snake_case to Title Case for use as credit
            const photographerCredit = subDir.name
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
            const subFiles = await fs.promises.readdir(subDirPath);
            const sortedSubFiles = subFiles.sort((a, b) =>
                a.localeCompare(b, 'en-us', { numeric: true })
            );
            for (const file of sortedSubFiles) {
                const filePath = path.join(subDirPath, file);
                if (await isAnImage(filePath)) {
                    imageEntries.push({ file: filePath, credit: photographerCredit });
                }
            }
        }

        console.log(`\nSyncing ${directoryName}...`);
        await syncGalleryTemplate(directoryName, imageEntries);
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

async function syncGalleryTemplate(galleryName, imageEntries) {
    const galleryDirectory = path.join('src', 'content', 'galleries');
    const galleryTemplatePath = path.join(
        galleryDirectory,
        `${galleryName}.md`
    );

    function convertWinToPOSIX(pathString) {
        const converted = pathString.replace(/\\/g, '/');
        const normalized = path.posix.normalize(converted);
        return normalized;
    }

    try {
        // If galleries directory doesn't exist, create it
        if (!fs.existsSync(galleryDirectory)) {
            fs.mkdirSync(galleryDirectory);
        }

        // Build the canonical set of POSIX paths from disk
        const diskEntries = imageEntries.map(({ file, credit }) => ({
            posix: convertWinToPOSIX(file),
            credit,
        }));

        let existingImages = {};
        let topLevelData = {};

        if (fs.existsSync(galleryTemplatePath)) {
            // Parse existing file, preserving all top-level fields and per-image metadata
            const raw = await fs.promises.readFile(galleryTemplatePath, 'utf8');
            const match = raw.match(/^---\n([\s\S]*?)\n---/);
            if (match) {
                const parsed = yaml.load(match[1]) ?? {};
                const { images: parsedImages, ...rest } = parsed;
                topLevelData = rest;
                for (const entry of parsedImages ?? []) {
                    existingImages[convertWinToPOSIX(entry.image)] = entry;
                }
            }
        }

        // Detect removals and additions for logging
        const diskPaths = new Set(diskEntries.map((e) => e.posix));
        const existingPaths = new Set(Object.keys(existingImages));

        for (const removed of existingPaths) {
            if (!diskPaths.has(removed)) {
                console.log(`  [removed] ${removed}`);
            }
        }
        for (const { posix } of diskEntries) {
            if (!existingPaths.has(posix)) {
                console.log(`  [added]   ${posix}`);
            }
        }

        // Build synced images array: disk order, existing metadata preserved, new files get defaults
        const syncedImages = diskEntries.map(({ posix, credit }) => {
            if (existingImages[posix]) {
                return existingImages[posix];
            }
            return {
                image: posix,
                caption: null,
                credit: credit,
                includeInAssProject: false,
            };
        });

        const data = { ...topLevelData, images: syncedImages };
        const yamlString = yaml.dump(data, { lineWidth: -1 });
        const content = '---\n' + yamlString + '---\n';
        await fs.promises.writeFile(galleryTemplatePath, content);
    } catch (error) {
        console.error(`Error syncing template file for ${galleryName}`, error);
    }
}

async function processImage(parentDir, file) {
    // MAX WIDTH OPTION
    const maxWidth = 2000;

    const filePath = path.join(parentDir, file);

    function createSafePipeline(input, shouldResize) {
        const pipeline = sharp(input)
            .rotate() // Auto-rotate based on EXIF orientation
            // Normalize to sRGB to avoid libvips interpretation issues on odd source profiles.
            .toColorspace('srgb');

        if (shouldResize) {
            return pipeline.resize({ width: maxWidth, withoutEnlargement: true });
        }

        return pipeline;
    }

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
            await createSafePipeline(outputBuffer, true)
                .withMetadata({ orientation: 1 })
                .jpeg({ quality: 92 })
                .toFile(newFilePath);
            console.log(
                `\nConverted ${file} from HEIC to JPG and resized to ${maxWidth}px wide as ${newFileName}`
            );
            await fs.promises.unlink(filePath);
            console.log(`Deleted original file ${filePath}`);
            //
            //
        } else {
            const shouldResize = metadata.width > maxWidth;
            const hasOrientationMetadata = Boolean(metadata.orientation);
            const hasEmbeddedMetadata =
                Boolean(metadata.exif) ||
                Boolean(metadata.icc) ||
                Boolean(metadata.xmp) ||
                Boolean(metadata.iptc);

            // Re-encode files that carry metadata/orientation blocks to strip problematic tags.
            if (!shouldResize && !hasOrientationMetadata && !hasEmbeddedMetadata) {
                return;
            }

            const newFilePath = path.join(
                parentDir,
                `${path.basename(file, path.extname(file))}-resized${path.extname(file)}`
            );
            let output = createSafePipeline(filePath, shouldResize);

            if (metadata.format === 'jpeg') {
                output = output.withMetadata({ orientation: 1 }).jpeg({ quality: 92 });
            }

            await output.toFile(newFilePath);

            if (shouldResize) {
                console.log(`Resized ${file} to ${maxWidth}px wide`);
            } else {
                console.log(`Normalized metadata/colorspace for ${file}`);
            }

            // Delete original image
            await delay(100);
            // TODO add check for permissions
            // if (await fs.promises.access())
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
        console.log('\nCompleted gallery sync ✨\n');
    } catch (error) {
        console.error(error);
    }
}

runScript();
