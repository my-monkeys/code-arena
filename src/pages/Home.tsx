// src/pages/Home.tsx
import { useState } from "react";
import { getPseudo, getSolvedLocal } from "../data/progress";
import PseudoGate from "./PseudoGate";
import LevelGrid from "../components/LevelGrid";
import LevelView from "../components/LevelView";
import type { Level } from "../types";

const GlyphSvg = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4l3.2 4L3 12"/><path d="M9 12h4"/>
  </svg>
);

export default function Home() {
  const [pseudo, setReady] = useState<string | null>(getPseudo());
  const [solved, setSolved] = useState<number[]>(getSolvedLocal());
  const [active, setActive] = useState<Level | null>(null);

  if (!pseudo) return <PseudoGate onReady={() => setReady(getPseudo())} />;

  return (
    <>
      <header className="topbar">
        <span className="brand">
          <span className="glyph"><GlyphSvg /></span>
          <b>code·arena</b>
          <span className="crumb">~/challenges</span>
        </span>
        <div></div>
        <span className="me"><span className="dot"></span>@{pseudo}</span>
      </header>
      <main className="page">
        {active ? (
          <LevelView
            level={active}
            onBack={() => setActive(null)}
            onSolved={(id) => setSolved((s) => (s.includes(id) ? s : [...s, id]))}
          />
        ) : (
          <LevelGrid solved={solved} onSelect={setActive} />
        )}
      </main>
    </>
  );
}
