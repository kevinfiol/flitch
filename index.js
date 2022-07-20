let QUEUE = [],
    SUITES = [],
    totalPasses = 0,
    totalFailures = 0,
    totalSkips = 0,
    onlySuite = null,
    skipSuite = [],
    fail = false,
    isFn = x => typeof x == 'function',
    isNum = Number.isFinite,
    start = (now = Date.now()) => _ => ((Date.now() - now) / 1000) + 's',
    p = (s = '', ...c) => console.log(c.map(x => `\x1b[${x}m`).join('') + `${s}\x1b[0m`);

function noop() {}

function chain(ctx, ...ops) {
    let promise = Promise.resolve();
    for (let op of ops) promise = promise.then(_ => op(ctx));
    return promise;
}

function race(label, op, timeout) {
    let tick;
    let clear = _ => clearTimeout(tick);

    return Promise.race([
        new Promise((_, rej) =>
            tick = setTimeout(
                _ => rej(`[${label}] timed out after ${timeout}s.`),
                1000 * timeout
            )
        ),
        isFn(op) ? op() || 1 && clear() : op.finally(clear)
    ]);
}

function printSuite({ name, errors, passes, failures, skip, time }) {
    p(name, 4, 1);
    errors.map(e => p('✗ ' + e[0], 47, 30) + p(e[1] + '\n'));
    failures && p(`✗ ${failures} tests failed`, 41);
    passes && p(`✓ ${passes} tests passed`, 42);
    skip && p(`↷ ${skip} tests skipped`, 30, 43);
    p(`\n⧗ ${time}\n`);
}

export function run({ parallel = false } = {}) {
    for (let name in SUITES)
        if (!skipSuite.includes(name) && !(onlySuite && name != onlySuite))
            QUEUE.push(SUITES[name]);

    let end = start();

    return (parallel
        ? Promise.all(QUEUE.map(p => p()))
        : (async _ => {
            let results = [];
            for (let job of QUEUE) results.push(await job());
            return results;
        })()
    ).then(results =>
        results.map(printSuite)
    ).finally(_ => {
        p(`• • •\n\nPassed:  ${totalPasses}\nFailed:  ${totalFailures}\nSkipped: ${totalSkips}\n`);
        if (skipSuite.length || onlySuite)
            p(`↷ ${skipSuite.length || Object.keys(SUITES).length - 1} suites skipped`, 30, 43) + p('');
        p(`Duration: ${end()}\n`);
        process.exit(fail ? 1 : 0);
    });
}

suite.not = suite.skip = name =>
    skipSuite.push(name) && suite(name);

suite.only = (name, ...args) =>
    (onlySuite = name) && suite(name, ...args);

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
    $.not = $.skip = _ => skip++;
    $.only = (label, testcase, x, y) =>
        onlyTest = [label, testcase, x, y];

    SUITES[name] = _ => chain().then(async _ => {
        let end = start();
        await runOp('before.all hook', chain(ctx, $.before.all));
        if (onlyTest) skip += tests.length, tests = [onlyTest];

        for (let [label, testcase, x, y] of tests)
            await runOp(
                label,
                chain(ctx, $.before.each, testcase),
                x,
                y,
                _ => (passes++, totalPasses++),
                _ => failures++,
                $.after.each
            );

        await runOp('after.all hook', chain(ctx, $.after.all));
        if (failures) totalFailures += failures, fail = true;
        if (skip) totalSkips += skip;
        return { name, errors, passes, failures, skip, time: end() };
    });

    function runOp(label, op, x, y, onSuccess = noop, onFail = noop, onComplete = noop) {
        let opTimeout = isNum(x) ? x : (isNum(y) ? y : timeout);
        let cleanup = isFn(x) ? x : (isFn(y) ? y : noop);
        let addError = e => errors.push([label, e.message || e]);

        return race(label, op, opTimeout).then(onSuccess)
            .catch(e => addError(e) && onFail())
            .finally(_ => race(label, chain(ctx, cleanup, onComplete), timeout).catch(addError));
    }

    return $;
}