import { ArrowLeft } from "lucide-react";
import { METHODS_FORMULAS, METHODS_REFERENCES, METHODS_SECTIONS } from "../shared/methods_copy";

interface Props {
  onBack: () => void;
}

export function MobileMethods({ onBack }: Props) {
  return (
    <section className="m-methods" aria-label="How this works">
      <header className="m-methods-head">
        <button type="button" className="m-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>
        <h2>How this works</h2>
        <p>Lineage, derivation, and math behind the demo.</p>
      </header>

      {METHODS_SECTIONS.map((block) => (
        <article className="m-methods-card" key={block.id}>
          <h3>{block.title}</h3>
          <p>{block.body}</p>
          {block.items ? (
            <ul>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {block.note ? <p className="m-methods-note">{block.note}</p> : null}
        </article>
      ))}

      <article className="m-methods-card">
        <h3>Mathematics</h3>
        {METHODS_FORMULAS.map((block) => (
          <div className="m-formula-block" key={block.id}>
            <strong>{block.title}</strong>
            {block.formula ? <pre>{block.formula}</pre> : null}
            <p>{block.body}</p>
          </div>
        ))}
      </article>

      <article className="m-methods-card">
        <h3>References</h3>
        {METHODS_REFERENCES.map((ref) => (
          <p key={ref.href}>
            <a href={ref.href} target="_blank" rel="noreferrer">
              {ref.label}
            </a>
          </p>
        ))}
      </article>
    </section>
  );
}
