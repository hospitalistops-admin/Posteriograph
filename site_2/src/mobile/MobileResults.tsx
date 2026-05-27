import { useMemo, useRef, useState } from "react";
import { MobileSiteFooter } from "../components/SiteFooter";
import { buildB10PosteriorRows } from "../lib/b10PosteriorRows";
import { uncertaintyBadge, type TargetState } from "../lib/b10Views";
import { formatPercent, STATE_COLORS, targetStateLabel } from "../lib/cases";
import type { EvidenceSet, PosteriorResult, RandomCase, StateEmbedding } from "../types";
import { MobileEvidenceImpact } from "./MobileEvidenceImpact";
import { MobileGeometryPanel } from "./MobileGeometryPanel";
import { MobilePosteriorDistribution } from "./MobilePosteriorDistribution";
import { MobileThreeDExplorer } from "./MobileThreeDExplorer";

type SectionId = "posterior" | "evidence" | "geometry" | "3d";

interface Props {
  result: PosteriorResult;
  priorProbabilities: Record<string, number>;
  evidence: EvidenceSet;
  embeddings: StateEmbedding[];
  activeCase: RandomCase | null;
  onEdit: () => void;
  onRandom: () => void;
  onReset: () => void;
}

const SECTIONS: { id: SectionId; label: string; target: string }[] = [
  { id: "posterior", label: "Posterior", target: "m-section-posterior" },
  { id: "evidence", label: "Evidence", target: "m-section-evidence" },
  { id: "geometry", label: "Geometry", target: "m-section-geometry" },
  { id: "3d", label: "3D", target: "m-section-3d" }
];

export function MobileResults({
  result,
  priorProbabilities,
  evidence,
  embeddings,
  activeCase,
  onEdit,
  onRandom,
  onReset
}: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>("posterior");
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(
    () => buildB10PosteriorRows(result, priorProbabilities, evidence),
    [result, priorProbabilities, evidence]
  );

  const topState = (rows[0]?.state ?? "EColi") as TargetState;
  const topProb = result.probabilities[topState] ?? 0;
  const badge = uncertaintyBadge(result.entropy, result.margin);

  function scrollToSection(section: SectionId) {
    setActiveSection(section);
    const target = SECTIONS.find((s) => s.id === section)?.target;
    if (!target) return;
    const el = document.getElementById(target);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="m-results m-results-workbook" ref={scrollRef}>
      {activeCase ? (
        <div className="m-case-strip">
          <strong>{activeCase.title}</strong>
          <span>{activeCase.intent}</span>
        </div>
      ) : null}

      <header className="m-hero">
        <p className="m-eyebrow">top pathogen · {badge.replace("rank ", "")}</p>
        <h2 className="m-hero-state">{targetStateLabel(topState)}</h2>
        <p className="m-hero-pct" style={{ color: STATE_COLORS[topState] }}>
          {formatPercent(topProb, 1)}
        </p>
        <p className="m-hero-meta">
          Margin over next {formatPercent(rows[0]?.marginFromNext ?? 0, 1)} · entropy{" "}
          {result.entropy.toFixed(2)}
        </p>
      </header>

      <nav className="m-section-nav" aria-label="Result sections">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={activeSection === section.id ? "m-section-tab active" : "m-section-tab"}
            onClick={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <MobilePosteriorDistribution rows={rows} evidence={evidence} />
      <MobileEvidenceImpact result={result} evidence={evidence} defaultFocus={topState} />
      <MobileGeometryPanel
        probabilities={result.probabilities}
        priorProbabilities={priorProbabilities}
        topState={topState}
      />
      <MobileThreeDExplorer
        probabilities={result.probabilities}
        priorProbabilities={priorProbabilities}
        highlightState={topState}
        embeddings={embeddings}
      />

      <MobileSiteFooter />

      <nav className="m-bottom-bar" aria-label="Actions">
        <button type="button" className="m-btn m-btn-primary" onClick={onEdit}>
          Edit evidence
        </button>
        <button type="button" className="m-btn m-btn-ghost" onClick={onRandom}>
          Random
        </button>
        <button type="button" className="m-btn m-btn-ghost" onClick={onReset}>
          Reset
        </button>
      </nav>
    </div>
  );
}
