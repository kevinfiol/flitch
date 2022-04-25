type Cleanup = () => void;
type Testcase = () => void | Cleanup | Promise<Cleanup>;

export function test(label: string, testcase: Testcase): void;
export function not(label: string): void;
export function only(label: string, testcase: Testcase): void;
export function run(): Promise<void>;
export function init(): void;