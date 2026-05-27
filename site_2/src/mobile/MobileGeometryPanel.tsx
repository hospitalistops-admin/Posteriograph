import { useEffect, useState } from "react";
import { SimplexHud } from "../components/B10CardViews";
import { B10TetrahedronHud } from "../components/B10TetrahedronHud";
import { TARGET_STATES, type TargetState } from "../lib/b10Views";
import { targetStateLabel } from "../lib/cases";

interface Props {
  probabilities: Record<string, number>;
  priorProbabilities: Record<string, number>;
  topState: TargetState;
}

export function MobileGeometryPanel({ probabilities, priorProbabilities, topState }: Props) {
  const [focusState, setFocusState] = useState<TargetState>(topState);

  useEffect(() => {
    if (TARGET_STATES.includes(topState)) setFocusState(topState);
  }, [topState]);

  return (
    <section className="m-result-section" id="m-section-geometry" aria-labelledby="m-geometry-heading">
      <h2 id="m-geometry-heading" className="m-section-title">
        Probability geometry
      </h2>
      <p className="m-section-lead">
        Where does this case sit among the four pathogen states? Open circle = expert model; filled dot = learnt
        posterior. Drag the tetrahedron to rotate.
      </p>

      <div className="m-focus-strip">
        {TARGET_STATES.map((state) => (
          <button
            key={state}
            type="button"
            className={focusState === state ? "m-focus-chip active" : "m-focus-chip"}
            onClick={() => setFocusState(state)}
          >
            {targetStateLabel(state)}
          </button>
        ))}
      </div>

      <article className="m-geometry-card">
        <h3 className="m-subheading">2D compositional map</h3>
        <SimplexHud
          probabilities={probabilities}
          priorProbabilities={priorProbabilities}
          highlightState={focusState}
          compact
        />
      </article>

      <article className="m-geometry-card m-geometry-card-tetra">
        <h3 className="m-subheading">3D tetrahedron</h3>
        <B10TetrahedronHud
          probabilities={probabilities}
          priorProbabilities={priorProbabilities}
          highlightState={focusState}
        />
      </article>
    </section>
  );
}
