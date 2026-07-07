import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.join(process.cwd(), 'src/images/splash-rotator');
const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const files = fs
    .readdirSync(dir)
    .filter((name) => exts.has(path.extname(name).toLowerCase()));

let before = 0;
let after = 0;
let changed = 0;

for (const name of files) {
    const filePath = path.join(dir, name);
    const ext = path.extname(name).toLowerCase();
    const input = fs.readFileSync(filePath);
    before += input.length;

    const pipeline = sharp(input, { failOn: 'none' })
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true });

    let output = input;

    if (ext === '.jpg' || ext === '.jpeg') {
        output = await pipeline.jpeg({ quality: 72, mozjpeg: true }).toBuffer();
    } else if (ext === '.png') {
        output = await pipeline
            .png({ quality: 70, compressionLevel: 9, palette: true })
            .toBuffer();
    } else if (ext === '.webp') {
        output = await pipeline.webp({ quality: 68 }).toBuffer();
    } else if (ext === '.avif') {
        output = await pipeline.avif({ quality: 48 }).toBuffer();
    }

    after += output.length;

    if (output.length <= input.length) {
        fs.writeFileSync(filePath, output);
        changed++;
    }
}

const summary = {
    files: files.length,
    updatedFiles: changed,
    beforeMB: +(before / 1024 / 1024).toFixed(2),
    afterMB: +(after / 1024 / 1024).toFixed(2),
    reductionPercent: before ? +(100 * (1 - after / before)).toFixed(1) : 0,
};

console.log(JSON.stringify(summary, null, 2));
