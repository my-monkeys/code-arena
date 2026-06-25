// src/pages/PseudoGate.tsx
import { useState } from "react";
import { setPseudo } from "../data/progress";

const GlyphSvg = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4l3.2 4L3 12"/><path d="M9 12h4"/>
  </svg>
);

export default function PseudoGate({ onReady }: { onReady: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="gate">
      <div className="gate-card">
        <div className="gate-head">
          <span className="glyph"><GlyphSvg /></span>
          code·arena
        </div>
        <div className="gate-prompt"><span className="u">arena</span>$ login</div>
        <p>Choisis un identifiant pour entrer dans l'arène.</p>
        <form
          className="gate-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) {
              setPseudo(value.trim());
              onReady();
            }
          }}
        >
          <span className="pr">›</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ton_pseudo"
            autoFocus
            spellCheck={false}
          />
          <button className="btn-primary" type="submit">entrer</button>
        </form>
      </div>
    </div>
  );
}
