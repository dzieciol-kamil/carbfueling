// Runs once per test file (vitest `setupFiles`). Keeps the planner trace (src/domain/planner/trace.ts)
// silent in the suite — it defaults to on so the owner sees it in the browser without flipping a flag,
// but 601 tests each printing eight `console.group` blocks would drown the output.
import { setPlannerTrace } from './src/domain/planner/trace';

setPlannerTrace(false);
