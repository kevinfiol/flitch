type Callback = () => any;

type TestFn =
    ((label: string, testcase: Callback, cleanup?: Callback) => void | Promise<void>) |
    ((label: string, testcase: Callback, cleanup?: Callback, timeout?: number) => void | Promise<void>) |
    ((label: string, testcase: Callback, timeout?: number, cleanup?: Callback) => void | Promise<void>) |
    ((label: string, testcase: Callback, timeout?: number) => void | Promise<void>);

type SuiteFn = (name: string, opts: { timeout: number }) => Suite;

type Suite = TestFn & {
    test: TestFn;
    only: TestFn;
    not: (label: string) => void;
    skip: (label: string) => void;
    before: { each: Callback, all: Callback };
    after: { each: Callback, all: Callback };
};

export const suite: SuiteFn & { not: SuiteFn, skip: SuiteFn, only: SuiteFn };
export function run(opts: { parallel: boolean }): Promise<void>;