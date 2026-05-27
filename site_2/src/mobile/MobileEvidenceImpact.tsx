import { useEffect, useState } from "react";
import { learnt } from "../data/models";
import {
  TARGET_STATES,
  evidenceArrowsForState,
  trajectoryStepsDetailed,
  type TargetState
} from "../lib/b10Views";
import { formatPercent, stateLabel, targetStateLabel } from "../lib/cases";
import { formatDeltaPp } from "../lib/b10Views";
import type { EvidenceSet, PosteriorResult } from "../types";

interface Props {
  result: PosteriorResult;
  evidence: EvidenceSet;
  defaultFocus?: TargetState;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatPercent(value, 1)}`;
}

export function MobileEvidenceImpact({ result, evidence, defaultFocus }: Props) {
  const initial =
    defaultFocus ??
    (TARGET_STATES.includes(result.topState as TargetState) ? (result.topState as TargetState) : "EColi");
  const [focusState, setFocusState] = useState<TargetState>(initial);

  useEffect(() => {
    if (TARGET_STATES.includes(result.topState as TargetState)) {
      setFocusState(result.topState as TargetState);
    }
  }, [result.topState]);

  const arrows = evidenceArrowsForState(result.evidenceDeltas, focusState, 8);
  const steps = trajectoryStepsDetailed(learnt, evidence, focusState);

  return (
    <section className="m-result-section" id="m-section-evidence" aria-labelledby="m-evidence-heading">
      <h2 id="m-evidence-heading" className="m-section-title">
        Evidence impact
      </h2>
      <p className="m-section-lead">
        Which findings moved belief for the selected pathogen? This is the model&apos;s update path in clinical
        control order — explanatory, not a causal effect estimate.
      </p>

      <div className="m-focus-strip" role="tablist" aria-label="Focus pathogen state">
        {TARGET_STATES.map((state) => (
          <button
            key={state}
            type="button"
            role="tab"
            aria-selected={focusState === state}
            className={focusState === state ? "m-focus-chip active" : "m-focus-chip"}
            onClick={() => setFocusState(state)}
          >
            {targetStateLabel(state)}
          </button>
        ))}
      </div>

      <h3 className="m-subheading">Largest movers for {targetStateLabel(focusState)}</h3>
      {arrows.length === 0 ? (
        <p className="m-empty">No evidence set — add findings to see posterior shifts.</p>
      ) : (
        <ul className="m-impact-list">
          {arrows.map((arrow) => (
            <li key={`${arrow.title}-${arrow.selectedState}`} className="m-impact-row">
              <span className={arrow.delta >= 0 ? "m-impact-arrow up" : "m-impact-arrow down"}>
                {arrow.delta >= 0 ? "▲" : "▼"} {formatSigned(arrow.delta)}
              </span>
              <div>
                <strong>{arrow.title}</strong>
                <small>{arrow.selectedState}</small>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3 className="m-subheading">Trajectory timeline</h3>
      <ol className="m-trajectory-timeline m-trajectory-timeline-standalone">
        {steps.map((step, index) => (
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
    </section>
  );
}
