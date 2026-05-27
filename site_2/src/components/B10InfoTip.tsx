import type { ReactNode } from "react";

export type ModelSourceTag = "learnt" | "expert" | "heuristic" | "both";

const SOURCE_LABEL: Record<ModelSourceTag, string> = {
  learnt: "Learnt BN",
  expert: "Expert / pre-learning BN",
  heuristic: "UI heuristic",
  both: "Learnt + expert BN"
};

export function ModelBadge({ source }: { source: ModelSourceTag }) {
  return <span className={`b10-model-badge source-${source}`}>{SOURCE_LABEL[source]}</span>;
}

export function B10InfoTip({
  label,
  source,
  summary,
  children
}: {
  label: string;
  source: ModelSourceTag;
  summary: string;
  children?: ReactNode;
}) {
  return (
    <details className="b10-info-tip">
      <summary>
        <span className="b10-info-label">{label}</span>
        <ModelBadge source={source} />
      </summary>
      {children ? <div className="b10-info-body">{children}</div> : <p className="b10-info-body">{summary}</p>}
    </details>
  );
}

export interface B10Explanation {
  label: string;
  source: ModelSourceTag;
  summary: string;
  detail?: string;
}

export const B10_EXPLANATIONS: Record<string, B10Explanation> = {
  posteriorFill: {
    label: "Colored bar",
    source: "learnt",
    summary: "Model's probability for this pathogen, given the evidence so far.",
    detail:
      "Posterior P(state) from Applied_BN_v2.2_learnt.dne, given current evidence. Computed by variable elimination on the learnt BN."
  },
  priorTick: {
    label: "White tick",
    source: "expert",
    summary: "What the original expert model would say with the same evidence.",
    detail:
      "Same evidence, but posterior from Applied_BN_v2.2_priors.dne (expert-elicited CPTs before cohort learning). Compares expert vs learnt parameterization."
  },
  sparkline: {
    label: "Grey trajectory line",
    source: "learnt",
    summary: "How probability changed as each finding was added (clinical order). Hover for the step.",
    detail:
      "Posterior for this state after each evidence node is added, in clinical control order. Each step re-runs inference on the learnt BN."
  },
  fragilityBand: {
    label: "Pale band",
    source: "heuristic",
    summary: "Derived UI hint — computed from entropy and rank margin. Not a confidence interval.",
    detail:
      "Derived quantity (heuristic). It is not from either DNE file and not a validated confidence interval. Spread is computed from posterior entropy and the margin to the next-ranked state."
  },
  fragilityVerdict: {
    label: "Fragility verdict",
    source: "heuristic",
    summary: "Derived rank-stability label (stable / moderate / fragile).",
    detail:
      "Computed locally from entropy and the margin to the next-ranked state. Not in either DNE; not a clinical score."
  },
  deltaPrior: {
    label: "Δ vs expert model",
    source: "both",
    summary: "Difference vs. the pre-learning expert model (percentage points).",
    detail: "Learnt-BN posterior minus expert/pre-learning-BN posterior for this state (percentage points)."
  },
  simplexPosterior: {
    label: "Filled dot (2D map)",
    source: "learnt",
    summary: "Where this case sits in the 4-pathogen mix.",
    detail: "Barycentric projection of the learnt-BN four-state posterior inside the rhomboid frame."
  },
  simplexPrior: {
    label: "Open circle (2D map)",
    source: "expert",
    summary: "Same position for the pre-learning expert model.",
    detail: "Same projection for the expert/pre-learning BN posterior with the same evidence."
  },
  tetraPosterior: {
    label: "Filled dot (3D tetrahedron)",
    source: "learnt",
    summary: "Same as the 2D map but in 3D, so opposite pathogens don't overlap.",
    detail:
      "3D barycentric position on a regular tetrahedron (distinct vertices for all four states — no opposite-pair collapse). Drag to rotate."
  },
  tetraPrior: {
    label: "Open circle (3D tetrahedron)",
    source: "expert",
    summary: "Pre-learning expert position in the same 3D view.",
    detail: "Expert/pre-learning BN posterior in the same 3D simplex."
  },
  cptEffectiveCases: {
    label: "Effective cases",
    source: "learnt",
    summary: "How much learning data informed this CPT row.",
    detail:
      "numcases row weight from the learnt DNE for this parent assignment. Netica effective sample size (may be fractional after learning), not raw patient IDs."
  },
  macroEntropy: {
    label: "Entropy",
    source: "learnt",
    summary: "How spread out the four pathogen probabilities are (higher = more uncertain).",
    detail: "Shannon entropy of the learnt-BN posterior over CauseUTI states."
  }
};
