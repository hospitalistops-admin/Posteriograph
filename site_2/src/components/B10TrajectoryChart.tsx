import { useState, type PointerEvent } from "react";
import { STATE_COLORS, formatPercent, stateLabel, targetStateLabel } from "../lib/cases";
import type { B10PosteriorRow } from "../lib/b10PosteriorRows";
import { formatDeltaPp } from "../lib/b10Views";
import type { EvidenceSet } from "../types";

function nearestStepIndex(clientX: number, rect: DOMRect, stepCount: number): number {
  if (stepCount <= 1) return 0;
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return Math.round(ratio * (stepCount - 1));
}

function abbrevStep(nodeId: string): string {
  if (nodeId.length <= 10) return nodeId;
  return `${nodeId.slice(0, 8)}…`;
}

interface Props {
  row: B10PosteriorRow;
  evidence: EvidenceSet;
  dense?: boolean;
  showHeading?: boolean;
}

export function B10TrajectoryChart({ row, evidence, dense = false, showHeading = true }: Props) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = dense ? 360 : 640;
  const height = dense ? 120 : 140;
  const padding = dense
    ? { left: 6, right: 6, top: 10, bottom: 24 }
    : { left: 8, right: 8, top: 12, bottom: 28 };
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
    <div className={`b10-trajectory-expand ${dense ? "dense" : ""}`}>
      {showHeading ? (
        <h4>
          Evidence trajectory — {targetStateLabel(row.state)}{" "}
          <span className="source-tag learnt">learnt BN</span>
        </h4>
      ) : null}

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
        aria-label={`Evidence trajectory for ${targetStateLabel(row.state)}`}
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
              r={point.index === chartStepIndex ? (dense ? 4 : 5) : dense ? 3 : 3.5}
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
