import { run } from '../index.js';
import { opendir } from 'fs/promises';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

// define path containing *.test.js files
const PATH = './tests';

(async () => {
    for await (let file of await walk(resolve(PATH))) {
        if (file.endsWith('.test.js')) {
            // import all *.test.js files containing suites
            await import(pathToFileURL(file));
        }
    }

    // run all imported suites
    // this will run the following test suites
    // * tests/a.test.js
    // * tests/b.test.js
    // * tests/sub/c.test.js
    await run({ parallel: true });
})();

// recursive directory walk
async function walk(dir, files = []) {
    for await (let dirent of await opendir(dir)) {
        const file = join(dir, dirent.name);
        if (dirent.isDirectory()) files.concat(await walk(file, files));
        else if (dirent.isFile()) files.push(file);
    }

    return files;
}