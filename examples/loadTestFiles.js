import { opendir } from 'fs/promises';
import { run } from '../index.js';
import { basename, join, resolve } from 'path';

async function* walk(dir) {
    for await (const d of await opendir(dir)) {
        const entry = join(dir, d.name);
        if (d.isDirectory() && d.name !== 'node_modules') yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}

(async () => {
    for await (const file of walk(resolve('.'))) {
        if (file.endsWith('.test.js')) {
            console.log(file);
        }
    }
})();