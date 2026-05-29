import { RAMSAY_PAPER_URL } from "./intro_copy";

export const OSF_PROJECT_URL = "https://osf.io/8taqy/";

export interface MethodsBlock {
  id: string;
  title: string;
  body: string;
  items?: string[];
  formula?: string;
  note?: string;
}

export const METHODS_SECTIONS: MethodsBlock[] = [
  {
    id: "lineage",
    title: "Source lineage",
    body: "This demo visualizes the Ramsay et al. pediatric UTI Applied Bayesian Network. Public materials include the expert DAG, prior and learnt Netica models, and dictionaries. Participant-level prospective cohort rows are not publicly released.",
    items: [
      "Paper: Ramsay JA et al., BMC Medical Research Methodology (2022)",
      "OSF release: Expert_DAG_v11.1, Applied_BN_v2.2_priors.dne, Applied_BN_v2.2_learnt.dne, dictionaries",
      "Site build: DNE files in reference/ are parsed at build time into JSON consumed by the browser"
    ]
  },
  {
    id: "derived",
    title: "Derived from Ramsay (not original to this site)",
    body: "Structure, states, and parameters come from the authors' models. The site does not re-learn CPTs.",
    items: [
      "36-node DAG, node IDs, state labels, parent sets, and full CPTs",
      "Target node CauseUTI (b10): EColi, OtherGramNeg, GramPos, None",
      "Learnt model posterior marginals and Netica numcases effective case weights per CPT row",
      "Prior Applied BN (priors.dne) for expert/pre-learning comparison",
      "Elimination order exported from the DNE for inference"
    ]
  },
  {
    id: "original",
    title: "Original to Posteriograph",
    body: "Everything below is implemented in this repository for explanation and interaction, not in the Ramsay OSF bundle.",
    items: [
      "React/Vite UI, evidence editor, curated teaching cases, mobile layout",
      "TypeScript variable-elimination inference engine (exact, client-side)",
      "Evidence ablation deltas, sequential trajectories, pathway strips",
      "2D equiradial simplex and 3D tetrahedron projections for four-state posteriors",
      "Heuristic fragility bands, uncertainty badges, synthetic decompensation/audio/visual channels",
      "Methods page, assistant Q&A wiring, and explanatory copy"
    ]
  },
  {
    id: "data-caveat",
    title: "Patient counts vs model weights",
    body: "Questions like “how many patients fit each category?” cannot be answered from raw rows in this public release. The assistant and BN tools report:",
    items: [
      "Cohort marginals: P(CauseUTI) with no evidence (learnt model)",
      "Posteriors after user-specified evidence (exact inference)",
      "Netica numcases: effective case weights attached to CPT rows — not guaranteed to be integer patient counts for arbitrary cross-tabs"
    ],
    note: "Do not enter real patient identifiers in the assistant. Use structured demo evidence only."
  }
];

export const METHODS_FORMULAS: MethodsBlock[] = [
  {
    id: "factorization",
    title: "Bayesian network factorization",
    formula: "P(X₁,…,Xₙ) = ∏ᵢ P(Xᵢ | Pa(Xᵢ))",
    body: "Joint probability factors into one conditional probability table (CPT) per node given its parents."
  },
  {
    id: "posterior",
    title: "Posterior query",
    formula: "P(Q | e) = α ∑_{hidden} ∏ᵢ P(xᵢ | Pa(xᵢ))",
    body: "Evidence e fixes observed nodes. Hidden variables are summed out; α normalizes over query states Q. Implemented via factor multiplication and variable elimination in inference.ts."
  },
  {
    id: "entropy",
    title: "Entropy (uncertainty)",
    formula: "H(p) = −∑ₛ p(s) log₂ p(s)",
    body: "Computed on the four-state CauseUTI posterior for the global uncertainty readout."
  },
  {
    id: "margin",
    title: "Rank margin",
    formula: "margin = p₁ − p₂",
    body: "Difference between the top two CauseUTI state probabilities (p₁ ≥ p₂)."
  },
  {
    id: "ablation",
    title: "Evidence ablation delta",
    formula: "Δₛ(n) = P(CauseUTI=s | e) − P(CauseUTI=s | e \\ {n})",
    body: "Per evidence node n and target state s. Shows how much each finding moved belief (associational, not causal intervention unless an intervention query is defined)."
  },
  {
    id: "trajectory",
    title: "Sequential evidence trajectory",
    formula: "P(CauseUTI=s | e₁,…,eₖ) for k = 0…|e|",
    body: "Cumulative posteriors in clinical control-group order (canonicalEvidenceOrder)."
  },
  {
    id: "domain-delta",
    title: "Domain ablation (3D / composites)",
    formula: "δ_domain(s) = P(s|e) − P(s|e without domain nodes)",
    body: "History, urine, and blood/imaging domains in composites.ts."
  },
  {
    id: "simplex",
    title: "2D equiradial projection",
    formula: "x = ∑ₛ wₛ cos θₛ,  y = ∑ₛ wₛ sin θₛ",
    body: "Weights wₛ are CauseUTI posteriors; θₛ places each state on a rhomboid axis (b10Views.ts)."
  },
  {
    id: "tetra",
    title: "3D tetrahedron embedding",
    formula: "r = ∑ₛ wₛ v̂ₛ",
    body: "Unit vertices v̂ₛ on a regular tetrahedron; isometric projection to SVG/WebGL."
  },
  {
    id: "fragility",
    title: "Fragility band (heuristic UI)",
    formula: "band = [p − spread, p + spread], spread = f(H, margin)",
    body: "Display-only uncertainty band — not a validated credible interval from the cohort."
  },
  {
    id: "decomp",
    title: "Synthetic decompensation risk",
    formula: "risk ≈ clamp(inflammation × P(GNR UTI), 0, 0.95)",
    body: "Heuristic composite from inflammatory labs and gram-negative posterior; drives 3D flash/audio styling only."
  }
];

export const METHODS_REFERENCES = [
  { label: "Ramsay et al. 2022 (DOI)", href: RAMSAY_PAPER_URL },
  { label: "OSF model files (8taqy)", href: OSF_PROJECT_URL }
] as const;
