import { WELCOME_COPY } from "../shared/intro_copy";

interface Props {
  onStart: () => void;
  onSkip: () => void;
}

export function MobileWelcome({ onStart, onSkip }: Props) {
  return (
    <section className="m-welcome" aria-label="Welcome">
      <p className="m-eyebrow">clinical demo</p>
      <h1 className="m-title cyber-glitch" data-text={WELCOME_COPY.title}>
        {WELCOME_COPY.title}
      </h1>
      <p className="m-tagline">{WELCOME_COPY.tagline}</p>
      <button type="button" className="m-btn m-btn-primary" onClick={onStart}>
        {WELCOME_COPY.pressStart}
      </button>
      <button type="button" className="m-btn m-btn-ghost" onClick={onSkip}>
        {WELCOME_COPY.skipIntro}
      </button>
    </section>
  );
}
