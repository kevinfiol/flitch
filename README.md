# flitch

![flitch](logo.jpg)

*Logo by [twitter.com/haggle](https://twitter.com/haggle)*

A cute testing library that barks at you.

```js
import { suite, run } from 'flitch';
import { strict as assert } from 'assert';

// create suite with timeout of 5 seconds for all operations
const test = suite('Flitch Tests', { timeout: 5 });

// attach before/after hooks
// e.g, test.before.all, test.before.each, test.after.all, test.after.each
test.before.all = (ctx) => {
  // use context object to share values within suite
  ctx.sum = 0;
};

test('addition works', (ctx) => {
  ctx.sum += 10;
  assert.equal(ctx.sum, 10); // tests rely on thrown errors to detect failures
});

test.not('this test will be skipped', (ctx) => {
  ctx.sum += 20;
  assert.equal(ctx.sum, 31); // this would fail, but we're skipping this test! *shrugs*
});

test.skip('test.skip is an alias for test.not', async () => {
  await new Promise(resolve => setTimeout(resolve, 6 * 1000));
});

test('this test would not timeout!', async () => {
  await new Promise(resolve => setTimeout(resolve, 6 * 1000));
}, 7); // timeout can be specified per test

test('this test cleans up after itself', async (ctx) => {
  await new Promise(resolve => setTimeout(resolve, 2 * 1000));
  ctx.sum += 100;
},
  3, // time out after 3 seconds
  () => {
    ctx.sum -= 100; // cleanup
  }
);

test.only('this test will run, by itself!', async (ctx) => {
  let num = await Promise.resolve(50);
  ctx.sum += num;
  assert.equal(ctx.sum, 50);
});

// `not`, `skip`, and `only` can also be used on suites
const test2 = suite.skip('This whole suite will be skipped');

test2('this will never run!', () => {
  assert.equal(1, 1);
});

run({ parallel: false }); // optionally run all suites in parallel
```

Save the above to `test.js` and run like so:
```bash
node test.js
````

The above outputs:
```
Flitch Tests
✓ 1 tests passed
↷ 5 tests skipped

⧗ 0.001s

• • •

Passed:  1
Failed:  0
Skipped: 5

↷ 1 suites skipped

Duration: 0.004s
```

## Install

```bash
npm install flitch --save-dev
```

## Running all test files in a directory

This package doesn't include any utilities to crawl directories for test files since that is a bit out of scope. Using `run()` will simply run any test suite defined in your import path. That means you can simply import all of your suites in a base `runTests.js` script and call `run()` afterwards.

This can get tedious as you'll have to manually import every test suite you create (although this isn't necessarily a bad thing). However, you can use Node APIs or something like [totalist](https://github.com/lukeed/totalist) to dynamically import all test files before calling `run()`. See [this example](examples/runTests.js) for a solution using a simple recursive directory walking function.

## Credits
Inspired by [fantestic](https://github.com/porsager/fantestic).
