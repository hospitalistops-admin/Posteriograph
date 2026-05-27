import { useMemo, useState } from "react";
import { learnt, priors } from "../data/models";
import { effectiveEvidence, randomCase } from "../lib/cases";
import { posteriorResult } from "../lib/inference";
import {
  initialOnboardingFlow,
  writeIntroDismissed,
  type OnboardingFlowState
} from "../shared/onboarding";
import type { EvidenceSet, RandomCase } from "../types";
import { MobileEvidenceSheet } from "./MobileEvidenceSheet";
import { MobileIntro } from "./MobileIntro";
import { MobileLanding } from "./MobileLanding";
import { MobileResults } from "./MobileResults";
import { MobileWelcome } from "./MobileWelcome";
import "./mobile.css";

export default function MobileApp() {
  const [flow, setFlow] = useState<OnboardingFlowState>(initialOnboardingFlow);
  const [evidence, setEvidence] = useState<EvidenceSet>({});
  const [activeCase, setActiveCase] = useState<RandomCase | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const currentEvidence = useMemo(() => effectiveEvidence(evidence, false), [evidence]);
  const result = useMemo(() => posteriorResult(learnt, currentEvidence), [currentEvidence]);
  const priorPosterior = useMemo(() => posteriorResult(priors, currentEvidence), [currentEvidence]);

  const inWorkbench = flow === "manual" || flow === "results";

  function skipOnboarding(persist = false) {
    if (persist) writeIntroDismissed(true);
    setFlow("landing");
  }

  function replayIntro() {
    writeIntroDismissed(false);
    setFlow("welcome");
  }

  function startManual() {
    setFlow("manual");
    setActiveCase(null);
    setEvidence({});
    setShowSheet(true);
    setActiveGroupIndex(0);
  }

  function loadRandomCase() {
    const testCase = randomCase();
    setEvidence(testCase.evidence);
    setActiveCase(testCase);
    setFlow("results");
    setShowSheet(false);
  }

  function resetAll() {
    setEvidence({});
    setActiveCase(null);
    setShowSheet(false);
    setActiveGroupIndex(0);
    setFlow("landing");
  }

  function revealResults() {
    setFlow("results");
    setShowSheet(false);
  }

  function setNodeEvidence(nodeId: string, state: string) {
    setEvidence((current) => ({ ...current, [nodeId]: state }));
  }

  function clearNodeEvidence(nodeId: string) {
    setEvidence((current) => {
      const next = { ...current };
      delete next[nodeId];
      return next;
    });
  }

  return (
    <main className={`m-shell flow-${flow}`}>
      {flow === "welcome" ? (
        <MobileWelcome onStart={() => setFlow("intro-1")} onSkip={() => skipOnboarding(false)} />
      ) : null}

      {flow === "intro-1" || flow === "intro-2" || flow === "intro-3" ? (
        <MobileIntro onComplete={() => setFlow("landing")} onSkip={() => skipOnboarding(false)} />
      ) : null}

      {flow === "landing" ? (
        <MobileLanding onManual={startManual} onRandom={loadRandomCase} onReplayIntro={replayIntro} />
      ) : null}

      {inWorkbench ? (
        <MobileResults
          result={result}
          priorProbabilities={priorPosterior.probabilities}
          activeCase={activeCase}
          onEdit={() => setShowSheet(true)}
          onRandom={loadRandomCase}
          onReset={resetAll}
        />
      ) : null}

      <MobileEvidenceSheet
        open={showSheet}
        activeGroupIndex={activeGroupIndex}
        evidence={evidence}
        onClose={() => setShowSheet(false)}
        onGroupChange={setActiveGroupIndex}
        onSet={setNodeEvidence}
        onClear={clearNodeEvidence}
        onReveal={revealResults}
        showReveal={flow === "manual"}
      />
    </main>
  );
}
