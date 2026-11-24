#!/usr/bin/env node
// Usage: node cli.ts --mandates samples/mandates.json --payments samples/agent-payments.csv [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { checkPayments, readPayments, validateMandateFile } from "./src/checker.ts";
import { toMarkdown, toResultCsv } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.mandates || !flags.payments) {
  fail("usage: node cli.ts --mandates <mandates.json> --payments <payments.csv> [--out <dir>] [--json]");
}
let raw: unknown;
try {
  raw = JSON.parse(readText(flags.mandates));
} catch (e) {
  fail(`could not read mandates JSON: ${(e as Error).message}`);
}
const { file, errors } = validateMandateFile(raw);
if (!file || errors.length) fail(errors.join("\n"));
const result = checkPayments(file, readPayments(parseCsv(readText(flags.payments))));
const md = toMarkdown(result);
if (flags.json) process.stdout.write(JSON.stringify(result.summary, null, 2) + "\n");
else process.stdout.write(md);
const written = writeOutputs(flags.out, {
  "mandate-check.md": md,
  "mandate-check.csv": toResultCsv(result),
  "mandate-check.json": JSON.stringify(result, null, 2),
});
if (written.length) process.stderr.write(`Wrote ${written.join(", ")}\n`);
process.exitCode = result.summary.block > 0 ? 1 : 0;
