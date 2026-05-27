import { useState } from "react";
import { WELCOME_COPY } from "../shared/intro_copy";

interface Props {
  onStart: () => void;
  onSkip: (persistDismiss: boolean) => void;
}

export function WelcomeMenu({ onStart, onSkip }: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <section className="welcome-stage" aria-label="Welcome">
      <div className="welcome-inner cyber-panel">
        <p className="eyebrow">clinical decision support demo</p>
        <h1 className="cyber-glitch welcome-title" data-text={WELCOME_COPY.title}>
          {WELCOME_COPY.title}
        </h1>
        <p className="welcome-tagline">{WELCOME_COPY.tagline}</p>
        <p className="welcome-cursor" aria-hidden="true">
          <span className="terminal-prefix">ready</span>
          <span className="blink-cursor">_</span>
        </p>
        <div className="welcome-actions">
          <button type="button" className="cyber-button glitch welcome-start" onClick={onStart}>
            {WELCOME_COPY.pressStart}
          </button>
          <button
            type="button"
            className="cyber-button ghost"
            onClick={() => onSkip(dontShowAgain)}
          >
            {WELCOME_COPY.skipIntro}
          </button>
        </div>
        <label className="welcome-persist">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
          />
          {WELCOME_COPY.dontShowAgain}
        </label>
      </div>
    </section>
  );
}
