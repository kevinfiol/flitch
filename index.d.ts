type Callback = () => void | Promise<void>;
type TestFn = (label: string, testcase: Callback, cleanup: Callback) => void | Promise<void>;

type Suite = {
    (label: string, testcase: Callback, cleanup: Callback): void | Promise<void>;
    test: TestFn;
    only: TestFn;
    not: (label: string) => void;
    run: () => Promise<void>;
    before: { each: Callback, all: Callback };
    after: { each: Callback, all: Callback };
};

export function suite(name: string): Suite;