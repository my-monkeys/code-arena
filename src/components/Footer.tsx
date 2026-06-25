// src/components/Footer.tsx
// Footer cross-sites My-Monkey — données via l'API harmonisée, habillage terminal maison.
import { useEffect, useState } from "react";

type FLink = { title: string; url: string };
type FCol = { key: string; label: string; links: FLink[] };
type FooterData = {
  columns: FCol[];
  more: { label: string; url: string };
  brand: { name: string; url: string };
};

export default function Footer() {
  const [data, setData] = useState<FooterData | null>(null);

  useEffect(() => {
    const host = location.host;
    fetch(`https://git.my-monkey.fr/api/footer?site=${encodeURIComponent(host)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {}); // pas de footer cassé si l'API est indispo
  }, []);

  return (
    <footer className="mmfoot">
      <div className="mmfoot-cmd"><span className="pr">arena $</span> ls ~/my-monkey<span className="caret sm" /></div>

      <div className="mmfoot-grid">
        <div className="mmfoot-brand">
          <a className="mmfoot-name" href={data?.brand.url ?? "https://my-monkey.fr"}>my-monkey</a>
          <p>un collectif, plein de petits projets — jeux, outils, idées un peu absurdes.</p>
          <a className="mmfoot-more" href={data?.more.url ?? "https://my-monkey.fr/projets/"}>
            {data?.more.label ?? "Tout l'univers My-Monkey"} →
          </a>
        </div>

        <div className="mmfoot-cols">
          {(data?.columns ?? []).map((c) => (
            <nav className="mmfoot-col" key={c.key} aria-label={c.label}>
              <h4>{c.label}</h4>
              <ul>
                {c.links.map((l) => (
                  <li key={l.url}><a href={l.url}>{l.title}</a></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="mmfoot-base">
        <span className="dim">code·arena</span> — un projet my-monkey · 2026
      </div>
    </footer>
  );
}
