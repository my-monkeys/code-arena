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
