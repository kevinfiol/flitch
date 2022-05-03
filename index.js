let tests, skip, passes, failures, onlyTest;
init();

const noop = () => {};

export function test(label, testcase) {
    tests.push({ label, testcase });
};

export function not(label) {
    skip.push(label);
};

export function only(label, testcase) {
    onlyTest = { label, testcase };
};

export function run() {
    return Promise.resolve().then(async () => {
        await new Promise(async (res) => {
            if (onlyTest) {
                await runTestCase(onlyTest).then(cleanup => cleanup());
            } else {
                for (let i = 0, len = tests.length; i < len; i += 1) {
                    await runTestCase(tests[i]).then(cleanup => cleanup());
                }
            }

            res(true);
        });

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
}

async function runTestCase({ label, testcase }) {
    let cleanup = noop;

    try {
        cleanup = await testcase() || cleanup;
        passes += 1;
    } catch(e) {
        failures += 1;
        console.error(`Failed Test: "${label}":\n${e.message}\n`)
    }

    return cleanup;
}

function logFail(str) {
    console.error('\x1b[41m%s\x1b[0m', str);
}

function logPass(str) {
    console.log('\x1b[42m%s\x1b[0m', str);
}
