import type { IntroSlideContent } from "../shared/intro_copy";

interface Props {
  slide: IntroSlideContent;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function IntroSlide({ slide, isLast, onBack, onNext, onSkip }: Props) {
  return (
    <section className="intro-stage" aria-label={slide.title}>
      <article className="intro-slide cyber-panel">
        <p className="eyebrow intro-step">{slide.step}</p>
        <h2 className="intro-title">{slide.title}</h2>
        <p className="intro-body">{slide.body}</p>
        {slide.references?.length ? (
          <div className="intro-references">
            {slide.references.map((ref) => (
              <a key={ref.href} href={ref.href} target="_blank" rel="noreferrer">
                {ref.label}
              </a>
            ))}
          </div>
        ) : null}
        <footer className="intro-footer">
          <button type="button" className="cyber-button ghost" onClick={onBack}>
            Back
          </button>
          <button type="button" className="cyber-button" onClick={onNext}>
            {isLast ? "Begin" : "Next"}
          </button>
          <button type="button" className="cyber-button ghost intro-skip" onClick={onSkip}>
            Skip Intro
          </button>
        </footer>
      </article>
    </section>
  );
}
