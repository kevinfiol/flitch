import { test, not, only, run, init } from './dist/flitch.js';
import { strict as assert } from 'assert';

let foo = 0;

test('regular test', () => {
  foo = 1;
  assert.equal(foo, 1);
});

test('test cleanup', () => {
  assert.equal(foo, 1); // foo should still be one
  return () => foo = 0;
});

test('did the last test clean up well?', () => {
  assert.equal(foo, 0);
  return () => foo = 20;
});

test('what about the last one?', () => {
  assert.equal(foo, 20);
});

await run();

init();

test('this will not run', () => {
  foo = 220;
});

only('this will run', () => {
  assert.equal(foo, 20); // should still equal 20
});

await run();
init();

test('this will run', () => {
  foo = 0;
});

test('this will also run', () => {
  foo += 1;
});

not('this will not run', () => {
  foo += 1;
});

test('test should just equal 1', () => {
  assert.equal(foo, 1);
});

await run();
init();

// async tests
test('this test is asynchronous', async () => {
  foo = await Promise.resolve(100);
  assert.equal(foo, 100);

  return async () => {
    foo = await Promise.resolve(200);
  };
});

test('cleanups can be async as well', async () => {
  assert.equal(foo, 200);
});

await run();