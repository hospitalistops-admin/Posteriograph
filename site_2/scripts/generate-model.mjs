import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(siteRoot, "..");
const referenceRoot = path.join(projectRoot, "reference");
const outDir = path.join(siteRoot, "src", "data");

const files = [
  {
    source: "learnt",
    input: path.join(referenceRoot, "Applied_BN_v2.2_learnt.dne"),
    output: path.join(outDir, "model.generated.json")
  },
  {
    source: "priors",
    input: path.join(referenceRoot, "Applied_BN_v2.2_priors.dne"),
    output: path.join(outDir, "priors.generated.json")
  }
];

const statusById = {
  AgeGroup: "Observable",
  Sex: "Observable",
  PrevUriKidProbs: "Observable",
  diarrhea: "Observable",
  OnAbxEDGroup3: "Observable",
  EcoliPresence: "Latent",
  OtherGramNegPresence: "Latent",
  GramPosPresence: "Latent",
  CauseUTI: "Latent",
  CurrPhenotype: "LatentSummary",
  EmpricAbxGroup3: "Observable",
  CollMethod: "Observable",
  Epithelials: "Observable",
  ContaminationRisk: "Latent",
  Microscopy_bacts: "Observable",
  EColi: "Observable",
  OtherGramNeg: "Observable",
  GramPos: "Observable",
  Urin_LeucEst: "Observable",
  Urin_Nitrite: "Observable",
  Urin_Leuc: "Observable",
  WCCLevel: "Observable",
  CRPLevel: "Observable",
  NeutLevel: "Observable",
  UrinSym_PainOrDiscomf: "Observable",
  AbdoPain: "Observable",
  UrinSym_haematuria: "Observable",
  UrinSym_smelly: "Observable",
  UltraSound: "Observable",
  RespSymp: "Observable",
  FeverPR: "Observable",
  TemperatureLvl2: "Observable",
  Irritable: "Observable",
  Lethargy: "Observable",
  NauseaOrVomit: "Observable",
  PoorIntake: "Observable"
};

const groupPriority = {
  contamination: 6,
  infection: 5,
  labs: 4,
  management: 3,
  overlap: 2,
  background: 1,
  other: 0
};

const nodeSetGroups = {
  Backgrounds: "background",
  Managements: "management",
  Manage: "management",
  Labs: "labs",
  Infect: "infection",
  Overlap: "overlap",
  Contam: "contamination"
};

function stripLineComments(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`Unmatched brace at ${openIndex}`);
}

function findMatchingParen(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error(`Unmatched parenthesis at ${openIndex}`);
}

function extractNodeBlocks(text) {
  const blocks = [];
  const nodeRegex = /\bnode\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g;
  let match;

  while ((match = nodeRegex.exec(text)) !== null) {
    const id = match[1];
    const openIndex = text.indexOf("{", match.index);
    const closeIndex = findMatchingBrace(text, openIndex);
    blocks.push({ id, block: text.slice(openIndex + 1, closeIndex) });
    nodeRegex.lastIndex = closeIndex + 1;
  }

  return blocks;
}

function extractList(block, key) {
  const keyIndex = block.indexOf(`${key} =`);
  if (keyIndex < 0) return [];
  const openIndex = block.indexOf("(", keyIndex);
  const closeIndex = findMatchingParen(block, openIndex);
  return block
    .slice(openIndex + 1, closeIndex)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractNumbers(block, key) {
  const keyIndex = block.indexOf(`${key} =`);
  if (keyIndex < 0) return [];
  const openIndex = block.indexOf("(", keyIndex);
  const closeIndex = findMatchingParen(block, openIndex);
  const cleaned = stripLineComments(block.slice(openIndex + 1, closeIndex));
  return (cleaned.match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
}

function extractString(block, key) {
  const regex = new RegExp(`${key}\\s*=\\s*"((?:\\\\.|[^"])*)"`);
  const match = block.match(regex);
  return match ? match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : undefined;
}

function extractKind(block) {
  const match = block.match(/\bkind\s*=\s*([A-Z]+)/);
  return match ? match[1] : "NATURE";
}

function extractPosition(block) {
  const match = block.match(/center\s*=\s*\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)/);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : undefined;
}

function parseNodeSets(text) {
  const groupByNode = new Map();
  const regex = /NodeSet\s+([A-Za-z]+)\s*\{Nodes\s*=\s*\(([^)]*)\);?\};/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const group = nodeSetGroups[match[1]];
    if (!group) continue;

    const nodes = match[2]
      .split(",")
      .map((node) => node.trim())
      .filter(Boolean);

    nodes.forEach((nodeId) => {
      const current = groupByNode.get(nodeId) ?? "other";
      if (groupPriority[group] > groupPriority[current]) {
        groupByNode.set(nodeId, group);
      }
    });
  }

  return groupByNode;
}

function parseEliminationOrder(text) {
  const match = text.match(/ElimOrder\s*=\s*\(([^)]*)\)/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((node) => node.trim())
    .filter(Boolean);
}

function parseModel(input, source) {
  const text = fs.readFileSync(input, "utf8");
  const groupByNode = parseNodeSets(text);
  const nodes = extractNodeBlocks(text).map(({ id, block }) => {
    const states = extractList(block, "states");
    const parents = extractList(block, "parents");
    const cpt = extractNumbers(block, "probs");
    const numCasesRaw = extractNumbers(block, "numcases");
    const numCases = numCasesRaw.length > 0 ? numCasesRaw : undefined;
    const belief = extractNumbers(block, "belief");
    const title = extractString(block, "title") ?? id;
    const comment = extractString(block, "comment");
    const group = groupByNode.get(id) ?? "other";

    if (states.length === 0) {
      throw new Error(`Node ${id} has no states`);
    }
    if (cpt.length === 0) {
      throw new Error(`Node ${id} has no CPT probabilities`);
    }

    return {
      id,
      title,
      states,
      parents,
      cpt,
      ...(numCases ? { numCases } : {}),
      belief,
      kind: extractKind(block),
      status: statusById[id] ?? "Observable",
      group,
      ...(extractPosition(block) ? { position: extractPosition(block) } : {}),
      ...(comment ? { comment } : {})
    };
  });

  const knownNodes = new Set(nodes.map((node) => node.id));
  const edges = nodes.flatMap((node) =>
    node.parents
      .filter((parent) => knownNodes.has(parent))
      .map((parent) => ({ from: parent, to: node.id }))
  );

  return {
    nodes,
    edges,
    targetId: "CauseUTI",
    source,
    eliminationOrder: parseEliminationOrder(text)
  };
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const model = parseModel(file.input, file.source);
  fs.writeFileSync(file.output, `${JSON.stringify(model, null, 2)}\n`);
  console.log(`Generated ${path.relative(siteRoot, file.output)} with ${model.nodes.length} nodes`);
}
