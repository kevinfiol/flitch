import { suite } from './dist/flitch.js';
import { strict as assert } from 'assert';
import { ModuleA, ModuleB } from './test/index.js';

function timer(timeout) {
  return new Promise(res =>
    setTimeout(() => {
      res(1)
    }, timeout)
  );
}

let foo;

let test = suite('flitch regular tests');

test.before.all = () => {
  foo = 0;
};

test('regular test', () => {
  assert.equal(foo, 0);
  foo = 1;
  assert.equal(foo, 1);
});

test('test cleanup', () => {
  assert.equal(foo, 1); // foo should still be one
}, () => foo = 0);

test('did the last test clean up well?', () => {
  assert.equal(foo, 0);
}, () => foo = 20);

test('what about the last one?', () => {
  assert.equal(foo, 20);
});

await test.run();
test = suite('flitch only test');

test.before.all = () => {
  foo = 30;
};

test('this will not run', () => {
  foo = 220;
});

test.only('this will run', () => {
  assert.equal(foo, 30);
});

await test.run();
test = suite('flitch not test');

test('this will run', () => {
  foo = 0;
});

test('this will also run', () => {
  foo += 1;
});

test.not('this will not run', () => {
  foo += 1;
});

test('test should just equal 1', () => {
  assert.equal(foo, 1);
});

await test.run();
test = suite('async tests');

// async tests
test('this test is asynchronous', async () => {
  foo = await Promise.resolve(100);
  assert.equal(foo, 100);
}, async () => {
  foo = await Promise.resolve(200);
});

test('cleanups can be async as well', async () => {
  assert.equal(foo, 200);
});

await test.run()
  // run module tests
  .then(ModuleA.run)
  .then(ModuleB.run);