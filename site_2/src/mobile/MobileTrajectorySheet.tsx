import { useEffect, useId } from "react";
import { B10TrajectoryChart } from "../components/B10TrajectoryChart";
import type { B10PosteriorRow } from "../lib/b10PosteriorRows";
import { formatPercent, STATE_COLORS, targetStateLabel } from "../lib/cases";
import { formatDeltaPp } from "../lib/b10Views";
import type { EvidenceSet } from "../types";

interface Props {
  open: boolean;
  row: B10PosteriorRow | null;
  evidence: EvidenceSet;
  onClose: () => void;
}

export function MobileTrajectorySheet({ open, row, evidence, onClose }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!row) return null;

  const color = STATE_COLORS[row.state] ?? "#64748b";

  return (
    <>
      <div
        className={open ? "m-sheet-backdrop open" : "m-sheet-backdrop"}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        className={open ? "m-trajectory-sheet open" : "m-trajectory-sheet"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <div className="m-sheet-handle" aria-hidden="true" />
        <header className="m-trajectory-sheet-head">
          <div className="m-trajectory-sheet-title" id={titleId}>
            <span className="m-trajectory-swatch" style={{ background: color }} aria-hidden />
            <div>
              <strong>{targetStateLabel(row.state)}</strong>
              <span className="m-trajectory-sheet-pct">{formatPercent(row.probability, 1)}</span>
            </div>
          </div>
          <button type="button" className="m-btn m-btn-ghost m-btn-sm" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="m-trajectory-sheet-meta">
          <span className="m-chip-meta">Δ expert {formatDeltaPp(row.delta)}</span>
          <span className={`m-chip-verdict verdict-${row.verdict}`}>{row.verdict}</span>
        </div>
        <div className="m-trajectory-sheet-body">
          <B10TrajectoryChart row={row} evidence={evidence} dense showHeading={false} />
          <p className="m-trajectory-sheet-caption">Tap or drag along the chart to inspect a step.</p>
        </div>
      </aside>
    </>
  );
}
