// src/pages/PseudoGate.tsx
import { useState } from "react";
import { setPseudo } from "../data/progress";

export default function PseudoGate({ onReady }: { onReady: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="gate">
      <div className="gate-card">
        <span className="logo-lg">▷</span>
        <h1>Code Arena</h1>
        <p>Choisis un pseudo pour commencer à résoudre les défis.</p>
        <form
          className="gate-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) {
              setPseudo(value);
              onReady();
            }
          }}
        >
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ton pseudo" autoFocus />
          <button className="btn-primary" type="submit">Commencer</button>
        </form>
      </div>
    </div>
  );
}
