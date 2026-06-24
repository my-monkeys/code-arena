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
      <h1 className="title">Classement</h1>
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
          </ol>
          {players.length === 0 && <p className="empty">En attente des premiers élèves…</p>}
        </section>
        <section className="bylevel">
          <h2>Progression par niveau</h2>
          <div className="lvls">
            {LEVELS.map((l) => {
              const c = counts.get(l.id) ?? 0;
              return (
                <div key={l.id} className={`lvl-stat ${c === 0 ? "zero" : ""}`}>
                  <span className="n">{l.id}</span>
                  <span className="c">{c}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
