#!/usr/bin/env node
// Usage: node cli.ts --trades samples/trades.csv --ssis samples/ssis.csv [--assume-t1] [--holidays 2027-12-25,2027-12-26] [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { assessTrades, DEFAULT_CONFIG, readSsis, readTrades } from "./src/predict.ts";
import { toMarkdown, toResultCsv } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.trades) fail("usage: node cli.ts --trades <trades.csv> --ssis <ssis.csv> [--assume-t1] [--holidays d1,d2] [--cutoff 23:59] [--out <dir>]");
const cfg = { ...DEFAULT_CONFIG, assume_t1: !!flags["assume-t1"], holidays: flags.holidays ? flags.holidays.split(",") : [], instruction_cutoff: flags.cutoff ?? DEFAULT_CONFIG.instruction_cutoff };
const list = assessTrades(readTrades(parseCsv(readText(flags.trades))), flags.ssis ? readSsis(parseCsv(readText(flags.ssis))) : [], cfg);
const md = toMarkdown(list);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "t1-report.md": md, "t1-report.csv": toResultCsv(list) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
process.exitCode = list.some((a) => a.risk === "HIGH") ? 1 : 0;
