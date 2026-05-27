import type { EvidenceDelta } from "../types";
import type { PathwayLane, TargetState } from "../lib/b10Views";
import {
  TARGET_STATES,
  cornerPosition,
  cptTerrainPreview,
  equiradialProjection,
  evidenceArrowsForState,
  pathwayLanes,
  simplexFramePolygon
} from "../lib/b10Views";
import type { BnModel, EvidenceSet } from "../types";
import { formatPercent } from "../lib/cases";
import { STATE_COLORS } from "../lib/cases";
import { learnt } from "../data/models";

export type CardViewMode = "simplex" | "evidence" | "pathways" | "cpt";

interface ViewProps {
  mode: CardViewMode;
  probabilities: Record<string, number>;
  priorProbabilities: Record<string, number>;
  focusState: TargetState;
  evidence: EvidenceSet;
  deltas: EvidenceDelta[];
  highlightState?: TargetState;
}

export function CardViewPanel({
  mode,
  probabilities,
  priorProbabilities,
  focusState,
  evidence,
  deltas,
  highlightState
}: ViewProps) {
  switch (mode) {
    case "simplex":
      return (
        <SimplexHud
          probabilities={probabilities}
          priorProbabilities={priorProbabilities}
          highlightState={highlightState ?? focusState}
        />
      );
    case "evidence":
      return <EvidenceArrowPanel focusState={focusState} deltas={deltas} />;
    case "pathways":
      return <PathwayPanel evidence={evidence} />;
    case "cpt":
      return <CptTerrainPanel model={learnt} evidence={evidence} focusState={focusState} />;
    default:
      return null;
  }
}

export function SimplexHud({
  probabilities,
  priorProbabilities,
  highlightState,
  compact = false
}: {
  probabilities: Record<string, number>;
  priorProbabilities: Record<string, number>;
  highlightState: TargetState;
  compact?: boolean;
}) {
  const current = equiradialProjection(probabilities);
  const prior = equiradialProjection(priorProbabilities);
  const frame = simplexFramePolygon();
  const corners = TARGET_STATES.map((state) => ({
    state,
    ...cornerPosition(state),
    prob: probabilities[state] ?? 0
  }));

  return (
    <div className={`simplex-hud ${compact ? "compact" : ""}`}>
      <svg viewBox="0 0 100 100" role="img" aria-label="Four-state equiradial compositional map">
        <polygon
          points={frame}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(148,163,184,0.35)"
          strokeWidth="0.5"
        />
        {TARGET_STATES.map((state) => {
          const corner = cornerPosition(state);
          return (
            <line
              key={`axis-${state}`}
              x1={50}
              y1={50}
              x2={corner.x}
              y2={corner.y}
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="0.35"
            />
          );
        })}
        {corners.map((corner) => (
          <g key={corner.state}>
            <circle
              cx={corner.x}
              cy={corner.y}
              r={2 + corner.prob * 3}
              fill={stateFill(corner.state)}
              opacity={0.25 + corner.prob * 0.45}
            />
            <text x={corner.x} y={corner.y - 4} textAnchor="middle" className="simplex-label">
              {corner.state}
            </text>
          </g>
        ))}
        <line
          x1={prior.x}
          y1={prior.y}
          x2={current.x}
          y2={current.y}
          stroke="rgba(148,163,184,0.55)"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
        />
        <circle cx={prior.x} cy={prior.y} r="1.8" fill="none" stroke="rgba(148,163,184,0.9)" strokeWidth="0.7" />
        <circle
          cx={current.x}
          cy={current.y}
          r="2.8"
          fill={stateFill(highlightState)}
          fillOpacity={0.85}
          stroke="#e8eaed"
          strokeWidth="0.5"
        />
      </svg>
      {!compact ? (
        <p className="simplex-caption">
          Open circle = expert/pre-learning BN posterior (priors.dne); filled dot = learnt BN posterior. Rhomboid =
          barycentric frame (points stay inside).
        </p>
      ) : null}
    </div>
  );
}

function EvidenceArrowPanel({
  focusState,
  deltas
}: {
  focusState: TargetState;
  deltas: EvidenceDelta[];
}) {
  const arrows = evidenceArrowsForState(deltas, focusState);

  return (
    <div className="evidence-arrow-panel">
      {arrows.length === 0 ? (
        <p className="empty-state">No evidence — enter findings to see posterior shifts.</p>
      ) : (
        arrows.map((arrow) => (
          <div className="arrow-row" key={`${arrow.title}-${arrow.selectedState}`}>
            <span className={arrow.delta >= 0 ? "positive" : "negative"}>
              {arrow.delta >= 0 ? "▲" : "▼"} {formatSigned(arrow.delta)}
            </span>
            <div>
              <strong>{arrow.title}</strong>
              <small>{arrow.selectedState}</small>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function PathwayPanel({ evidence }: { evidence: EvidenceSet }) {
  const lanes = pathwayLanes(learnt, evidence);

  return (
    <div className="pathway-panel">
      {lanes.map((lane) => (
        <PathwayBar key={lane.id} lane={lane} evidence={evidence} />
      ))}
    </div>
  );
}

function PathwayBar({ lane, evidence }: { lane: PathwayLane; evidence: EvidenceSet }) {
  const observed = lane.nodeIds.filter((id) => id in evidence).length;
  return (
    <div className="pathway-bar">
      <div className="pathway-head">
        <strong>{lane.label}</strong>
        <span>{formatPercent(lane.signal, 0)}</span>
      </div>
      <div className="pathway-track">
        <span style={{ width: `${lane.signal * 100}%` }} />
      </div>
      <small>
        {lane.detail} · {observed}/{lane.nodeIds.length} nodes set
      </small>
    </div>
  );
}

function CptTerrainPanel({
  model,
  evidence,
  focusState
}: {
  model: BnModel;
  evidence: EvidenceSet;
  focusState: TargetState;
}) {
  const cells = cptTerrainPreview(model, evidence, focusState);

  return (
    <div className="cpt-terrain">
      {cells.map((cell) => (
        <div
          className={cell.matchesEvidence ? "cpt-cell match" : "cpt-cell"}
          key={cell.parentLabel}
          title={cell.parentLabel}
        >
          <span>{cell.dominantState}</span>
          <b>{formatPercent(cell.probability, 0)}</b>
        </div>
      ))}
    </div>
  );
}

function stateFill(state: TargetState): string {
  return STATE_COLORS[state] ?? "#64748b";
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatPercent(value, 1)}`;
}
