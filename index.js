let DURATION = 'Duration',
    QUEUE = [],
    SUITES = [],
    totalPasses = 0,
    totalFailures = 0,
    totalSkips = 0,
    onlySuite = null,
    skipSuite = [],
    fail = false,
    isFn = x => typeof x == 'function',
    isNum = Number.isFinite,
    startTimer = (now = Date.now()) => _ => (Date.now() - now) + 'ms',
    f = (s = '', ...c) => c.map(x => `\x1b[${x}m`).join('') + `${s}\x1b[0m`,
    p = (s = '', ...c) => console.log(f(s, ...c));

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
    let tick;
    let clear = _ => clearTimeout(tick);

    return Promise.race([
        new Promise((_, rej) =>
            tick = setTimeout(_ =>
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

function printSuite({ name, time, errors, passes, skip, failures }) {
    p(name, 4, 1);
    p(time);
    errors.map(printError);
    if (failures) p(`✗ ${failures} tests failed.`, 41);

    if (passes) p(`✓ ${passes} tests passed.`, 42);

    if (skip)
        totalSkips += skip,
        p(`↷ ${skip} tests skipped.`, 30, 43);
}

export function run({ parallel = true } = {}) {
    for (let name in SUITES) {
        if (!skipSuite.includes(name) && !(onlySuite && name != onlySuite))
            QUEUE.push(SUITES[name]);
    }

    let timer = startTimer();

    return (parallel
        ? Promise.all(QUEUE.map(p => p()))
        : (async _ => {
            const results = [];

            for (let i = 0, len = QUEUE.length; i < len; i++) {
                results.push(await QUEUE[i]());
            }

            return results;
        })()
    ).then(results =>
        results.map(printSuite)
    ).finally(_ => {
        p(`• • •\nPassed: ${totalPasses}\nFailed: ${totalFailures}\nSkipped: ${totalSkips}`);
        if (skipSuite.length || onlySuite) {
            p();
            p(`↷ ${skipSuite.length || Object.keys(SUITES).length - 1} suites skipped.`, 30, 43);
            p();
        }

        p(`Duration: ${timer()}`);
        console.log({fail, process});
        process.exit(fail ? 1 : 0);
    });
}

export function suite(name, { timeout = 1 } = {}) {
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

    SUITES[name] = _ => chain().then(async _ => {
        const timer = startTimer();
        await runOp('before.all hook', chain(ctx, $.before.all));

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

        await runOp('after.all hook', chain(ctx, $.after.all));
        const time = timer();

        if (failures)
            totalFailures += failures,
            fail = true;

        if (skip) totalSkips += skip;

        return { name, errors, passes, failures, skip, time };
    });

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