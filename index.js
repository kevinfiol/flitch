let DURATION = 'Duration',
    suites = 0,
    totalPasses = 0,
    totalFailures = 0,
    totalSkips = 0,
    onlySuite = null,
    skipSuite = [],
    ran = 0,
    fail = false,
    p = console.log,
    pe = console.error,
    promise = Promise.resolve(),
    isFn = x => typeof x == 'function',
    isNum = Number.isFinite,
    f = (s, ...c) => c.map(x => `\x1b[${x}m`).join('') + `${s}\x1b[0m`;

function noop() {}

function printError([label, message]) {
    pe(f('✗ ' + label, 47, 30));
    p(message + '\n');
}

function race(label, fn, timeout) {
    let timer;
    let clear = _ => clearTimeout(timer);

    return Promise.race([
        new Promise((_, rej) =>
            timer = setTimeout(_ =>
                rej(
                    `[${label}] timed out after ${timeout} seconds.`
                ),
                1000 * timeout
            )
        ),
        isFn(fn)
            ? fn() || 1 && clear()
            : fn.finally(clear)
    ]);
}

suite.not = suite.skip = (name, ...args) => {
    skipSuite.push(name);
    return suite(name, ...args);
};

suite.only = (name, ...args) => {
    onlySuite = name;
    return suite(name, ...args);
};

export function suite(name, { timeout = 1 } = {}) {
    if (!skipSuite.includes(name)) suites++;

    let ctx = {},
        tests = [],
        errors = [],
        skip = 0,
        passes = 0,
        failures = 0,
        onlyTest = null,
        $ = (label, testcase, x, y) =>
            tests.push([label, testcase, x, y]);

    $.test = $;
    $.before = { each: noop, all: noop };
    $.after = { each: noop, all: noop };

    $.only = (label, testcase, x, y) =>
        onlyTest = [label, testcase, x, y];

    $.not = $.skip = _ => skip++;

    $.run = (onlySuite && name != onlySuite) || (skipSuite.includes(name))
        ? promise.then(noop)
        : _ => promise
        .then(_ => {
            p(f(name, 4, 1));
            if (ran == 0) console.time(DURATION);
            return race(name, $.before.all, timeout)
        })
        .then(async _ => {
            if (onlyTest)
                skip = tests.length,
                tests = [onlyTest];

            for (let i = 0, len = tests.length; i < len; i++) {
                await runTestCase(tests[i]);
            }
        })
        .then(_ =>
            race(name, $.after.all, timeout)
        )
        .then(_ => {
            if (failures = errors.length) {
                errors.map(printError);
                totalFailures += failures;
                throw f(`✗ ${failures} tests failed.`, 41);
            }

            p(f(`✓ ${passes} tests passed.`, 42));
        })
        .catch(e => {
            pe(f(e, 41));
            fail = true;
        })
        .finally(_ => {
            if (skip)
                totalSkips += skip,
                p(f(`↷ ${skip} tests skipped.`, 30, 43));

            p('');
            if (onlySuite || ++ran == suites) {
                p('• • •');
                p(`Passed: ${totalPasses}`);
                p(`Failed: ${totalFailures}`);
                p(`Skipped: ${totalSkips}`);

                // if (onlySuite) p(`\nOnly the following suite was run:\n• ${onlySuite}`);
                // if (skipSuite.length || onlySuite) p(f(`↷ ${skip.length} tests skipped.`, 30, 43));
                console.timeEnd(DURATION);
                p('');
                process.exit(fail ? 1 : 0);
            }
        });

    function runTestCase([label, testcase, x, y]) {
        let _timeout = isNum(x) ? x : (isNum(y) ? y : timeout);
        let cleanup = isFn(x) ? x : (isFn(y) ? y : noop);
        let addError = e => errors.push([label, e.message || e]);

        return race(
            label,
            promise.then($.before.each).then(testcase),
            _timeout
        )
            .then(_ => (passes++, totalPasses++))
            .catch(addError)
            .finally(_ =>
                race(
                    label,
                    promise.then(cleanup).then($.after.each),
                    timeout
                )
                .catch(addError)
            );
    }

    return $;
}