import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../../shared/table.ts";
import { checkPayments, normaliseName, readPayments, validateMandateFile, type MandateFile } from "../src/checker.ts";
import { toMarkdown, toResultCsv } from "../src/report.ts";

const file: MandateFile = {
  fx_rates: { EUR: 1.1 },
  mandates: [
    {
      id: "M1", agent_id: "bot", valid_from: "2026-01-01", valid_to: "2026-12-31", base_currency: "USD",
      currencies: ["USD", "EUR"], per_payment_limit: 1000, daily_limit: 1500, monthly_limit: 3000,
      human_approval_above: 500, allowed_payees: ["Acme Ltd"], allowed_categories: ["software"], blocked_categories: ["crypto"],
      allowed_hours: { start: "08:00", end: "18:00" }, allowed_weekdays: [1, 2, 3, 4, 5], max_payments_per_day: 3,
    },
  ],
};

function run(csv: string) {
  return checkPayments(file, readPayments(parseCsv(csv)));
}
const H = "payment_id,timestamp,agent_id,mandate_id,payee,amount,currency,category,approved_by,approval_time,purpose,status\n";
const rules = (r: ReturnType<typeof run>, i = 0) => r.payments[i].findings.map((f) => f.rule);

test("clean payment passes with complete audit trail", () => {
  const r = run(H + "P1,2026-11-24 10:00,bot,M1,ACME LIMITED,100,USD,software,,,Licence,settled\n");
  assert.equal(r.payments[0].verdict, "OK");
  assert.equal(r.summary.audit_trail_completeness, 1);
});

test("payee names match ignoring legal suffix and case", () => {
  assert.equal(normaliseName("ACME Limited."), normaliseName("Acme Ltd"));
});

test("no mandate and wrong-agent mandate are blocked", () => {
  const r = run(H + "P1,2026-11-24 10:00,ghost,,Acme Ltd,10,USD,software,,,x,\nP2,2026-11-24 10:00,other,M1,Acme Ltd,10,USD,software,,,x,\n");
  assert.ok(rules(r, 0).includes("NO_MANDATE"));
  assert.ok(rules(r, 1).includes("MANDATE_AGENT_MISMATCH"));
  assert.equal(r.summary.block, 2);
});

test("limits, approvals, categories, currency and time windows", () => {
  const r = run(
    H +
      "P1,2026-11-24 10:00,bot,M1,Acme Ltd,1200,USD,software,Jo,2026-11-24 09:00,x,\n" + // over per-payment
      "P2,2026-11-25 10:00,bot,M1,Acme Ltd,600,USD,software,,,x,\n" + // no human approval
      "P3,2026-11-26 10:00,bot,M1,Acme Ltd,10,USD,crypto,,,x,\n" + // blocked category
      "P4,2026-11-26 11:00,bot,M1,Acme Ltd,10,GBP,software,,,x,\n" + // currency not allowed + no fx
      "P5,2026-11-28 10:00,bot,M1,Acme Ltd,10,USD,software,,,x,\n" + // Saturday
      "P6,2026-11-27 20:00,bot,M1,Acme Ltd,10,USD,software,,,x,\n" + // after hours
      "P7,2026-11-27 10:00,bot,M1,Acme Ltd,600,USD,software,bot,2026-11-27 09:00,x,\n" + // self approval
      "P8,2026-11-27 12:00,bot,M1,Acme Ltd,100,USD,software,Jo,2026-11-27 12:30,x,\n", // approval after payment
  );
  assert.ok(rules(r, 0).includes("OVER_PER_PAYMENT_LIMIT"));
  assert.ok(rules(r, 1).includes("NO_HUMAN_APPROVAL"));
  assert.ok(rules(r, 2).includes("CATEGORY_BLOCKED"));
  assert.ok(rules(r, 3).includes("CURRENCY_NOT_ALLOWED"));
  assert.ok(rules(r, 3).includes("NO_FX_RATE"));
  assert.ok(rules(r, 4).includes("OUTSIDE_ALLOWED_TIME"));
  assert.ok(rules(r, 5).includes("OUTSIDE_ALLOWED_TIME"));
  assert.ok(rules(r, 6).includes("SELF_APPROVAL"));
  assert.ok(rules(r, 7).includes("APPROVAL_AFTER_PAYMENT"));
});

test("FX conversion applies to limits", () => {
  const r = run(H + "P1,2026-11-24 10:00,bot,M1,Acme Ltd,950,EUR,software,Jo,2026-11-24 09:00,x,\n");
  assert.ok(rules(r).includes("OVER_PER_PAYMENT_LIMIT")); // 950 EUR = 1045 USD
});

test("cumulative daily limit, duplicates, split payments; rejected payments ignored", () => {
  const r = run(
    H +
      "P1,2026-11-24 09:00,bot,M1,Acme Ltd,450,USD,software,,,x,\n" +
      "P2,2026-11-24 09:05,bot,M1,Acme Ltd,450,USD,software,,,x,\n" +
      "P3,2026-11-24 09:10,bot,M1,Acme Ltd,999,USD,software,Jo,2026-11-24 09:00,x,rejected\n" +
      "P4,2026-11-24 09:20,bot,M1,Acme Ltd,700,USD,software,Jo,2026-11-24 09:00,x,\n",
  );
  assert.ok(rules(r, 1).includes("POSSIBLE_DUPLICATE"));
  assert.ok(rules(r, 0).includes("SPLIT_PAYMENT_SUSPECTED"));
  assert.ok(!rules(r, 2).includes("OVER_DAILY_LIMIT"));
  assert.ok(rules(r, 3).includes("OVER_DAILY_LIMIT")); // 450+450+700 = 1600 > 1500
});

test("expired mandate and missing fields", () => {
  const r = run(H + "P1,2027-02-01 10:00,bot,M1,Acme Ltd,10,USD,software,,,x,\n,,bot,M1,,abc,,software,,,,\n");
  assert.ok(rules(r, 0).includes("MANDATE_NOT_ACTIVE"));
  assert.ok(rules(r, 1).includes("MISSING_CORE_FIELDS"));
  assert.ok(rules(r, 1).includes("NO_PURPOSE"));
});

test("mandate validation catches bad files", () => {
  assert.ok(validateMandateFile({}).errors.length > 0);
  assert.ok(validateMandateFile({ mandates: [{ id: "A", agent_id: "x", per_payment_limit: -1 }] }).errors.length > 0);
  assert.ok(validateMandateFile({ mandates: [{ id: "A", agent_id: "x" }, { id: "A", agent_id: "y" }] }).errors.some((e) => e.includes("Duplicate")));
  assert.equal(validateMandateFile([{ id: "A", agent_id: "x" }]).errors.length, 0);
});

test("reports render", () => {
  const r = run(H + "P1,2026-11-24 10:00,ghost,,Acme Ltd,10,USD,software,,,x,\n");
  assert.match(toMarkdown(r), /BLOCK/);
  assert.match(toResultCsv(r), /^line,payment_id/);
});
