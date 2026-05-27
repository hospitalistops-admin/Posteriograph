export const INTRO_STORAGE_KEY = "posteriograph.introDismissed";

export const WELCOME_COPY = {
  title: "Posteriograph",
  tagline: "Causal Bayesian networks for inpatient decision-making",
  pressStart: "Press Start",
  skipIntro: "Skip Intro",
  dontShowAgain: "Don't show intro again"
} as const;

export const RAMSAY_PAPER_URL = "https://doi.org/10.1186/s12874-022-01695-6";

export const CONTACT_EMAIL = "akashvenkataramanan2@gmail.com";
export const CONTACT_NAME = "Akash Venkataramanan";

export interface IntroReference {
  label: string;
  href: string;
}

export interface IntroSlideContent {
  id: string;
  step: string;
  title: string;
  body: string;
  references?: IntroReference[];
}

export const INTRO_SLIDES: IntroSlideContent[] = [
  {
    id: "intro-1",
    step: "01 / 03",
    title: "Who built this",
    body: "My name is Akash, and I'm a hospitalist (internal medicine doctor) working with causal Bayesian networks. I'm trying to build user interfaces and Bayesian networks for common inpatient scenarios."
  },
  {
    id: "intro-2",
    step: "02 / 03",
    title: "What is a causal Bayesian network?",
    body: "A causal Bayesian network is a directed graph where nodes represent clinical variables and edges represent causal influence. Each node has a probability table: given what you observe (evidence), the network updates beliefs about unobserved causes — like which pathogen is driving a urinary tract infection — in a way that respects the causal structure experts defined."
  },
  {
    id: "intro-3",
    step: "03 / 03",
    title: "What this demo predicts",
    body: "The Bayesian network shown here is taken from the excellent work of Ramsay et al. (2022). It uses input data from children presenting to an emergency department in Australia and outputs the probability of four outcomes: E. coli UTI, other gram-negative UTI, gram-positive UTI, or no UTI. My goal is to make this information as clear as possible at the bedside, so a clinician can understand which pieces of information changed the result, and by how much. Put simply: the model estimates which organism is causing the child's UTI, or whether there is actually no UTI.",
    references: [
      {
        label: "Read Ramsay et al. (2022), BMC Med Res Methodol",
        href: RAMSAY_PAPER_URL
      }
    ]
  }
];

export const LANDING_HELP_SECTIONS = [
  {
    id: "what-is-this",
    title: "What am I looking at?",
    body: "An interactive demo of the Ramsay et al. pediatric UTI Bayesian network, focused on the four-state causative pathogen node (b10). You enter clinical evidence — or load a preset case — and see how posterior probabilities shift."
  },
  {
    id: "manual-vs-random",
    title: "Manual vs random case?",
    body: "Manual opens an evidence editor grouped by clinical domain; you set findings step by step, then reveal the b10 output. Random case loads a curated scenario with evidence already set, jumping straight to the posterior views with minimal clutter."
  },
  {
    id: "model-source",
    title: "Where is this model from?",
    body: "Structure and parameters come from the outstanding Ramsay JA et al. paper in BMC Medical Research Methodology (2022). It's one of the cleanest examples of clinical BN practice in the literature: expert-elicited DAG, learnt CPTs on a real prospective UTI cohort, and a clinically meaningful decision target. This site uses their learnt Applied BN v2.2 (CauseUTI target) from the authors' OSF release."
  },
  {
    id: "about-contact",
    title: "About & Contact",
    body: `Posteriograph is a clinician-facing demo by ${CONTACT_NAME}, exploring how causal Bayesian networks can support inpatient decision-making. Questions, feedback, or collaboration:`
  }
] as const;
