// src/pages/Landing.tsx
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TextPlugin } from "gsap/TextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TOTAL_LEVELS } from "../levels";

gsap.registerPlugin(useGSAP, TextPlugin, ScrollTrigger);

const BOOT: [string, string, string][] = [
  ["init", "kernel + runtime", "done"],
  ["mount", "/challenges", `${TOTAL_LEVELS} défis`],
  ["load", "pyodide · python wasm", "ready"],
  ["link", "supabase", "connected"],
  ["start", "leaderboard", "en ligne"],
];

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(".boot-head, .bootL, .cmd-line, .hero > *", { opacity: 1, clearProps: "transform" });
        gsap.set(".bar > i", { width: "100%" });
        return;
      }

      // séquence de boot → révélation du hero
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
      tl.from(".boot-head", { opacity: 0, duration: 0.3 })
        .from(".bootL", { opacity: 0, x: -10, stagger: 0.22, duration: 0.25 }, ">")
        .to(".bar > i", { width: "100%", duration: 0.55, ease: "power1.inOut" }, "<")
        .to(".cmd", { duration: 0.7, text: "booting arena…", ease: "none" }, ">0.1")
        .from(".hero", { opacity: 0, duration: 0.2 }, ">0.25")
        .from(".wordmark", { opacity: 0, scale: 0.93, duration: 0.55, ease: "back.out(1.5)" }, "<")
        .from(".tagline", { opacity: 0, y: 10, duration: 0.4 }, ">-0.15")
        .from(".cta > *", { opacity: 0, y: 12, stagger: 0.1, duration: 0.35 }, ">-0.1");

      // révélations au scroll
      gsap.utils.toArray<HTMLElement>(".seg").forEach((seg) => {
        gsap.from(seg.children, {
          scrollTrigger: { trigger: seg, start: "top 78%" },
          opacity: 0,
          y: 18,
          stagger: 0.08,
          duration: 0.45,
        });
      });
    },
    { scope: root }
  );

  return (
    <div className="landing" ref={root}>
      <div className="crt">
        {/* ===== Boot + hero ===== */}
        <section className="boot">
          <div className="boot-head">code-arena OS <span className="dim">v0.3.0</span> — initialisation du système</div>
          <div className="boot-log">
            {BOOT.map(([act, what, res], i) => (
              <div className="bootL" key={i}>
                <span className="ok">[ ok ]</span>
                <span className="act">{act}</span>
                <span className="what">{what}</span>
                <span className="dots" />
                <span className="res">{res}</span>
              </div>
            ))}
          </div>
          <div className="bar"><i /></div>
          <div className="cmd-line"><span className="pr">arena $</span> <span className="cmd" /><span className="caret" /></div>

          <div className="hero">
            <h1 className="wordmark">CODE<span className="sp"> </span>ARENA</h1>
            <p className="tagline">// résous des défis Python directement dans ton navigateur — tests en direct, classement, zéro installation.</p>
            <div className="cta">
              <button className="btn-primary lg" onClick={() => nav("/play")}>▸ lancer l'arène</button>
              <button className="btn-text" onClick={() => nav("/tableau")}>voir le classement</button>
            </div>
          </div>
        </section>

        {/* ===== Features (sortie terminal) ===== */}
        <section className="seg">
          <div className="seg-cmd"><span className="pr">arena $</span> arena --features</div>
          <div className="feat">
            <div className="f"><span className="fk">20 défis</span><span className="fv">du « hello world » à l'algo — facile, moyen, difficile</span></div>
            <div className="f"><span className="fk">exécution locale</span><span className="fv">ton code tourne en Python (Pyodide / WebAssembly), aucun serveur</span></div>
            <div className="f"><span className="fk">tests en direct</span><span className="fv">PASS / FAIL instantané, comme un vrai test-runner</span></div>
            <div className="f"><span className="fk">classement</span><span className="fv">grimpe le leaderboard, gagne de l'XP, garde ta série</span></div>
          </div>
        </section>

        {/* ===== How (sortie terminal) ===== */}
        <section className="seg">
          <div className="seg-cmd"><span className="pr">arena $</span> arena --how</div>
          <div className="how">
            <div className="step"><span className="n">01</span><span className="t">choisis un défi dans la liste</span></div>
            <div className="step"><span className="n">02</span><span className="t">écris ta fonction Python</span></div>
            <div className="step"><span className="n">03</span><span className="t">lance les tests, vaincs le défi</span></div>
          </div>
          <button className="btn-primary lg start" onClick={() => nav("/play")}>▸ commencer maintenant</button>
        </section>

        <footer className="lfoot"><span className="dim">code·arena</span> — my-monkey · 2026<span className="caret sm" /></footer>
      </div>
    </div>
  );
}
