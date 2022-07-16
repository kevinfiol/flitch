let DURATION = 'Duration',
    suites = 0,
    suitesRan = 0,
    totalPasses = 0,
    totalFailures = 0,
    totalSkips = 0,
    onlySuite = null,
    skipSuite = [],
    fail = false,
    isFn = x => typeof x == 'function',
    isNum = Number.isFinite,
    p = (s = '', ...c) => console.log(c.map(x => `\x1b[${x}m`).join('') + `${s}\x1b[0m`);

function noop() {}

function chain(ctx, ...ops) {
    let promise = Promise.resolve();

    for (let i = 0, len = ops.length; i < len; i++) {
        promise = promise.then(_ => ops[i](ctx));
    }

    return promise;
}

function printError([label, message]) {
    p('✗ ' + label, 47, 30);
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
        ? chain(undefined, noop)
        : runSuite();

    function runSuite() {
        return chain().then(_ => {
            p(name, 4, 1);
            if (suitesRan == 0) console.time(DURATION);
            return runOp('before.all hook', chain(ctx, $.before.all));
        })
        .then(async _ => {
            if (onlyTest)
                skip = tests.length,
                tests = [onlyTest];

            for (let i = 0, len = tests.length; i < len; i++) {
                let [label, testcase, x, y] = tests[i];

                await runOp(
                    label,
                    chain(ctx, $.before.each, testcase),
                    x,
                    y,
                    _ => (passes++, totalPasses++),
                    _ => failures++,
                    $.after.each
                );
            }
        })
        .then(_ =>
            runOp('after.all hook', chain(ctx, $.after.all))
        )
        .then(_ => {
            if (failures) throw `✗ ${failures} tests failed.`;
            if (errors.length) throw 0;
        })
        .catch(e => {
            errors.map(printError);
            e && p(e, 41);
            totalFailures += failures;
            fail = true;
        })
        .finally(_ => {
            if (passes) p(`✓ ${passes} tests passed.`, 42);

            if (skip)
                totalSkips += skip,
                p(`↷ ${skip} tests skipped.`, 30, 43);

            p();
            if (onlySuite || ++suitesRan == suites) {
                p(`• • •\nPassed: ${totalPasses}\nFailed: ${totalFailures}\nSkipped: ${totalSkips}`);
                if (skipSuite.length || onlySuite) {
                    p();
                    p(`↷ ${skipSuite.length || suites - 1} suites skipped.`, 30, 43);
                    p();
                }

                console.timeEnd(DURATION);
                process.exit(fail ? 1 : 0);
            }
        });
    }

    function runOp(label, op, x, y, onSuccess = noop, onFail = noop, onComplete = noop) {
        let opTimeout = isNum(x) ? x : (isNum(y) ? y : timeout);
        let cleanup = isFn(x) ? x : (isFn(y) ? y : noop);
        let addError = e => errors.push([label, e.message || e]);

        return race(label, op, opTimeout)
            .then(onSuccess)
            .catch(e => addError(e) && onFail())
            .finally(_ =>
                race(
                    label,
                    chain(ctx, cleanup, onComplete),
                    timeout
                )
                .catch(addError)
            );
    }

    return $;
}