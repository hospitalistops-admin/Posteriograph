import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { B10TetrahedronHud } from "../components/B10TetrahedronHud";
import { BnProbabilityScene, type CameraPreset } from "../components/BnProbabilityScene";
import type { TargetState } from "../lib/b10Views";
import { targetStateLabel } from "../lib/cases";
import type { StateEmbedding } from "../types";

type ExplorerTab = "tetrahedron" | "swarm";

interface Props {
  probabilities: Record<string, number>;
  priorProbabilities: Record<string, number>;
  highlightState: TargetState;
  embeddings: StateEmbedding[];
}

export function MobileThreeDExplorer({
  probabilities,
  priorProbabilities,
  highlightState,
  embeddings
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ExplorerTab>("tetrahedron");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("reset");

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <section className="m-result-section" id="m-section-3d" aria-labelledby="m-3d-heading">
      <h2 id="m-3d-heading" className="m-section-title">
        3D explorer
      </h2>
      <p className="m-section-lead">
        Full-screen views: compositional tetrahedron for the four pathogen states, and the guided swarm field showing
        how history, urine tests, and posterior probability relate in 3D.
      </p>
      <button type="button" className="m-btn m-btn-primary m-open-3d" onClick={() => setOpen(true)}>
        Open 3D explorer
      </button>

      {open ? (
        <div className="m-3d-modal" role="dialog" aria-modal="true" aria-label="3D explorer">
          <header className="m-3d-toolbar">
            <div className="m-3d-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "tetrahedron"}
                className={tab === "tetrahedron" ? "m-3d-tab active" : "m-3d-tab"}
                onClick={() => setTab("tetrahedron")}
              >
                Tetrahedron
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "swarm"}
                className={tab === "swarm" ? "m-3d-tab active" : "m-3d-tab"}
                onClick={() => setTab("swarm")}
              >
                Swarm field
              </button>
            </div>
            <button type="button" className="m-btn m-btn-ghost m-btn-sm" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
              Close
            </button>
          </header>

          <div className="m-3d-body">
            {tab === "tetrahedron" ? (
              <div className="m-3d-tetra-wrap">
                <B10TetrahedronHud
                  probabilities={probabilities}
                  priorProbabilities={priorProbabilities}
                  highlightState={highlightState}
                />
              </div>
            ) : (
              <>
                <div className="m-swarm-legend">
                  <span className="axis-tag magenta">X · history</span>
                  <span className="axis-tag cyan">Z · urine</span>
                  <span className="axis-tag green">Y · posterior</span>
                </div>
                <div className="m-3d-presets">
                  {(["front", "top", "side", "reset"] as CameraPreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className="m-focus-chip"
                      onClick={() => setCameraPreset(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="m-swarm-wrap">
                  <BnProbabilityScene
                    embeddings={embeddings}
                    fullscreen
                    cameraPreset={cameraPreset}
                    quality="mobile"
                  />
                </div>
                <p className="m-swarm-hint">
                  Drag horizontally to rotate. Tap a swarm to inspect {targetStateLabel(highlightState)} and related
                  metrics.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
