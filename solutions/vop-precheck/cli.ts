#!/usr/bin/env node
// Usage: node cli.ts --payments samples/payments.csv [--master samples/supplier-master.csv] [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { precheck, readMaster, readPayments } from "./src/precheck.ts";
import { toMarkdown, toResultCsv } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.payments) fail("usage: node cli.ts --payments <file.csv> [--master <supplier-master.csv>] [--out <dir>]");
const list = precheck(readPayments(parseCsv(readText(flags.payments))), flags.master ? readMaster(parseCsv(readText(flags.master))) : []);
const md = toMarkdown(list);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "vop-precheck.md": md, "vop-precheck.csv": toResultCsv(list) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
process.exitCode = list.some((r) => r.outcome === "WILL BE REJECTED" || r.outcome === "LIKELY NO MATCH") ? 1 : 0;
