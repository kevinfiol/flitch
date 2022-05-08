let tests, skip, passes, failures, onlyTest;
init();

function noop() {}

export function test(label, testcase, cleanup) {
    tests.push({label, testcase, cleanup});
};

export function not(label) {
    skip.push(label);
};

export function only(label, testcase, cleanup) {
    onlyTest = {label, testcase, cleanup};
};

export function run() {
    return Promise.resolve().then(async () => {
        await test.before.all();

        await new Promise(async (res) => {
            if (onlyTest) {
                await runTestCase(onlyTest);
            } else {
                for (let i = 0, len = tests.length; i < len; i += 1) {
                    await runTestCase(tests[i]);
                }
            }

            res(1);
        });

        await test.after.all();

        console.log(`===\nTests Passed ✓: ${passes}`);
        console.warn(`Tests Failed ✗: ${failures}`);

        if (failures) {
            logFail(`\n✗ Tests failed with ${failures} failing tests.`);
            process.exit(1);
        } else logPass(`\n✓ All ${passes} tests passed.`)

        if (skip.length) {
            console.log('\nThe following tests were skipped:');
            console.log(skip.join('\n'));
        }
    });
};

export function init() {
    tests = [];
    skip = [];
    passes = 0;
    failures = 0;
    onlyTest = null;
    test.before = { each: noop, all: noop };
    test.after = { each: noop, all: noop };
}

async function runTestCase({ label, testcase, cleanup }) {
    try {
        await test.before.each();
        await testcase();
        passes += 1;
    } catch(e) {
        failures += 1;
        console.error(`Failed Test: "${label}":\n${e.message}\n`)
    }

    if (cleanup) await cleanup();
    await test.after.each();
}

function logFail(str) {
    console.error('\x1b[41m%s\x1b[0m', str);
}

function logPass(str) {
    console.log('\x1b[42m%s\x1b[0m', str);
}
