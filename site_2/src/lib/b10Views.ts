import type { BnModel, EvidenceDelta, EvidenceSet } from "../types";
import { CONTROL_GROUPS } from "./cases";
import { getNode, inferPosterior } from "./inference";

export const TARGET_STATES = ["EColi", "OtherGramNeg", "GramPos", "None"] as const;
export type TargetState = (typeof TARGET_STATES)[number];

const TARGET_ID = "CauseUTI";

/** Four equiradial axes at 90° (top, right, bottom, left) in SVG coordinates (y down). */
export const CORNER_ANGLES: Record<TargetState, number> = {
  EColi: Math.PI / 2,
  OtherGramNeg: 0,
  GramPos: -Math.PI / 2,
  None: Math.PI
};

export const SIMPLEX_CENTER = { cx: 50, cy: 50, radius: 38 } as const;

export interface SimplexPoint {
  x: number;
  y: number;
}

export function cornerPosition(
  state: TargetState,
  cx = SIMPLEX_CENTER.cx,
  cy = SIMPLEX_CENTER.cy,
  radius = SIMPLEX_CENTER.radius
): SimplexPoint {
  const angle = CORNER_ANGLES[state];
  return { x: cx + Math.cos(angle) * radius, y: cy - Math.sin(angle) * radius };
}

export function simplexFramePolygon(
  cx = SIMPLEX_CENTER.cx,
  cy = SIMPLEX_CENTER.cy,
  radius = SIMPLEX_CENTER.radius
): string {
  return TARGET_STATES.map((state) => {
    const { x, y } = cornerPosition(state, cx, cy, radius);
    return `${x},${y}`;
  }).join(" ");
}

export function equiradialProjection(probabilities: Record<string, number>): SimplexPoint {
  let x = 0;
  let y = 0;
  TARGET_STATES.forEach((state) => {
    const weight = probabilities[state] ?? 0;
    const angle = CORNER_ANGLES[state];
    x += weight * Math.cos(angle);
    y += weight * Math.sin(angle);
  });
  return {
    x: SIMPLEX_CENTER.cx + x * SIMPLEX_CENTER.radius,
    y: SIMPLEX_CENTER.cy - y * SIMPLEX_CENTER.radius
  };
}

/** Manhattan distance from center; <= radius means inside the rhomboid frame. */
export function isInsideRhomboid(point: SimplexPoint, cx = SIMPLEX_CENTER.cx, cy = SIMPLEX_CENTER.cy, radius = SIMPLEX_CENTER.radius): boolean {
  return Math.abs(point.x - cx) + Math.abs(point.y - cy) <= radius + 0.01;
}

/** Unit tetrahedron vertices (regular tetrahedron in 3D). */
const TETRA_VERTICES: Record<TargetState, [number, number, number]> = {
  EColi: [1, 1, 1],
  OtherGramNeg: [1, -1, -1],
  GramPos: [-1, 1, -1],
  None: [-1, -1, 1]
};

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

const TETRA_UNIT = Object.fromEntries(
  TARGET_STATES.map((state) => [state, normalize3(TETRA_VERTICES[state])])
) as Record<TargetState, [number, number, number]>;

export interface TetraPoint3 {
  x: number;
  y: number;
  z: number;
}

export function tetrahedronBarycentric(probabilities: Record<string, number>): TetraPoint3 {
  let x = 0;
  let y = 0;
  let z = 0;
  TARGET_STATES.forEach((state) => {
    const w = probabilities[state] ?? 0;
    const [vx, vy, vz] = TETRA_UNIT[state];
    x += w * vx;
    y += w * vy;
    z += w * vz;
  });
  return { x, y, z };
}

/** Isometric-ish projection to 2D SVG coords (viewBox ~100). */
export function projectTetraToSvg(point: TetraPoint3, cx = 50, cy = 52, scale = 22): SimplexPoint {
  const isoX = (point.x - point.z) * scale;
  const isoY = (-point.y + (point.x + point.z) * 0.5) * scale;
  return { x: cx + isoX, y: cy + isoY };
}

function tetraVertexPoint(state: TargetState): TetraPoint3 {
  const [x, y, z] = TETRA_UNIT[state];
  return { x, y, z };
}

/** Unit-length 3D corner of the compositional tetrahedron (for WebGL scenes). */
export function tetraUnitVertex(state: TargetState): TetraPoint3 {
  return tetraVertexPoint(state);
}

export function tetrahedronWireframeEdges(): { from: SimplexPoint; to: SimplexPoint }[] {
  const corners = TARGET_STATES.map((state) => projectTetraToSvg(tetraVertexPoint(state)));
  const edges: { from: SimplexPoint; to: SimplexPoint }[] = [];
  for (let i = 0; i < corners.length; i += 1) {
    for (let j = i + 1; j < corners.length; j += 1) {
      edges.push({ from: corners[i], to: corners[j] });
    }
  }
  return edges;
}

export function tetraCornerSvg(state: TargetState): SimplexPoint {
  return projectTetraToSvg(tetraVertexPoint(state));
}

export interface TrajectoryPoint {
  label: string;
  value: number;
}

/** Clinical control-group order for sequential evidence sparklines. */
export function canonicalEvidenceOrder(evidence: EvidenceSet): string[] {
  const present = Object.keys(evidence).filter((id) => id !== TARGET_ID);
  const ordered = CONTROL_GROUPS.flatMap((group) => group.ids).filter((id) => present.includes(id));
  const extra = present.filter((id) => !ordered.includes(id));
  return [...ordered, ...extra];
}

/** Posterior for one state after each cumulative evidence step (plus empty prior). */
export function trajectoryFor(
  model: BnModel,
  evidence: EvidenceSet,
  state: TargetState
): TrajectoryPoint[] {
  const order = canonicalEvidenceOrder(evidence);
  const points: TrajectoryPoint[] = [
    {
      label: "empty",
      value: inferPosterior(model, TARGET_ID, {})[state] ?? 0
    }
  ];

  let cumulative: EvidenceSet = {};
  order.forEach((nodeId) => {
    cumulative = { ...cumulative, [nodeId]: evidence[nodeId] };
    points.push({
      label: nodeId,
      value: inferPosterior(model, TARGET_ID, cumulative)[state] ?? 0
    });
  });

  return points;
}

export interface TrajectoryStep extends TrajectoryPoint {
  deltaFromPrev: number;
  displayLabel: string;
}

export function trajectoryStepsDetailed(
  model: BnModel,
  evidence: EvidenceSet,
  state: TargetState
): TrajectoryStep[] {
  const points = trajectoryFor(model, evidence, state);
  return points.map((point, index) => {
    const prev = index > 0 ? points[index - 1].value : point.value;
    const displayLabel =
      point.label === "empty"
        ? "Cohort marginal (learnt BN, no evidence)"
        : getNode(model, point.label).title;
    return {
      ...point,
      deltaFromPrev: point.value - prev,
      displayLabel
    };
  });
}

export type FragilityVerdict = "stable" | "moderate" | "fragile";

export function fragilityVerdict(
  rank: number,
  probability: number,
  marginFromNext: number,
  globalEntropy: number,
  globalMargin: number
): FragilityVerdict {
  if (rank === 0) {
    if (globalEntropy > 1.6 || globalMargin < 0.1) return "fragile";
    if (globalEntropy > 1.2 || globalMargin < 0.18) return "moderate";
    return "stable";
  }
  if (probability >= globalMargin * 0.5 && marginFromNext < 0.12) return "fragile";
  if (probability >= 0.12) return "moderate";
  return "stable";
}

export function formatDeltaPp(delta: number, digits = 1): string {
  const pp = delta * 100;
  const sign = pp >= 0 ? "+" : "";
  return `${sign}${pp.toFixed(digits)}pp`;
}

export function fragilityBand(
  probability: number,
  entropy: number,
  margin: number
): { low: number; high: number } {
  const spread = 0.06 + (entropy / 2) * 0.14 + (margin < 0.12 ? 0.09 : margin < 0.2 ? 0.05 : 0.02);
  return {
    low: clamp(probability - spread, 0, 1),
    high: clamp(probability + spread, 0, 1)
  };
}

export function uncertaintyBadge(entropy: number, margin: number): string {
  if (entropy > 1.6 || margin < 0.1) return "rank fragile";
  if (entropy > 1.2 || margin < 0.18) return "watch closely";
  return "stable rank";
}

export interface PathwayLane {
  id: string;
  label: string;
  nodeIds: string[];
  signal: number;
  detail: string;
}

export function pathwayLanes(model: BnModel, evidence: EvidenceSet): PathwayLane[] {
  const contam = inferPosterior(model, "ContaminationRisk", evidence).High ?? 0;
  const onAbx = evidence.OnAbxEDGroup3;
  const abxSignal =
    onAbx === "Broader" ? 0.85 : onAbx === "Narrow" ? 0.55 : onAbx === "No" ? 0.15 : 0.35;

  const urineNodes = ["Urin_Nitrite", "Urin_LeucEst", "Urin_Leuc", "Microscopy_bacts"];
  const urineHits = urineNodes.filter((id) => id in evidence).length / urineNodes.length;
  const inflamNodes = ["CRPLevel", "WCCLevel", "NeutLevel", "TemperatureLvl2", "FeverPR"];

  let inflamHigh = 0;
  if (evidence.CRPLevel === "Above70") inflamHigh += 0.36;
  else if (evidence.CRPLevel === "Btw15And70") inflamHigh += 0.18;
  if (evidence.WCCLevel === "Above18") inflamHigh += 0.24;
  else if (evidence.WCCLevel === "Btw10And18") inflamHigh += 0.12;
  if (evidence.NeutLevel === "Above15") inflamHigh += 0.24;
  else if (evidence.NeutLevel === "Btw8And15") inflamHigh += 0.12;
  if (evidence.TemperatureLvl2 === "Abv385") inflamHigh += 0.14;
  if (evidence.FeverPR === "Yes") inflamHigh += 0.1;
  inflamHigh = clamp(inflamHigh, 0, 1);

  const colonNodes = ["EcoliPresence", "OtherGramNegPresence", "GramPosPresence"];
  const colonHigh = colonNodes.reduce((sum, id) => {
    const p = inferPosterior(model, id, evidence).High ?? 0;
    return sum + p;
  }, 0) / colonNodes.length;

  return [
    {
      id: "infection",
      label: "Infection pathway",
      nodeIds: ["EcoliPresence", "OtherGramNegPresence", "GramPosPresence", "CurrPhenotype"],
      signal: colonHigh,
      detail: `Colonisation / phenotype pressure ${formatPct(colonHigh)}`
    },
    {
      id: "contamination",
      label: "Contamination pathway",
      nodeIds: ["ContaminationRisk", "CollMethod", "Epithelials"],
      signal: contam,
      detail: `Contamination risk ${formatPct(contam)}`
    },
    {
      id: "antibiotics",
      label: "Antibiotic suppression",
      nodeIds: ["OnAbxEDGroup3"],
      signal: abxSignal,
      detail: onAbx ? `On antibiotics: ${onAbx}` : "Antibiotic exposure not set"
    },
    {
      id: "urine",
      label: "Urine testing",
      nodeIds: urineNodes,
      signal: urineHits,
      detail: `${Math.round(urineHits * 100)}% urine nodes observed`
    },
    {
      id: "inflammation",
      label: "Inflammation / blood",
      nodeIds: inflamNodes,
      signal: inflamHigh,
      detail: `Inflammatory burden ${formatPct(inflamHigh)}`
    }
  ];
}

export interface CauseUtiCptRow {
  parentLabel: string;
  probabilities: Record<TargetState, number>;
  effectiveCases: number | null;
  dominantState: TargetState;
  matchesEvidence: boolean;
  exactParentMatch: boolean;
}

export function causeUtiCptTable(model: BnModel, evidence: EvidenceSet): CauseUtiCptRow[] {
  const target = getNode(model, TARGET_ID);
  const parentIds = target.parents;
  const parentStates = parentIds.map((id) => {
    const node = getNode(model, id);
    const observed = evidence[id];
    return { id, states: node.states, observed };
  });

  const combinations = enumerateCombinations(parentStates.map((p) => p.states));
  const rows: CauseUtiCptRow[] = [];

  combinations.forEach((combo) => {
    const lengths = parentStates.map((parent) => parent.states.length);
    const parentIndex = parentCombinationIndex(combo, lengths);
    const blockStart = parentIndex * target.states.length;
    const probs = target.states.map((_, i) => target.cpt[blockStart + i] ?? 0);
    const probRecord = Object.fromEntries(
      target.states.map((s, i) => [s, probs[i]])
    ) as Record<TargetState, number>;
    const dominantIndex = probs.indexOf(Math.max(...probs));

    const allParentsObserved = parentStates.every((p) => p.observed !== undefined);
    const exactParentMatch =
      allParentsObserved &&
      parentStates.every((parent, index) => parent.observed === parent.states[combo[index]]);
    const matchesEvidence = parentStates.every((parent, index) => {
      if (!parent.observed) return true;
      return parent.observed === parent.states[combo[index]];
    });

    const parentLabel = combo
      .map((stateIndex, i) => `${parentIds[i]}=${parentStates[i].states[stateIndex]}`)
      .join(" · ");

    const effectiveCases =
      target.numCases && target.numCases.length > parentIndex
        ? target.numCases[parentIndex]
        : null;

    rows.push({
      parentLabel,
      probabilities: probRecord,
      effectiveCases,
      dominantState: target.states[dominantIndex] as TargetState,
      matchesEvidence,
      exactParentMatch
    });
  });

  return rows.sort((a, b) => {
    if (a.exactParentMatch !== b.exactParentMatch) return a.exactParentMatch ? -1 : 1;
    if (a.matchesEvidence !== b.matchesEvidence) return a.matchesEvidence ? -1 : 1;
    return (b.effectiveCases ?? 0) - (a.effectiveCases ?? 0);
  });
}

export interface CptTerrainCell {
  parentLabel: string;
  dominantState: TargetState;
  probability: number;
  matchesEvidence: boolean;
}

export function cptTerrainPreview(
  model: BnModel,
  evidence: EvidenceSet,
  focusState: TargetState,
  limit = 8
): CptTerrainCell[] {
  const target = getNode(model, TARGET_ID);
  const parentIds = target.parents;
  const cells: CptTerrainCell[] = [];

  const parentStates = parentIds.map((id) => {
    const node = getNode(model, id);
    const observed = evidence[id];
    return { id, states: node.states, observed };
  });

  const combinations = enumerateCombinations(parentStates.map((p) => p.states));
  combinations.slice(0, 64).forEach((combo) => {
    const matchesEvidence = parentStates.every((parent, index) => {
      if (!parent.observed) return true;
      return parent.observed === parent.states[combo[index]];
    });

    const lengths = parentStates.map((parent) => parent.states.length);
    const parentIndex = parentCombinationIndex(combo, lengths);
    const blockStart = parentIndex * target.states.length;
    const probs = target.states.map((_, i) => target.cpt[blockStart + i] ?? 0);
    const dominantIndex = probs.indexOf(Math.max(...probs));
    const dominantState = target.states[dominantIndex] as TargetState;

    const parentLabel = combo
      .map((stateIndex, i) => `${parentIds[i]}=${parentStates[i].states[stateIndex]}`)
      .join(" · ");

    cells.push({
      parentLabel,
      dominantState,
      probability: probs[target.states.indexOf(focusState)] ?? 0,
      matchesEvidence
    });
  });

  return cells
    .sort((a, b) => {
      if (a.matchesEvidence !== b.matchesEvidence) return a.matchesEvidence ? -1 : 1;
      return b.probability - a.probability;
    })
    .slice(0, limit);
}

export function evidenceArrowsForState(
  deltas: EvidenceDelta[],
  focusState: TargetState,
  limit = 6
): { title: string; delta: number; selectedState: string }[] {
  return deltas
    .map((delta) => ({
      title: delta.title,
      delta: delta.deltas[focusState] ?? 0,
      selectedState: delta.selectedState
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

function parentCombinationIndex(combo: number[], lengths: number[]): number {
  let index = 0;
  let stride = 1;
  for (let i = combo.length - 1; i >= 0; i--) {
    index += combo[i] * stride;
    stride *= lengths[i];
  }
  return index;
}

function enumerateCombinations(stateLists: string[][]): number[][] {
  if (stateLists.length === 0) return [[]];
  const [first, ...rest] = stateLists;
  const restCombos = enumerateCombinations(rest);
  const combos: number[][] = [];
  first.forEach((_, stateIndex) => {
    restCombos.forEach((tail) => combos.push([stateIndex, ...tail]));
  });
  return combos;
}

function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
