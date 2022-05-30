let count = 0,
    ran = 0,
    fail = false,
    p = console.log,
    pe = console.error,
    f = (s, ...c) => c.map(x => `\x1b[${x}m`).join('') + `${s}\x1b[0m`;

function noop() {}

function printError([label, message]) {
    pe(f('✗ ' + label, 47, 30));
    p(message);
}

export function suite(name) {
    count++;
    let tests = [],
        skip = [],
        errors = [],
        passes = 0,
        failures = 0,
        onlyTest = null,
        $ = (label, testcase, cleanup) =>
            tests.push([label, testcase, cleanup]);

    $.test = $;
    $.before = { each: noop, all: noop };
    $.after = { each: noop, all: noop };

    $.only = (label, testcase, cleanup) =>
        onlyTest = [label, testcase, cleanup];

    $.not = label => skip.push(label);

    $.run = () => Promise.resolve()
        .then($.before.all)
        .then(async _ => {
            if (onlyTest) await runTestCase(onlyTest);
            else for (let i = 0; i < tests.length; i += 1) await runTestCase(tests[i]);
        })
        .then($.after.all)
        .then(_ => {
            p(f(name, 4, 1));

            if (failures = errors.length) errors.map(printError);

            p(`Tests Passed ✓: ${passes}`);
            p(`Tests Failed ✗: ${failures}\n`);

            if (failures) fail = true, pe(f(`✗ ${failures} failing tests.`, 41));
            else p(f(`✓ All ${passes} tests passed.`, 42));

            if (onlyTest) p(`\nOnly the following testcase was run:\n• ${onlyTest[0]}`);
            else if (skip.length) p(`\nThe following tests were skipped:\n• ${skip.join('\n• ')}`);
            p('');

            ran++;
            if (fail && ran == count) process.exit(1);
        }).catch(e => {
            pe(e);
            process.exit(1);
        });

    async function runTestCase([label, testcase, cleanup]) {
        try {
            await $.before.each();
            await testcase();
            passes++;
        } catch (e) {
            errors.push([label, e.message]);
        }

        if (cleanup) await cleanup();
        await $.after.each();
    }

    return $;
}