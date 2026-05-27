export type ModelSource = "learnt" | "priors";

export type NodeStatus = "Observable" | "Latent" | "LatentSummary" | "Decision";

export type NodeGroup =
  | "background"
  | "infection"
  | "contamination"
  | "management"
  | "labs"
  | "overlap"
  | "other";

export interface BnNode {
  id: string;
  title: string;
  states: string[];
  parents: string[];
  cpt: number[];
  /** Effective case weights from Netica `numcases` in the DNE (may be fractional). */
  numCases?: number[];
  belief: number[];
  kind: string;
  status: NodeStatus;
  group: NodeGroup;
  position?: {
    x: number;
    y: number;
  };
  comment?: string;
}

export interface BnEdge {
  from: string;
  to: string;
}

export interface BnModel {
  nodes: BnNode[];
  edges: BnEdge[];
  targetId: "CauseUTI";
  source: ModelSource;
  eliminationOrder: string[];
}

export type EvidenceSet = Record<string, string>;

export interface EvidenceDelta {
  nodeId: string;
  title: string;
  selectedState: string;
  group: NodeGroup;
  deltas: Record<string, number>;
  maxAbsDelta: number;
}

export interface PosteriorResult {
  probabilities: Record<string, number>;
  entropy: number;
  topState: string;
  margin: number;
  evidenceDeltas: EvidenceDelta[];
}

export interface RandomCase {
  id: string;
  title: string;
  intent: string;
  evidence: EvidenceSet;
  pending: string[];
  hiddenEvidence?: string[];
}

export interface ScenarioBranch {
  nodeId: string;
  title: string;
  state: string;
  probabilities: Record<string, number>;
  entropy: number;
}

export interface LatentVisualChannels {
  colonizationPosteriors: {
    EColi: number;
    OtherGramNeg: number;
    GramPos: number;
  };
  contaminationHigh: number;
  dominantColonization: "EColi" | "OtherGramNeg" | "GramPos";
  syntheticDecompensationRisk: number;
  flashHz: number;
}

export interface StateEmbedding {
  state: string;
  label: string;
  posterior: number;
  historyDelta: number;
  urineDelta: number;
  bloodImagingDelta: number;
  color: string;
  flashHz: number;
  decompensationRisk: number;
  audioFrequency: number;
  contaminationHigh: number;
  dominantColonization: "EColi" | "OtherGramNeg" | "GramPos";
}
