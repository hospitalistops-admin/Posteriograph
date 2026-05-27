import { useEffect, useState } from "react";
import { targetStateLabel } from "../lib/cases";
import { TARGET_STATES, type TargetState } from "../lib/b10Views";
import type { EvidenceSet, PosteriorResult } from "../types";
import { CardViewPanel, SimplexHud } from "./B10CardViews";
import { B10CauseUtiCptTable } from "./B10CauseUtiCptTable";
import { B10TetrahedronHud } from "./B10TetrahedronHud";
import { B10_EXPLANATIONS } from "./B10InfoTip";
import { B10Popover } from "./B10Popover";

interface Props {
  result: PosteriorResult;
  priorProbabilities: Record<string, number>;
  evidence: EvidenceSet;
}

export function B10SmallMultiples({ result, priorProbabilities, evidence }: Props) {
  const defaultFocus =
    (TARGET_STATES.find((state) => state === result.topState) as TargetState | undefined) ?? "EColi";
  const [focusState, setFocusState] = useState<TargetState>(defaultFocus);
  const [showCpt, setShowCpt] = useState(false);

  useEffect(() => {
    if (TARGET_STATES.includes(result.topState as TargetState)) {
      setFocusState(result.topState as TargetState);
    }
  }, [result.topState]);

  return (
    <section className="b10-tufte b10-small-multiples" aria-label="Posterior detail panels">
      <div className="b10-focus-strip">
        <span className="b10-focus-label">Focus state</span>
        {TARGET_STATES.map((state) => (
          <button
            key={state}
            type="button"
            className={focusState === state ? "b10-focus-chip active" : "b10-focus-chip"}
            onClick={() => setFocusState(state)}
          >
            {targetStateLabel(state)}
          </button>
        ))}
      </div>

      <div className="b10-multiples-grid b10-multiples-grid-4">
        <article className="b10-multiple-panel">
          <h3>
            <B10Popover
              summary={B10_EXPLANATIONS.simplexPosterior.summary}
              detail={B10_EXPLANATIONS.simplexPosterior.detail}
              source="learnt"
            >
              <span className="b10-panel-title">2D compositional map</span>
            </B10Popover>
          </h3>
          <SimplexHud
            probabilities={result.probabilities}
            priorProbabilities={priorProbabilities}
            highlightState={focusState}
            compact
          />
        </article>

        <article className="b10-multiple-panel">
          <h3>3D tetrahedron</h3>
          <B10TetrahedronHud
            probabilities={result.probabilities}
            priorProbabilities={priorProbabilities}
            highlightState={focusState}
          />
        </article>

        <article className="b10-multiple-panel">
          <h3>Evidence ledger</h3>
          <p className="panel-subtitle">
            Δ posterior for {targetStateLabel(focusState)} <span className="source-tag learnt">learnt BN</span>
          </p>
          <CardViewPanel
            mode="evidence"
            probabilities={result.probabilities}
            priorProbabilities={priorProbabilities}
            focusState={focusState}
            evidence={evidence}
            deltas={result.evidenceDeltas}
          />
        </article>

        <article className="b10-multiple-panel">
          <h3>Clinical pathways</h3>
          <p className="panel-subtitle">
            Mixed: BN inference + heuristics <span className="source-tag learnt">mostly learnt</span>
          </p>
          <CardViewPanel
            mode="pathways"
            probabilities={result.probabilities}
            priorProbabilities={priorProbabilities}
            focusState={focusState}
            evidence={evidence}
            deltas={result.evidenceDeltas}
          />
        </article>
      </div>

      <div className="b10-cpt-audit b10-cpt-audit-bottom">
        <button type="button" className="b10-cpt-toggle" onClick={() => setShowCpt((v) => !v)}>
          {showCpt ? "Hide" : "Reveal"} model internals (CauseUTI CPT)
        </button>
        {showCpt ? (
          <div className="b10-cpt-panel">
            <B10CauseUtiCptTable evidence={evidence} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
