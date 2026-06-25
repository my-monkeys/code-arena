// src/components/LevelGrid.tsx
import { LEVELS, TOTAL_LEVELS, THEMES } from "../levels";
import type { Level } from "../types";

const DIFF_RANK: Record<string, number> = { facile: 0, moyen: 1, difficile: 2 };

export default function LevelGrid({ solved, onSelect }: { solved: number[]; onSelect: (l: Level) => void }) {
  const set = new Set(solved);
  const total = TOTAL_LEVELS, done = set.size, w = 22, fill = Math.round((done / total) * w);

  return (
    <section className="grid-wrap">
      <div className="prompt-line"><span className="u">arena</span>:<span className="p">~/challenges</span>$ arena ls --all<span className="caret"></span></div>
      <div className="statsbar">
        <div className="stat"><span className="k">résolus</span><span className="v">{String(done).padStart(2, "0")}<span className="dim"> / {total}</span></span></div>
        <div className="stat"><span className="k">thèmes</span><span className="v">{THEMES.length}</span></div>
        <div className="stat xp"><span className="k">progression</span><span className="bar">[<span className="f">{"█".repeat(fill)}</span>{"░".repeat(w - fill)}] <span className="bright">{Math.round((done / total) * 100)}%</span></span></div>
      </div>

      <div className="tbl">
        {THEMES.map((th) => {
          const items = LEVELS.filter((l) => l.theme === th.key)
            .sort((a, b) => (DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty]) || a.id - b.id);
          const themeDone = items.filter((l) => set.has(l.id)).length;
          return (
            <div className="theme-block" key={th.key}>
              <div className="tr theme-head">
                <span className="th-name">{th.label}</span>
                <span className="th-count">{themeDone}/{items.length}</span>
              </div>
              {items.map((l) => {
                const ok = set.has(l.id);
                return (
                  <button key={l.id} className={`tr row ${ok ? "done" : ""}`} onClick={() => onSelect(l)}>
                    <span className="st">{ok
                      ? <svg className="ok" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3.3L13 5"/></svg>
                      : <span className="todo">○</span>}</span>
                    <span className="num">{String(l.id).padStart(2, "0")}</span>
                    <span className="title">{l.title}</span>
                    <span className={`tag ${l.difficulty}`}>{l.difficulty}</span>
                    <span className="go">▸</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
