#!/usr/bin/env node
// Usage: node cli.ts --text "…query…"  |  node cli.ts --file query.txt  [--json]
import { fail, parseArgs, readText } from "../shared/cli.ts";
import { analyse } from "./src/investigate.ts";
import { toMarkdown } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
const text = flags.text ?? (flags.file ? readText(flags.file) : "");
if (!text.trim()) fail('usage: node cli.ts --text "<query>" | --file <query.txt> [--json]');
const c = analyse(text);
process.stdout.write(flags.json ? JSON.stringify(c, null, 2) + "\n" : toMarkdown(c));
