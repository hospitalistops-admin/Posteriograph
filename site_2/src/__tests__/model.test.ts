import { describe, expect, it } from "vitest";
import { learnt, priors } from "../data/models";
import { effectiveEvidence, RANDOM_CASES } from "../lib/cases";
import { computeStateEmbeddings } from "../lib/composites";
import { inferPosterior, posteriorResult } from "../lib/inference";

describe("generated Ramsay BN model", () => {
  it("loads the learnt and prior applied BN files", () => {
    expect(learnt.nodes).toHaveLength(36);
    expect(priors.nodes).toHaveLength(36);
  });

  it("contains the expected four-state target with direct parents", () => {
    const target = learnt.nodes.find((node) => node.id === "CauseUTI");
    expect(target?.states).toEqual(["EColi", "OtherGramNeg", "GramPos", "None"]);
    expect(target?.parents).toEqual([
      "PrevUriKidProbs",
      "AgeGroup",
      "EcoliPresence",
      "OtherGramNegPresence",
      "GramPosPresence"
    ]);
  });
});

describe("exact inference", () => {
  it("reproduces the baseline CauseUTI belief from the DNE export", () => {
    const posterior = inferPosterior(learnt, "CauseUTI", {});
    expect(posterior.EColi).toBeCloseTo(0.395326, 4);
    expect(posterior.OtherGramNeg).toBeCloseTo(0.1117718, 4);
    expect(posterior.GramPos).toBeCloseTo(0.182509, 4);
    expect(posterior.None).toBeCloseTo(0.3103932, 4);
  });

  it("moves E. coli upward with nitrite and E. coli culture evidence", () => {
    const baseline = inferPosterior(learnt, "CauseUTI", {});
    const posterior = inferPosterior(learnt, "CauseUTI", {
      Urin_Nitrite: "Detected",
      EColi: "Positive"
    });
    expect(posterior.EColi).toBeGreaterThan(baseline.EColi);
    expect(posterior.None).toBeLessThan(baseline.None);
  });

  it("supports culture-hidden views by removing organism growth evidence", () => {
    const evidence = RANDOM_CASES.find((item) => item.id === "nitrite-ecoli")!.evidence;
    const visible = posteriorResult(learnt, evidence);
    const hidden = posteriorResult(learnt, effectiveEvidence(evidence, true));
    expect(visible.probabilities.EColi).toBeGreaterThan(hidden.probabilities.EColi);
  });

  it("keeps all curated random cases inferable", () => {
    RANDOM_CASES.forEach((testCase) => {
      const result = posteriorResult(learnt, testCase.evidence);
      const total = Object.values(result.probabilities).reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(1, 5);
    });
  });
});

describe("3D composite embeddings", () => {
  it("returns four finite scene nodes with zero domain deltas when no evidence is set", () => {
    const embeddings = computeStateEmbeddings(learnt, {});
    expect(embeddings.map((embedding) => embedding.state)).toEqual([
      "EColi",
      "OtherGramNeg",
      "GramPos",
      "None"
    ]);
    embeddings.forEach((embedding) => {
      expect(Number.isFinite(embedding.posterior)).toBe(true);
      expect(embedding.historyDelta).toBe(0);
      expect(embedding.urineDelta).toBe(0);
      expect(embedding.bloodImagingDelta).toBe(0);
      expect(embedding.color).toMatch(/^hsl\(/);
      expect(embedding.flashHz).toBeGreaterThanOrEqual(0);
      expect(embedding.decompensationRisk).toBeGreaterThanOrEqual(0);
      expect(embedding.audioFrequency).toBeGreaterThan(0);
    });
    expect(embeddings.find((embedding) => embedding.state === "None")?.decompensationRisk).toBe(0);
  });

  it("drives decompensation spin from inflammatory markers and gram-negative UTI probability", () => {
    const embeddings = computeStateEmbeddings(learnt, {
      CRPLevel: "Above70",
      WCCLevel: "Above18",
      NeutLevel: "Above15",
      Urin_Nitrite: "Detected",
      EColi: "Positive"
    });
    const ecoli = embeddings.find((embedding) => embedding.state === "EColi")!;
    const otherGnr = embeddings.find((embedding) => embedding.state === "OtherGramNeg")!;
    const none = embeddings.find((embedding) => embedding.state === "None")!;
    expect(ecoli.decompensationRisk).toBeGreaterThan(0);
    expect(otherGnr.decompensationRisk).toBeGreaterThanOrEqual(0);
    expect(none.decompensationRisk).toBe(0);
    expect(none.flashHz).toBe(0);
  });

  it("keeps all curated cases renderable in the 3D scene", () => {
    RANDOM_CASES.forEach((testCase) => {
      const embeddings = computeStateEmbeddings(learnt, testCase.evidence);
      expect(embeddings).toHaveLength(4);
      embeddings.forEach((embedding) => {
        expect(Number.isFinite(embedding.posterior)).toBe(true);
        expect(Number.isFinite(embedding.historyDelta)).toBe(true);
        expect(Number.isFinite(embedding.urineDelta)).toBe(true);
        expect(Number.isFinite(embedding.bloodImagingDelta)).toBe(true);
        expect(Number.isFinite(embedding.contaminationHigh)).toBe(true);
        expect(Number.isFinite(embedding.decompensationRisk)).toBe(true);
        expect(Number.isFinite(embedding.audioFrequency)).toBe(true);
      });
    });
  });

  it("changes urine contribution when culture findings are hidden", () => {
    const evidence = RANDOM_CASES.find((item) => item.id === "nitrite-ecoli")!.evidence;
    const visible = computeStateEmbeddings(learnt, evidence);
    const hidden = computeStateEmbeddings(learnt, effectiveEvidence(evidence, true));
    const visibleMagnitude = visible.reduce((sum, embedding) => sum + Math.abs(embedding.urineDelta), 0);
    const hiddenMagnitude = hidden.reduce((sum, embedding) => sum + Math.abs(embedding.urineDelta), 0);
    expect(visibleMagnitude).not.toBeCloseTo(hiddenMagnitude, 4);
  });
});
