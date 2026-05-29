import { learnt, priors } from "../data/models";
import { targetStateLabel } from "./cases";
import { causeUtiCptTable } from "./b10Views";
import { getNode, inferPosterior, posteriorResult } from "./inference";
import type { BnModel, EvidenceSet } from "../types";

const TARGET_ID = "CauseUTI";
const TARGET_STATES = ["EColi", "OtherGramNeg", "GramPos", "None"] as const;

export type ModelSource = "learnt" | "priors";

export type BnQueryOperation =
  | "target_marginal"
  | "posterior"
  | "evidence_deltas"
  | "list_nodes"
  | "node_marginal"
  | "causeuti_cpt_rows"
  | "effective_case_weights"
  | "category_summary";

export interface BnQueryRequest {
  operation: BnQueryOperation;
  model?: ModelSource;
  evidence?: EvidenceSet;
  nodeId?: string;
  limit?: number;
}

export interface BnQueryError {
  ok: false;
  error: string;
}

export interface TargetMarginalResult {
  ok: true;
  operation: "target_marginal";
  model: ModelSource;
  label: string;
  probabilities: Record<string, number>;
  labeled: { state: string; label: string; probability: number }[];
  note: string;
}

export interface PosteriorResultPayload {
  ok: true;
  operation: "posterior";
  model: ModelSource;
  queryNodeId: string;
  queryTitle: string;
  evidence: EvidenceSet;
  probabilities: Record<string, number>;
  entropy?: number;
  topState?: string;
  margin?: number;
}

export interface EvidenceDeltasPayload {
  ok: true;
  operation: "evidence_deltas";
  model: ModelSource;
  deltas: {
    nodeId: string;
    title: string;
    selectedState: string;
    targetDeltas: Record<string, number>;
    maxAbsDelta: number;
  }[];
}

export interface ListNodesPayload {
  ok: true;
  operation: "list_nodes";
  model: ModelSource;
  nodes: { id: string; title: string; states: string[]; status: string; group: string }[];
}

export interface NodeMarginalPayload {
  ok: true;
  operation: "node_marginal";
  model: ModelSource;
  nodeId: string;
  title: string;
  evidence: EvidenceSet;
  probabilities: Record<string, number>;
}

export interface CptRowsPayload {
  ok: true;
  operation: "causeuti_cpt_rows";
  model: ModelSource;
  evidence: EvidenceSet;
  rows: {
    parentLabel: string;
    probabilities: Record<string, number>;
    effectiveCases: number | null;
    dominantState: string;
    matchesEvidence: boolean;
    exactParentMatch: boolean;
  }[];
  limit: number;
}

export interface EffectiveCaseWeightsPayload {
  ok: true;
  operation: "effective_case_weights";
  model: ModelSource;
  nodeId: string;
  title: string;
  weights: { index: number; effectiveCases: number | null; description: string }[];
  totalEffectiveCases: number | null;
  note: string;
}

export interface CategorySummaryPayload {
  ok: true;
  operation: "category_summary";
  model: ModelSource;
  evidence: EvidenceSet;
  causeUtiPosterior: Record<string, number>;
  causeUtiLabeled: { state: string; label: string; probability: number }[];
  cohortMarginalNoEvidence: Record<string, number>;
  disclaimer: string;
}

export type BnQuerySuccess =
  | TargetMarginalResult
  | PosteriorResultPayload
  | EvidenceDeltasPayload
  | ListNodesPayload
  | NodeMarginalPayload
  | CptRowsPayload
  | EffectiveCaseWeightsPayload
  | CategorySummaryPayload;

export type BnQueryResponse = BnQuerySuccess | BnQueryError;

export function getModel(source: ModelSource = "learnt"): BnModel {
  return source === "priors" ? priors : learnt;
}

export function validateEvidence(model: BnModel, evidence: EvidenceSet): string | null {
  for (const [nodeId, state] of Object.entries(evidence)) {
    const node = model.nodes.find((n) => n.id === nodeId);
    if (!node) return `Unknown node: ${nodeId}`;
    if (!node.states.includes(state)) return `Unknown state ${state} for node ${nodeId}`;
  }
  if (Object.keys(evidence).length > 24) return "Too many evidence nodes (max 24)";
  return null;
}

export function executeBnQuery(request: BnQueryRequest): BnQueryResponse {
  const model = getModel(request.model ?? "learnt");
  const evidence = request.evidence ?? {};
  const validationError = validateEvidence(model, evidence);
  if (validationError) return { ok: false, error: validationError };

  const limit = Math.min(Math.max(request.limit ?? 12, 1), 64);

  switch (request.operation) {
    case "target_marginal": {
      const probabilities = inferPosterior(model, TARGET_ID, {});
      return {
        ok: true,
        operation: "target_marginal",
        model: request.model ?? "learnt",
        label: "CauseUTI cohort marginal (no evidence)",
        probabilities,
        labeled: TARGET_STATES.map((state) => ({
          state,
          label: targetStateLabel(state),
          probability: probabilities[state] ?? 0
        })),
        note: "Exact inference on the exported learnt/prior BN — not raw patient row counts."
      };
    }
    case "posterior": {
      const queryId = request.nodeId ?? TARGET_ID;
      const node = model.nodes.find((n) => n.id === queryId);
      if (!node) return { ok: false, error: `Unknown node: ${queryId}` };
      const result =
        queryId === TARGET_ID ? posteriorResult(model, evidence) : null;
      const probabilities = inferPosterior(model, queryId, evidence);
      return {
        ok: true,
        operation: "posterior",
        model: request.model ?? "learnt",
        queryNodeId: queryId,
        queryTitle: node.title,
        evidence,
        probabilities,
        ...(result
          ? { entropy: result.entropy, topState: result.topState, margin: result.margin }
          : {})
      };
    }
    case "evidence_deltas": {
      const result = posteriorResult(model, evidence);
      return {
        ok: true,
        operation: "evidence_deltas",
        model: request.model ?? "learnt",
        deltas: result.evidenceDeltas.map((d) => ({
          nodeId: d.nodeId,
          title: d.title,
          selectedState: d.selectedState,
          targetDeltas: d.deltas,
          maxAbsDelta: d.maxAbsDelta
        }))
      };
    }
    case "list_nodes":
      return {
        ok: true,
        operation: "list_nodes",
        model: request.model ?? "learnt",
        nodes: model.nodes.map((n) => ({
          id: n.id,
          title: n.title,
          states: n.states,
          status: n.status,
          group: n.group
        }))
      };
    case "node_marginal": {
      if (!request.nodeId) return { ok: false, error: "nodeId required" };
      const node = getNode(model, request.nodeId);
      const probabilities = inferPosterior(model, request.nodeId, evidence);
      return {
        ok: true,
        operation: "node_marginal",
        model: request.model ?? "learnt",
        nodeId: request.nodeId,
        title: node.title,
        evidence,
        probabilities
      };
    }
    case "causeuti_cpt_rows": {
      const rows = causeUtiCptTable(model, evidence).slice(0, limit);
      return {
        ok: true,
        operation: "causeuti_cpt_rows",
        model: request.model ?? "learnt",
        evidence,
        rows: rows.map((r) => ({
          parentLabel: r.parentLabel,
          probabilities: r.probabilities,
          effectiveCases: r.effectiveCases,
          dominantState: r.dominantState,
          matchesEvidence: r.matchesEvidence,
          exactParentMatch: r.exactParentMatch
        })),
        limit
      };
    }
    case "effective_case_weights": {
      const nodeId = request.nodeId ?? TARGET_ID;
      const node = model.nodes.find((n) => n.id === nodeId);
      if (!node) return { ok: false, error: `Unknown node: ${nodeId}` };
      const numCases = node.numCases ?? [];
      const weights = numCases.map((effectiveCases, index) => ({
        index,
        effectiveCases: effectiveCases ?? null,
        description: `CPT row index ${index}`
      }));
      const total =
        numCases.length > 0 ? numCases.reduce((sum, value) => sum + value, 0) : null;
      return {
        ok: true,
        operation: "effective_case_weights",
        model: request.model ?? "learnt",
        nodeId,
        title: node.title,
        weights: weights.slice(0, limit),
        totalEffectiveCases: total,
        note: "Netica numcases are effective case weights for CPT learning — not public patient-level cross-tabs."
      };
    }
    case "category_summary": {
      const cohortMarginal = inferPosterior(model, TARGET_ID, {});
      const current = inferPosterior(model, TARGET_ID, evidence);
      return {
        ok: true,
        operation: "category_summary",
        model: request.model ?? "learnt",
        evidence,
        causeUtiPosterior: current,
        causeUtiLabeled: TARGET_STATES.map((state) => ({
          state,
          label: targetStateLabel(state),
          probability: current[state] ?? 0
        })),
        cohortMarginalNoEvidence: cohortMarginal,
        disclaimer:
          "Categories are the four CauseUTI states. Probabilities are model posteriors; raw cohort row counts are not in the public release."
      };
    }
    default:
      return { ok: false, error: "Unknown operation" };
  }
}
