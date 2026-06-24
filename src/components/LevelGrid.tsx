// src/components/LevelGrid.tsx
import { LEVELS, TOTAL_LEVELS } from "../levels";
import type { Level } from "../types";

export default function LevelGrid({
  solved, onSelect,
}: { solved: number[]; onSelect: (l: Level) => void }) {
  const set = new Set(solved);
  const pct = (set.size / TOTAL_LEVELS) * 100;
  return (
    <section className="grid-wrap">
      <div className="grid-head">
        <p className="progress">{set.size} / {TOTAL_LEVELS} niveaux résolus</p>
        <div className="progress-track"><span style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="grid">
        {LEVELS.map((l) => (
          <button key={l.id} className={`tile ${set.has(l.id) ? "done" : ""}`} onClick={() => onSelect(l)}>
            <span className="tnum">{l.id}</span>
            <span className={`tdiff ${l.difficulty}`}>{l.difficulty}</span>
            <span className="ttitle">{l.title}</span>
            {set.has(l.id) && <span className="tcheck">✓</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
