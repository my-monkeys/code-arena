# Code Arena Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plateforme web de défis Python à 20 niveaux (façon France-IOI) pour animer une classe : éditeur dans le navigateur, exécution Pyodide, validation par tests, leaderboard live projetable.

**Architecture:** SPA Vite + React + TS. Le Python tourne **dans un Web Worker Pyodide** (timeout par terminaison/relance du worker). La logique de comparaison des résultats est un module pur testé en TDD ; Pyodide est câblé autour. Supabase (une table, sans auth) pour la progression et le leaderboard temps réel.

**Tech Stack:** Vite, React 18, TypeScript, React Router, CodeMirror 6 (`@uiw/react-codemirror` + `@codemirror/lang-python`), Pyodide (CDN jsDelivr), `@supabase/supabase-js`, Vitest.

## Global Constraints

- **Aucun backend d'exécution** : tout le Python s'exécute côté navigateur (Pyodide en Web Worker). Jamais d'`eval` serveur.
- **Pas d'auth** : identité = pseudo libre en `localStorage`. Table Supabase publique en lecture/insertion.
- **Convention des niveaux** : chaque défi est une **fonction qui retourne une valeur** (jamais `print`).
- **Langue UI** : français.
- **Préfixe tables Supabase** : `cc_` (ex. `cc_progress`) sur le projet partagé MyMonkey.
- **Pas d'attribution IA** dans les commits (repo public My-Monkey, auteur `MaximCosta`).
- **Timeout d'exécution** : `EXEC_TIMEOUT_MS = 5000`.
- **Node** : v22.x (déjà installé).

---

### Task 1: Scaffold du projet Vite + React + TS

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: app Vite lançable (`npm run dev`), `npm run build`, `npm test` (Vitest).

- [ ] **Step 1: Scaffolder et installer**

```bash
cd /Users/maxim/Documents/my-monkey/code-arena
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom @supabase/supabase-js @uiw/react-codemirror @codemirror/lang-python
npm install -D vitest
```

- [ ] **Step 2: Ajouter le script de test dans `package.json`**

Dans `"scripts"`, ajouter :
```json
"test": "vitest run"
```

- [ ] **Step 3: Créer `.env.example`**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Vérifier le `.gitignore`**

S'assurer qu'il contient `node_modules`, `dist`, `.env`, `.env.local`. (Le template Vite les met déjà ; ajouter `.env` et `.env.local` si absents.)

- [ ] **Step 5: Remplacer `src/App.tsx` par un placeholder minimal**

```tsx
export default function App() {
  return <h1>Code Arena</h1>;
}
```

- [ ] **Step 6: Vérifier le build**

Run: `npm run build`
Expected: build réussit, dossier `dist/` créé.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react ts project"
```

---

### Task 2: Types partagés des niveaux et résultats

**Files:**
- Create: `src/types.ts`

**Interfaces:**
- Produces: types `Test`, `Level`, `CaseOutcome`, `RunResult` consommés par tous les modules suivants.

- [ ] **Step 1: Écrire les types**

```ts
// src/types.ts
export type Test = { args: unknown[]; expected: unknown };

export type Difficulty = "facile" | "moyen" | "difficile";

export type Level = {
  id: number;
  title: string;
  difficulty: Difficulty;
  statement: string;     // markdown léger (rendu en texte/paragraphes)
  starterCode: string;
  entry: string;         // nom de la fonction à appeler
  tests: Test[];         // visibles
  hiddenTests: Test[];   // cachés
};

// Résultat brut renvoyé par le worker pour UNE soumission
export type WorkerOutcome =
  | { kind: "error"; phase: "compile" | "runtime" | "timeout"; message: string }
  | { kind: "ok"; actuals: { value?: unknown; error?: string }[] };

// Résultat d'un cas après comparaison
export type CaseOutcome = {
  hidden: boolean;
  passed: boolean;
  args: unknown[];
  expected: unknown;
  got?: unknown;      // valeur obtenue (si pas d'exception)
  error?: string;     // message d'exception pour ce cas
};

// Résultat global d'une soumission
export type RunResult = {
  passed: boolean;             // tous les cas verts
  globalError?: string;        // erreur compile/timeout → affichée seule
  cases: CaseOutcome[];        // vide si globalError
};
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: shared level and result types"
```

---

### Task 3: Module de comparaison pur (TDD)

**Files:**
- Create: `src/runner/compare.ts`
- Test: `src/runner/compare.test.ts`

**Interfaces:**
- Consumes: `Test`, `WorkerOutcome`, `RunResult`, `CaseOutcome` de `src/types.ts`.
- Produces:
  - `deepEqual(a: unknown, b: unknown): boolean`
  - `buildRunResult(visible: Test[], hidden: Test[], outcome: WorkerOutcome): RunResult`

- [ ] **Step 1: Écrire les tests qui échouent**

```ts
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
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL (`compare.ts` n'existe pas).

- [ ] **Step 3: Implémenter `compare.ts`**

```ts
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
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `npm test`
Expected: PASS (tous les tests de `compare.test.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/runner/compare.ts src/runner/compare.test.ts
git commit -m "feat: pure result comparison module with tests"
```

---

### Task 4: Web Worker Pyodide

**Files:**
- Create: `src/runner/pyodide.worker.ts`

**Interfaces:**
- Consumes: messages `{ code: string; entry: string; cases: unknown[][] }`.
- Produces: poste un `WorkerOutcome` (de `src/types.ts`) via `postMessage`.

- [ ] **Step 1: Implémenter le worker**

Charge Pyodide depuis le CDN, exécute le code utilisateur dans un namespace, appelle la fonction `entry` pour chaque cas, renvoie valeurs ou exceptions par cas. Une erreur d'`exec` global = phase `compile`.

```ts
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
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: pas d'erreur de type (les `@ts-expect-error` couvrent les globals worker).

- [ ] **Step 3: Commit**

```bash
git add src/runner/pyodide.worker.ts
git commit -m "feat: pyodide web worker runner"
```

---

### Task 5: Client d'exécution (spawn worker + timeout)

**Files:**
- Create: `src/runner/runCode.ts`

**Interfaces:**
- Consumes: `buildRunResult` (Task 3), worker (Task 4), `Level`, `RunResult`.
- Produces: `runCode(code: string, level: Level): Promise<RunResult>` — gère le timeout en terminant/réinstanciant le worker.

- [ ] **Step 1: Implémenter le client**

```ts
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
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 3: Commit**

```bash
git add src/runner/runCode.ts
git commit -m "feat: worker client with execution timeout"
```

---

### Task 6: Données des 20 niveaux

**Files:**
- Create: `src/levels.ts`

**Interfaces:**
- Consumes: `Level` de `src/types.ts`.
- Produces: `LEVELS: Level[]` (20 entrées, ids 1..20), `TOTAL_LEVELS = 20`.

- [ ] **Step 1: Écrire les niveaux**

Énoncés en français, convention « retourne une valeur ». Difficulté croissante.

```ts
// src/levels.ts
import type { Level } from "./types";

export const LEVELS: Level[] = [
  {
    id: 1, title: "Bonjour", difficulty: "facile",
    statement: "Écris une fonction `bonjour()` qui **retourne** la chaîne `\"Bonjour\"`.",
    entry: "bonjour",
    starterCode: "def bonjour():\n    # retourne la chaîne \"Bonjour\"\n    pass\n",
    tests: [{ args: [], expected: "Bonjour" }],
    hiddenTests: [],
  },
  {
    id: 2, title: "Le double", difficulty: "facile",
    statement: "Retourne le double de `n`.",
    entry: "double",
    starterCode: "def double(n):\n    pass\n",
    tests: [{ args: [3], expected: 6 }, { args: [0], expected: 0 }],
    hiddenTests: [{ args: [-4], expected: -8 }],
  },
  {
    id: 3, title: "Somme", difficulty: "facile",
    statement: "Retourne la somme de `a` et `b`.",
    entry: "somme",
    starterCode: "def somme(a, b):\n    pass\n",
    tests: [{ args: [2, 3], expected: 5 }],
    hiddenTests: [{ args: [-1, 1], expected: 0 }, { args: [100, 250], expected: 350 }],
  },
  {
    id: 4, title: "Pair ou impair", difficulty: "facile",
    statement: "Retourne `True` si `n` est pair, sinon `False`.",
    entry: "est_pair",
    starterCode: "def est_pair(n):\n    pass\n",
    tests: [{ args: [4], expected: true }, { args: [7], expected: false }],
    hiddenTests: [{ args: [0], expected: true }, { args: [-3], expected: false }],
  },
  {
    id: 5, title: "Le plus grand", difficulty: "facile",
    statement: "Retourne le plus grand des deux nombres `a` et `b`.",
    entry: "maximum",
    starterCode: "def maximum(a, b):\n    pass\n",
    tests: [{ args: [3, 8], expected: 8 }, { args: [10, 2], expected: 10 }],
    hiddenTests: [{ args: [5, 5], expected: 5 }, { args: [-1, -9], expected: -1 }],
  },
  {
    id: 6, title: "Taille du mot", difficulty: "facile",
    statement: "Retourne le nombre de caractères de la chaîne `mot`.",
    entry: "taille",
    starterCode: "def taille(mot):\n    pass\n",
    tests: [{ args: ["chat"], expected: 4 }, { args: [""], expected: 0 }],
    hiddenTests: [{ args: ["bonjour"], expected: 7 }],
  },
  {
    id: 7, title: "Somme des pairs", difficulty: "moyen",
    statement: "Retourne la somme des nombres **pairs** de la liste `nombres`.",
    entry: "somme_pairs",
    starterCode: "def somme_pairs(nombres):\n    pass\n",
    tests: [{ args: [[1, 2, 3, 4]], expected: 6 }, { args: [[]], expected: 0 }],
    hiddenTests: [{ args: [[1, 3, 5]], expected: 0 }, { args: [[2, 4, 6, 8]], expected: 20 }],
  },
  {
    id: 8, title: "Compter les voyelles", difficulty: "moyen",
    statement: "Retourne le nombre de voyelles (a, e, i, o, u, y) dans `mot` (en minuscules).",
    entry: "compter_voyelles",
    starterCode: "def compter_voyelles(mot):\n    pass\n",
    tests: [{ args: ["bonjour"], expected: 3 }, { args: ["xyz"], expected: 1 }],
    hiddenTests: [{ args: [""], expected: 0 }, { args: ["aeiouy"], expected: 6 }],
  },
  {
    id: 9, title: "À l'envers", difficulty: "moyen",
    statement: "Retourne la chaîne `s` inversée.",
    entry: "inverser",
    starterCode: "def inverser(s):\n    pass\n",
    tests: [{ args: ["abc"], expected: "cba" }, { args: [""], expected: "" }],
    hiddenTests: [{ args: ["a"], expected: "a" }, { args: ["python"], expected: "nohtyp" }],
  },
  {
    id: 10, title: "FizzBuzz", difficulty: "moyen",
    statement: "Retourne une liste de 1 à `n`. Remplace les multiples de 3 par `\"Fizz\"`, de 5 par `\"Buzz\"`, de 15 par `\"FizzBuzz\"`.",
    entry: "fizzbuzz",
    starterCode: "def fizzbuzz(n):\n    pass\n",
    tests: [{ args: [5], expected: [1, 2, "Fizz", 4, "Buzz"] }],
    hiddenTests: [{ args: [15], expected: [1, 2, "Fizz", 4, "Buzz", "Fizz", 7, 8, "Fizz", "Buzz", 11, "Fizz", 13, 14, "FizzBuzz"] }],
  },
  {
    id: 11, title: "Palindrome", difficulty: "moyen",
    statement: "Retourne `True` si `s` se lit pareil à l'endroit et à l'envers.",
    entry: "est_palindrome",
    starterCode: "def est_palindrome(s):\n    pass\n",
    tests: [{ args: ["kayak"], expected: true }, { args: ["chien"], expected: false }],
    hiddenTests: [{ args: [""], expected: true }, { args: ["ressasser"], expected: true }],
  },
  {
    id: 12, title: "Factorielle", difficulty: "moyen",
    statement: "Retourne `n!` (factorielle de `n`). On a `0! = 1`.",
    entry: "factorielle",
    starterCode: "def factorielle(n):\n    pass\n",
    tests: [{ args: [5], expected: 120 }, { args: [0], expected: 1 }],
    hiddenTests: [{ args: [1], expected: 1 }, { args: [6], expected: 720 }],
  },
  {
    id: 13, title: "Maximum d'une liste", difficulty: "moyen",
    statement: "Retourne le plus grand élément de `nombres` **sans utiliser `max()`**. La liste n'est jamais vide.",
    entry: "maximum_liste",
    starterCode: "def maximum_liste(nombres):\n    pass\n",
    tests: [{ args: [[3, 7, 2, 9, 4]], expected: 9 }],
    hiddenTests: [{ args: [[-5, -1, -10]], expected: -1 }, { args: [[42]], expected: 42 }],
  },
  {
    id: 14, title: "Compter les occurrences", difficulty: "moyen",
    statement: "Retourne le nombre de fois où `x` apparaît dans la liste `liste`.",
    entry: "compter",
    starterCode: "def compter(liste, x):\n    pass\n",
    tests: [{ args: [[1, 2, 2, 3, 2], 2], expected: 3 }, { args: [[1, 2, 3], 9], expected: 0 }],
    hiddenTests: [{ args: [[], 1], expected: 0 }],
  },
  {
    id: 15, title: "Fibonacci", difficulty: "difficile",
    statement: "Retourne le `n`-ième terme de la suite de Fibonacci. `fib(0)=0`, `fib(1)=1`.",
    entry: "fibonacci",
    starterCode: "def fibonacci(n):\n    pass\n",
    tests: [{ args: [0], expected: 0 }, { args: [1], expected: 1 }, { args: [7], expected: 13 }],
    hiddenTests: [{ args: [10], expected: 55 }, { args: [20], expected: 6765 }],
  },
  {
    id: 16, title: "Nombre premier", difficulty: "difficile",
    statement: "Retourne `True` si `n` est un nombre premier, sinon `False`.",
    entry: "est_premier",
    starterCode: "def est_premier(n):\n    pass\n",
    tests: [{ args: [7], expected: true }, { args: [10], expected: false }, { args: [1], expected: false }],
    hiddenTests: [{ args: [2], expected: true }, { args: [97], expected: true }, { args: [0], expected: false }],
  },
  {
    id: 17, title: "Trier (sans sorted)", difficulty: "difficile",
    statement: "Retourne une **nouvelle** liste contenant les éléments de `nombres` triés par ordre croissant, **sans utiliser `sorted()` ni `.sort()`**.",
    entry: "trier",
    starterCode: "def trier(nombres):\n    pass\n",
    tests: [{ args: [[3, 1, 2]], expected: [1, 2, 3] }, { args: [[]], expected: [] }],
    hiddenTests: [{ args: [[5, 5, 1, 9, 1]], expected: [1, 1, 5, 5, 9] }, { args: [[-2, 0, -7]], expected: [-7, -2, 0] }],
  },
  {
    id: 18, title: "Deux nombres, une cible", difficulty: "difficile",
    statement: "Retourne la liste `[i, j]` des **indices** (i < j) de deux nombres de `nombres` dont la somme vaut `cible`. Retourne `None` s'il n'y en a pas. Il y a au plus une solution.",
    entry: "paire_somme",
    starterCode: "def paire_somme(nombres, cible):\n    pass\n",
    tests: [{ args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[1, 2, 3], 100], expected: null }],
    hiddenTests: [{ args: [[3, 2, 4], 6], expected: [1, 2] }],
  },
  {
    id: 19, title: "Anagrammes", difficulty: "difficile",
    statement: "Retourne `True` si `a` et `b` sont des anagrammes (mêmes lettres, même nombre), sinon `False`.",
    entry: "sont_anagrammes",
    starterCode: "def sont_anagrammes(a, b):\n    pass\n",
    tests: [{ args: ["chien", "niche"], expected: true }, { args: ["abc", "abd"], expected: false }],
    hiddenTests: [{ args: ["", ""], expected: true }, { args: ["aab", "abb"], expected: false }],
  },
  {
    id: 20, title: "Somme maximale", difficulty: "difficile",
    statement: "Retourne la somme du sous-tableau **contigu** de somme maximale dans `nombres` (au moins un élément). Ex : `[-2,1,-3,4,-1,2,1,-5,4]` → `6` (`[4,-1,2,1]`).",
    entry: "max_sous_somme",
    starterCode: "def max_sous_somme(nombres):\n    pass\n",
    tests: [{ args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 }],
    hiddenTests: [{ args: [[1]], expected: 1 }, { args: [[-3, -1, -2]], expected: -1 }, { args: [[5, 4, -1, 7, 8]], expected: 23 }],
  },
];

export const TOTAL_LEVELS = LEVELS.length;
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: pas d'erreur (les 20 niveaux respectent le type `Level`).

- [ ] **Step 3: Commit**

```bash
git add src/levels.ts
git commit -m "feat: 20 python challenges data"
```

---

### Task 7: Client Supabase & couche progression

**Files:**
- Create: `src/data/supabase.ts`, `src/data/progress.ts`

**Interfaces:**
- Consumes: `@supabase/supabase-js`, `TOTAL_LEVELS`.
- Produces:
  - `supabase` (client) ; `getPseudo(): string | null` ; `setPseudo(p: string): void`
  - `markSolved(pseudo: string, levelId: number): Promise<void>` (upsert `cc_progress`)
  - `getSolvedLocal(): number[]` / `addSolvedLocal(levelId: number): void` (cache localStorage)
  - `type Row = { pseudo: string; level_id: number; solved_at: string }`
  - `fetchAllProgress(): Promise<Row[]>` ; `subscribeProgress(cb: () => void): () => void`

- [ ] **Step 1: Créer la table Supabase**

Sur le projet partagé MyMonkey, exécuter (via le MCP `supabase` `apply_migration`, nom `cc_progress_init`) :

```sql
create table if not exists cc_progress (
  pseudo text not null,
  level_id int not null,
  solved_at timestamptz not null default now(),
  primary key (pseudo, level_id)
);
alter table cc_progress enable row level security;
create policy "cc_read"  on cc_progress for select using (true);
create policy "cc_write" on cc_progress for insert with check (true);
alter publication supabase_realtime add table cc_progress;
```

- [ ] **Step 2: Écrire le client Supabase**

```ts
// src/data/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export type Row = { pseudo: string; level_id: number; solved_at: string };
```

- [ ] **Step 3: Écrire la couche progression**

```ts
// src/data/progress.ts
import { supabase, type Row } from "./supabase";

const PSEUDO_KEY = "ca_pseudo";
const SOLVED_KEY = "ca_solved";

export function getPseudo(): string | null {
  return localStorage.getItem(PSEUDO_KEY);
}
export function setPseudo(p: string): void {
  localStorage.setItem(PSEUDO_KEY, p.trim());
}

export function getSolvedLocal(): number[] {
  const raw = localStorage.getItem(SOLVED_KEY);
  return raw ? (JSON.parse(raw) as number[]) : [];
}
export function addSolvedLocal(levelId: number): void {
  const cur = new Set(getSolvedLocal());
  cur.add(levelId);
  localStorage.setItem(SOLVED_KEY, JSON.stringify([...cur]));
}

export async function markSolved(pseudo: string, levelId: number): Promise<void> {
  addSolvedLocal(levelId);
  await supabase
    .from("cc_progress")
    .upsert({ pseudo, level_id: levelId }, { onConflict: "pseudo,level_id", ignoreDuplicates: true });
}

export async function fetchAllProgress(): Promise<Row[]> {
  const { data } = await supabase.from("cc_progress").select("*");
  return data ?? [];
}

export function subscribeProgress(cb: () => void): () => void {
  const ch = supabase
    .channel("cc_progress_live")
    .on("postgres_changes", { event: "*", schema: "public", table: "cc_progress" }, cb)
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}
```

- [ ] **Step 4: Vérifier le typecheck**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 5: Commit**

```bash
git add src/data/supabase.ts src/data/progress.ts
git commit -m "feat: supabase client and progress layer"
```

---

### Task 8: Routing, pseudo gate, layout de base

**Files:**
- Modify: `src/main.tsx`, `src/App.tsx`
- Create: `src/pages/Home.tsx`, `src/pages/PseudoGate.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `getPseudo`, `setPseudo` (Task 7), React Router.
- Produces: routes `/` (Home, défis) et `/tableau` (Task 11). `Home` n'est accessible qu'après saisie du pseudo.

- [ ] **Step 1: Brancher le router dans `main.tsx`**

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Tableau from "./pages/Tableau";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tableau" element={<Tableau />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
```

- [ ] **Step 2: Écrire `PseudoGate.tsx`**

```tsx
// src/pages/PseudoGate.tsx
import { useState } from "react";
import { setPseudo } from "../data/progress";

export default function PseudoGate({ onReady }: { onReady: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="gate">
      <h1>Code Arena</h1>
      <p>Choisis un pseudo pour commencer.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            setPseudo(value);
            onReady();
          }
        }}
      >
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ton pseudo" autoFocus />
        <button type="submit">C'est parti</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Écrire `Home.tsx` (squelette avec gate)**

```tsx
// src/pages/Home.tsx
import { useState } from "react";
import { getPseudo } from "../data/progress";
import PseudoGate from "./PseudoGate";

export default function Home() {
  const [pseudo, setReady] = useState<string | null>(getPseudo());
  if (!pseudo) return <PseudoGate onReady={() => setReady(getPseudo())} />;
  return <div className="home">Connecté en tant que {pseudo}</div>;
}
```

- [ ] **Step 4: Stub `Tableau.tsx` et `App.tsx`** (remplacé en Task 11)

```tsx
// src/pages/Tableau.tsx
export default function Tableau() {
  return <div>Tableau (à venir)</div>;
}
```

`src/App.tsx` n'est plus utilisé par `main.tsx` : le supprimer.
```bash
rm src/App.tsx
```

- [ ] **Step 5: CSS de base**

```css
/* src/styles.css */
:root { color-scheme: dark; --bg:#0f1115; --fg:#e6e8eb; --accent:#ffcc33; --ok:#3ddc84; --ko:#ff5d5d; --panel:#1a1d24; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font-family: ui-sans-serif, system-ui, sans-serif; }
.gate { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; }
.gate input { padding:.6rem 1rem; font-size:1rem; border-radius:8px; border:1px solid #333; background:var(--panel); color:var(--fg); }
.gate button, .home button { padding:.6rem 1.2rem; border:0; border-radius:8px; background:var(--accent); color:#111; font-weight:700; cursor:pointer; }
```

- [ ] **Step 6: Vérifier en navigateur**

Run: `npm run dev`
Expected: la page demande un pseudo ; après saisie, « Connecté en tant que … ». `/tableau` affiche le stub.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: routing, pseudo gate and base layout"
```

---

### Task 9: Grille des niveaux (Home)

**Files:**
- Modify: `src/pages/Home.tsx`
- Create: `src/components/LevelGrid.tsx`

**Interfaces:**
- Consumes: `LEVELS`, `TOTAL_LEVELS`, `getSolvedLocal`.
- Produces: `LevelGrid` affiche les 20 niveaux + état résolu ; `onSelect(level: Level)` remonte la sélection.

- [ ] **Step 1: Écrire `LevelGrid.tsx`**

```tsx
// src/components/LevelGrid.tsx
import { LEVELS, TOTAL_LEVELS } from "../levels";
import type { Level } from "../types";

export default function LevelGrid({
  solved, onSelect,
}: { solved: number[]; onSelect: (l: Level) => void }) {
  const set = new Set(solved);
  return (
    <div className="grid-wrap">
      <p className="progress">{set.size} / {TOTAL_LEVELS} résolus</p>
      <div className="grid">
        {LEVELS.map((l) => (
          <button key={l.id} className={`tile ${set.has(l.id) ? "done" : ""} ${l.difficulty}`} onClick={() => onSelect(l)}>
            <span className="num">{l.id}</span>
            <span className="t">{l.title}</span>
            {set.has(l.id) && <span className="check">✅</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Câbler dans `Home.tsx`**

```tsx
// src/pages/Home.tsx
import { useState } from "react";
import { getPseudo, getSolvedLocal } from "../data/progress";
import PseudoGate from "./PseudoGate";
import LevelGrid from "../components/LevelGrid";
import type { Level } from "../types";

export default function Home() {
  const [pseudo, setReady] = useState<string | null>(getPseudo());
  const [solved] = useState<number[]>(getSolvedLocal());
  const [active, setActive] = useState<Level | null>(null);

  if (!pseudo) return <PseudoGate onReady={() => setReady(getPseudo())} />;

  return (
    <div className="home">
      <header className="topbar">
        <strong>Code Arena</strong>
        <span>{pseudo}</span>
      </header>
      {active ? (
        <div>Niveau {active.id} sélectionné (éditeur en Task 10)
          <button onClick={() => setActive(null)}>← retour</button></div>
      ) : (
        <LevelGrid solved={solved} onSelect={setActive} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: CSS de la grille** (ajouter à `src/styles.css`)

```css
.topbar { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.5rem; border-bottom:1px solid #222; }
.grid-wrap { padding:1.5rem; max-width:900px; margin:0 auto; }
.progress { font-size:1.1rem; color:var(--accent); font-weight:700; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:.8rem; }
.tile { position:relative; text-align:left; padding:1rem; border-radius:12px; border:1px solid #2a2e38; background:var(--panel); color:var(--fg); cursor:pointer; display:flex; flex-direction:column; gap:.3rem; }
.tile .num { font-size:.8rem; opacity:.6; }
.tile .t { font-weight:700; }
.tile.done { border-color:var(--ok); }
.tile .check { position:absolute; top:.6rem; right:.6rem; }
.tile.facile { border-left:4px solid #3ddc84; }
.tile.moyen { border-left:4px solid #ffcc33; }
.tile.difficile { border-left:4px solid #ff5d5d; }
```

- [ ] **Step 4: Vérifier en navigateur**

Run: `npm run dev`
Expected: grille des 20 niveaux, compteur « 0 / 20 », clic sur une tuile → message de sélection.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: level grid on home"
```

---

### Task 10: Vue d'un niveau — éditeur + exécution + résultats

**Files:**
- Create: `src/components/LevelView.tsx`, `src/components/Results.tsx`
- Modify: `src/pages/Home.tsx`

**Interfaces:**
- Consumes: `runCode` (Task 5), `markSolved` (Task 7), CodeMirror, `Level`, `RunResult`.
- Produces: `LevelView` (éditeur + bouton lancer + résultats + marque résolu) ; `Results` (affichage des cas).

- [ ] **Step 1: Écrire `Results.tsx`**

```tsx
// src/components/Results.tsx
import type { RunResult } from "../types";

const fmt = (v: unknown) => JSON.stringify(v);

export default function Results({ result }: { result: RunResult | null }) {
  if (!result) return null;
  if (result.globalError) return <div className="res-error">⛔ {result.globalError}</div>;
  const visible = result.cases.filter((c) => !c.hidden);
  const hidden = result.cases.filter((c) => c.hidden);
  const hiddenPassed = hidden.filter((c) => c.passed).length;
  return (
    <div className="results">
      {result.passed && <div className="res-win">🎉 Niveau réussi !</div>}
      <table>
        <thead><tr><th>Entrée</th><th>Attendu</th><th>Obtenu</th><th></th></tr></thead>
        <tbody>
          {visible.map((c, i) => (
            <tr key={i} className={c.passed ? "ok" : "ko"}>
              <td>{c.args.map(fmt).join(", ")}</td>
              <td>{fmt(c.expected)}</td>
              <td>{c.error ? `⚠ ${c.error}` : fmt(c.got)}</td>
              <td>{c.passed ? "✅" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hidden.length > 0 && (
        <p className="hidden-count">Tests cachés : {hiddenPassed} / {hidden.length} ✅</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Écrire `LevelView.tsx`**

```tsx
// src/components/LevelView.tsx
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { runCode } from "../runner/runCode";
import { markSolved, getPseudo } from "../data/progress";
import Results from "./Results";
import type { Level, RunResult } from "../types";

export default function LevelView({
  level, onBack, onSolved,
}: { level: Level; onBack: () => void; onSolved: (id: number) => void }) {
  const [code, setCode] = useState(level.starterCode);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  async function lancer() {
    setRunning(true);
    setResult(null);
    const res = await runCode(code, level);
    setResult(res);
    setRunning(false);
    if (res.passed) {
      const pseudo = getPseudo();
      if (pseudo) await markSolved(pseudo, level.id);
      onSolved(level.id);
    }
  }

  return (
    <div className="level-view">
      <div className="statement">
        <button className="back" onClick={onBack}>← niveaux</button>
        <h2>{level.id}. {level.title} <span className={`tag ${level.difficulty}`}>{level.difficulty}</span></h2>
        <p>{level.statement}</p>
      </div>
      <div className="editor">
        <CodeMirror value={code} height="320px" theme="dark" extensions={[python()]} onChange={setCode} />
        <button className="run" onClick={lancer} disabled={running}>
          {running ? "Exécution…" : "▶ Lancer les tests"}
        </button>
        <Results result={result} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Câbler `LevelView` dans `Home.tsx`**

Remplacer le bloc `active ? (...)` par :
```tsx
import LevelView from "../components/LevelView";
// ...
// état solved devient mutable :
const [solved, setSolved] = useState<number[]>(getSolvedLocal());
// ...
{active ? (
  <LevelView
    level={active}
    onBack={() => setActive(null)}
    onSolved={(id) => setSolved((s) => (s.includes(id) ? s : [...s, id]))}
  />
) : (
  <LevelGrid solved={solved} onSelect={setActive} />
)}
```

- [ ] **Step 4: CSS niveau** (ajouter à `src/styles.css`)

```css
.level-view { display:grid; grid-template-columns:1fr 1.2fr; gap:1.5rem; padding:1.5rem; max-width:1200px; margin:0 auto; }
@media (max-width:800px){ .level-view{ grid-template-columns:1fr; } }
.statement h2 { margin-top:.5rem; }
.tag { font-size:.7rem; padding:.1rem .5rem; border-radius:6px; vertical-align:middle; }
.tag.facile{ background:#143d27; color:#3ddc84; } .tag.moyen{ background:#3d3414; color:#ffcc33; } .tag.difficile{ background:#3d1414; color:#ff5d5d; }
.back { background:none; border:0; color:var(--accent); cursor:pointer; padding:0; }
.run { margin-top:.8rem; padding:.6rem 1.2rem; border:0; border-radius:8px; background:var(--accent); color:#111; font-weight:700; cursor:pointer; }
.results { margin-top:1rem; }
.results table { width:100%; border-collapse:collapse; font-family:ui-monospace,monospace; font-size:.85rem; }
.results th, .results td { text-align:left; padding:.4rem .5rem; border-bottom:1px solid #222; }
.results tr.ok td { color:var(--ok); } .results tr.ko td { color:var(--ko); }
.res-win { color:var(--ok); font-weight:700; font-size:1.1rem; margin-bottom:.5rem; }
.res-error { color:var(--ko); font-family:ui-monospace,monospace; }
.hidden-count { opacity:.7; font-size:.85rem; }
```

- [ ] **Step 5: Vérifier en navigateur (chemin critique)**

Run: `npm run dev`
Vérifier manuellement sur le niveau 7 (`somme_pairs`) :
1. Code faux (`return 0`) → des cas ❌, tests cachés < total.
2. Code correct (`return sum(n for n in nombres if n%2==0)`) → 🎉 + tuile passe ✅ au retour.
3. Boucle infinie (`while True: pass`) → message « Temps dépassé » après ~5s, l'UI reste réactive.
Expected: les trois comportements OK.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: level view with editor, execution and results"
```

---

### Task 11: Écran prof `/tableau` (leaderboard live)

**Files:**
- Modify: `src/pages/Tableau.tsx`
- Create: `src/leaderboard.ts`

**Interfaces:**
- Consumes: `fetchAllProgress`, `subscribeProgress`, `Row` (Task 7), `TOTAL_LEVELS`, `LEVELS`.
- Produces:
  - `src/leaderboard.ts` : `rankPlayers(rows: Row[]): Player[]` (pur), `countByLevel(rows: Row[]): Map<number, number>` (pur).
  - `type Player = { pseudo: string; count: number; lastSolved: string }`.

- [ ] **Step 1: Écrire les fonctions pures de classement (TDD)**

```ts
// src/leaderboard.ts
import type { Row } from "./data/supabase";

export type Player = { pseudo: string; count: number; lastSolved: string };

export function rankPlayers(rows: Row[]): Player[] {
  const byPseudo = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = byPseudo.get(r.pseudo) ?? [];
    arr.push(r);
    byPseudo.set(r.pseudo, arr);
  }
  const players: Player[] = [...byPseudo.entries()].map(([pseudo, rs]) => ({
    pseudo,
    count: rs.length,
    lastSolved: rs.reduce((max, r) => (r.solved_at > max ? r.solved_at : max), rs[0].solved_at),
  }));
  // plus de niveaux d'abord ; à égalité, celui qui a fini son dernier le plus tôt devant
  return players.sort((a, b) => (b.count - a.count) || a.lastSolved.localeCompare(b.lastSolved));
}

export function countByLevel(rows: Row[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const r of rows) m.set(r.level_id, (m.get(r.level_id) ?? 0) + 1);
  return m;
}
```

```ts
// src/leaderboard.test.ts
import { describe, it, expect } from "vitest";
import { rankPlayers, countByLevel } from "./leaderboard";

const rows = [
  { pseudo: "alice", level_id: 1, solved_at: "2026-06-24T10:00:00Z" },
  { pseudo: "alice", level_id: 2, solved_at: "2026-06-24T10:05:00Z" },
  { pseudo: "bob",   level_id: 1, solved_at: "2026-06-24T10:02:00Z" },
];

describe("rankPlayers", () => {
  it("classe par nombre de niveaux puis rapidité", () => {
    const r = rankPlayers(rows);
    expect(r[0].pseudo).toBe("alice");
    expect(r[0].count).toBe(2);
    expect(r[1].pseudo).toBe("bob");
  });
  it("départage 1-1 par dernier résolu le plus tôt", () => {
    const tie = [
      { pseudo: "a", level_id: 1, solved_at: "2026-06-24T09:00:00Z" },
      { pseudo: "b", level_id: 1, solved_at: "2026-06-24T09:30:00Z" },
    ];
    expect(rankPlayers(tie)[0].pseudo).toBe("a");
  });
});

describe("countByLevel", () => {
  it("compte les résolutions par niveau", () => {
    const c = countByLevel(rows);
    expect(c.get(1)).toBe(2);
    expect(c.get(2)).toBe(1);
  });
});
```

- [ ] **Step 2: Lancer les tests**

Run: `npm test`
Expected: PASS (`leaderboard.test.ts` + `compare.test.ts`).

- [ ] **Step 3: Écrire la page `Tableau.tsx`**

```tsx
// src/pages/Tableau.tsx
import { useEffect, useState } from "react";
import { fetchAllProgress, subscribeProgress } from "../data/progress";
import { rankPlayers, countByLevel, type Player } from "../leaderboard";
import { LEVELS, TOTAL_LEVELS } from "../levels";
import type { Row } from "../data/supabase";

export default function Tableau() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const load = () => fetchAllProgress().then(setRows);
    load();
    const unsub = subscribeProgress(load);
    return unsub;
  }, []);

  const players: Player[] = rankPlayers(rows);
  const counts = countByLevel(rows);

  return (
    <div className="tableau">
      <h1>Classement — Code Arena</h1>
      <div className="board">
        <section className="ranking">
          <h2>Élèves</h2>
          <ol>
            {players.map((p) => (
              <li key={p.pseudo}>
                <span className="who">{p.pseudo}</span>
                <span className="bar"><span style={{ width: `${(p.count / TOTAL_LEVELS) * 100}%` }} /></span>
                <span className="cnt">{p.count}/{TOTAL_LEVELS}</span>
              </li>
            ))}
            {players.length === 0 && <p>En attente des premiers élèves…</p>}
          </ol>
        </section>
        <section className="bylevel">
          <h2>Progression par niveau</h2>
          <div className="lvls">
            {LEVELS.map((l) => (
              <div key={l.id} className="lvl-stat">
                <span className="n">{l.id}</span>
                <span className="c">{counts.get(l.id) ?? 0}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: CSS tableau** (ajouter à `src/styles.css`)

```css
.tableau { padding:2rem; max-width:1100px; margin:0 auto; }
.board { display:grid; grid-template-columns:1.4fr 1fr; gap:2rem; }
@media (max-width:800px){ .board{ grid-template-columns:1fr; } }
.ranking ol { list-style:none; padding:0; display:flex; flex-direction:column; gap:.5rem; }
.ranking li { display:grid; grid-template-columns:8rem 1fr 3rem; align-items:center; gap:.8rem; font-size:1.1rem; }
.ranking .who { font-weight:700; }
.ranking .bar { background:#222; border-radius:6px; height:14px; overflow:hidden; }
.ranking .bar span { display:block; height:100%; background:var(--accent); }
.lvls { display:grid; grid-template-columns:repeat(5,1fr); gap:.5rem; }
.lvl-stat { background:var(--panel); border-radius:8px; padding:.5rem; text-align:center; }
.lvl-stat .n { display:block; font-size:.75rem; opacity:.6; }
.lvl-stat .c { font-size:1.4rem; font-weight:700; color:var(--accent); }
```

- [ ] **Step 5: Vérifier en navigateur (temps réel)**

Run: `npm run dev`
Dans un onglet : résoudre un niveau (Home). Dans un second onglet sur `/tableau` : le pseudo apparaît et le compteur s'incrémente **sans recharger**.
Expected: mise à jour live OK.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: live leaderboard teacher screen"
```

---

### Task 12: Déploiement `.monkey`

**Files:**
- Create: `.monkey`, `public/_redirects` (fallback SPA si besoin), `README.md`

**Interfaces:**
- Consumes: build Vite (`dist/`).
- Produces: config de déploiement pour `code-arena.my-monkey.fr`.

- [ ] **Step 1: Écrire `.monkey`**

```jsonc
{
  "target": "code-arena.my-monkey.fr",
  "source": "./dist/",
  "site": {
    "title": "Code Arena",
    "description": "Défis de code Python à niveaux pour s'entraîner et s'affronter.",
    "category": "tool"
  }
}
```

- [ ] **Step 2: Routing SPA — config Vite base**

Vérifier que `vite.config.ts` n'a pas de `base` exotique (défaut `/`). Pour le fallback des routes (`/tableau` en accès direct), ajouter `public/_redirects` :
```
/*    /index.html   200
```

- [ ] **Step 3: README minimal**

```markdown
# Code Arena
Défis Python à 20 niveaux (Pyodide en navigateur + leaderboard Supabase live).
Dev : `npm run dev`. Build : `npm run build`. Tests : `npm test`.
Variables : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (voir `.env.example`).
Écran prof à projeter : `/tableau`.
```

- [ ] **Step 4: Build de validation**

Run: `npm run build`
Expected: build OK, `dist/` prêt.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: monkey deploy config and readme"
```

- [ ] **Step 6: (Manuel, hors agent) Créer le repo + release**

Le déploiement réel (création repo `my-monkeys/code-arena`, `.env` local, release GitHub, vérif API admin monkey) est une étape manuelle à faire avec Maxim — pas dans ce plan d'implémentation.

---

## Notes d'exécution

- **Pyodide en test** : la logique pure (`compare.ts`, `leaderboard.ts`) est couverte par Vitest. L'intégration Pyodide/worker se valide **en navigateur** (étapes « Vérifier en navigateur ») car charger Pyodide dans Vitest/node est lourd et hors périmètre.
- **Variables d'env** : créer un `.env.local` (non commité) avec les vraies valeurs Supabase avant `npm run dev`/`build`.
- **Ordre** : les tâches sont séquentielles ; chaque tâche se termine sur un commit et un livrable testable.
