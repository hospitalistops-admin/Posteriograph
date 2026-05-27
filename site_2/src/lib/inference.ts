import type {
  BnModel,
  BnNode,
  EvidenceDelta,
  EvidenceSet,
  PosteriorResult,
  ScenarioBranch
} from "../types";

interface Factor {
  vars: string[];
  values: number[];
}

const TARGET_ID = "CauseUTI";

export function getNode(model: BnModel, nodeId: string): BnNode {
  const node = model.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown node: ${nodeId}`);
  return node;
}

export function entropy(probabilities: number[]): number {
  return probabilities.reduce((sum, probability) => {
    if (probability <= 0) return sum;
    return sum - probability * Math.log2(probability);
  }, 0);
}

export function inferPosterior(
  model: BnModel,
  queryId: string,
  evidence: EvidenceSet = {}
): Record<string, number> {
  const queryNode = getNode(model, queryId);
  const cards = new Map(model.nodes.map((node) => [node.id, node.states.length]));
  const evidenceIndexes = buildEvidenceIndexes(model, evidence);
  let factors = model.nodes.map((node) => reduceFactor(makeNodeFactor(node), evidenceIndexes, cards));

  const hidden = model.nodes
    .map((node) => node.id)
    .filter((nodeId) => nodeId !== queryId && !(nodeId in evidenceIndexes));
  const orderedHidden = orderVariables(model, hidden);

  orderedHidden.forEach((variable) => {
    const selected = factors.filter((factor) => factor.vars.includes(variable));
    if (selected.length === 0) return;
    const rest = factors.filter((factor) => !factor.vars.includes(variable));
    const product = selected.reduce((acc, factor) => multiplyFactors(acc, factor, cards));
    rest.push(sumOut(product, variable, cards));
    factors = rest;
  });

  const combined = factors.reduce((acc, factor) => multiplyFactors(acc, factor, cards));
  const queryOnly = combined.vars
    .filter((variable) => variable !== queryId)
    .reduce((factor, variable) => sumOut(factor, variable, cards), combined);

  const queryIndex = queryOnly.vars.indexOf(queryId);
  if (queryIndex < 0) {
    const observedState = evidence[queryId];
    return Object.fromEntries(queryNode.states.map((state) => [state, state === observedState ? 1 : 0]));
  }

  const raw = queryNode.states.map((_, stateIndex) =>
    sumMatchingState(queryOnly, queryId, stateIndex, cards)
  );
  const normalized = normalize(raw);
  return Object.fromEntries(queryNode.states.map((state, index) => [state, normalized[index]]));
}

export function posteriorResult(model: BnModel, evidence: EvidenceSet): PosteriorResult {
  const target = getNode(model, TARGET_ID);
  const probabilities = inferPosterior(model, TARGET_ID, evidence);
  const probabilityValues = target.states.map((state) => probabilities[state] ?? 0);
  const ranked = target.states
    .map((state) => ({ state, probability: probabilities[state] ?? 0 }))
    .sort((a, b) => b.probability - a.probability);

  return {
    probabilities,
    entropy: entropy(probabilityValues),
    topState: ranked[0]?.state ?? target.states[0],
    margin: (ranked[0]?.probability ?? 0) - (ranked[1]?.probability ?? 0),
    evidenceDeltas: evidenceDeltas(model, evidence, probabilities)
  };
}

export function evidenceDeltas(
  model: BnModel,
  evidence: EvidenceSet,
  currentProbabilities = inferPosterior(model, TARGET_ID, evidence)
): EvidenceDelta[] {
  const target = getNode(model, TARGET_ID);

  return Object.entries(evidence)
    .filter(([nodeId]) => nodeId !== TARGET_ID)
    .map(([nodeId, selectedState]) => {
      const node = getNode(model, nodeId);
      const ablated = { ...evidence };
      delete ablated[nodeId];
      const withoutNode = inferPosterior(model, TARGET_ID, ablated);
      const deltas = Object.fromEntries(
        target.states.map((state) => [state, (currentProbabilities[state] ?? 0) - (withoutNode[state] ?? 0)])
      );
      const maxAbsDelta = Math.max(...Object.values(deltas).map((delta) => Math.abs(delta)));

      return {
        nodeId,
        title: node.title,
        selectedState,
        group: node.group,
        deltas,
        maxAbsDelta
      };
    })
    .sort((a, b) => b.maxAbsDelta - a.maxAbsDelta);
}

export function scenarioBranches(
  model: BnModel,
  evidence: EvidenceSet,
  candidates: string[],
  limit = 6
): ScenarioBranch[] {
  return candidates
    .filter((nodeId) => !(nodeId in evidence))
    .flatMap((nodeId) => {
      const node = getNode(model, nodeId);
      return node.states.slice(0, 3).map((state) => {
        const probabilities = inferPosterior(model, TARGET_ID, { ...evidence, [nodeId]: state });
        const target = getNode(model, TARGET_ID);
        const values = target.states.map((targetState) => probabilities[targetState] ?? 0);
        return {
          nodeId,
          title: node.title,
          state,
          probabilities,
          entropy: entropy(values)
        };
      });
    })
    .sort((a, b) => a.entropy - b.entropy)
    .slice(0, limit);
}

function makeNodeFactor(node: BnNode): Factor {
  return {
    vars: [...node.parents, node.id],
    values: node.cpt
  };
}

function buildEvidenceIndexes(model: BnModel, evidence: EvidenceSet): Record<string, number> {
  return Object.fromEntries(
    Object.entries(evidence).map(([nodeId, state]) => {
      const node = getNode(model, nodeId);
      const stateIndex = node.states.indexOf(state);
      if (stateIndex < 0) throw new Error(`Unknown state ${state} for node ${nodeId}`);
      return [nodeId, stateIndex];
    })
  );
}

function orderVariables(model: BnModel, hidden: string[]): string[] {
  const hiddenSet = new Set(hidden);
  const fromModel = model.eliminationOrder.filter((nodeId) => hiddenSet.has(nodeId));
  const missing = hidden.filter((nodeId) => !fromModel.includes(nodeId));
  return [...fromModel, ...missing];
}

function reduceFactor(
  factor: Factor,
  evidence: Record<string, number>,
  cards: Map<string, number>
): Factor {
  return Object.entries(evidence).reduce((current, [variable, stateIndex]) => {
    if (!current.vars.includes(variable)) return current;
    return restrictFactor(current, variable, stateIndex, cards);
  }, factor);
}

function restrictFactor(
  factor: Factor,
  variable: string,
  stateIndex: number,
  cards: Map<string, number>
): Factor {
  const variableIndex = factor.vars.indexOf(variable);
  const newVars = factor.vars.filter((item) => item !== variable);
  const newSize = newVars.reduce((size, item) => size * cards.get(item)!, 1);
  const values = new Array(newSize);

  for (let index = 0; index < newSize; index += 1) {
    const assignment = decodeIndex(index, newVars, cards);
    assignment.splice(variableIndex, 0, stateIndex);
    values[index] = factor.values[indexFromAssignment(assignment, factor.vars, cards)];
  }

  return { vars: newVars, values };
}

function multiplyFactors(a: Factor, b: Factor, cards: Map<string, number>): Factor {
  const vars = [...a.vars, ...b.vars.filter((variable) => !a.vars.includes(variable))];
  const size = vars.reduce((product, variable) => product * cards.get(variable)!, 1);
  const values = new Array(size);
  const aIndexes = a.vars.map((variable) => vars.indexOf(variable));
  const bIndexes = b.vars.map((variable) => vars.indexOf(variable));

  for (let index = 0; index < size; index += 1) {
    const assignment = decodeIndex(index, vars, cards);
    const aAssignment = aIndexes.map((assignmentIndex) => assignment[assignmentIndex]);
    const bAssignment = bIndexes.map((assignmentIndex) => assignment[assignmentIndex]);
    values[index] =
      a.values[indexFromAssignment(aAssignment, a.vars, cards)] *
      b.values[indexFromAssignment(bAssignment, b.vars, cards)];
  }

  return { vars, values };
}

function sumOut(factor: Factor, variable: string, cards: Map<string, number>): Factor {
  const variableIndex = factor.vars.indexOf(variable);
  if (variableIndex < 0) return factor;

  const vars = factor.vars.filter((item) => item !== variable);
  const size = vars.reduce((product, item) => product * cards.get(item)!, 1);
  const values = new Array(size).fill(0);
  const states = cards.get(variable)!;

  for (let index = 0; index < size; index += 1) {
    const assignment = decodeIndex(index, vars, cards);
    let sum = 0;
    for (let stateIndex = 0; stateIndex < states; stateIndex += 1) {
      const fullAssignment = [...assignment];
      fullAssignment.splice(variableIndex, 0, stateIndex);
      sum += factor.values[indexFromAssignment(fullAssignment, factor.vars, cards)];
    }
    values[index] = sum;
  }

  return { vars, values };
}

function sumMatchingState(
  factor: Factor,
  variable: string,
  stateIndex: number,
  cards: Map<string, number>
): number {
  const variableIndex = factor.vars.indexOf(variable);
  return factor.values.reduce((sum, value, index) => {
    const assignment = decodeIndex(index, factor.vars, cards);
    return assignment[variableIndex] === stateIndex ? sum + value : sum;
  }, 0);
}

function normalize(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 1 / values.length);
  return values.map((value) => value / total);
}

function decodeIndex(index: number, vars: string[], cards: Map<string, number>): number[] {
  const assignment = new Array(vars.length);
  let remainder = index;

  for (let i = vars.length - 1; i >= 0; i -= 1) {
    const card = cards.get(vars[i])!;
    assignment[i] = remainder % card;
    remainder = Math.floor(remainder / card);
  }

  return assignment;
}

function indexFromAssignment(assignment: number[], vars: string[], cards: Map<string, number>): number {
  return assignment.reduce((index, stateIndex, variableIndex) => {
    const cardProduct = vars
      .slice(variableIndex + 1)
      .reduce((product, variable) => product * cards.get(variable)!, 1);
    return index + stateIndex * cardProduct;
  }, 0);
}
