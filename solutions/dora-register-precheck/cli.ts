#!/usr/bin/env node
// Usage: node cli.ts --register samples/register.csv [--reference-date 2026-12-31] [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { precheck, readRegister } from "./src/precheck.ts";
import { toIssuesCsv, toMarkdown } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.register) fail("usage: node cli.ts --register <register.csv> [--reference-date YYYY-MM-DD] [--out <dir>]");
const list = readRegister(parseCsv(readText(flags.register)));
const issues = precheck(list, { referenceDate: flags["reference-date"] });
const md = toMarkdown(list, issues);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "dora-precheck.md": md, "dora-issues.csv": toIssuesCsv(issues) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
process.exitCode = issues.some((i) => i.severity === "error") ? 1 : 0;
