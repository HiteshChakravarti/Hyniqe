#!/usr/bin/env node
// Usage: node cli.ts <file|folder> [more…] [--title "USD nostro recon"] [--out out/] [--prompt]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fail, parseArgs, writeOutputs } from "../shared/cli.ts";
import { buildRunbook } from "./src/extract.ts";
import { aiPrompt, gapsCsv, toMarkdown } from "./src/report.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
if (!positional.length) fail("usage: node cli.ts <file|folder> [...] [--title <t>] [--out <dir>] [--prompt]");
const inputs: { name: string; text: string }[] = [];
const add = (p: string) => {
  const st = statSync(p);
  if (st.isDirectory()) return readdirSync(p).sort().forEach((n) => add(join(p, n)));
  if (st.size > 1_000_000) return;
  const text = readFileSync(p, "utf8");
  if (!text.includes("\u0000")) inputs.push({ name: basename(p), text });
};
positional.forEach(add);
const rb = buildRunbook(inputs, flags.title);
const md = toMarkdown(rb);
const prompt = aiPrompt(rb, inputs);
process.stdout.write(flags.prompt ? prompt + "\n" : md);
const written = writeOutputs(flags.out, { "runbook.md": md, "knowledge-gaps.csv": gapsCsv(rb), "runbook.json": JSON.stringify(rb, null, 2), "ai-prompt.txt": prompt });
if (written.length) process.stderr.write(`Wrote ${written.join(", ")}\n`);
