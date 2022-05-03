# flitch

![flitch](logo.jpg)

*Logo by [twitter.com/haggle](https://twitter.com/haggle)*

A cute testing library that barks at you. Extremely minimal. WIP.

```js
import { test, not, only, run, init } from 'flitch';
import { strict as assert } from 'assert';

let sum = 0;

init(); // clears global test runner state; only demonstrating here, not necessary in this case

test('addition works', () => {
  sum += 10;
  assert.equal(sum, 10); // use whatever assertion library you want
  return () => sum = 0; // cleans up after test is complete
});

not('this test will be skipped', () => {
  sum += 20;
  assert.equal(sum, 21); // this would fail, but we're skipping this test! *shrugs*
});

only('this test will run, by itself! the first two tests are ignored', async () => {
  // async tests are cool!
  sum = await Promise.resolve(50);
  assert.equal(sum, 50);
});

run(); // this function is async. chain it if you want!
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