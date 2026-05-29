import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronRight,
  Eye,
  EyeOff,
  Network,
  Pencil,
  RefreshCcw,
  Shuffle,
  X
} from "lucide-react";
import { AssistantSection } from "./components/AssistantSection";
import { B10PosteriorTable } from "./components/B10PosteriorTable";
import { B10SmallMultiples } from "./components/B10SmallMultiples";
import { BnProbabilityScene, type CameraPreset } from "./components/BnProbabilityScene";
import { IntroSlide } from "./components/IntroSlide";
import { LandingInfoDropdown } from "./components/LandingInfoDropdown";
import { MethodsSection } from "./components/MethodsSection";
import { SiteFooter } from "./components/SiteFooter";
import { WelcomeMenu } from "./components/WelcomeMenu";
import { learnt, priors } from "./data/models";
import {
  CONTROL_GROUPS,
  RANDOM_CASES,
  effectiveEvidence,
  randomCase,
  stateLabel
} from "./lib/cases";
import { computeStateEmbeddings } from "./lib/composites";
import { posteriorResult } from "./lib/inference";
import { INTRO_SLIDES } from "./shared/intro_copy";
import {
  initialOnboardingFlow,
  isInfoFlow,
  isOnboardingStep,
  nextIntroStep,
  prevIntroStep,
  writeIntroDismissed,
  type OnboardingFlowState
} from "./shared/onboarding";
import type { BnModel, EvidenceSet, RandomCase } from "./types";

export default function App() {
  const [flow, setFlow] = useState<OnboardingFlowState>(initialOnboardingFlow);
  const [evidence, setEvidence] = useState<EvidenceSet>({});
  const [activeCase, setActiveCase] = useState<RandomCase | null>(null);
  const [hideCulture, setHideCulture] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [show3dOverlay, setShow3dOverlay] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("reset");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const currentEvidence = useMemo(() => effectiveEvidence(evidence, hideCulture), [evidence, hideCulture]);
  const result = useMemo(() => posteriorResult(learnt, currentEvidence), [currentEvidence]);
  const priorPosterior = useMemo(() => posteriorResult(priors, currentEvidence), [currentEvidence]);
  const embeddings = useMemo(() => computeStateEmbeddings(learnt, currentEvidence), [currentEvidence]);
  const activeGroup = CONTROL_GROUPS[activeGroupIndex] ?? CONTROL_GROUPS[0];
  const inResults = flow === "results";
  const inOnboarding = isOnboardingStep(flow);
  const inInfo = isInfoFlow(flow);
  const showFooter =
    flow === "landing" || flow === "manual" || flow === "results" || flow === "methods" || flow === "assistant";
  const introSlideIndex =
    flow === "intro-1" ? 0 : flow === "intro-2" ? 1 : flow === "intro-3" ? 2 : -1;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "SELECT" || target?.tagName === "TEXTAREA") return;

      if (inOnboarding) {
        if (event.key === "Escape") {
          event.preventDefault();
          skipOnboarding(false);
          return;
        }
        if (event.key === "Enter" || event.key === "ArrowRight") {
          event.preventDefault();
          if (flow === "welcome") setFlow("intro-1");
          else advanceIntro();
          return;
        }
        if (event.key === "ArrowLeft" && flow !== "welcome") {
          event.preventDefault();
          setFlow(prevIntroStep(flow));
          return;
        }
        return;
      }

      if (event.key.toLowerCase() === "m" && flow === "landing") {
        event.preventDefault();
        startManual();
      }
      if (event.key.toLowerCase() === "r" && flow === "landing") {
        event.preventDefault();
        loadRandomCase();
      }
      if (event.key === "Enter" && flow === "manual") {
        event.preventDefault();
        setFlow("results");
        setShowEditDrawer(false);
      }
      if (event.key.toLowerCase() === "g" && inResults) {
        event.preventDefault();
        setShow3dOverlay(true);
      }
      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        setHideCulture((value) => !value);
      }
      if (event.key === "]" && showEditDrawer) {
        event.preventDefault();
        setActiveGroupIndex((index) => (index + 1) % CONTROL_GROUPS.length);
      }
      if (event.key === "[" && showEditDrawer) {
        event.preventDefault();
        setActiveGroupIndex((index) => (index - 1 + CONTROL_GROUPS.length) % CONTROL_GROUPS.length);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (show3dOverlay) setShow3dOverlay(false);
        else if (showEditDrawer) setShowEditDrawer(false);
        else if (inInfo) setFlow("landing");
        else if (flow !== "landing") resetAll();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flow, inResults, inOnboarding, inInfo, show3dOverlay, showEditDrawer]);

  function skipOnboarding(persistDismiss: boolean) {
    if (persistDismiss) writeIntroDismissed(true);
    setFlow("landing");
  }

  function advanceIntro() {
    setFlow(nextIntroStep(flow));
  }

  function replayIntro() {
    writeIntroDismissed(false);
    setFlow("welcome");
  }

  function startManual() {
    setFlow("manual");
    setActiveCase(null);
    setEvidence({});
    setShowEditDrawer(true);
    setActiveGroupIndex(0);
  }

  function loadRandomCase(testCase = randomCase()) {
    setEvidence(testCase.evidence);
    setActiveCase(testCase);
    setHideCulture(false);
    setFlow("results");
    setShowEditDrawer(false);
  }

  function resetAll() {
    setEvidence({});
    setActiveCase(null);
    setHideCulture(false);
    setShow3dOverlay(false);
    setShowEditDrawer(false);
    setActiveGroupIndex(0);
    setFlow("landing");
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

  function revealResults() {
    setFlow("results");
    setShowEditDrawer(false);
  }

  return (
    <main
      className={`app-shell flow-${flow} ${showEditDrawer ? "drawer-open" : ""} ${inOnboarding ? "onboarding-active" : ""}`}
    >
      <div className="scanline-layer" aria-hidden="true" />

      {!inOnboarding ? (
        <header className="top-bar cyber-panel">
          <div>
            <p className="eyebrow">Ramsay UTI · b10</p>
            <h1 className="cyber-glitch compact-title" data-text="Causative pathogen">
              Causative pathogen
            </h1>
          </div>
          {inResults && activeCase ? (
            <div className="case-banner">
              <Activity size={18} />
              <div>
                <strong>{activeCase.title}</strong>
                <span>{activeCase.intent}</span>
              </div>
            </div>
          ) : null}
          <div className="top-actions">
            {flow === "landing" ? (
              <>
                <button type="button" className="cyber-button ghost" onClick={() => setFlow("methods")}>
                  how it works
                </button>
                <button type="button" className="cyber-button ghost" onClick={() => setFlow("assistant")}>
                  ask assistant
                </button>
                <button type="button" className="cyber-button ghost" onClick={startManual}>
                  manual
                </button>
                <button type="button" className="cyber-button" onClick={() => loadRandomCase()}>
                  <Shuffle size={16} />
                  random case
                </button>
              </>
            ) : inInfo ? (
              <button type="button" className="cyber-button ghost" onClick={() => setFlow("landing")}>
                home
              </button>
            ) : (
              <>
                {inResults ? (
                  <>
                    <button
                      type="button"
                      className="cyber-button secondary"
                      onClick={() => setShowEditDrawer((value) => !value)}
                    >
                      <Pencil size={16} />
                      {showEditDrawer ? "hide controls" : "edit evidence"}
                    </button>
                    <button type="button" className="cyber-button" onClick={() => setShow3dOverlay(true)}>
                      <Network size={16} />
                      open 3D field
                    </button>
                    <button type="button" className="cyber-button ghost" onClick={() => setHideCulture((v) => !v)}>
                      {hideCulture ? <EyeOff size={16} /> : <Eye size={16} />}
                      culture
                    </button>
                  </>
                ) : null}
                <button type="button" className="cyber-button ghost" onClick={resetAll} aria-label="Reset">
                  <RefreshCcw size={16} />
                </button>
              </>
            )}
          </div>
        </header>
      ) : (
        <header className="top-bar top-bar-minimal">
          <button type="button" className="cyber-button ghost" onClick={() => skipOnboarding(false)}>
            Skip Intro
          </button>
        </header>
      )}

      {flow === "welcome" ? (
        <WelcomeMenu onStart={() => setFlow("intro-1")} onSkip={skipOnboarding} />
      ) : null}

      {introSlideIndex >= 0 ? (
        <IntroSlide
          slide={INTRO_SLIDES[introSlideIndex]!}
          isLast={introSlideIndex === INTRO_SLIDES.length - 1}
          onBack={() => setFlow(prevIntroStep(flow))}
          onNext={advanceIntro}
          onSkip={() => skipOnboarding(false)}
        />
      ) : null}

      {flow === "landing" ? (
        <LandingChoice
          onManual={startManual}
          onRandom={() => loadRandomCase()}
          onReplayIntro={replayIntro}
          onMethods={() => setFlow("methods")}
          onAssistant={() => setFlow("assistant")}
        />
      ) : null}

      {flow === "methods" ? <MethodsSection onBack={() => setFlow("landing")} /> : null}

      {flow === "assistant" ? (
        <AssistantSection evidence={currentEvidence} onBack={() => setFlow("landing")} />
      ) : null}

      {flow === "manual" || flow === "results" ? (
        <div className="results-layout">
          <B10PosteriorTable
            result={result}
            priorProbabilities={priorPosterior.probabilities}
            evidence={currentEvidence}
          />
          <B10SmallMultiples
            result={result}
            priorProbabilities={priorPosterior.probabilities}
            evidence={currentEvidence}
          />

          {flow === "manual" && !inResults ? (
            <div className="manual-hint cyber-panel">
              <p>Set evidence in the drawer, then reveal b10 output.</p>
              <button type="button" className="cyber-button" onClick={revealResults}>
                reveal b10 output
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {showEditDrawer ? (
        <aside className="edit-drawer cyber-panel" aria-label="Evidence editor">
          <div className="drawer-head">
            <span className="terminal-prefix">evidence editor</span>
            <button type="button" className="icon-close" onClick={() => setShowEditDrawer(false)} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <nav className="evidence-tabs">
            {CONTROL_GROUPS.map((group, index) => (
              <button
                type="button"
                key={group.title}
                className={index === activeGroupIndex ? "tab active" : "tab"}
                onClick={() => setActiveGroupIndex(index)}
              >
                {group.title}
              </button>
            ))}
          </nav>
          <EvidenceList
            model={learnt}
            group={activeGroup}
            evidence={evidence}
            onSet={setNodeEvidence}
            onClear={clearNodeEvidence}
          />
          <div className="drawer-foot">
            <label className="case-picker">
              Load case
              <select
                value={activeCase?.id ?? ""}
                onChange={(event) => {
                  const testCase = RANDOM_CASES.find((item) => item.id === event.target.value);
                  if (testCase) loadRandomCase(testCase);
                }}
              >
                <option value="">—</option>
                {RANDOM_CASES.map((testCase) => (
                  <option key={testCase.id} value={testCase.id}>
                    {testCase.title}
                  </option>
                ))}
              </select>
            </label>
            {flow === "manual" ? (
              <button type="button" className="cyber-button wide" onClick={revealResults}>
                reveal b10
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}

      {showFooter ? <SiteFooter /> : null}

      {show3dOverlay ? (
        <div className="fullscreen-3d-overlay" role="dialog" aria-modal="true" aria-label="3D probability field">
          <div className="overlay-toolbar">
            <span className="terminal-prefix">guided 3D field</span>
            <div className="camera-presets">
              {(["front", "top", "side", "reset"] as CameraPreset[]).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className="cyber-button ghost"
                  onClick={() => setCameraPreset(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <button type="button" className="cyber-button secondary" onClick={() => setShow3dOverlay(false)}>
              <X size={16} />
              close
            </button>
          </div>
          <BnProbabilityScene
            embeddings={embeddings}
            fullscreen
            cameraPreset={cameraPreset}
            onClose={() => setShow3dOverlay(false)}
          />
        </div>
      ) : null}
    </main>
  );
}

function LandingChoice({
  onManual,
  onRandom,
  onReplayIntro,
  onMethods,
  onAssistant
}: {
  onManual: () => void;
  onRandom: () => void;
  onReplayIntro: () => void;
  onMethods: () => void;
  onAssistant: () => void;
}) {
  return (
    <section className="landing-section">
      <div className="landing-grid landing-grid-4">
        <button type="button" className="choice-card cyber-panel" onClick={onManual}>
          <span className="eyebrow">route 01</span>
          <strong>Select evidence manually</strong>
          <p>Focused editor, then four b10 cards.</p>
        </button>
        <button type="button" className="choice-card cyber-panel hot" onClick={onRandom}>
          <Shuffle size={32} />
          <span className="eyebrow">route 02</span>
          <strong>Initialize random case</strong>
          <p>Jump straight to four expandable neon cards — no control clutter.</p>
        </button>
        <button type="button" className="choice-card cyber-panel" onClick={onMethods}>
          <span className="eyebrow">learn</span>
          <strong>How this works</strong>
          <p>Lineage, Ramsay vs original work, and the math behind each view.</p>
        </button>
        <button type="button" className="choice-card cyber-panel" onClick={onAssistant}>
          <span className="eyebrow">ask</span>
          <strong>Model assistant</strong>
          <p>Q&amp;A about derivation and deterministic BN queries (API proxy).</p>
        </button>
      </div>
      <LandingInfoDropdown />
      <button type="button" className="replay-intro-link" onClick={onReplayIntro}>
        Replay intro
      </button>
    </section>
  );
}

function EvidenceList({
  model,
  group,
  evidence,
  onSet,
  onClear
}: {
  model: BnModel;
  group: (typeof CONTROL_GROUPS)[number];
  evidence: EvidenceSet;
  onSet: (nodeId: string, state: string) => void;
  onClear: (nodeId: string) => void;
}) {
  return (
    <div className="evidence-list compact-list">
      {group.ids.map((nodeId) => {
        const node = model.nodes.find((candidate) => candidate.id === nodeId);
        if (!node) return null;
        return (
          <article className={evidence[nodeId] ? "evidence-row selected" : "evidence-row"} key={nodeId}>
            <div className="evidence-row-head">
              <strong>{node.title}</strong>
              {evidence[nodeId] ? (
                <button type="button" onClick={() => onClear(nodeId)}>
                  clear
                </button>
              ) : null}
            </div>
            <div className="state-grid">
              {node.states.map((state) => (
                <button
                  type="button"
                  key={state}
                  className={evidence[nodeId] === state ? "state-chip active" : "state-chip"}
                  onClick={() => onSet(nodeId, state)}
                >
                  {stateLabel(nodeId, state)}
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
