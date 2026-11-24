import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsv } from "../../shared/table.ts";
import { compareNames, precheck, readMaster, readPayments } from "../src/precheck.ts";
import { toMarkdown, toResultCsv } from "../src/report.ts";

const read = (f: string) => parseCsv(readFileSync(new URL(`../samples/${f}`, import.meta.url), "utf8"));
const res = precheck(readPayments(read("payments.csv")), readMaster(read("supplier-master.csv")));
const at = (line: number) => res.find((r) => r.payment.line === line)!;

test("name comparison classes", () => {
  assert.equal(compareNames("MÜLLER logistik gmbh", "Müller Logistik GmbH").outcome, "MATCH");
  assert.equal(compareNames("Muller Logistik", "Müller Logistik GmbH").outcome, "LIKELY CLOSE MATCH");
  assert.equal(compareNames("Consulting Van der Berg", "Van der Berg Consulting").outcome, "LIKELY CLOSE MATCH");
  assert.equal(compareNames("Rosi Forniture", "Rossi Forniture").outcome, "LIKELY CLOSE MATCH");
  assert.equal(compareNames("Fresh Fruit Wholesale", "García y Asociados SL").outcome, "LIKELY NO MATCH");
});
test("sample file predictions", () => {
  assert.equal(at(2).outcome, "MATCH");
  assert.equal(at(3).outcome, "LIKELY CLOSE MATCH"); // trading name
  assert.equal(at(13).outcome, "WILL BE REJECTED"); // bad IBAN
  assert.equal(at(14).outcome, "NOT IN VOP SCOPE"); // Japan
  assert.equal(at(12).outcome, "UNKNOWN"); // not in master
  assert.equal(at(16).outcome, "LIKELY NO MATCH");
});
test("warnings: c/o text, duplicate, many names per IBAN, long names", () => {
  assert.ok(at(10).warnings.some((w) => w.includes("c/o")));
  assert.ok(at(15).warnings.some((w) => w.includes("duplicate")));
  assert.ok(at(5).warnings.some((w) => w.includes("different names")));
  const long = precheck(readPayments(parseCsv(`payee_name,iban\n"${"A".repeat(75)}",NL91ABNA0417164300`)));
  assert.ok(long[0].warnings.some((w) => w.includes("70")));
});
test("reports render", () => { assert.match(toMarkdown(res), /Fix before sending/); assert.match(toResultCsv(res), /^line,payee_name/); });
