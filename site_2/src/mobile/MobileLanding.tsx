import { Shuffle } from "lucide-react";
import { MobileSiteFooter } from "../components/SiteFooter";
import { CONTACT_EMAIL, LANDING_HELP_SECTIONS, RAMSAY_PAPER_URL } from "../shared/intro_copy";

interface Props {
  onManual: () => void;
  onRandom: () => void;
  onReplayIntro: () => void;
}

export function MobileLanding({ onManual, onRandom, onReplayIntro }: Props) {
  return (
    <section className="m-landing" aria-label="Choose route">
      <p className="m-eyebrow">select route</p>
      <h2 className="m-landing-heading">How do you want to begin?</h2>
      <button type="button" className="m-route-btn" onClick={onManual}>
        <span className="m-route-label">route 01</span>
        <strong>Select evidence manually</strong>
        <span className="m-route-desc">Step through findings, then view posteriors.</span>
      </button>
      <button type="button" className="m-route-btn m-route-hot" onClick={onRandom}>
        <Shuffle size={22} aria-hidden />
        <span className="m-route-label">route 02</span>
        <strong>Initialize random case</strong>
        <span className="m-route-desc">Load a curated scenario instantly.</span>
      </button>
      <details className="m-help">
        <summary>Help</summary>
        <div className="m-help-body">
          {LANDING_HELP_SECTIONS.map((section) => (
            <div key={section.id} className="m-help-block">
              <h3>{section.title}</h3>
              <p>
                {section.body}
                {section.id === "model-source" ? (
                  <>
                    {" "}
                    <a href={RAMSAY_PAPER_URL} target="_blank" rel="noreferrer">
                      Ramsay et al. 2022 (open access)
                    </a>
                  </>
                ) : null}
                {section.id === "about-contact" ? (
                  <>
                    {" "}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  </>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </details>
      <button type="button" className="m-skip-link" onClick={onReplayIntro}>
        Replay intro
      </button>
      <MobileSiteFooter />
    </section>
  );
}
