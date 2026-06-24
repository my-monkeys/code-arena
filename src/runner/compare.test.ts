// src/runner/compare.test.ts
import { describe, it, expect } from "vitest";
import { deepEqual, buildRunResult } from "./compare";
import type { WorkerOutcome } from "../types";

describe("deepEqual", () => {
  it("compare des scalaires", () => {
    expect(deepEqual(6, 6)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(6, 7)).toBe(false);
  });
  it("compare des listes imbriquées", () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });
  it("distingue null et 0", () => {
    expect(deepEqual(null, 0)).toBe(false);
  });
});

describe("buildRunResult", () => {
  const visible = [{ args: [[1, 2, 3, 4]], expected: 6 }];
  const hidden = [{ args: [[]], expected: 0 }];

  it("propage une erreur globale (compile)", () => {
    const outcome: WorkerOutcome = { kind: "error", phase: "compile", message: "SyntaxError" };
    const res = buildRunResult(visible, hidden, outcome);
    expect(res.passed).toBe(false);
    expect(res.globalError).toBe("SyntaxError");
    expect(res.cases).toHaveLength(0);
  });

  it("marque tous les cas verts quand les valeurs correspondent", () => {
    const outcome: WorkerOutcome = { kind: "ok", actuals: [{ value: 6 }, { value: 0 }] };
    const res = buildRunResult(visible, hidden, outcome);
    expect(res.passed).toBe(true);
    expect(res.cases).toHaveLength(2);
    expect(res.cases[0].hidden).toBe(false);
    expect(res.cases[1].hidden).toBe(true);
  });

  it("échoue si un cas caché diffère", () => {
    const outcome: WorkerOutcome = { kind: "ok", actuals: [{ value: 6 }, { value: 99 }] };
    const res = buildRunResult(visible, hidden, outcome);
    expect(res.passed).toBe(false);
    expect(res.cases[1].passed).toBe(false);
    expect(res.cases[1].got).toBe(99);
  });

  it("remonte l'exception d'un cas", () => {
    const outcome: WorkerOutcome = { kind: "ok", actuals: [{ error: "IndexError" }, { value: 0 }] };
    const res = buildRunResult(visible, hidden, outcome);
    expect(res.passed).toBe(false);
    expect(res.cases[0].error).toBe("IndexError");
    expect(res.cases[0].passed).toBe(false);
  });
});
