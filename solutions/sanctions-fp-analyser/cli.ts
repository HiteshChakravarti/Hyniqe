#!/usr/bin/env node
// Usage: node cli.ts --alerts samples/alerts.csv [--min-clears 3] [--minutes 30] [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { analyse, readAlerts } from "./src/analyse.ts";
import { goodGuysCsv, toMarkdown } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.alerts) fail("usage: node cli.ts --alerts <alerts.csv> [--min-clears 3] [--minutes 30] [--out <dir>]");
const a = analyse(readAlerts(parseCsv(readText(flags.alerts))), { minClears: Number(flags["min-clears"] ?? 3), defaultMinutes: Number(flags.minutes ?? 30) });
const md = toMarkdown(a);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "fp-analysis.md": md, "good-guy-candidates.csv": goodGuysCsv(a) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
