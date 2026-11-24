import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { scanWorkbook } from "../src/scan.ts";
import { registerCsv, toMarkdown } from "../src/report.ts";

const inflate = async (d: Uint8Array) => new Uint8Array(inflateRawSync(d));
const load = (f: string) => new Uint8Array(readFileSync(new URL(`../samples/${f}`, import.meta.url)));

test("risky model: macros, links, password, hidden sheets, broken names, hard-coded numbers", async () => {
  const r = await scanWorkbook("fx", load("fx-revaluation-model.xlsm"), inflate);
  const rules = r.findings.map((f) => f.rule);
  for (const x of ["MACROS", "EXTERNAL_LINKS", "PASSWORD_IN_CONNECTION", "VERY_HIDDEN_SHEETS", "HIDDEN_SHEETS", "BROKEN_NAMES", "ERRORS", "HARDCODED", "VOLATILE", "OWNERSHIP"]) assert.ok(rules.includes(x), x);
  assert.equal(r.tier, "HIGH");
  assert.equal(r.author, "j.smith");
  assert.ok(r.externalLinks[0].includes("daily rates 2019.xlsx"));
});
test("tidy list is low risk", async () => {
  const r = await scanWorkbook("breaks", load("nostro-breaks-list.xlsx"), inflate);
  assert.equal(r.tier, "LOW");
  assert.equal(r.formulas, 29);
});
test("legacy .xls is flagged as uninspectable, at least medium", async () => {
  const r = await scanWorkbook("old", load("old-limits-tracker.xls"), inflate);
  assert.equal(r.format, "xls (legacy binary)");
  assert.notEqual(r.tier, "LOW");
});
test("non-spreadsheet input handled", async () => {
  const r = await scanWorkbook("x", new TextEncoder().encode("hello"), inflate);
  assert.equal(r.format, "not a spreadsheet");
});
test("reports render", async () => {
  const r = await scanWorkbook("fx", load("fx-revaluation-model.xlsm"), inflate);
  assert.match(toMarkdown([r]), /HIGH/);
  assert.match(registerCsv([r]), /^file,format,risk/);
});
