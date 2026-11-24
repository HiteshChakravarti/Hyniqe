// Run the browser engine under Node: node scripts/js_scan.mjs <file>
import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// engine.js is a UMD file: it sets module.exports under CommonJS and globalThis.HyniqeShield under ESM
const mod = await import(pathToFileURL(join(here, "..", "web", "engine.js")).href);
const { createScanner } = globalThis.HyniqeShield || mod.default;
const rules = JSON.parse(readFileSync(join(here, "..", "hyniqe_shield", "rules.json"), "utf8"));
const scanner = createScanner(rules);
const file = process.argv[2];
const text = readFileSync(file, "utf8");
const res = scanner.summarise(file, [scanner.scanText(text, basename(file))]);
process.stdout.write(JSON.stringify(res, null, 2));
