#!/usr/bin/env node
// Blank template:  node cli.ts --template > my-ai-inventory.csv
// Build register:  node cli.ts --inventory samples/ai-inventory.csv [--out out/]
import { parseCsv } from "../shared/table.ts";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { classify, readUseCases } from "./src/classify.ts";
import { templateCsv, toMarkdown, toRegisterCsv } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (flags.template) {
  process.stdout.write(templateCsv());
} else if (flags.inventory) {
  const rows = parseCsv(readText(flags.inventory)).filter((r) => !/^your reference/i.test(Object.values(r)[0] ?? ""));
  const list = readUseCases(rows).map((u) => classify(u, flags.today ? new Date(flags.today) : new Date()));
  const md = toMarkdown(list);
  process.stdout.write(md);
  const written = writeOutputs(flags.out, { "ai-register.md": md, "ai-register.csv": toRegisterCsv(list), "ai-register.json": JSON.stringify(list, null, 2) });
  if (written.length) process.stderr.write(`Wrote ${written.join(", ")}\n`);
  process.exitCode = list.some((e) => e.priority === "P1") ? 1 : 0;
} else {
  fail("use --template to get a blank inventory, or --inventory <file.csv> to build the register.");
}
