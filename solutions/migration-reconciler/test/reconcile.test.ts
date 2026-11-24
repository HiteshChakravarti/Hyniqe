import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../../shared/table.ts";
import { classify, reconcile } from "../src/reconcile.ts";
import { diffsCsv, toMarkdown } from "../src/report.ts";

test("classifies differences: real vs harmless", () => {
  assert.equal(classify("1963-02-16", "16/02/1963"), "FORMAT_ONLY");
  assert.equal(classify("1963-02-03", "02/03/1963"), "DATE_CHANGED"); // read as 2 March: day/month swapped
  assert.equal(classify("41739.21", "41,739.21"), "FORMAT_ONLY");
  assert.equal(classify("41739.21", "41749.21"), "NUMBER_CHANGED");
  assert.equal(classify("Y", "true"), "FORMAT_ONLY");
  assert.equal(classify("Y", ""), "EMPTIED");
  assert.equal(classify("196 Station Road, Flat 23", "196 Station Road, Fl"), "TRUNCATED");
  assert.equal(classify("RETAIL", "retail"), "CASE_SPACING");
  assert.equal(classify("Anna Smith", "Smith Anna"), "CHANGED");
  assert.equal(classify("10.00", "10.004", 0.01), "FORMAT_ONLY");
});
test("record-level reconciliation with key mapping and leading zeros", () => {
  const s = parseCsv("id,name,bal\n0001,Ann,10\n0002,Bob,20\n0003,Cy,30");
  const t = parseCsv("cust_no,name,bal\n1,Ann,10\n2,Bob,25\n4,Dee,40\n4,Dee,40");
  const r = reconcile(s, t, { key: ["id"], map: { id: "cust_no" }, ignoreLeadingZeros: true });
  assert.deepEqual(r.missing, ["3"]);
  assert.deepEqual(r.extra, ["4"]);
  assert.deepEqual(r.dupTarget, ["4"]);
  assert.equal(r.diffs[0].kind, "NUMBER_CHANGED");
  const bal = r.fields.find((f) => f.field === "bal")!;
  assert.equal(bal.sourceSum, 60);
  assert.equal(bal.targetSum, 115);
});
test("clear error for a missing key mapping", () => {
  assert.throws(() => reconcile(parseCsv("id,a\n1,x"), parseCsv("cust,a\n1,x"), { key: ["id"] }), /--map id/);
});
test("reports render and verdict", () => {
  const r = reconcile(parseCsv("id,a\n1,x"), parseCsv("id,a\n1,x"), { key: ["id"] });
  assert.match(toMarkdown(r), /✅ RECONCILED/);
  assert.match(diffsCsv(r), /^key,field/);
});
