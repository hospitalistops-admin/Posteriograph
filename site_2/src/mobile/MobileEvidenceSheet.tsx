import { useEffect, useRef } from "react";
import { CONTROL_GROUPS } from "../lib/cases";
import { learnt } from "../data/models";
import { stateLabel } from "../lib/cases";
import type { BnModel, EvidenceSet } from "../types";

interface Props {
  open: boolean;
  activeGroupIndex: number;
  evidence: EvidenceSet;
  onClose: () => void;
  onGroupChange: (index: number) => void;
  onSet: (nodeId: string, state: string) => void;
  onClear: (nodeId: string) => void;
  onReveal?: () => void;
  showReveal: boolean;
}

export function MobileEvidenceSheet({
  open,
  activeGroupIndex,
  evidence,
  onClose,
  onGroupChange,
  onSet,
  onClear,
  onReveal,
  showReveal
}: Props) {
  const sheetRef = useRef<HTMLElement>(null);
  const group = CONTROL_GROUPS[activeGroupIndex] ?? CONTROL_GROUPS[0];

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div
        className={open ? "m-sheet-backdrop open" : "m-sheet-backdrop"}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        ref={sheetRef}
        className={open ? "m-sheet open" : "m-sheet"}
        role="dialog"
        aria-modal="true"
        aria-label="Evidence editor"
        aria-hidden={!open}
      >
        <div className="m-sheet-handle" aria-hidden="true" />
        <header className="m-sheet-head">
          <span>Evidence</span>
          <button type="button" className="m-btn m-btn-ghost m-btn-sm" onClick={onClose}>
            Close
          </button>
        </header>
        <nav className="m-sheet-tabs" aria-label="Evidence groups">
          {CONTROL_GROUPS.map((g, index) => (
            <button
              type="button"
              key={g.title}
              className={index === activeGroupIndex ? "m-tab active" : "m-tab"}
              onClick={() => onGroupChange(index)}
            >
              {g.title}
            </button>
          ))}
        </nav>
        <div className="m-sheet-list">
          <EvidenceRows model={learnt} nodeIds={group.ids} evidence={evidence} onSet={onSet} onClear={onClear} />
        </div>
        {showReveal && onReveal ? (
          <button type="button" className="m-btn m-btn-primary m-sheet-reveal" onClick={onReveal}>
            Reveal b10 output
          </button>
        ) : null}
      </aside>
    </>
  );
}

function EvidenceRows({
  model,
  nodeIds,
  evidence,
  onSet,
  onClear
}: {
  model: BnModel;
  nodeIds: string[];
  evidence: EvidenceSet;
  onSet: (nodeId: string, state: string) => void;
  onClear: (nodeId: string) => void;
}) {
  return (
    <>
      {nodeIds.map((nodeId) => {
        const node = model.nodes.find((n) => n.id === nodeId);
        if (!node) return null;
        return (
          <article key={nodeId} className={evidence[nodeId] ? "m-ev-row selected" : "m-ev-row"}>
            <div className="m-ev-head">
              <strong>{node.title}</strong>
              {evidence[nodeId] ? (
                <button type="button" className="m-ev-clear" onClick={() => onClear(nodeId)}>
                  clear
                </button>
              ) : null}
            </div>
            <div className="m-ev-chips">
              {node.states.map((state) => (
                <button
                  type="button"
                  key={state}
                  className={evidence[nodeId] === state ? "m-chip active" : "m-chip"}
                  onClick={() => onSet(nodeId, state)}
                >
                  {stateLabel(nodeId, state)}
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </>
  );
}
