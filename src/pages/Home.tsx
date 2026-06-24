// src/pages/Home.tsx
import { useState } from "react";
import { getPseudo } from "../data/progress";
import PseudoGate from "./PseudoGate";

export default function Home() {
  const [pseudo, setReady] = useState<string | null>(getPseudo());
  if (!pseudo) return <PseudoGate onReady={() => setReady(getPseudo())} />;
  return <div className="home">Connecté en tant que {pseudo}</div>;
}
