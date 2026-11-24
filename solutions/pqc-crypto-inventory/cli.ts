#!/usr/bin/env node
// Usage: node cli.ts <folder-or-file> [more paths…] [--out out/] [--include-comments]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fail, parseArgs, writeOutputs } from "../shared/cli.ts";
import { isScannable, scanText, summarise, toCbom, type Finding } from "./src/scan.ts";
import { toMarkdown, toResultCsv } from "./src/report.ts";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "target", "vendor", ".venv", "venv", "__pycache__", ".idea", ".gradle", "out"]);
const MAX_BYTES = 2_000_000;

const { flags, positional } = parseArgs(process.argv.slice(2));
if (!positional.length) fail("usage: node cli.ts <folder-or-file> [...] [--out <dir>]");

const findings: Finding[] = [];
let files = 0;
function walk(path: string, root: string) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) if (!SKIP_DIRS.has(name)) walk(join(path, name), root);
    return;
  }
  if (!isScannable(path) || st.size > MAX_BYTES) return;
  const text = readFileSync(path, "utf8");
  if (text.includes("\u0000")) return; // binary
  files++;
  findings.push(...scanText(relative(root, path) || path, text));
}
for (const p of positional) walk(p, statSync(p).isDirectory() ? p : ".");

const summary = summarise(findings, files);
const md = toMarkdown(findings, summary);
process.stdout.write(flags.json ? JSON.stringify(summary, null, 2) + "\n" : md);
const written = writeOutputs(flags.out, {
  "pqc-inventory.md": md,
  "pqc-inventory.csv": toResultCsv(findings),
  "cbom.json": JSON.stringify(toCbom(findings, positional.join(",")), null, 2),
});
if (written.length) process.stderr.write(`Wrote ${written.join(", ")}\n`);
process.exitCode = summary.by_category.BROKEN_NOW + summary.by_category.SECRET_EXPOSED > 0 ? 1 : 0;
