// src/runner/runCode.ts
import { buildRunResult } from "./compare";
import type { Level, RunResult, WorkerOutcome } from "../types";

const EXEC_TIMEOUT_MS = 5000;

let worker: Worker | null = null;

function spawn(): Worker {
  return new Worker(new URL("./pyodide.worker.ts", import.meta.url), { type: "module" });
}

function getWorker(): Worker {
  if (!worker) worker = spawn();
  return worker;
}

export function runCode(code: string, level: Level): Promise<RunResult> {
  const cases = [...level.tests, ...level.hiddenTests].map((t) => t.args);
  const w = getWorker();

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.terminate();
      worker = null; // forcer un nouveau worker au prochain run
      resolve({
        passed: false,
        globalError: `Temps dépassé (> ${EXEC_TIMEOUT_MS / 1000}s). Boucle infinie ?`,
        cases: [],
      });
    }, EXEC_TIMEOUT_MS);

    const onMessage = (e: MessageEvent) => {
      clearTimeout(timer);
      w.removeEventListener("message", onMessage);
      resolve(buildRunResult(level.tests, level.hiddenTests, e.data as WorkerOutcome));
    };

    w.addEventListener("message", onMessage);
    w.postMessage({ code, entry: level.entry, cases });
  });
}
