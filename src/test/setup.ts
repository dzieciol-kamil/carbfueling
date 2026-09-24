/**
 * Vitest setup, run before every test file.
 *
 * **Yield to the event loop before each test.** A test worker reports progress to the main process
 * over RPC and gives up on a reply after a fixed 60 s (not configurable in vitest 3). The reply is
 * I/O, and the runner only ever awaits promises between tests, so a file of long synchronous tests
 * — the autoplan property and exhaustive-search suites — never lets it in: once the file has run
 * for a minute the worker throws `Timeout calling "onTaskUpdate"` and the run fails with every test
 * green. `setImmediate` runs after the poll phase, so waiting on it once per test lets the replies
 * in; only a single test over 60 s could still hit the limit.
 */
import { beforeEach } from 'vitest';

// The app's tsconfig carries no Node types, so the one Node global used here is typed by hand.
const { setImmediate } = globalThis as unknown as { setImmediate: (fn: () => void) => void };

beforeEach(() => new Promise<void>((resolve) => setImmediate(resolve)));
