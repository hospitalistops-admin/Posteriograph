import { useCallback, useRef, useState } from "react";
import type { IntroSlideContent } from "../shared/intro_copy";
import { INTRO_SLIDES } from "../shared/intro_copy";

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function MobileIntro({ onComplete, onSkip }: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const slide = INTRO_SLIDES[index]!;

  const goNext = useCallback(() => {
    if (index >= INTRO_SLIDES.length - 1) onComplete();
    else setIndex((i) => i + 1);
  }, [index, onComplete]);

  const goBack = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: React.TouchEvent) {
    const start = touchStartX.current;
    if (start == null) return;
    const end = event.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (delta < -48) goNext();
    else if (delta > 48) goBack();
    touchStartX.current = null;
  }

  return (
    <section
      className="m-intro"
      aria-label={slide.title}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="m-intro-dots" role="tablist" aria-label="Intro progress">
        {INTRO_SLIDES.map((s, i) => (
          <span
            key={s.id}
            className={i === index ? "m-dot active" : "m-dot"}
            aria-current={i === index ? "step" : undefined}
          />
        ))}
      </div>
      <MobileIntroCard slide={slide} />
      <div className="m-intro-nav">
        <button type="button" className="m-btn m-btn-ghost" onClick={goBack} disabled={index === 0}>
          Back
        </button>
        <button type="button" className="m-btn m-btn-primary" onClick={goNext}>
          {index === INTRO_SLIDES.length - 1 ? "Begin" : "Next"}
        </button>
      </div>
      <button type="button" className="m-skip-link" onClick={onSkip}>
        Skip Intro
      </button>
      <p className="m-swipe-hint">Swipe left for next · right for back</p>
    </section>
  );
}

function MobileIntroCard({ slide }: { slide: IntroSlideContent }) {
  return (
    <article className="m-intro-card" key={slide.id}>
      <p className="m-eyebrow">{slide.step}</p>
      <h2 className="m-intro-title">{slide.title}</h2>
      <p className="m-intro-body">{slide.body}</p>
      {slide.references?.length ? (
        <div className="intro-references m-intro-refs">
          {slide.references.map((ref) => (
            <a key={ref.href} href={ref.href} target="_blank" rel="noreferrer">
              {ref.label}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  );
}
