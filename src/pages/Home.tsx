// src/pages/Home.tsx
import { useState } from "react";
import { getPseudo, getSolvedLocal } from "../data/progress";
import PseudoGate from "./PseudoGate";
import LevelGrid from "../components/LevelGrid";
import type { Level } from "../types";

export default function Home() {
  const [pseudo, setReady] = useState<string | null>(getPseudo());
  const [solved] = useState<number[]>(getSolvedLocal());
  const [active, setActive] = useState<Level | null>(null);

  if (!pseudo) return <PseudoGate onReady={() => setReady(getPseudo())} />;

  return (
    <div className="home">
      <header className="topbar">
        <strong>Code Arena</strong>
        <span>{pseudo}</span>
      </header>
      {active ? (
        <div>Niveau {active.id} sélectionné (éditeur en Task 10)
          <button onClick={() => setActive(null)}>← retour</button></div>
      ) : (
        <LevelGrid solved={solved} onSelect={setActive} />
      )}
    </div>
  );
}
