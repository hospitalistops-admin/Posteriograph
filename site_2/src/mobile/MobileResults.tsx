import { useMemo, useState } from "react";
import { SimplexHud } from "../components/B10CardViews";
import { MobileSiteFooter } from "../components/SiteFooter";
import { TARGET_STATES, type TargetState } from "../lib/b10Views";
import { formatPercent, STATE_COLORS, targetStateLabel } from "../lib/cases";
import type { PosteriorResult, RandomCase } from "../types";

interface Props {
  result: PosteriorResult;
  priorProbabilities: Record<string, number>;
  activeCase: RandomCase | null;
  onEdit: () => void;
  onRandom: () => void;
  onReset: () => void;
}

export function MobileResults({
  result,
  priorProbabilities,
  activeCase,
  onEdit,
  onRandom,
  onReset
}: Props) {
  const [showSimplex, setShowSimplex] = useState(false);
  const topState = (result.topState as TargetState) || "EColi";
  const topProb = result.probabilities[topState] ?? 0;

  const rows = useMemo(
    () =>
      TARGET_STATES.map((state) => {
        const prob = result.probabilities[state] ?? 0;
        const prior = priorProbabilities[state] ?? 0;
        return { state, prob, prior, delta: prob - prior };
      }).sort((a, b) => b.prob - a.prob),
    [result.probabilities, priorProbabilities]
  );

  return (
    <div className="m-results">
      {activeCase ? (
        <div className="m-case-strip">
          <strong>{activeCase.title}</strong>
          <span>{activeCase.intent}</span>
        </div>
      ) : null}

      <header className="m-hero">
        <p className="m-eyebrow">top pathogen</p>
        <h2 className="m-hero-state">{targetStateLabel(topState)}</h2>
        <p className="m-hero-pct" style={{ color: STATE_COLORS[topState] }}>
          {formatPercent(topProb, 1)}
        </p>
      </header>

      <div className="m-card-row" role="list" aria-label="Posterior by pathogen">
        {rows.map((row) => (
          <article
            key={row.state}
            className="m-path-card"
            role="listitem"
            style={{ borderColor: STATE_COLORS[row.state] }}
          >
            <span className="m-path-name">{targetStateLabel(row.state)}</span>
            <strong className="m-path-pct" style={{ color: STATE_COLORS[row.state] }}>
              {formatPercent(row.prob, 1)}
            </strong>
            <span className={row.delta >= 0 ? "m-delta pos" : "m-delta neg"}>
              {row.delta >= 0 ? "+" : ""}
              {formatPercent(row.delta, 1)} vs expert
            </span>
          </article>
        ))}
      </div>

      <details className="m-more" open={showSimplex} onToggle={(e) => setShowSimplex((e.target as HTMLDetailsElement).open)}>
        <summary>More details (2D map)</summary>
        <div className="m-simplex-wrap">
          <SimplexHud
            probabilities={result.probabilities}
            priorProbabilities={priorProbabilities}
            highlightState={topState}
            compact
          />
        </div>
      </details>

      <MobileSiteFooter />

      <nav className="m-bottom-bar" aria-label="Actions">
        <button type="button" className="m-btn m-btn-primary" onClick={onEdit}>
          Edit evidence
        </button>
        <button type="button" className="m-btn m-btn-ghost" onClick={onRandom}>
          Random
        </button>
        <button type="button" className="m-btn m-btn-ghost" onClick={onReset}>
          Reset
        </button>
      </nav>
    </div>
  );
}
