// src/components/Results.tsx
import type { RunResult } from "../types";

const fmt = (v: unknown) => JSON.stringify(v);

export default function Results({ result }: { result: RunResult | null }) {
  if (!result) return null;
  if (result.globalError) return <div className="res-error">&#x26d4; {result.globalError}</div>;
  const visible = result.cases.filter((c) => !c.hidden);
  const hidden = result.cases.filter((c) => c.hidden);
  const hiddenPassed = hidden.filter((c) => c.passed).length;
  const passed = result.cases.filter((c) => c.passed).length;
  const failed = result.cases.length - passed;
  return (
    <div className="runner">
      <div className={`rhead ${result.passed ? "ok" : "ko"}`}>
        {result.passed ? "PASS" : "FAIL"}
        <span className="dim"> cas visibles{hidden.length ? " + cachés" : ""}</span>
      </div>
      {visible.map((c, i) => (
        <div key={i} className={`rline ${c.passed ? "pass" : "fail"}`}>
          <span className="sym">{c.passed ? "✓" : "✗"}</span>
          <span className="txt">
            ({c.args.map(fmt).join(", ")}) → {c.error
              ? <span className="fail">{c.error}</span>
              : fmt(c.got)}
            {!c.passed && !c.error && <span className="dim"> · attendu {fmt(c.expected)}</span>}
          </span>
        </div>
      ))}
      {hidden.length > 0 && (
        <div className="rline dim">
          <span className="sym">{hiddenPassed === hidden.length ? "✓" : "·"}</span>
          <span className="txt">{hiddenPassed} / {hidden.length} cas cachés</span>
        </div>
      )}
      <div className="rsum">Tests : <b className="p">{passed} réussis</b>, <b className="f">{failed} échoués</b></div>
      {result.passed && (
        <div className="victory">
          <span className="vt">&#x2bae; DÉFI VAINCU</span>
          <span className="vx">niveau résolu · +120 XP</span>
        </div>
      )}
    </div>
  );
}
