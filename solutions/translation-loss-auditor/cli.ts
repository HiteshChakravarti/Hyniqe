#!/usr/bin/env node
// One pair:  node cli.ts --mx samples/pacs008.xml --mt samples/mt103.txt
// Batch:     node cli.ts --dir folder/   (pairs *.xml with MT files by UETR)   [--out out/]
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { audit, parseMt103, parsePacs008 } from "./src/audit.ts";
import { type PairResult, toMarkdown, toResultCsv } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
const pairs: PairResult[] = [];
if (flags.mx && flags.mt) {
  const mx = parsePacs008(readText(flags.mx));
  pairs.push({ name: flags.mx.split("/").pop() as string, uetr: mx.uetr, findings: audit(mx, parseMt103(readText(flags.mt))) });
} else if (flags.dir) {
  const files = readdirSync(flags.dir).map((f) => join(flags.dir, f));
  const mts = files.filter((f) => !f.endsWith(".xml")).map((f) => parseMt103(readText(f)));
  for (const f of files.filter((f) => f.endsWith(".xml"))) {
    const mx = parsePacs008(readText(f));
    const mt = mts.find((m) => m.uetr && m.uetr === mx.uetr);
    if (!mt) { pairs.push({ name: f.split("/").pop() as string, uetr: mx.uetr, findings: [{ rule: "NO_MT_FOUND", severity: "critical", field: "UETR", mx: mx.uetr, mt: "(none)", message: "No MT103 with this UETR in the folder." }] }); continue; }
    pairs.push({ name: f.split("/").pop() as string, uetr: mx.uetr, findings: audit(mx, mt) });
  }
} else fail("usage: node cli.ts --mx <pacs008.xml> --mt <mt103.txt> | --dir <folder> [--out <dir>]");
const md = toMarkdown(pairs);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "translation-audit.md": md, "translation-audit.csv": toResultCsv(pairs) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
process.exitCode = pairs.some((p) => p.findings.some((f) => f.severity === "critical")) ? 1 : 0;
