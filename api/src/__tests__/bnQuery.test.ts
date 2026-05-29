import { describe, expect, it } from "vitest";
import { executeBnQuery } from "../../../site_2/src/lib/bnQuery.js";

describe("executeBnQuery (API shared)", () => {
  it("returns cohort marginal for CauseUTI", () => {
    const result = executeBnQuery({ operation: "target_marginal", model: "learnt" });
    expect(result.ok).toBe(true);
    if (!result.ok || result.operation !== "target_marginal") return;
    expect(result.operation).toBe("target_marginal");
    const total = Object.values(result.probabilities).reduce((s, v) => s + v, 0);
    expect(total).toBeCloseTo(1, 4);
  });

  it("rejects invalid evidence", () => {
    const result = executeBnQuery({
      operation: "posterior",
      evidence: { NotANode: "Yes" }
    });
    expect(result.ok).toBe(false);
  });

  it("summarizes categories with evidence", () => {
    const result = executeBnQuery({
      operation: "category_summary",
      evidence: { Urin_Nitrite: "Detected", EColi: "Positive" }
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.operation !== "category_summary") return;
    expect(result.causeUtiLabeled).toHaveLength(4);
  });
});
