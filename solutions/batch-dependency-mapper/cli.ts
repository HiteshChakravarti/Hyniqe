#!/usr/bin/env node
// Usage: node cli.ts <folder-or-files…> [--out out/]   (JCL, crontab, Control-M XML export, shell scripts)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { fail, parseArgs, writeOutputs } from "../shared/cli.ts";
import { buildGraph, parseAll } from "./src/map.ts";
import { edgesCsv, svg, toMarkdown } from "./src/report.ts";

const { flags, positional } = parseArgs(process.argv.slice(2));
if (!positional.length) fail("usage: node cli.ts <folder-or-files…> [--out <dir>]");
const files: { name: string; text: string }[] = [];
const walk = (p: string) => { const s = statSync(p); if (s.isDirectory()) readdirSync(p).sort().forEach((n) => walk(join(p, n))); else if (s.size < 2_000_000) files.push({ name: basename(p), text: readFileSync(p, "utf8") }); };
positional.forEach(walk);
const { jobs, skipped } = parseAll(files);
const g = buildGraph(jobs);
const md = toMarkdown(g, skipped);
process.stdout.write(md);
const w = writeOutputs(flags.out, { "batch-map.md": md, "batch-map.svg": svg(g), "dependencies.csv": edgesCsv(g) });
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
