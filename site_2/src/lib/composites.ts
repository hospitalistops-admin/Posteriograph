import type { BnModel, EvidenceSet, LatentVisualChannels, StateEmbedding } from "../types";
import { inferPosterior } from "./inference";
import { targetStateLabel } from "./cases";

export const HISTORY_NODES = [
  "AgeGroup",
  "Sex",
  "PrevUriKidProbs",
  "diarrhea",
  "OnAbxEDGroup3",
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
] as const;

export const URINE_TEST_NODES = [
  "CollMethod",
  "Epithelials",
  "Urin_LeucEst",
  "Urin_Nitrite",
  "Urin_Leuc",
  "Microscopy_bacts",
  "EColi",
  "OtherGramNeg",
  "GramPos"
] as const;

export const BLOOD_IMAGING_NODES = ["CRPLevel", "WCCLevel", "NeutLevel", "UltraSound"] as const;

const TARGET_ID = "CauseUTI";
const TARGET_STATES = ["EColi", "OtherGramNeg", "GramPos", "None"];

export function removeDomainEvidence(evidence: EvidenceSet, domain: readonly string[]): EvidenceSet {
  const domainSet = new Set(domain);
  return Object.fromEntries(Object.entries(evidence).filter(([nodeId]) => !domainSet.has(nodeId)));
}

export function domainDelta(
  model: BnModel,
  evidence: EvidenceSet,
  domain: readonly string[],
  state: string
): number {
  const domainEvidenceCount = domain.filter((nodeId) => evidence[nodeId] !== undefined).length;
  if (domainEvidenceCount === 0) return 0;

  const current = inferPosterior(model, TARGET_ID, evidence);
  const withoutDomain = inferPosterior(model, TARGET_ID, removeDomainEvidence(evidence, domain));
  return (current[state] ?? 0) - (withoutDomain[state] ?? 0);
}

export function computeLatentVisualChannels(
  model: BnModel,
  evidence: EvidenceSet
): LatentVisualChannels {
  const causePosterior = inferPosterior(model, TARGET_ID, evidence);
  const ecoliPresence = inferPosterior(model, "EcoliPresence", evidence).High ?? 0;
  const otherPresence = inferPosterior(model, "OtherGramNegPresence", evidence).High ?? 0;
  const gramPosPresence = inferPosterior(model, "GramPosPresence", evidence).High ?? 0;
  const contaminationHigh = inferPosterior(model, "ContaminationRisk", evidence).High ?? 0;

  const colonizationEntries = [
    ["EColi", ecoliPresence],
    ["OtherGramNeg", otherPresence],
    ["GramPos", gramPosPresence]
  ] as const;
  const dominantColonization = colonizationEntries.reduce((best, item) =>
    item[1] > best[1] ? item : best
  )[0];
  const inflammatoryBurden = inflammatoryCompositeFromEvidence(evidence);
  const gramNegativeProbability = (causePosterior.EColi ?? 0) + (causePosterior.OtherGramNeg ?? 0);
  const syntheticDecompensationRisk = clamp(inflammatoryBurden * gramNegativeProbability, 0, 0.95);

  return {
    colonizationPosteriors: {
      EColi: ecoliPresence,
      OtherGramNeg: otherPresence,
      GramPos: gramPosPresence
    },
    contaminationHigh,
    dominantColonization,
    syntheticDecompensationRisk,
    flashHz: syntheticDecompensationRisk * 2.4
  };
}

export function computeStateEmbeddings(model: BnModel, evidence: EvidenceSet): StateEmbedding[] {
  const posterior = inferPosterior(model, TARGET_ID, evidence);
  const channels = computeLatentVisualChannels(model, evidence);

  return TARGET_STATES.map((state) => {
    const historyDelta = domainDelta(model, evidence, HISTORY_NODES, state);
    const urineDelta = domainDelta(model, evidence, URINE_TEST_NODES, state);
    const bloodImagingDelta = domainDelta(model, evidence, BLOOD_IMAGING_NODES, state);
    const stateRisk = syntheticStateRisk(state, posterior, evidence, bloodImagingDelta);

    return {
      state,
      label: targetStateLabel(state),
      posterior: posterior[state] ?? 0,
      historyDelta,
      urineDelta,
      bloodImagingDelta,
      color: colorForState(state, channels),
      flashHz: stateRisk <= 0.001 ? 0 : 0.25 + stateRisk * 2.8,
      decompensationRisk: stateRisk,
      audioFrequency: audioFrequencyFromDelta(bloodImagingDelta),
      contaminationHigh: channels.contaminationHigh,
      dominantColonization: channels.dominantColonization
    };
  });
}

export function audioFrequencyFromEmbeddings(embeddings: StateEmbedding[]): number {
  const weightedDelta = embeddings.reduce(
    (sum, embedding) => sum + embedding.posterior * embedding.bloodImagingDelta,
    0
  );
  const normalized = clamp((weightedDelta + 0.25) / 0.5, 0, 1);
  return Math.round(180 + normalized * 720);
}

export function audioFrequencyFromEmbedding(embedding: StateEmbedding): number {
  return audioFrequencyFromDelta(embedding.bloodImagingDelta);
}

function colorForState(state: string, channels: LatentVisualChannels): string {
  const hueByState: Record<string, number> = {
    EColi: 184,
    OtherGramNeg: 236,
    GramPos: 34,
    None: 205
  };
  const colonizationStrength =
    state === "EColi"
      ? channels.colonizationPosteriors.EColi
      : state === "OtherGramNeg"
        ? channels.colonizationPosteriors.OtherGramNeg
        : state === "GramPos"
          ? channels.colonizationPosteriors.GramPos
          : 0.25;
  const saturation = clamp(46 + colonizationStrength * 38 - channels.contaminationHigh * 14, 30, 82);
  const lightness = clamp(58 - channels.contaminationHigh * 22 + colonizationStrength * 8, 32, 68);
  return `hsl(${hueByState[state] ?? 200}, ${saturation}%, ${lightness}%)`;
}

function audioFrequencyFromDelta(delta: number): number {
  const normalized = clamp((delta + 0.18) / 0.42, 0, 1);
  return Math.round(170 + normalized * 780);
}

function syntheticStateRisk(
  state: string,
  posterior: Record<string, number>,
  evidence: EvidenceSet,
  bloodImagingDelta: number
): number {
  if (state === "None") return 0;

  const inflammatoryBurden = inflammatoryCompositeFromEvidence(evidence);
  const inflammatoryPush = clamp(inflammatoryBurden + Math.max(0, bloodImagingDelta) * 1.25, 0, 1);
  const ecoliProbability = posterior.EColi ?? 0;
  const otherGramNegativeProbability = posterior.OtherGramNeg ?? 0;

  if (state === "EColi") return clamp(inflammatoryPush * ecoliProbability, 0, 0.96);
  if (state === "OtherGramNeg") return clamp(inflammatoryPush * otherGramNegativeProbability, 0, 0.96);
  if (state === "GramPos") {
    const gramNegativeProbability = ecoliProbability + otherGramNegativeProbability;
    return clamp(inflammatoryPush * gramNegativeProbability * 0.18, 0, 0.28);
  }
  return 0;
}

function inflammatoryCompositeFromEvidence(evidence: EvidenceSet): number {
  let burden = 0;
  if (evidence.CRPLevel === "Above70") burden += 0.36;
  if (evidence.CRPLevel === "Btw15And70") burden += 0.18;
  if (evidence.WCCLevel === "Above18") burden += 0.24;
  if (evidence.WCCLevel === "Btw10And18") burden += 0.12;
  if (evidence.NeutLevel === "Above15") burden += 0.24;
  if (evidence.NeutLevel === "Btw8And15") burden += 0.12;
  if (evidence.UltraSound === "Abnormal") burden += 0.16;
  return clamp(burden, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
