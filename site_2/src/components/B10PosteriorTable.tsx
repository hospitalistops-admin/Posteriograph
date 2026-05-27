import { useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { STATE_COLORS, formatPercent, stateLabel, targetStateLabel } from "../lib/cases";
import { buildB10PosteriorRows, type B10PosteriorRow } from "../lib/b10PosteriorRows";
import {
  TARGET_STATES,
  formatDeltaPp,
  uncertaintyBadge,
  type TargetState
} from "../lib/b10Views";
import type { EvidenceSet, PosteriorResult } from "../types";
import { B10_EXPLANATIONS } from "./B10InfoTip";
import { B10Popover } from "./B10Popover";

interface Props {
  result: PosteriorResult;
  priorProbabilities: Record<string, number>;
  evidence: EvidenceSet;
}

type RankedRow = B10PosteriorRow;

function nearestStepIndex(clientX: number, rect: DOMRect, stepCount: number): number {
  if (stepCount <= 1) return 0;
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return Math.round(ratio * (stepCount - 1));
}

export function B10PosteriorTable({ result, priorProbabilities, evidence }: Props) {
  const [expandedState, setExpandedState] = useState<TargetState | null>(null);
  const ranked = useMemo(() => buildB10PosteriorRows(result, priorProbabilities, evidence), [
    result,
    priorProbabilities,
    evidence
  ]);

  const badge = uncertaintyBadge(result.entropy, result.margin);
  const top = ranked[0];

  return (
    <section className="b10-tufte b10-posterior-table" aria-label="Four-state posterior comparison">
      <header className="b10-macro">
        <h2>Causative pathogen</h2>
        <p className="b10-macro-summary">
          <strong>{targetStateLabel(top.state)}</strong> {formatPercent(top.probability, 1)} · margin over next{" "}
          {formatPercent(top.marginFromNext, 1)} · {badge.replace("rank ", "")}
        </p>
        <p className="b10-macro-hint">Click the organism name or ▾ to expand the evidence trajectory.</p>
      </header>

      <details className="b10-legend-details">
        <summary>Legend</summary>
        <div className="b10-legend-strip">
          <span>■ Learnt posterior</span>
          <span>| Expert-model tick</span>
          <span>~ Trajectory (learnt)</span>
          <span>▢ Fragility (derived)</span>
          <span className="b10-legend-meta">
            Entropy {result.entropy.toFixed(2)} — {B10_EXPLANATIONS.macroEntropy.summary}
          </span>
        </div>
      </details>

      <div className="b10-table-wrap" role="table" aria-label="Posterior by state">
        <div className="b10-table-head" role="row">
          <span role="columnheader">State</span>
          <span role="columnheader" className="col-strip-head">
            Probability (0–100%, shared scale)
          </span>
          <span role="columnheader">
            <B10Popover summary={B10_EXPLANATIONS.deltaPrior.summary} detail={B10_EXPLANATIONS.deltaPrior.detail} source="both">
              <span className="b10-head-pop">Δ expert</span>
            </B10Popover>
          </span>
          <span role="columnheader">Margin</span>
          <span role="columnheader">
            <B10Popover
              summary={B10_EXPLANATIONS.fragilityBand.summary}
              detail={B10_EXPLANATIONS.fragilityBand.detail}
              source="heuristic"
            >
              <span className="b10-head-pop">Fragility (derived)</span>
            </B10Popover>
          </span>
          <span role="columnheader" className="col-expand-head" aria-hidden="true" />
        </div>

        {ranked.map((row, index) => (
          <PosteriorRowBlock
            key={row.state}
            row={row}
            rank={index}
            isTop={index === 0}
            expanded={expandedState === row.state}
            evidence={evidence}
            entropy={result.entropy}
            onToggle={() => setExpandedState((current) => (current === row.state ? null : row.state))}
          />
        ))}
      </div>

      <p className="b10-table-footnote">
        Fragility is a derived UI hint, not a confidence interval or clinical score. White tick = pre-learning expert
        model with the same evidence.
      </p>
    </section>
  );
}

function PosteriorRowBlock({
  row,
  rank,
  isTop,
  expanded,
  evidence,
  entropy,
  onToggle
}: {
  row: RankedRow;
  rank: number;
  isTop: boolean;
  expanded: boolean;
  evidence: EvidenceSet;
  entropy: number;
  onToggle: () => void;
}) {
  const color = STATE_COLORS[row.state] ?? "#64748b";
  const [sparkStepIndex, setSparkStepIndex] = useState<number | null>(null);

  const sparkStep = sparkStepIndex != null ? row.steps[sparkStepIndex] : null;
  const sparkBody = sparkStep ? (
    <>
      <div>
        <strong>{sparkStep.displayLabel}</strong>
        {sparkStep.label !== "empty" && evidence[sparkStep.label] ? (
          <span> = {stateLabel(sparkStep.label, evidence[sparkStep.label])}</span>
        ) : null}
      </div>
      <div>
        {formatPercent(sparkStep.value, 1)}
        {sparkStepIndex != null && sparkStepIndex > 0 ? (
          <span className={sparkStep.deltaFromPrev >= 0 ? "step-delta up" : "step-delta down"}>
            {" "}
            ({formatDeltaPp(sparkStep.deltaFromPrev)})
          </span>
        ) : null}
      </div>
    </>
  ) : null;

  const onSparkMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSparkStepIndex(nearestStepIndex(event.clientX, rect, row.steps.length));
  };

  return (
    <div className={`b10-row-block ${expanded ? "expanded" : ""}`}>
      <div
        className={`b10-table-row ${isTop ? "top-row" : ""}`}
        role="row"
        style={{ "--state-color": color } as CSSProperties}
      >
        <button type="button" className="b10-state-cell" onClick={onToggle} aria-expanded={expanded}>
          <span className="b10-state-name">{targetStateLabel(row.state)}</span>
          <span className="b10-state-pct">{formatPercent(row.probability, 1)}</span>
        </button>

        <div className="b10-strip-cell">
          <div className="b10-composite-strip" aria-hidden="true">
            <span className="gridline" style={{ left: "0%" }} />
            <span className="gridline" style={{ left: "25%" }} />
            <span className="gridline" style={{ left: "50%" }} />
            <span className="gridline" style={{ left: "75%" }} />
            <span className="gridline" style={{ left: "100%" }} />

            <B10Popover
              className="b10-popover-layer fragility-layer"
              summary={B10_EXPLANATIONS.fragilityBand.summary}
              detail={B10_EXPLANATIONS.fragilityBand.detail}
              source="heuristic"
              style={{
                left: `${row.band.low * 100}%`,
                width: `${(row.band.high - row.band.low) * 100}%`,
                top: "4px",
                height: "14px"
              }}
            >
              <span className="fragility-band" />
            </B10Popover>

            <B10Popover
              className="b10-popover-layer sparkline-layer"
              summary={B10_EXPLANATIONS.sparkline.summary}
              detail={B10_EXPLANATIONS.sparkline.detail}
              source="learnt"
              body={sparkBody ?? <span className="b10-popover-hint">Move along the line to inspect a step.</span>}
            >
              <Sparkline
                points={row.trajectory}
                onPointerMove={onSparkMove}
                onPointerLeave={() => setSparkStepIndex(null)}
              />
            </B10Popover>

            <B10Popover
              className="b10-popover-layer fill-layer"
              summary={B10_EXPLANATIONS.posteriorFill.summary}
              detail={B10_EXPLANATIONS.posteriorFill.detail}
              source="learnt"
              style={{
                width: `${Math.max(row.probability * 100, row.probability > 0 ? 0.4 : 0)}%`,
                left: 0,
                top: 0,
                bottom: 0
              }}
              body={
                <div>
                  P({targetStateLabel(row.state)}) = <strong>{formatPercent(row.probability, 1)}</strong>
                </div>
              }
            >
              <span className="posterior-fill" />
            </B10Popover>

            <B10Popover
              className="b10-popover-layer tick-layer"
              summary={B10_EXPLANATIONS.priorTick.summary}
              detail={B10_EXPLANATIONS.priorTick.detail}
              source="expert"
              style={{
                left: `calc(${row.prior * 100}% - 7px)`,
                width: "14px",
                top: 0,
                bottom: 0
              }}
              body={
                <div>
                  Expert model: <strong>{formatPercent(row.prior, 1)}</strong>
                  <br />
                  Δ vs learnt: <strong>{formatDeltaPp(row.delta)}</strong>
                </div>
              }
            >
              <span className="prior-tick" />
            </B10Popover>
          </div>
        </div>

        <span className="b10-delta-cell" role="cell">
          <B10Popover
            summary={B10_EXPLANATIONS.deltaPrior.summary}
            detail={B10_EXPLANATIONS.deltaPrior.detail}
            source="both"
          >
            <span>{formatDeltaPp(row.delta)}</span>
          </B10Popover>
        </span>
        <span className="b10-margin-cell" role="cell">
          {rank < TARGET_STATES.length - 1 ? formatPercent(row.marginFromNext, 1) : "—"}
        </span>
        <span className={`b10-verdict-cell verdict-${row.verdict}`} role="cell">
          <B10Popover
            summary={B10_EXPLANATIONS.fragilityVerdict.summary}
            detail={B10_EXPLANATIONS.fragilityVerdict.detail}
            source="heuristic"
            body={
              <div>
                entropy {entropy.toFixed(2)} · margin {formatPercent(row.marginFromNext, 1)} → {row.verdict}
              </div>
            }
          >
            <span className="b10-verdict-label">{row.verdict}</span>
          </B10Popover>
        </span>
        <button
          type="button"
          className="b10-expand-chevron"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} trajectory for ${targetStateLabel(row.state)}`}
        >
          {expanded ? "▴" : "▾"}
        </button>
      </div>

      {expanded ? <TrajectoryExpandPanel row={row} evidence={evidence} /> : null}
    </div>
  );
}

function TrajectoryExpandPanel({ row, evidence }: { row: RankedRow; evidence: EvidenceSet }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 640;
  const height = 140;
  const padding = { left: 8, right: 8, top: 12, bottom: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const values = row.steps.map((s) => s.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = row.steps.map((step, index) => {
    const x = padding.left + (index / Math.max(1, row.steps.length - 1)) * innerW;
    const y = padding.top + innerH - ((step.value - min) / range) * innerH;
    return { ...step, x, y, index };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const chartStepIndex = hoverIndex ?? row.steps.length - 1;
  const active = points[chartStepIndex];

  const onChartMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverIndex(nearestStepIndex(event.clientX, rect, row.steps.length));
  };

  return (
    <div className="b10-trajectory-expand">
      <h4>
        Evidence trajectory — {targetStateLabel(row.state)} <span className="source-tag learnt">learnt BN</span>
      </h4>

      {active ? (
        <p className="trajectory-hover-caption" aria-live="polite">
          <strong>{active.displayLabel}</strong>
          {active.label !== "empty" && evidence[active.label] ? (
            <span> = {stateLabel(active.label, evidence[active.label])}</span>
          ) : null}
          <span> → {formatPercent(active.value, 1)}</span>
          {active.index > 0 ? (
            <span className={active.deltaFromPrev >= 0 ? "step-delta up" : "step-delta down"}>
              {" "}
              ({formatDeltaPp(active.deltaFromPrev)})
            </span>
          ) : null}
        </p>
      ) : null}

      <svg
        className="b10-trajectory-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Evidence trajectory for ${row.state}`}
        onPointerMove={onChartMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding.top + innerH - ((tick - min) / range) * innerH;
          const label = `${((min + (max - min) * tick) * 100).toFixed(0)}%`;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(148,163,184,0.15)"
                strokeWidth="0.5"
              />
              <text x={2} y={y + 3} className="trajectory-axis-label">
                {label}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke="rgba(148,163,184,0.75)" strokeWidth="1.2" />
        {points.map((point) => (
          <g key={`${point.label}-${point.index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.index === chartStepIndex ? 5 : 3.5}
              fill={STATE_COLORS[row.state]}
              stroke="#e8eaed"
              strokeWidth={point.index === chartStepIndex ? 1.2 : 0.6}
              opacity={hoverIndex == null || point.index === chartStepIndex ? 1 : 0.45}
            />
            <text x={point.x} y={height - 6} textAnchor="middle" className="trajectory-step-label">
              {point.index === 0 ? "∅" : abbrevStep(point.label)}
            </text>
          </g>
        ))}
      </svg>

      <details className="b10-trajectory-steps-details">
        <summary>All steps ({row.steps.length})</summary>
        <p className="trajectory-expand-note">
          Order-aware cumulative updates on <strong>Applied_BN_v2.2_learnt.dne</strong> (clinical control order).
        </p>
        <ol className="b10-trajectory-steps">
          {row.steps.map((step, index) => (
            <li key={`${step.label}-${index}`}>
              <strong>{step.displayLabel}</strong>
              {step.label !== "empty" && evidence[step.label] ? (
                <span className="step-evidence"> = {stateLabel(step.label, evidence[step.label])}</span>
              ) : null}
              <span className="step-value"> → {formatPercent(step.value, 1)}</span>
              {index > 0 ? (
                <span className={`step-delta ${step.deltaFromPrev >= 0 ? "up" : "down"}`}>
                  {" "}
                  ({formatDeltaPp(step.deltaFromPrev)})
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function abbrevStep(nodeId: string): string {
  if (nodeId.length <= 10) return nodeId;
  return `${nodeId.slice(0, 8)}…`;
}

function Sparkline({
  points,
  onPointerMove,
  onPointerLeave
}: {
  points: { value: number }[];
  onPointerMove?: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerLeave?: () => void;
}) {
  if (points.length < 2) return null;

  const width = 100;
  const height = 12;
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
    <svg
      className="b10-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <path d={path} fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="0.8" />
    </svg>
  );
}
