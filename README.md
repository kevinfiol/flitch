# flitch

![flitch](logo.jpg)

*Logo by [twitter.com/haggle](https://twitter.com/haggle)*

A cute testing library that barks at you.

```js
import { test, not, only, run, init } from 'flitch';
import { strict as assert } from 'assert';

let sum = 0;

init(); // clears global test runner state

test.before.each = () => {}; // will run before each test case

test.before.all = () => {}; // will run before all test cases

test.after.each = () => {}; // will run after each test case

test.after.all = () => {}; // will run after all test cases

test('addition works', () => {
  sum += 10;
  assert.equal(sum, 10); // tests rely on thrown errors to detect failures
});

not('this test will be skipped', () => {
  sum += 20;
  assert.equal(sum, 21); // this would fail, but we're skipping this test! *shrugs*
});

test('this test cleans up after itself', () => {
  sum += 100;
}, () => {
  sum -= 100;
});

only('this test will run, by itself! the first two tests are ignored', async () => {
  // async tests are cool!
  sum = await Promise.resolve(50);
  assert.equal(sum, 50);
});

run(); // this function is a thenable; chain it if you want
```

The above outputs:
```
Tests Passed ✓: 1
Tests Failed ✗: 0

✓ All 1 tests passed.

The following tests were skipped:
this test will be skipped
```

## Install

```bash
npm install flitch --save-dev
```

## Credits
Inspired by [fantestic](https://github.com/porsager/fantestic).