#!/usr/bin/env node
// Usage: node cli.ts --source legacy.csv --target new.csv --key customer_id [--map "cust_name:full_name,dob:date_of_birth"] [--tolerance 0.01] [--ignore-case] [--ignore-leading-zeros] [--ignore updated_at] [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { reconcile } from "./src/reconcile.ts";
import { diffsCsv, toMarkdown } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.source || !flags.target || !flags.key) fail('usage: node cli.ts --source <src.csv> --target <tgt.csv> --key <col[,col]> [--map "a:b,c:d"] [--tolerance 0.01] [--ignore-case] [--ignore-leading-zeros] [--ignore col1,col2] [--out <dir>]');
const map = Object.fromEntries((flags.map ?? "").split(",").filter(Boolean).map((p) => p.split(":").map((x) => x.trim())));
const r = reconcile(parseCsv(readText(flags.source)), parseCsv(readText(flags.target)), { key: flags.key.split(","), map, tolerance: Number(flags.tolerance ?? 0), ignoreCase: !!flags["ignore-case"], ignoreLeadingZeros: !!flags["ignore-leading-zeros"], ignoreFields: flags.ignore?.split(",") });
const md = toMarkdown(r);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "reconciliation.md": md, "differences.csv": diffsCsv(r) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
process.exitCode = md.includes("NOT RECONCILED") ? 1 : 0;
