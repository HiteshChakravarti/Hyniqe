import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { audit, parseMt103, parsePacs008, verdict } from "../src/audit.ts";
import { toMarkdown, toResultCsv } from "../src/report.ts";
import { parseXml, textAt, findAll } from "../../shared/xml-reader.ts";

const s = (f: string) => readFileSync(new URL(`../samples/${f}`, import.meta.url), "utf8");
const mx = parsePacs008(s("pacs008.xml"));

test("xml parser handles namespaces, attributes, entities", () => {
  const d = parseXml('<a:Doc xmlns:a="x"><a:Amt Ccy="EUR">10.50</a:Amt><Nm>Fish &amp; Chips</Nm></a:Doc>');
  assert.equal(findAll(d, "Amt")[0].attrs.Ccy, "EUR");
  assert.equal(textAt(findAll(d, "Doc")[0], "Nm"), "Fish & Chips");
});
test("pacs.008 parsed", () => {
  assert.equal(mx.uetr, "e8b2c1d4-5f6a-4b7c-8d9e-0a1b2c3d4e5f");
  assert.equal(mx.ccy, "EUR");
  assert.equal(mx.dbtr.town, "Chennai");
  assert.equal(mx.purpose, "GDDS");
});
test("lossy translation: truncated name, lost ultimate debtor, LEI, purpose, remittance", () => {
  const rules = audit(mx, parseMt103(s("mt103-translated.txt"))).map((f) => f.rule);
  for (const r of ["TRUNCATED_NAME", "ULTIMATE_PARTY_LOST", "LEI_LOST", "PURPOSE_LOST", "REMITTANCE_TRUNCATED"]) assert.ok(rules.includes(r), r);
});
test("faithful translation has no high or critical findings", () => {
  const f = audit(mx, parseMt103(s("mt103-faithful.txt")));
  assert.ok(!f.some((x) => x.severity === "critical" || x.severity === "high"));
  assert.notEqual(verdict(f), "CRITICAL");
});
test("critical mismatches", () => {
  const mt = parseMt103(s("mt103-faithful.txt").replace(/184250,00/, "184260,00").replace(":71A:SHA", ":71A:OUR"));
  const rules = audit(mx, mt).map((f) => f.rule);
  assert.ok(rules.includes("AMOUNT_MISMATCH"));
  assert.ok(rules.includes("CHARGES_MISMATCH"));
});
test("reports render", () => {
  const p = [{ name: "x", uetr: mx.uetr, findings: audit(mx, parseMt103(s("mt103-translated.txt"))) }];
  assert.match(toMarkdown(p), /DATA LOST/);
  assert.match(toResultCsv(p), /^payment,uetr/);
});
