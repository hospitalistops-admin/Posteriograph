import { CONTACT_EMAIL, LANDING_HELP_SECTIONS, RAMSAY_PAPER_URL } from "../shared/intro_copy";

export function LandingInfoDropdown() {
  return (
    <div className="landing-info-dropdown" aria-label="Help and context">
      {LANDING_HELP_SECTIONS.map((section) => (
        <details key={section.id} className="b10-info-tip landing-help-item">
          <summary>
            <span className="b10-info-label">{section.title}</span>
          </summary>
          <p className="b10-info-body">
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
        </details>
      ))}
    </div>
  );
}
