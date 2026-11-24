#!/usr/bin/env node
// Dictionary only:  node cli.ts --copybook samples/CUSTREC.cpy
// Decode data:      node cli.ts --copybook samples/CUSTREC.cpy --data samples/CUSTMAST.dat [--encoding ebcdic|ascii] [--rdw] [--lines] [--record-length N] [--out out/]
import { readFileSync } from "node:fs";
import { fail, parseArgs, readText, writeOutputs } from "../shared/cli.ts";
import { decodeData, layout, parseCopybook, type Encoding } from "./src/copybook.ts";
import { dataCsv, decodeSummary, dictionaryCsv, dictionaryMarkdown } from "./src/report.ts";

const { flags } = parseArgs(process.argv.slice(2));
if (!flags.copybook) fail("usage: node cli.ts --copybook <file.cpy> [--data <file>] [--encoding ebcdic|ascii] [--rdw] [--lines] [--record-length N] [--out <dir>]");
const { root, warnings } = parseCopybook(readText(flags.copybook));
const l = layout(root);
let md = dictionaryMarkdown(l.fields, l.recordLength, [...warnings, ...l.warnings]);
const files: Record<string, string> = { "data-dictionary.csv": dictionaryCsv(l.fields) };
if (flags.data) {
  const d = decodeData(l.fields, new Uint8Array(readFileSync(flags.data)), { encoding: (flags.encoding as Encoding) ?? "ebcdic", recordLength: Number(flags["record-length"] ?? l.recordLength), rdw: !!flags.rdw, lineSeparated: !!flags.lines });
  md += "\n" + decodeSummary(d);
  files["decoded.csv"] = dataCsv(d);
}
files["data-dictionary.md"] = md;
process.stdout.write(md);
const w = writeOutputs(flags.out, files);
if (w.length) process.stderr.write(`Wrote ${w.join(", ")}\n`);
