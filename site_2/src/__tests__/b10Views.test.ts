import { describe, expect, it } from "vitest";
import { learnt } from "../data/models";
import {
  causeUtiCptTable,
  cornerPosition,
  equiradialProjection,
  fragilityBand,
  isInsideRhomboid,
  pathwayLanes,
  projectTetraToSvg,
  simplexFramePolygon,
  tetrahedronBarycentric,
  trajectoryFor,
  trajectoryStepsDetailed,
  uncertaintyBadge
} from "../lib/b10Views";
import { posteriorResult } from "../lib/inference";

describe("b10 view helpers", () => {
  it("projects four probabilities to finite 2D coordinates inside rhomboid", () => {
    const cases = [
      posteriorResult(learnt, {}).probabilities,
      posteriorResult(learnt, { Urin_Nitrite: "Detected", CRPLevel: "Above70" }).probabilities,
      { EColi: 0, OtherGramNeg: 0.42, GramPos: 0.58, None: 0 },
      { EColi: 0.25, OtherGramNeg: 0.25, GramPos: 0.25, None: 0.25 }
    ];
    cases.forEach((probabilities) => {
      const point = equiradialProjection(probabilities);
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(isInsideRhomboid(point)).toBe(true);
    });
  });

  it("widens fragility band when entropy is high or margin is low", () => {
    const tight = fragilityBand(0.4, 0.8, 0.25);
    const wide = fragilityBand(0.4, 1.8, 0.08);
    expect(wide.high - wide.low).toBeGreaterThan(tight.high - tight.low);
  });

  it("labels uncertainty badge tiers", () => {
    expect(uncertaintyBadge(0.9, 0.3)).toBe("stable rank");
    expect(uncertaintyBadge(1.4, 0.15)).toBe("watch closely");
    expect(uncertaintyBadge(1.7, 0.08)).toBe("rank fragile");
  });

  it("returns pathway lanes for a random case", () => {
    const lanes = pathwayLanes(learnt, { Urin_Nitrite: "Detected", CRPLevel: "Above70" });
    expect(lanes.length).toBe(5);
    expect(lanes.some((lane) => lane.id === "infection")).toBe(true);
  });

  it("places four corners on a diamond frame", () => {
    const frame = simplexFramePolygon();
    expect(frame.split(" ").length).toBe(4);
    const ecoli = cornerPosition("EColi");
    expect(ecoli.y).toBeLessThan(50);
    const none = cornerPosition("None");
    expect(none.x).toBeLessThan(50);
  });

  it("builds trajectory with cumulative evidence", () => {
    const evidence = { Urin_Nitrite: "Detected", CRPLevel: "Above70" };
    const series = trajectoryFor(learnt, evidence, "EColi");
    expect(series.length).toBeGreaterThanOrEqual(2);
    expect(series[0].label).toBe("empty");
    expect(series.every((point) => point.value >= 0 && point.value <= 1)).toBe(true);
  });

  it("trajectory steps include deltas and labels", () => {
    const steps = trajectoryStepsDetailed(learnt, { AgeGroup: "Btw2And5Yr" }, "EColi");
    expect(steps.length).toBeGreaterThan(1);
    expect(steps[1].displayLabel.length).toBeGreaterThan(0);
    expect(typeof steps[1].deltaFromPrev).toBe("number");
  });

  it("tetrahedron projection is finite", () => {
    const posterior = posteriorResult(learnt, { Urin_Nitrite: "Detected" }).probabilities;
    const point3 = tetrahedronBarycentric(posterior);
    const svg = projectTetraToSvg(point3);
    expect(Number.isFinite(svg.x)).toBe(true);
    expect(Number.isFinite(svg.y)).toBe(true);
  });

  it("CauseUTI CPT rows include effective cases from learnt model", () => {
    const causeNode = learnt.nodes.find((n) => n.id === "CauseUTI");
    expect(causeNode?.numCases?.length).toBeGreaterThan(0);
    const rows = causeUtiCptTable(learnt, {});
    expect(rows.length).toBe(64);
    expect(rows.some((row) => row.effectiveCases != null && row.effectiveCases > 0)).toBe(true);
  });

  it("separates opposite 50/50 mixes in 3D tetrahedron", () => {
    const mixA = tetrahedronBarycentric({ EColi: 0.5, GramPos: 0.5, OtherGramNeg: 0, None: 0 });
    const mixB = tetrahedronBarycentric({ EColi: 0, GramPos: 0, OtherGramNeg: 0.5, None: 0.5 });
    const dist = Math.hypot(mixA.x - mixB.x, mixA.y - mixB.y, mixA.z - mixB.z);
    expect(dist).toBeGreaterThan(0.01);
  });
});
