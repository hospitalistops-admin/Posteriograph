import { useState, type CSSProperties } from "react";
import type { B10PosteriorRow } from "../lib/b10PosteriorRows";
import { TARGET_STATES } from "../lib/b10Views";
import { formatPercent, STATE_COLORS, stateLabel, targetStateLabel } from "../lib/cases";
import { formatDeltaPp } from "../lib/b10Views";
import type { EvidenceSet } from "../types";

interface Props {
  rows: B10PosteriorRow[];
  evidence: EvidenceSet;
}

function MobileSparkline({ points }: { points: { value: number }[] }) {
  if (points.length < 2) return null;
  const width = 100;
  const height = 14;
  const values = points.map((p) => p.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 2) - 1;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="m-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <path d={path} fill="none" stroke="rgba(148,163,184,0.6)" strokeWidth="1" />
    </svg>
  );
}

function PosteriorCard({
  row,
  rank,
  evidence,
  expanded,
  onToggle
}: {
  row: B10PosteriorRow;
  rank: number;
  evidence: EvidenceSet;
  expanded: boolean;
  onToggle: () => void;
}) {
  const color = STATE_COLORS[row.state] ?? "#64748b";

  return (
    <article
      className={`m-posterior-card ${rank === 0 ? "top" : ""} ${expanded ? "expanded" : ""}`}
      style={{ "--state-color": color } as CSSProperties}
    >
      <button type="button" className="m-posterior-head" onClick={onToggle} aria-expanded={expanded}>
        <div className="m-posterior-title">
          <span className="m-path-name">{targetStateLabel(row.state)}</span>
          <strong className="m-path-pct">{formatPercent(row.probability, 1)}</strong>
        </div>
        <span className="m-expand-chevron">{expanded ? "▴" : "▾"}</span>
      </button>

      <div className="m-mobile-composite-bar" aria-hidden>
        <span className="m-gridline" style={{ left: "0%" }} />
        <span className="m-gridline" style={{ left: "25%" }} />
        <span className="m-gridline" style={{ left: "50%" }} />
        <span className="m-gridline" style={{ left: "75%" }} />
        <span className="m-gridline" style={{ left: "100%" }} />
        <span
          className="m-fragility-band"
          style={{
            left: `${row.band.low * 100}%`,
            width: `${(row.band.high - row.band.low) * 100}%`
          }}
        />
        <span className="m-posterior-fill" style={{ width: `${Math.max(row.probability * 100, 0.5)}%` }} />
        <span className="m-prior-tick" style={{ left: `${row.prior * 100}%` }} title="Expert model tick" />
        <span className="m-trajectory-line">
          <MobileSparkline points={row.trajectory} />
        </span>
      </div>

      <div className="m-posterior-chips">
        <span className="m-chip-meta">Δ expert {formatDeltaPp(row.delta)}</span>
        <span className="m-chip-meta">
          margin {rank < TARGET_STATES.length - 1 ? formatPercent(row.marginFromNext, 1) : "—"}
        </span>
        <span className={`m-chip-verdict verdict-${row.verdict}`}>{row.verdict}</span>
      </div>

      {expanded ? (
        <ol className="m-trajectory-timeline">
          {row.steps.map((step, index) => (
            <li key={`${step.label}-${index}`}>
              <strong>{step.displayLabel}</strong>
              {step.label !== "empty" && evidence[step.label] ? (
                <span> = {stateLabel(step.label, evidence[step.label])}</span>
              ) : null}
              <span className="m-step-value"> → {formatPercent(step.value, 1)}</span>
              {index > 0 ? (
                <span className={step.deltaFromPrev >= 0 ? "m-step-delta up" : "m-step-delta down"}>
                  {" "}
                  ({formatDeltaPp(step.deltaFromPrev)})
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}

export function MobilePosteriorDistribution({ rows, evidence }: Props) {
  const [expandedState, setExpandedState] = useState<string | null>(rows[0]?.state ?? null);

  return (
    <section className="m-result-section" id="m-section-posterior" aria-labelledby="m-posterior-heading">
      <h2 id="m-posterior-heading" className="m-section-title">
        Posterior distribution
      </h2>
      <p className="m-section-lead">
        Four causative-pathogen outcomes on a shared 0–100% scale. Bar = learnt posterior; white tick = expert model;
        pale band = derived uncertainty hint; grey line = evidence trajectory.
      </p>
      <div className="m-posterior-list">
        {rows.map((row, index) => (
          <PosteriorCard
            key={row.state}
            row={row}
            rank={index}
            evidence={evidence}
            expanded={expandedState === row.state}
            onToggle={() =>
              setExpandedState((current) => (current === row.state ? null : row.state))
            }
          />
        ))}
      </div>
    </section>
  );
}
