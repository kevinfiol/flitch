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
    isFn = x => typeof x == 'function',
    isNum = Number.isFinite,
    f = (s, ...c) => c.map(x => `\x1b[${x}m`).join('') + `${s}\x1b[0m`;

function noop() {}

function chain(...ops) {
    let promise = Promise.resolve();

    for (let i = 0, len = ops.length; i < len; i++) {
        promise = promise.then(ops[i]);
    }

    return promise;
}

function printError([label, message]) {
    pe(f('✗ ' + label, 47, 30));
    p(message + '\n');
}

function race(label, op, timeout) {
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
        isFn(op)
            ? op() || 1 && clear()
            : op.finally(clear)
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

    $.run = _ => (onlySuite && name != onlySuite) || (skipSuite.includes(name))
        ? chain(noop)
        : runSuite();

    function runSuite() {
        return chain().then(_ => {
            p(f(name, 4, 1));
            if (ran == 0) console.time(DURATION);
            return race('before.all hook', $.before.all, timeout)
        })
        .then(async _ => {
            if (onlyTest)
                skip = tests.length,
                tests = [onlyTest];

            for (let i = 0, len = tests.length; i < len; i++) {
                let [label, testcase, x, y] = tests[i];

                await runOp(
                    label,
                    chain($.before.each, testcase),
                    x,
                    y,
                    _ => (passes++, totalPasses++),
                    $.after.each
                );
            }
        })
        .then(_ => runOp('after.all hook', $.after.all))
        .then(_ => {
            if (failures = errors.length) {
                errors.map(printError);
                throw f(`✗ ${failures} tests failed.`, 41);
            }
        })
        .catch(e => {
            pe(f(e, 41));
            totalFailures += failures;
            fail = true;
        })
        .finally(_ => {
            if (passes) p(f(`✓ ${passes} tests passed.`, 42));

            if (skip)
                totalSkips += skip,
                p(f(`↷ ${skip} tests skipped.`, 30, 43));

            p('');
            if (onlySuite || ++ran == suites) {
                p('• • •');
                p(`Passed: ${totalPasses}`);
                p(`Failed: ${totalFailures}`);
                p(`Skipped: ${totalSkips}`);

                if (skipSuite.length || onlySuite) {
                    p('\n' + f(`↷ ${skipSuite.length || suites - 1} suites skipped.`, 30, 43) + '\n');
                }

                console.timeEnd(DURATION);
                process.exit(fail ? 1 : 0);
            }
        });
    }

    function runOp(label, op, x, y, onSuccess = noop, onComplete = noop) {
        let opTimeout = isNum(x) ? x : (isNum(y) ? y : timeout);
        let cleanup = isFn(x) ? x : (isFn(y) ? y : noop);
        let addError = e => errors.push([label, e.message || e]);

        return race(label, op, opTimeout)
            .then(onSuccess)
            .catch(addError)
            .finally(_ =>
                race(
                    label,
                    chain(cleanup, onComplete),
                    timeout
                )
                .catch(addError)
            );
    }

    return $;
}