import { strict as assert } from 'assert';
import { add } from './a.js';
import { suite } from '../index.js';

let ran = false;
const ModuleA = suite('ModuleA tests');

ModuleA.test('tests adding', () => {
    ran = true;
    assert.equal(10, add(5, 5));
});

ModuleA('tests ran', () => {
    assert.ok(ran);
});

export { ModuleA };