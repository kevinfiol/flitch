type Cleanup = () => void;
type Testcase = () => void;

export function test(label: string, testcase: Testcase, cleanup: Cleanup): void;
export function not(label: string): void;
export function only(label: string, testcase: Testcase, cleanup: Cleanup): void;
export function run(): Promise<void>;
export function init(): void;