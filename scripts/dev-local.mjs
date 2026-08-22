import { spawn } from 'node:child_process';

const filterPatterns = [
    /Could not read orientation for image:/,
    /GLib-GObject-CRITICAL/,
    /VipsInterpretation/,
];

function shouldFilter(line) {
    return filterPatterns.some((pattern) => pattern.test(line));
}

function pipeWithFilter(stream, writer) {
    let buffer = '';

    stream.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (!shouldFilter(line)) {
                writer.write(line + '\n');
            }
        }
    });

    stream.on('end', () => {
        if (buffer && !shouldFilter(buffer)) {
            writer.write(buffer + '\n');
        }
    });
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const child = spawn(`${npxCommand} astro dev`, {
    shell: true,
    cwd: process.cwd(),
    env: {
        ...process.env,
        SHARP_IGNORE_GLOBAL_LIBVIPS: '1',
        CCAM_PASSTHROUGH_IMAGES: '1',
        CCAM_DISABLE_NETLIFY_ADAPTER: '1',
    },
    stdio: ['inherit', 'pipe', 'pipe'],
});

pipeWithFilter(child.stdout, process.stdout);
pipeWithFilter(child.stderr, process.stderr);

child.on('close', (code) => {
    process.exit(code ?? 0);
});

child.on('error', (err) => {
    console.error(err);
    process.exit(1);
});
