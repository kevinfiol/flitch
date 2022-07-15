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

const test1 = suite('Flitch Regular Tests');

test1.before.all = () => {
  foo = 0;
};

test1('regular test', () => {
  assert.equal(foo, 0);
  foo = 1;
  assert.equal(foo, 1);
});

test1('test cleanup', () => {
  assert.equal(foo, 1); // foo should still be one
}, () => foo = 0);

test1('did the last test clean up well?', () => {
  assert.equal(foo, 0);
}, () => foo = 20);

test1('what about the last one?', () => {
  assert.equal(foo, 20);
});

const test2 = suite('Flitch *Only* Test');

test2.before.all = () => {
  foo = 30;
};

test2('this will not run', () => {
  foo = 220;
});

test2.only('this will run by itself', () => {
  assert.equal(foo, 30);
});

const test3 = suite('Flitch *Not* Test');

test3('this will run', () => {
  foo = 0;
});

test3('this will also run', () => {
  foo += 1;
});

test3.not('this will not run', () => {
  foo += 1;
});

test3('test should just equal 1', () => {
  assert.equal(foo, 1);
});

const test4 = suite('Flitch Async Tests');

// async tests
test4('this test is asynchronous', async () => {
  foo = await Promise.resolve(100);
  assert.equal(foo, 100);
}, async () => {
  foo = await Promise.resolve(200);
});

test4('cleanups can be async as well', async () => {
  assert.equal(foo, 200);
});

const test5 = suite('Flitch Timeout Tests *THIS SHOULD HAVE 1 FAILING TEST*', { timeout: 0.05 });

test5('SHOULD FAIL: This test should timeout', async () => {
  await timer(0.06);
});

test5('This test should not timeout', async () => {
  await timer(0.06);
}, 0.07);

const test6 = suite('Flitch Varargs for Cleanup & Timeout *THIS SHOULD HAVE 2 FAILING TESTS*');

test6('SHOULD FAIL: This test should time out', async () => {
  await timer(0.06);
}, 0.05);

let baz = 10;

test6('This should test baz and then cleanup', () => {
  baz += 10
  assert.equal(baz, 20);
}, () => {
  baz = 10;
});

test6('baz should be 10', () => {
  assert.equal(baz, 10);
});

test6('SHOULD FAIL: should be able to pass cleanup and timeout', async () => {
  assert.equal(baz, 10);
  await timer(0.06);
}, 0.05, () => {
  baz = 20;
});

test6('should have cleaned up', () => {
  assert.equal(baz, 20);
});

const test7 = suite('Flitch Timeout in Before Each *SHOULD HAVE 1 FAILING TEST*', { timeout: 0.02 });

test7.before.each = async () => {
  await timer(0.03);
};

test7('SHOULD FAIL: time out in before.each hook', () => {
  // should fail because of before.each hook
});

const test8 = suite('Flitch Timeout in Before All *SUITE FAILURE*', { timeout: 0.02 });

test8.before.all = async () => {
  await timer(0.03);
};

test8('SHOULD FAIL: Suite should fail', () => {});

const test9 = suite('Flitch Timeout in After All *SUITE FAILURE*', { timeout: 0.02 });

test9.after.all = async () => {
  await timer(0.03);
};

test9('SHOULD FAIL: Suite should fail', () => {});

const runSuites = async (...suites) => {
  for (let i = 0; i < suites.length; i++) {
    await suites[i].run();
  }
};

await runSuites(
  test1,
  test2,
  test3,
  test4,
  test5,
  test6,
  test7,
  test8,
  test9,
  ModuleA,
  ModuleB
);