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
