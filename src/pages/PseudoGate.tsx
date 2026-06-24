// src/pages/PseudoGate.tsx
import { useState } from "react";
import { setPseudo } from "../data/progress";

export default function PseudoGate({ onReady }: { onReady: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="gate">
      <h1>Code Arena</h1>
      <p>Choisis un pseudo pour commencer.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            setPseudo(value);
            onReady();
          }
        }}
      >
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ton pseudo" autoFocus />
        <button type="submit">C'est parti</button>
      </form>
    </div>
  );
}
