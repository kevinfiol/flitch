import { strict as assert } from 'assert';
import { add } from './a.js';
import { suite } from '../dist/flitch.js';

let ran = false;
const ModuleA = suite('ModuleA tests');

ModuleA('tests adding', () => {
    ran = true;
    assert.equal(10, add(5, 5));
});

ModuleA('tests ran', () => {
    assert.ok(ran);
});

export { ModuleA };