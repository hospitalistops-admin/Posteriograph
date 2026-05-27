import type { BnModel, EvidenceSet, RandomCase } from "../types";

export const TARGET_STATES = {
  EColi: "E. coli UTI",
  OtherGramNeg: "Other GNR UTI",
  GramPos: "Gram-positive UTI",
  None: "No UTI"
} as const;

export const STATE_COLORS: Record<string, string> = {
  EColi: "#0e7c86",
  OtherGramNeg: "#5a67d8",
  GramPos: "#b45309",
  None: "#64748b"
};

export const CULTURE_NODE_IDS = ["EColi", "OtherGramNeg", "GramPos"];

export const SCENARIO_CANDIDATES = [
  "Urin_Nitrite",
  "Urin_LeucEst",
  "Urin_Leuc",
  "Microscopy_bacts",
  "EColi",
  "OtherGramNeg",
  "GramPos",
  "CRPLevel",
  "Epithelials"
];

export const CONTROL_GROUPS = [
  {
    title: "Context",
    ids: ["AgeGroup", "Sex", "PrevUriKidProbs", "diarrhea", "OnAbxEDGroup3", "CollMethod"]
  },
  {
    title: "Symptoms",
    ids: [
      "RespSymp",
      "FeverPR",
      "TemperatureLvl2",
      "UrinSym_PainOrDiscomf",
      "AbdoPain",
      "UrinSym_haematuria",
      "UrinSym_smelly",
      "Irritable",
      "Lethargy",
      "NauseaOrVomit",
      "PoorIntake"
    ]
  },
  {
    title: "Urine Tests",
    ids: ["Urin_LeucEst", "Urin_Nitrite", "Urin_Leuc", "Microscopy_bacts", "Epithelials"]
  },
  {
    title: "Culture",
    ids: ["EColi", "OtherGramNeg", "GramPos"]
  },
  {
    title: "Blood / Imaging",
    ids: ["CRPLevel", "WCCLevel", "NeutLevel", "UltraSound"]
  },
  {
    title: "Latent Model Layer",
    ids: ["EcoliPresence", "OtherGramNegPresence", "GramPosPresence", "ContaminationRisk", "CurrPhenotype"]
  }
];

export const RANDOM_CASES: RandomCase[] = [
  {
    id: "pre-culture-febrile",
    title: "Pre-culture febrile child",
    intent: "Shows how early presentation and dipstick data move belief before culture returns.",
    evidence: {
      AgeGroup: "Btw2And5Yr",
      Sex: "Female",
      PrevUriKidProbs: "Unknown",
      diarrhea: "No",
      OnAbxEDGroup3: "No",
      CollMethod: "CleanCatch",
      FeverPR: "Yes",
      RespSymp: "No",
      TemperatureLvl2: "Abv385",
      Urin_LeucEst: "Moderate",
      Urin_Nitrite: "NotDetected",
      CRPLevel: "NotDone"
    },
    pending: ["EColi", "OtherGramNeg", "GramPos", "Urin_Leuc", "Microscopy_bacts"]
  },
  {
    id: "nitrite-ecoli",
    title: "Nitrite-positive E. coli pattern",
    intent: "A high-signal example where dipstick, microscopy, and culture align.",
    evidence: {
      AgeGroup: "Btw6MonAnd2Yr",
      Sex: "Female",
      PrevUriKidProbs: "Unknown",
      diarrhea: "No",
      OnAbxEDGroup3: "No",
      CollMethod: "Catheter",
      Urin_Nitrite: "Detected",
      Urin_LeucEst: "High",
      Urin_Leuc: "High",
      Microscopy_bacts: "Many",
      EColi: "Positive",
      OtherGramNeg: "Negative",
      GramPos: "Negative"
    },
    pending: ["CRPLevel", "WCCLevel"]
  },
  {
    id: "culture-contamination",
    title: "Culture positive, contamination concern",
    intent: "Contrasts organism growth with weak inflammation and specimen-quality signals.",
    evidence: {
      AgeGroup: "Above5Yr",
      Sex: "Female",
      PrevUriKidProbs: "Unknown",
      diarrhea: "Yes",
      OnAbxEDGroup3: "No",
      CollMethod: "CleanCatch",
      Epithelials: "Moderate",
      Urin_Nitrite: "NotDetected",
      Urin_LeucEst: "Low",
      Urin_Leuc: "Low",
      CRPLevel: "Below15",
      EColi: "Positive",
      OtherGramNeg: "Negative",
      GramPos: "Negative"
    },
    pending: ["Microscopy_bacts", "WCCLevel"]
  },
  {
    id: "suppressed-culture",
    title: "Prior antibiotics, suppressed culture",
    intent: "Shows why negative culture is not always the same as no infection.",
    evidence: {
      AgeGroup: "LessThan6Mon",
      Sex: "Male",
      PrevUriKidProbs: "Reported",
      diarrhea: "No",
      OnAbxEDGroup3: "Broader",
      FeverPR: "Yes",
      TemperatureLvl2: "Abv385",
      Urin_LeucEst: "High",
      Urin_Leuc: "High",
      CRPLevel: "Above70",
      EColi: "Negative",
      OtherGramNeg: "Negative",
      GramPos: "Negative"
    },
    pending: ["Microscopy_bacts", "NeutLevel", "UltraSound"]
  },
  {
    id: "low-uti-nonspecific",
    title: "Nonspecific low-UTI case",
    intent: "A teaching case where respiratory symptoms and low urine markers push toward no UTI.",
    evidence: {
      AgeGroup: "Above5Yr",
      Sex: "Male",
      PrevUriKidProbs: "Unknown",
      diarrhea: "No",
      OnAbxEDGroup3: "No",
      RespSymp: "Yes",
      FeverPR: "Yes",
      TemperatureLvl2: "Btw375and385",
      Urin_Nitrite: "NotDetected",
      Urin_LeucEst: "NotDetected",
      Urin_Leuc: "Low",
      CRPLevel: "Below15",
      WCCLevel: "Below10",
      EColi: "Negative",
      OtherGramNeg: "Negative",
      GramPos: "Negative"
    },
    pending: ["Epithelials", "Microscopy_bacts"]
  }
];

export function effectiveEvidence(evidence: EvidenceSet, hideCulture: boolean): EvidenceSet {
  if (!hideCulture) return evidence;
  return Object.fromEntries(
    Object.entries(evidence).filter(([nodeId]) => !CULTURE_NODE_IDS.includes(nodeId))
  );
}

export function targetStateLabel(state: string): string {
  return TARGET_STATES[state as keyof typeof TARGET_STATES] ?? state;
}

export function stateLabel(nodeId: string, state: string): string {
  const labels: Record<string, Record<string, string>> = {
    AgeGroup: {
      LessThan6Mon: "<6 mo",
      Btw6MonAnd2Yr: "6 mo-2 yr",
      Btw2And5Yr: "2-5 yr",
      Above5Yr: ">5 yr"
    },
    OnAbxEDGroup3: {
      No: "No antibiotics",
      Narrow: "Narrow spectrum",
      Broader: "Broader spectrum"
    },
    CollMethod: {
      CleanCatch: "Clean catch",
      Catheter: "Catheter",
      SupraAsp: "Suprapubic aspirate"
    },
    TemperatureLvl2: {
      Abv385: ">38.5 C",
      Btw375and385: "37.5-38.5 C",
      Btw365and375: "36.5-37.5 C",
      Below365: "<36.5 C"
    },
    CRPLevel: {
      Above70: ">70",
      Btw15And70: "15-70",
      Below15: "<15",
      NotDone: "Not done"
    },
    WCCLevel: {
      Above18: ">18",
      Btw10And18: "10-18",
      Below10: "<10",
      NotDone: "Not done"
    },
    NeutLevel: {
      Above15: ">15",
      Btw8And15: "8-15",
      Below8: "<8",
      NotDone: "Not done"
    }
  };

  return labels[nodeId]?.[state] ?? splitCamel(state);
}

export function splitCamel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/And/g, " and ")
    .replace(/Abv/g, "Above ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function nodeTitle(model: BnModel, nodeId: string): string {
  return model.nodes.find((node) => node.id === nodeId)?.title ?? nodeId;
}

export function randomCase(): RandomCase {
  return RANDOM_CASES[Math.floor(Math.random() * RANDOM_CASES.length)];
}
