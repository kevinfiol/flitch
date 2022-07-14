import { suite } from './dist/flitch.js';
import { strict as assert } from 'assert';
import { ModuleA, ModuleB } from './test/index.js';

process.exit = () => {};

function timer(timeout) {
  return new Promise(res =>
    setTimeout(() => {
      res(1)
    }, timeout * 1000)
  );
}

let foo;

let test = suite('Flitch Regular Tests');

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
test = suite('Flitch *Only* Test');

test.before.all = () => {
  foo = 30;
};

test('this will not run', () => {
  foo = 220;
});

test.only('this will run by itself', () => {
  assert.equal(foo, 30);
});

await test.run();
test = suite('Flitch *Not* Test');

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
test = suite('Flitch Async Tests');

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

await test.run();
test = suite('Flitch Timeout Tests *THIS SHOULD HAVE 1 FAILING TEST*', { timeout: 0.05 });

test('SHOULD FAIL: This test should timeout', async () => {
  await timer(0.06);
});

test('This test should not timeout', async () => {
  await timer(0.06);
}, 0.07);

await test.run();
test = suite('Flitch Varargs for Cleanup & Timeout *THIS SHOULD HAVE 2 FAILING TESTS*');

test('SHOULD FAIL: This test should time out', async () => {
  await timer(0.06);
}, 0.05);

let baz = 10;

test('This should test baz and then cleanup', () => {
  baz += 10
  assert.equal(baz, 20);
}, () => {
  baz = 10;
});

test('baz should be 10', () => {
  assert.equal(baz, 10);
});

test('SHOULD FAIL: should be able to pass cleanup and timeout', async () => {
  assert.equal(baz, 10);
  await timer(0.06);
}, 0.05, () => {
  baz = 20;
});

test('should have cleaned up', () => {
  assert.equal(baz, 20);
});

await test.run();
test = suite('Flitch Timeout in Before Each *SHOULD HAVE 1 FAILING TEST*', { timeout: 0.02 });

test.before.each = async () => {
  await timer(0.03);
};

test('SHOULD FAIL: time out in before.each hook', () => {
  // should fail because of before.each hook
});

await test.run();
test = suite('Flitch Timeout in Before All *SUITE FAILURE*', { timeout: 0.02 });

test.before.all = async () => {
  await timer(0.03);
};

test('SHOULD FAIL: Suite should fail', () => {});

await test.run();
test = suite('Flitch Timeout in After All *SUITE FAILURE*', { timeout: 0.02 });

test.after.all = async () => {
  await timer(0.03);
};

test('SHOULD FAIL: Suite should fail', () => {});

await test.run()
  // run module tests
  .then(ModuleA.run)
  .then(ModuleB.run);