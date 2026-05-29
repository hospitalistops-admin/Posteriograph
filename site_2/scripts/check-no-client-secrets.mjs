import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, "../src");

const forbidden = [
  /OPENAI_API_KEY/i,
  /VITE_OPENAI/i,
  /sk-[a-zA-Z0-9]{10,}/
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let failed = false;
for (const file of walk(srcRoot)) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      console.error(`Forbidden secret pattern in ${path.relative(srcRoot, file)}: ${pattern}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("No client secret patterns found in site_2/src");
