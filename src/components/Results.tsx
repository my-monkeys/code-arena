// src/components/Results.tsx
import type { RunResult } from "../types";

const fmt = (v: unknown) => JSON.stringify(v);

export default function Results({ result }: { result: RunResult | null }) {
  if (!result) return null;
  if (result.globalError) return <div className="res-error">⛔ {result.globalError}</div>;
  const visible = result.cases.filter((c) => !c.hidden);
  const hidden = result.cases.filter((c) => c.hidden);
  const hiddenPassed = hidden.filter((c) => c.passed).length;
  return (
    <div className="results">
      {result.passed && <div className="res-win"><span>✓</span> <span>Niveau réussi</span></div>}
      <table>
        <thead><tr><th>Entrée</th><th>Attendu</th><th>Obtenu</th><th></th></tr></thead>
        <tbody>
          {visible.map((c, i) => (
            <tr key={i} className={c.passed ? "ok" : "ko"}>
              <td>{c.args.map(fmt).join(", ")}</td>
              <td>{fmt(c.expected)}</td>
              <td>{c.error ? `⚠ ${c.error}` : fmt(c.got)}</td>
              <td className="status">{c.passed ? "✓" : "✗"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hidden.length > 0 && (
        <p className="hidden-count">Tests cachés : {hiddenPassed} / {hidden.length} réussis</p>
      )}
    </div>
  );
}
