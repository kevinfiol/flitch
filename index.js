let count = 0,
    ran = 0,
    fail = false,
    p = console.log,
    pe = console.error;

function noop() {}

export function suite(name) {
    count++;
    let $,
        tests = [],
        skip = [],
        passes = 0,
        failures = 0,
        onlyTest = null;

    $ = (label, testcase, cleanup) =>
        tests.push({label, testcase, cleanup})

    $.test = $;
    $.before = { each: noop, all: noop };
    $.after = { each: noop, all: noop };

    $.only = (label, testcase, cleanup) =>
        onlyTest = {label, testcase, cleanup};

    $.not = label => skip.push(label);

    $.run = () => Promise.resolve().then(async () => {
        await $.before.all();

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

        await $.after.all();

        p(`=== ${name}\nTests Passed ✓: ${passes}`);
        p(`Tests Failed ✗: ${failures}\n`);

        if (failures) {
            fail = true;
            pe('\x1b[41m%s\x1b[0m', `✗ ${name}: ${failures} failing tests.`);
        } else p('\x1b[42m%s\x1b[0m', `✓ ${name}: All ${passes} tests passed.`);

        if (onlyTest) p(`\nOnly the following testcase was run:\n${onlyTest.label}`);
        else if (skip.length) p(`\nThe following tests were skipped:\n${skip.join('\n')}`);
        p('');

        ran++;
        if (fail && ran == count) process.exit(1);
    });

    async function runTestCase({ label, testcase, cleanup }) {
        try {
            await $.before.each();
            await testcase();
            passes++;
        } catch (e) {
            failures++;
            pe(`Failed Test: "${label}":\n${e.message}`)
        }

        if (cleanup) await cleanup();
        await $.after.each();
    }

    return $;
}