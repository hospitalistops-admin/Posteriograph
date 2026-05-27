import { CONTACT_EMAIL, CONTACT_NAME, RAMSAY_PAPER_URL } from "../shared/intro_copy";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>
        Built on the work of{" "}
        <a href={RAMSAY_PAPER_URL} target="_blank" rel="noreferrer">
          Ramsay JA et al., BMC Med Res Methodol 2022
        </a>{" "}
        — an exemplar of clinical-grade Bayesian-network methodology.
      </span>
      <span>
        By {CONTACT_NAME} ·{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </span>
    </footer>
  );
}

export function MobileSiteFooter() {
  return (
    <footer className="m-footer">
      <p>
        Built on{" "}
        <a href={RAMSAY_PAPER_URL} target="_blank" rel="noreferrer">
          Ramsay JA et al., BMC Med Res Methodol 2022
        </a>{" "}
        — an exemplar of clinical-grade BN methodology.
      </p>
      <p>
        {CONTACT_NAME} · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </footer>
  );
}
