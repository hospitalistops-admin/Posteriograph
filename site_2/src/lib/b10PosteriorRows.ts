import { learnt } from "../data/models";
import type { EvidenceSet, PosteriorResult } from "../types";
import {
  TARGET_STATES,
  fragilityBand,
  fragilityVerdict,
  trajectoryFor,
  trajectoryStepsDetailed,
  type FragilityVerdict,
  type TargetState,
  type TrajectoryStep
} from "./b10Views";

export interface B10PosteriorRow {
  state: TargetState;
  probability: number;
  prior: number;
  delta: number;
  marginFromNext: number;
  band: { low: number; high: number };
  verdict: FragilityVerdict;
  trajectory: { label: string; value: number }[];
  steps: TrajectoryStep[];
}

export function buildB10PosteriorRows(
  result: PosteriorResult,
  priorProbabilities: Record<string, number>,
  evidence: EvidenceSet
): B10PosteriorRow[] {
  const sorted = [...TARGET_STATES]
    .map((state) => ({
      state,
      probability: result.probabilities[state] ?? 0,
      prior: priorProbabilities[state] ?? 0
    }))
    .sort((a, b) => b.probability - a.probability);

  return sorted.map((item, index) => {
    const next = sorted[index + 1];
    const marginFromNext = next ? item.probability - next.probability : item.probability;
    return {
      state: item.state,
      probability: item.probability,
      prior: item.prior,
      delta: item.probability - item.prior,
      marginFromNext,
      band: fragilityBand(item.probability, result.entropy, result.margin),
      verdict: fragilityVerdict(
        index,
        item.probability,
        marginFromNext,
        result.entropy,
        result.margin
      ),
      trajectory: trajectoryFor(learnt, evidence, item.state),
      steps: trajectoryStepsDetailed(learnt, evidence, item.state)
    };
  });
}
