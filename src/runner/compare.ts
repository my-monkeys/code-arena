// src/runner/compare.ts
import type { Test, WorkerOutcome, RunResult, CaseOutcome } from "../types";

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    );
  }
  return false;
}

export function buildRunResult(
  visible: Test[],
  hidden: Test[],
  outcome: WorkerOutcome,
): RunResult {
  if (outcome.kind === "error") {
    return { passed: false, globalError: outcome.message, cases: [] };
  }
  const all = [
    ...visible.map((t) => ({ t, hidden: false })),
    ...hidden.map((t) => ({ t, hidden: true })),
  ];
  const cases: CaseOutcome[] = all.map(({ t, hidden }, i) => {
    const actual = outcome.actuals[i];
    if (actual?.error) {
      return { hidden, passed: false, args: t.args, expected: t.expected, error: actual.error };
    }
    const got = actual?.value;
    return { hidden, passed: deepEqual(got, t.expected), args: t.args, expected: t.expected, got };
  });
  return { passed: cases.every((c) => c.passed), cases };
}
