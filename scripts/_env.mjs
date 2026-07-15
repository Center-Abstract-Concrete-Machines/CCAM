import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseDotenv(text) {
    return Object.fromEntries(
        text
            .split(/\r?\n/)
            .filter(
                (line) =>
                    line.trim() &&
                    !line.trim().startsWith('#') &&
                    line.includes('=')
            )
            .map((line) => {
                const idx = line.indexOf('=');
                const key = line.slice(0, idx).trim();
                const value = line
                    .slice(idx + 1)
                    .trim()
                    .replace(/^"|"$/g, '');
                return [key, value];
            })
    );
}

export function loadScriptEnv() {
    const cwd = process.cwd();
    const dotenvLocalPath = resolve(cwd, '.env.local');
    const dotenvPath = resolve(cwd, '.env');

    const base = existsSync(dotenvPath)
        ? parseDotenv(readFileSync(dotenvPath, 'utf8'))
        : {};

    const local = existsSync(dotenvLocalPath)
        ? parseDotenv(readFileSync(dotenvLocalPath, 'utf8'))
        : {};

    return { ...base, ...local };
}