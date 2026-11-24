#!/usr/bin/env node
// Check one pasted request:   node cli.ts --text "message..." [--domains acme.com] [--from "Jane Doe" --title CFO --channel whatsapp]
// Audit an approval log:      node cli.ts --log samples/approval-log.csv --domains acme.com [--policy policy.json] [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { assess, DEFAULT_POLICY, readRequests, requestFromText, type Policy } from "./src/assess.ts";
import { oneToMarkdown, toMarkdown, toResultCsv } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
let policy: Policy = { ...DEFAULT_POLICY };
if (flags.policy) policy = { ...policy, ...JSON.parse(readText(flags.policy)) };
if (flags.domains) policy.company_domains = flags.domains.split(",").map((d) => d.trim());

if (flags.text || flags["text-file"]) {
  const text = flags.text ?? readText(flags["text-file"]);
  const req = requestFromText(text, {
    ...(flags.from ? { requested_by: flags.from } : {}),
    ...(flags.title ? { requester_title: flags.title } : {}),
    ...(flags.channel ? { channel: flags.channel.toLowerCase() } : {}),
  });
  const a = assess(req, policy);
  process.stdout.write(`# Verify-Before-You-Pay\n\n${oneToMarkdown(a)}\n`);
  process.exitCode = a.level === "CRITICAL" || a.level === "HIGH" ? 1 : 0;
} else if (flags.log) {
  const list = readRequests(parseCsv(readText(flags.log))).map((r) => assess(r, policy));
  const md = toMarkdown(list);
  process.stdout.write(md);
  const written = writeOutputs(flags.out, { "verify-report.md": md, "verify-report.csv": toResultCsv(list), "verify-report.json": JSON.stringify(list, null, 2) });
  if (written.length) process.stderr.write(`Wrote ${written.join(", ")}\n`);
  process.exitCode = list.some((a) => a.breaches.length) ? 1 : 0;
} else {
  fail("give --text \"...\" (or --text-file) to check one request, or --log <approvals.csv> to audit a log. Add --domains yourcompany.com.");
}
