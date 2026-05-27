import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPercent, targetStateLabel } from "../lib/cases";
import { fragilityBand, uncertaintyBadge, type TargetState } from "../lib/b10Views";
import type { PosteriorResult } from "../types";
import type { StateEmbedding } from "../types";
import type { EvidenceSet } from "../types";
import { CardViewPanel, type CardViewMode } from "./B10CardViews";

const TARGET_STATES = ["EColi", "OtherGramNeg", "GramPos", "None"] as const;

const STATE_META: Record<string, { token: string; caution: string }> = {
  EColi: { token: "ecoli", caution: "Classic gram-negative UTI pathway." },
  OtherGramNeg: { token: "gnr", caution: "Alternative GNR signal — coverage matters." },
  GramPos: { token: "gpc", caution: "Organism call fragile; contamination common." },
  None: { token: "none", caution: "Low UTI branch; culture may be suppressed by antibiotics." }
};

const VIEW_MODES: { id: CardViewMode; label: string }[] = [
  { id: "simplex", label: "Simplex" },
  { id: "evidence", label: "Evidence" },
  { id: "pathways", label: "Pathways" },
  { id: "cpt", label: "CPT terrain" }
];

interface Props {
  result: PosteriorResult;
  priorProbabilities: Record<string, number>;
  embeddings: StateEmbedding[];
  evidence: EvidenceSet;
}

export function B10AccordionCards({ result, priorProbabilities, embeddings, evidence }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewByCard, setViewByCard] = useState<Record<string, CardViewMode>>({});

  const ranked = [...TARGET_STATES]
    .map((state) => ({
      state,
      probability: result.probabilities[state] ?? 0,
      prior: priorProbabilities[state] ?? 0,
      embedding: embeddings.find((item) => item.state === state)
    }))
    .sort((a, b) => b.probability - a.probability);

  const badge = uncertaintyBadge(result.entropy, result.margin);

  return (
    <section className="b10-accordion" aria-label="Causative pathogen b10 output">
      <header className="b10-accordion-header">
        <span className="terminal-prefix">b10 output</span>
        <h2>Four-state posterior</h2>
        <p className="uncertainty-global">
          Global uncertainty: <strong>{badge}</strong> · entropy {result.entropy.toFixed(2)} · margin{" "}
          {formatPercent(result.margin, 1)}
        </p>
      </header>
      <div className="b10-card-stack">
        {ranked.map((item, index) => {
          const meta = STATE_META[item.state];
          const isOpen = expanded === item.state;
          const viewMode = viewByCard[item.state] ?? "simplex";
          const band = fragilityBand(item.probability, result.entropy, result.margin);
          const decomp = item.embedding?.decompensationRisk ?? 0;

          return (
            <article
              className={`b10-dropdown-card ${meta.token} ${isOpen ? "open" : ""}`}
              key={item.state}
            >
              <button
                type="button"
                className="b10-card-trigger"
                onClick={() => setExpanded(isOpen ? null : item.state)}
                aria-expanded={isOpen}
              >
                <div className="trigger-main">
                  <span className="rank-pill">#{index + 1}</span>
                  <div>
                    <span className="state-code">{item.state}</span>
                    <strong>{targetStateLabel(item.state)}</strong>
                  </div>
                </div>
                <div className="trigger-stats">
                  <strong className="prob-value">{formatPercent(item.probability, 1)}</strong>
                  <div className="probability-track compact">
                    <span style={{ width: `${item.probability * 100}%` }} />
                  </div>
                  <span className="uncertainty-pill">{badge}</span>
                </div>
                <ChevronDown className={`chevron ${isOpen ? "open" : ""}`} size={22} />
              </button>

              {!isOpen ? (
                <p className="card-collapsed-note">{meta.caution}</p>
              ) : (
                <div className="b10-card-body">
                  <div className="interval-column">
                    <IntervalRow label="Posterior now" value={item.probability} accent="current" />
                    <IntervalRow
                      label="Prior model"
                      low={item.prior}
                      high={item.prior}
                      single
                      note="Expert/prior BN marginal"
                    />
                    <IntervalRow
                      label="Fragility band"
                      low={band.low}
                      high={band.high}
                      note="Heuristic uncertainty display — not a validated CI"
                    />
                    <IntervalRow
                      label="Clinical deterioration"
                      low={decomp}
                      high={decomp}
                      single
                      note="Inflammatory × organism-risk composite"
                    />
                  </div>

                  <div className="view-toggle-strip">
                    {VIEW_MODES.map((mode) => (
                      <button
                        type="button"
                        key={mode.id}
                        className={viewMode === mode.id ? "view-chip active" : "view-chip"}
                        onClick={() =>
                          setViewByCard((current) => ({ ...current, [item.state]: mode.id }))
                        }
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <CardViewPanel
                    mode={viewMode}
                    probabilities={result.probabilities}
                    priorProbabilities={priorProbabilities}
                    focusState={item.state as TargetState}
                    evidence={evidence}
                    deltas={result.evidenceDeltas}
                    highlightState={item.state as TargetState}
                  />

                  <p className="card-footnote">{meta.caution}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function IntervalRow({
  label,
  value,
  low,
  high,
  single,
  accent,
  note
}: {
  label: string;
  value?: number;
  low?: number;
  high?: number;
  single?: boolean;
  accent?: "current";
  note?: string;
}) {
  const lo = value ?? low ?? 0;
  const hi = value ?? high ?? 0;

  return (
    <div className={`interval-row ${accent ?? ""}`}>
      <div className="interval-head">
        <span>{label}</span>
        <strong>
          {single || lo === hi
            ? formatPercent(lo, 1)
            : `${formatPercent(lo, 0)} – ${formatPercent(hi, 0)}`}
        </strong>
      </div>
      <div className="interval-track">
        {!single && lo !== hi ? (
          <span
            className="interval-band"
            style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }}
          />
        ) : null}
        <span className="interval-marker" style={{ left: `${((lo + hi) / 2) * 100}%` }} />
      </div>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
