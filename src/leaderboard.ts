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
