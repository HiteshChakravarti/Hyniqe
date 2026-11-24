#!/usr/bin/env node
// Usage: node cli.ts <folder-or-files…> [--out out/]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { inflateRawSync } from "node:zlib";
import { fail, parseArgs, writeOutputs } from "../shared/cli.ts";
import { scanWorkbook, type FileReport } from "./src/scan.ts";
import { registerCsv, toMarkdown } from "./src/report.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
if (!positional.length) fail("usage: node cli.ts <folder-or-files…> [--out <dir>]");
const inflate = async (d: Uint8Array) => new Uint8Array(inflateRawSync(d));
const files: string[] = [];
const walk = (p: string) => { const s = statSync(p); if (s.isDirectory()) readdirSync(p).forEach((n) => walk(join(p, n))); else if (/\.(xlsx|xlsm|xls|xltx|xltm)$/i.test(p) && !/(^|\/)~\$/.test(p)) files.push(p); };
positional.forEach(walk);
const reports: FileReport[] = [];
for (const f of files) {
  try { reports.push(await scanWorkbook(relative(".", f), new Uint8Array(readFileSync(f)), inflate)); }
  catch (e) { process.stderr.write(`Could not read ${f}: ${(e as Error).message}\n`); }
}
const md = toMarkdown(reports);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "euc-register.md": md, "euc-register.csv": registerCsv(reports) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
