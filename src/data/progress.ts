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
