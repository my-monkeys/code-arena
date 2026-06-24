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
