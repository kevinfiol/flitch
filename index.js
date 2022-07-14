let DURATION = 'Duration',
    count = 0,
    ran = 0,
    fail = false,
    p = console.log,
    pe = console.error,
    promise = Promise.resolve(),
    isFn = x => typeof x == 'function',
    isNum = Number.isFinite,
    f = (s, ...c) => c.map(x => `\x1b[${x}m`).join('') + `${s}\x1b[0m`;

function noop() {}

function printError(e) {
    pe(f('✗ ' + e[0], 47, 30));
    p(e[1] + '\n');
}

function race(label, fn, timeout) {
    let timer;
    let clear = _ => clearTimeout(timer);

    return Promise.race([
        new Promise((_, rej) =>
            timer = setTimeout(_ =>
                rej(
                    f('↻ [' + label + '] timed out.', 30, 43)
                ),
                1000 * timeout
            )
        ),
        promise.then(fn).finally(clear)
    ]);
}

export function suite(name, { timeout = 1 } = {}) {
    count++;

    let tests = [],
        skip = [],
        errors = [],
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

    $.not = $.skip = label => skip.push(label);

    $.run = () => promise
        .then(_ => {
            if (ran == 0) console.time(DURATION);
            return race(name, $.before.all, timeout)
        })
        .then(async _ => {
            tests = onlyTest ? [onlyTest] : tests;

            for (let i = 0, len = tests.length; i < len; i += 1) {
                await runTestCase(tests[i]);
            }
        })
        .then(_ =>
            race(name, $.after.all, timeout)
        )
        .then(_ => {
            p(f(name, 4, 1));

            if (errors.length)
                errors.map(printError),
                failures = errors.length;

            p(`Tests Passed ✓: ${passes}`);
            p(`Tests Failed ✗: ${failures}\n`);

            if (failures) {
                fail = true;
                pe(f(`✗ ${failures} failing tests.`, 41));
            } else p(f(`✓ All ${passes} tests passed.`, 42));

            if (onlyTest) p(`\nOnly the following testcase was run:\n• ${onlyTest[0]}`);
            else if (skip.length) p(f(`↷ ${skip.length} tests skipped.`, 30, 43));
        })
        .catch(e => {
            p(f(name, 4, 1));
            pe(f(e.message || e, 41));
            fail = true;
        })
        .finally(_ => {
            p('');
            if (++ran == count) {
                let code = fail ? 1 : 0;
                console.timeEnd(DURATION);
                process.exit(code);
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
            .then(_ => passes++)
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