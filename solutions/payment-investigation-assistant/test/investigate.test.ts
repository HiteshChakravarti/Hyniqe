import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyse, extract } from "../src/investigate.ts";
import { toMarkdown } from "../src/report.ts";

const sample = (f: string) => readFileSync(new URL(`../samples/${f}`, import.meta.url), "utf8");

test("MT199 non-receipt: type, UETR, amount, BICs from headers, IBAN", () => {
  const c = analyse(sample("mt199-non-receipt.txt"));
  assert.equal(c.type, "NON_RECEIPT");
  assert.equal(c.extracted.uetr, "3b2a7c1e-9f4d-4c2a-8e6b-1d2f3a4b5c6d");
  assert.deepEqual(c.extracted.amounts[0], { amount: 48250, currency: "EUR" });
  assert.deepEqual(c.extracted.bics, ["BANKGB2L", "DEUTDEFF"]);
  assert.deepEqual(c.extracted.ibans, ["SE4550000000058398257466"]);
  assert.equal(c.missing.length, 0);
});
test("fraud email is URGENT recall", () => {
  const c = analyse(sample("fraud-recall-email.txt"));
  assert.equal(c.type, "RECALL_FRAUD");
  assert.equal(c.urgency, "URGENT");
  assert.match(c.draft_reply, /fraud/);
});
test("plain English words are not mistaken for BICs; charges only from explicit fields", () => {
  const x = extract("OUR CUSTOMER ADVISES PAYMENT NOT RECEIVED");
  assert.deepEqual(x.bics, []);
  assert.equal(x.charges_option, undefined);
  assert.equal(extract(":71A:SHA").charges_option, "SHA");
});
test("missing information is listed", () => {
  const c = analyse("Where is my payment?");
  assert.equal(c.type, "STATUS");
  assert.ok(c.missing.some((m) => m.startsWith("UETR")));
});
test("report renders", () => assert.match(toMarkdown(analyse(sample("fraud-recall-email.txt"))), /Draft reply/));
