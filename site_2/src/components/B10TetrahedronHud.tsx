import { useMemo, useRef } from "react";
import { formatPercent, STATE_COLORS, targetStateLabel } from "../lib/cases";
import { TARGET_STATES, type TargetState } from "../lib/b10Views";
import { B10_EXPLANATIONS, ModelBadge } from "./B10InfoTip";
import { B10Popover } from "./B10Popover";
import {
  B10TetrahedronScene,
  TETRA_PRESET_LABELS,
  type B10TetrahedronSceneHandle,
  type TetraPresetName
} from "./B10TetrahedronScene";

const PRESET_ORDER: TetraPresetName[] = ["Iso", "EColi", "OtherGramNeg", "GramPos", "None"];

export function B10TetrahedronHud({
  probabilities,
  priorProbabilities,
  highlightState
}: {
  probabilities: Record<string, number>;
  priorProbabilities: Record<string, number>;
  highlightState: TargetState;
}) {
  const sceneRef = useRef<B10TetrahedronSceneHandle>(null);

  const readout = useMemo(
    () =>
      [...TARGET_STATES]
        .map((state) => ({ state, prob: probabilities[state] ?? 0 }))
        .sort((a, b) => b.prob - a.prob),
    [probabilities]
  );

  return (
    <div className="tetra-hud">
      <div className="tetra-legend-row">
        <span className="tetra-title">3D compositional tetrahedron</span>
        <ModelBadge source="both" />
      </div>
      <B10Popover
        summary={B10_EXPLANATIONS.tetraPosterior.summary}
        detail={B10_EXPLANATIONS.tetraPosterior.detail}
        source="both"
        className="tetra-scene-wrap"
      >
        <B10TetrahedronScene
          ref={sceneRef}
          probabilities={probabilities}
          priorProbabilities={priorProbabilities}
          highlightState={highlightState}
        />
      </B10Popover>

      <div className="tetra-preset-row" role="toolbar" aria-label="Camera presets">
        {PRESET_ORDER.map((name) => (
          <button
            key={name}
            type="button"
            className="tetra-preset-chip"
            onClick={() => sceneRef.current?.setPreset(name)}
          >
            {TETRA_PRESET_LABELS[name]}
          </button>
        ))}
      </div>

      <div className="tetra-readout" aria-label="Four-state composition">
        {readout.map(({ state, prob }) => (
          <span
            key={state}
            className="tetra-readout-chip"
            style={{ borderColor: STATE_COLORS[state] ?? "#64748b" }}
          >
            <span className="tetra-readout-dot" style={{ background: STATE_COLORS[state] ?? "#64748b" }} />
            {targetStateLabel(state)} {formatPercent(prob, 0)}
          </span>
        ))}
      </div>

      <p className="simplex-caption">
        Each edge is colour-blended between its two pathogens. Thin spokes from the dot show how strongly each corner is
        pulling it. Drag to rotate · double-click to reset · use presets to snap to a corner view.
      </p>
    </div>
  );
}
