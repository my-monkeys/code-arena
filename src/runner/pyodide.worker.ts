// src/runner/pyodide.worker.ts
import type { WorkerOutcome } from "../types";

const PYODIDE_VERSION = "v0.26.2";
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

// @ts-expect-error importScripts global dans un worker
importScripts(`${INDEX_URL}pyodide.js`);

let pyodideReady: Promise<any> | null = null;

async function getPyodide() {
  if (!pyodideReady) {
    // @ts-expect-error loadPyodide injecté par pyodide.js
    pyodideReady = loadPyodide({ indexURL: INDEX_URL });
  }
  return pyodideReady;
}

self.onmessage = async (e: MessageEvent) => {
  const { code, entry, cases } = e.data as {
    code: string;
    entry: string;
    cases: unknown[][];
  };
  let outcome: WorkerOutcome;
  try {
    const py = await getPyodide();
    const ns = py.toPy({});
    try {
      py.runPython(code, { globals: ns });
    } catch (err) {
      self.postMessage({ kind: "error", phase: "compile", message: String(err).split("\n").slice(-2)[0] } as WorkerOutcome);
      return;
    }
    const fn = ns.get(entry);
    if (!fn) {
      self.postMessage({ kind: "error", phase: "compile", message: `La fonction "${entry}" est introuvable.` } as WorkerOutcome);
      return;
    }
    const actuals = cases.map((args) => {
      try {
        const pyArgs = args.map((a) => py.toPy(a));
        const res = fn(...pyArgs);
        const value = res?.toJs ? res.toJs({ create_proxies: false }) : res;
        return { value };
      } catch (err) {
        return { error: String(err).split("\n").slice(-2)[0] };
      }
    });
    outcome = { kind: "ok", actuals };
  } catch (err) {
    outcome = { kind: "error", phase: "runtime", message: String(err) };
  }
  self.postMessage(outcome);
};
