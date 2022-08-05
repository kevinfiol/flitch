import { strict as assert } from 'assert';
import { suite } from '../../index.js';

const ModuleC = suite('ModuleC tests');

ModuleC('module c works', () => {
    assert.ok(true);
});

export { ModuleC };