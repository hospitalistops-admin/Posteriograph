import { ArrowLeft } from "lucide-react";
import { METHODS_FORMULAS, METHODS_REFERENCES, METHODS_SECTIONS } from "../shared/methods_copy";

interface Props {
  onBack: () => void;
}

export function MethodsSection({ onBack }: Props) {
  return (
    <section className="methods-section" aria-label="How this works">
      <header className="methods-header cyber-panel">
        <button type="button" className="cyber-button ghost" onClick={onBack}>
          <ArrowLeft size={16} />
          back
        </button>
        <div>
          <span className="terminal-prefix">methods</span>
          <h2>How this works</h2>
          <p>Lineage, derivation, mathematics, and what is original to this demo.</p>
        </div>
      </header>

      <div className="methods-grid">
        {METHODS_SECTIONS.map((block) => (
          <article className="methods-card cyber-panel" key={block.id}>
            <h3>{block.title}</h3>
            <p>{block.body}</p>
            {block.items ? (
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {block.note ? <p className="methods-note">{block.note}</p> : null}
          </article>
        ))}

        <article className="methods-card cyber-panel methods-formulas">
          <h3>Mathematics used in the UI</h3>
          <p>Formulas below map to code in inference.ts, b10Views.ts, and composites.ts.</p>
          <div className="formula-list">
            {METHODS_FORMULAS.map((block) => (
              <div className="formula-block" key={block.id}>
                <strong>{block.title}</strong>
                {block.formula ? <pre className="formula-pre">{block.formula}</pre> : null}
                <p>{block.body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="methods-card cyber-panel">
          <h3>References</h3>
          <ul className="methods-refs">
            {METHODS_REFERENCES.map((ref) => (
              <li key={ref.href}>
                <a href={ref.href} target="_blank" rel="noreferrer">
                  {ref.label}
                </a>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
