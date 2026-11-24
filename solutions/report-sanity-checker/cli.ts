#!/usr/bin/env node
// Usage: node cli.ts --report samples/derivatives-report.csv [--required uti,notional] [--report-date 2026-11-24] [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { checkReport } from "./src/check.ts";
import { toIssuesCsv, toMarkdown } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.report) fail("usage: node cli.ts --report <file.csv> [--required col1,col2] [--report-date YYYY-MM-DD] [--out <dir>]");
const res = checkReport(parseCsv(readText(flags.report)), { required: flags.required?.split(","), reportDate: flags["report-date"] });
const md = toMarkdown(res);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "report-check.md": md, "report-issues.csv": toIssuesCsv(res.issues) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
process.exitCode = res.issues.some((i) => i.severity === "error") ? 1 : 0;
