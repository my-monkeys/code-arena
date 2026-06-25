// src/components/LevelView.tsx
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { runCode } from "../runner/runCode";
import { markSolved, getPseudo } from "../data/progress";
import Results from "./Results";
import Statement from "./Statement";
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
    try {
      const res = await runCode(code, level);
      setResult(res);
      if (res.passed) {
        const pseudo = getPseudo();
        if (pseudo) await markSolved(pseudo, level.id);
        onSolved(level.id);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="level-view">
      <div className="statement">
        <button className="btn-text" onClick={onBack}>← retour aux défis</button>
        <h2><span>{String(level.id).padStart(2, "0")}. {level.title}</span> <span className={`tag ${level.difficulty}`}>{level.difficulty}</span></h2>
        <Statement text={level.statement} />
      </div>
      <div className="editor">
        <div className="tabbar">
          <div className="ftab">
            <span className="py">●</span>
            {level.entry}.py
          </div>
          <div></div>
          <div className="lang">python 3.12</div>
        </div>
        <CodeMirror value={code} height="320px" theme="dark" extensions={[python()]} onChange={setCode} />
        <div className="run-bar">
          <button className="run btn-primary" onClick={lancer} disabled={running}>
            {running ? "● exécution…" : "▶ lancer les tests"}
          </button>
        </div>
        <Results result={result} />
      </div>
    </div>
  );
}
