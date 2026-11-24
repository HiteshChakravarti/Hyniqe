// Synthetic benchmark: 2,000 agent payments, ~40% with one injected control breach.
// Measures per-rule precision/recall of the checker. Run: node bench.ts
import { rng, choice, score, printScores, type Score } from "../shared/bench.ts";
import { checkPayments, type MandateFile, type Payment } from "./src/checker.ts";

const r = rng(20261124);
const payees = ["Acme Cloud Ltd", "Northwind Office Supplies", "Contoso Travel", "Globex Logistics", "Initech Software"];
const file: MandateFile = {
  fx_rates: { EUR: 1.08 },
  mandates: [
    {
      id: "M1", agent_id: "ap-agent", valid_from: "2026-01-01", valid_to: "2026-12-31", base_currency: "USD",
      currencies: ["USD", "EUR"], per_payment_limit: 5000, daily_limit: 60000, human_approval_above: 2000,
      allowed_payees: payees, allowed_categories: ["software", "office", "travel", "logistics"], blocked_categories: ["gift cards", "crypto"],
      allowed_hours: { start: "08:00", end: "19:00" }, allowed_weekdays: [1, 2, 3, 4, 5],
    },
    { id: "M2", agent_id: "other-agent", valid_from: "2026-01-01", valid_to: "2026-12-31", per_payment_limit: 100000 },
  ],
};
const INJECT = [
  "NO_MANDATE", "MANDATE_AGENT_MISMATCH", "MANDATE_NOT_ACTIVE", "PAYEE_NOT_ALLOWED", "CATEGORY_BLOCKED",
  "OVER_PER_PAYMENT_LIMIT", "NO_HUMAN_APPROVAL", "SELF_APPROVAL", "APPROVAL_AFTER_PAYMENT", "CURRENCY_NOT_ALLOWED",
  "OUTSIDE_ALLOWED_TIME", "POSSIBLE_DUPLICATE",
] as const;
const IGNORE = new Set(["NO_PURPOSE", "NO_MANDATE_REFERENCE"]);

// weekday slots in 2026, 10 per day between 08:30 and 17:30
const slots: Date[] = [];
for (let d = new Date(Date.UTC(2026, 0, 1)); d.getUTCFullYear() === 2026; d = new Date(d.getTime() + 86400000)) {
  const wd = d.getUTCDay();
  if (wd === 0 || wd === 6) continue;
  for (let h = 0; h < 10; h++) slots.push(new Date(d.getTime() + (8.5 + h) * 3600000));
}

const payments: Payment[] = [];
const expected: Set<string>[] = [];
const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
for (let i = 0; i < 2000; i++) {
  const ts = slots[i];
  const amount = Math.round((50 + r() * 850) * 100) / 100;
  const p: Payment = {
    line: i + 2, payment_id: `P${i}`, timestamp: ts, timestamp_raw: fmt(ts), agent_id: "ap-agent", mandate_id: "M1",
    payee: choice(r, payees), amount, currency: "USD", category: choice(r, ["software", "office", "travel", "logistics"]),
    approved_by: "", approval_time: null, purpose: "Invoice", status: "settled",
  };
  const exp = new Set<string>();
  if (r() < 0.4) {
    const kind = choice(r, INJECT);
    exp.add(kind);
    switch (kind) {
      case "NO_MANDATE": p.agent_id = `rogue-${i}`; p.mandate_id = ""; break;
      case "MANDATE_AGENT_MISMATCH": p.agent_id = "other-agent"; break;
      case "MANDATE_NOT_ACTIVE": { const d = new Date(Date.UTC(2027, 0, 5, 10)); p.timestamp = d; p.timestamp_raw = fmt(d); break; }
      case "PAYEE_NOT_ALLOWED": p.payee = `Unknown Vendor ${i}`; break;
      case "CATEGORY_BLOCKED": p.category = choice(r, ["gift cards", "crypto"]); break;
      case "OVER_PER_PAYMENT_LIMIT": p.amount = 5001 + Math.round(r() * 4000); p.approved_by = "Jo"; p.approval_time = new Date(ts.getTime() - 600000); break;
      case "NO_HUMAN_APPROVAL": p.amount = 2001 + Math.round(r() * 2900); break;
      case "SELF_APPROVAL": p.approved_by = "ap-agent"; break;
      case "APPROVAL_AFTER_PAYMENT": p.approved_by = "Jo"; p.approval_time = new Date(ts.getTime() + 3600000); break;
      case "CURRENCY_NOT_ALLOWED": p.currency = "JPY"; exp.add("NO_FX_RATE"); break;
      case "OUTSIDE_ALLOWED_TIME": { const d = new Date(ts.getTime() + 4 * 3600000 + 30 * 60000 + (ts.getUTCHours() >= 15 ? 0 : 3 * 3600000)); p.timestamp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 21, 15)); p.timestamp_raw = fmt(p.timestamp); break; }
      case "POSSIBLE_DUPLICATE": {
        const prev = payments[payments.length - 1];
        // only a true duplicate if the previous payment was clean and within 24h (not across a weekend)
        if (!prev || expected[expected.length - 1].size || ts.getTime() - (prev.timestamp as Date).getTime() > 86400000) { exp.clear(); break; }
        Object.assign(p, { payee: prev.payee, amount: prev.amount, currency: prev.currency, agent_id: prev.agent_id });
        break;
      }
    }
  }
  payments.push(p);
  expected.push(exp);
}

const res = checkPayments(file, payments);
const perRule = new Map<string, Score>();
let verdictRight = 0;
res.payments.forEach((p, i) => {
  const pred = new Set(p.findings.map((f) => f.rule).filter((x) => !IGNORE.has(x)));
  for (const rule of new Set([...pred, ...expected[i]])) {
    const s = score(rule, expected[i].has(rule) ? new Set([rule]) : new Set(), pred.has(rule) ? new Set([rule]) : new Set());
    const acc = perRule.get(rule) ?? { label: rule, tp: 0, fp: 0, fn: 0 };
    acc.tp += s.tp; acc.fp += s.fp; acc.fn += s.fn;
    perRule.set(rule, acc);
  }
  if ((expected[i].size === 0) === (p.verdict === "OK")) verdictRight++;
});
const overall = printScores("Agent Payment Mandate Checker — synthetic benchmark (2,000 payments)", [...perRule.values()].sort((a, b) => a.label.localeCompare(b.label)));
console.log(`Clean-vs-flagged verdict accuracy: ${((verdictRight / res.payments.length) * 100).toFixed(1)}%`);
if (overall.recall < 0.98 || overall.precision < 0.98) process.exitCode = 1;
