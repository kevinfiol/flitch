import { strict as assert } from 'assert';
import { sub } from './b.js';
import { suite } from '../index.js';

let ran = false;
const ModuleB = suite('ModuleB tests');

ModuleB('tests adding', () => {
    ran = true;
    assert.equal(10, sub(20, 10));
});

ModuleB('tests ran', () => {
    assert.ok(ran);
});

export { ModuleB };