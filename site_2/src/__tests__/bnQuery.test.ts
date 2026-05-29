import { describe, expect, it } from "vitest";
import { executeBnQuery, validateEvidence } from "../lib/bnQuery";
import { learnt } from "../data/models";

describe("bnQuery", () => {
  it("validates evidence states", () => {
    expect(validateEvidence(learnt, { AgeGroup: "Above5Yr" })).toBeNull();
    expect(validateEvidence(learnt, { AgeGroup: "Invalid" })).toMatch(/Unknown state/);
  });

  it("lists all nodes", () => {
    const result = executeBnQuery({ operation: "list_nodes" });
    expect(result.ok).toBe(true);
    if (result.ok && result.operation === "list_nodes") expect(result.nodes).toHaveLength(36);
  });

  it("returns evidence deltas for nitrite case", () => {
    const result = executeBnQuery({
      operation: "evidence_deltas",
      evidence: { Urin_Nitrite: "Detected" }
    });
    expect(result.ok).toBe(true);
    if (result.ok && result.operation === "evidence_deltas") expect(result.deltas.length).toBeGreaterThan(0);
  });
});
