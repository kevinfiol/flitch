type Callback = (ctx: Record<string, any>) => any;

type TestFn = <A extends Callback | Timeout>(
    label: string,
    testcase: Callback,
    arg1?: A,
    arg2?: A extends Callback ? Timeout : Callback
) => void | Promise<void>;

type SuiteFn = (name: string, opts: { timeout: number }) => Suite;

type Suite = TestFn & {
    test: TestFn;
    only: TestFn;
    not: (label: string) => void;
    skip: (label: string) => void;
    before: { each: Callback, all: Callback };
    after: { each: Callback, all: Callback };
};

export const suite: SuiteFn & {
    not: (name: string) => Suite,
    skip: (name: string) => Suite,
    only: SuiteFn
};

export function run(opts: { parallel: boolean }): Promise<void>;