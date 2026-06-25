// src/types.ts
export type Test = { args: unknown[]; expected: unknown };

export type Difficulty = "facile" | "moyen" | "difficile";

export type Level = {
  id: number;
  title: string;
  difficulty: Difficulty;
  theme: string;         // clé de thème (cf. THEMES dans levels.ts)
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
