// Agent Payment Mandate Checker
// Checks every payment an AI agent made against the mandate a human gave it:
// who authorised the agent, for which payees/categories/currencies, within what limits,
// and whether the audit trail is complete enough to defend each payment.

import { type Row, pick, parseAmount, parseTimestamp } from "../../shared/table.ts";

export type Severity = "critical" | "high" | "medium" | "low";
export type Verdict = "BLOCK" | "REVIEW" | "OK";

export interface Mandate {
  id: string;
  agent_id: string;
  owner?: string;                 // human who granted the mandate
  valid_from?: string;            // YYYY-MM-DD
  valid_to?: string;              // YYYY-MM-DD (inclusive)
  base_currency?: string;         // currency the limits are written in (default: first of currencies, else USD)
  currencies?: string[];          // allowed payment currencies
  per_payment_limit?: number;
  daily_limit?: number;
  monthly_limit?: number;
  max_payments_per_day?: number;
  human_approval_above?: number;  // payments above this need a named human approver
  allowed_payees?: string[];
  allowed_categories?: string[];
  blocked_categories?: string[];
  allowed_hours?: { start: string; end: string; utc_offset_minutes?: number };
  allowed_weekdays?: number[];    // 0 = Sunday … 6 = Saturday, evaluated in allowed_hours offset
}

export interface MandateFile {
  mandates: Mandate[];
  fx_rates?: Record<string, number>; // 1 unit of currency = rate units of base currency
}

export interface Payment {
  line: number;
  payment_id: string;
  timestamp: Date | null;
  timestamp_raw: string;
  agent_id: string;
  mandate_id: string;
  payee: string;
  amount: number | null;
  currency: string;
  category: string;
  approved_by: string;
  approval_time: Date | null;
  purpose: string;
  status: string;
}

export interface Finding { rule: string; severity: Severity; message: string }

export interface CheckedPayment extends Payment {
  mandate?: Mandate;
  amount_base: number | null;
  verdict: Verdict;
  findings: Finding[];
  audit_complete: boolean;
}

export interface CheckResult {
  payments: CheckedPayment[];
  summary: {
    total: number;
    block: number;
    review: number;
    ok: number;
    total_value_base: number;
    value_at_risk_base: number; // BLOCK + REVIEW
    audit_trail_completeness: number; // 0..1
    by_rule: Record<string, number>;
    agents: string[];
    mandates_unused: string[];
  };
}

export const RULES: Record<string, { severity: Severity; title: string }> = {
  NO_MANDATE: { severity: "critical", title: "Agent paid with no mandate on file" },
  MANDATE_AGENT_MISMATCH: { severity: "critical", title: "Payment cites a mandate granted to a different agent" },
  MANDATE_NOT_ACTIVE: { severity: "critical", title: "Mandate expired or not yet valid" },
  PAYEE_NOT_ALLOWED: { severity: "critical", title: "Payee is not on the mandate's allowed list" },
  CATEGORY_BLOCKED: { severity: "critical", title: "Spend category is explicitly blocked" },
  OVER_PER_PAYMENT_LIMIT: { severity: "critical", title: "Single payment above per-payment limit" },
  SELF_APPROVAL: { severity: "critical", title: "Agent approved its own payment" },
  NO_HUMAN_APPROVAL: { severity: "high", title: "Above approval threshold with no named human approver" },
  APPROVAL_AFTER_PAYMENT: { severity: "high", title: "Approval recorded after the payment was made" },
  OVER_DAILY_LIMIT: { severity: "high", title: "Cumulative daily limit exceeded" },
  OVER_MONTHLY_LIMIT: { severity: "high", title: "Cumulative monthly limit exceeded" },
  SPLIT_PAYMENT_SUSPECTED: { severity: "high", title: "Same-day payments to one payee look split to stay under a limit" },
  CURRENCY_NOT_ALLOWED: { severity: "high", title: "Currency not allowed by mandate" },
  CATEGORY_NOT_ALLOWED: { severity: "medium", title: "Spend category not on the allowed list" },
  TOO_MANY_PAYMENTS: { severity: "medium", title: "More payments in a day than the mandate allows" },
  POSSIBLE_DUPLICATE: { severity: "medium", title: "Same payee, amount and currency within 24 hours" },
  OUTSIDE_ALLOWED_TIME: { severity: "medium", title: "Paid outside the mandate's allowed hours or days" },
  NO_FX_RATE: { severity: "medium", title: "No FX rate to check limits for this currency" },
  MISSING_CORE_FIELDS: { severity: "high", title: "Payment record missing core fields (id, time, agent, payee, amount, currency)" },
  NO_PURPOSE: { severity: "low", title: "No purpose / reason recorded" },
  NO_MANDATE_REFERENCE: { severity: "low", title: "Payment does not cite which mandate it relied on" },
};

const DAY_MS = 24 * 60 * 60 * 1000;
const NON_SETTLING = /^(rejected|failed|cancel+ed|reversed|declined|blocked)$/i;

export function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(ltd|limited|llc|inc|incorporated|plc|gmbh|pvt|private|co|corp|corporation|the|sa|ag|bv)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readPayments(rows: Row[]): Payment[] {
  return rows.map((r, i) => {
    const ts = pick(r, "timestamp", "paid_at", "payment_time", "date", "datetime", "created_at");
    const appr = pick(r, "approval_time", "approved_at", "approval_timestamp");
    return {
      line: i + 2,
      payment_id: pick(r, "payment_id", "id", "reference", "txn_id", "transaction_id"),
      timestamp: parseTimestamp(ts),
      timestamp_raw: ts,
      agent_id: pick(r, "agent_id", "agent", "bot", "initiated_by"),
      mandate_id: pick(r, "mandate_id", "mandate", "authority_id"),
      payee: pick(r, "payee", "beneficiary", "vendor", "merchant", "creditor"),
      amount: parseAmount(pick(r, "amount", "value", "amt")),
      currency: pick(r, "currency", "ccy").toUpperCase(),
      category: pick(r, "category", "spend_category", "type"),
      approved_by: pick(r, "approved_by", "approver", "human_approver"),
      approval_time: parseTimestamp(appr),
      purpose: pick(r, "purpose", "reason", "description", "memo", "narrative"),
      status: pick(r, "status", "state"),
    };
  });
}

function dayKey(d: Date, offsetMin: number): string {
  return new Date(d.getTime() + offsetMin * 60000).toISOString().slice(0, 10);
}
function monthKey(d: Date, offsetMin: number): string {
  return dayKey(d, offsetMin).slice(0, 7);
}
function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function findMandate(p: Payment, file: MandateFile): { mandate?: Mandate; finding?: Finding } {
  if (p.mandate_id) {
    const m = file.mandates.find((x) => x.id.toLowerCase() === p.mandate_id.toLowerCase());
    if (!m) return { finding: f("NO_MANDATE", `Mandate "${p.mandate_id}" is not in the mandate file.`) };
    if (p.agent_id && m.agent_id.toLowerCase() !== p.agent_id.toLowerCase()) {
      return { mandate: m, finding: f("MANDATE_AGENT_MISMATCH", `Mandate ${m.id} belongs to agent "${m.agent_id}", but "${p.agent_id}" used it.`) };
    }
    return { mandate: m };
  }
  // No mandate cited: choose the agent's mandate that was active at payment time (or any of the agent's mandates).
  const mine = file.mandates.filter((x) => x.agent_id.toLowerCase() === p.agent_id.toLowerCase());
  if (mine.length === 0) {
    return { finding: f("NO_MANDATE", `No mandate exists for agent "${p.agent_id || "(blank)"}".`) };
  }
  const active = p.timestamp ? mine.find((m) => isActive(m, p.timestamp as Date)) : undefined;
  return { mandate: active ?? mine[0] };
}

function isActive(m: Mandate, at: Date): boolean {
  const day = at.toISOString().slice(0, 10);
  if (m.valid_from && day < m.valid_from) return false;
  if (m.valid_to && day > m.valid_to) return false;
  return true;
}

function f(rule: string, message: string): Finding {
  return { rule, severity: RULES[rule].severity, message };
}

function baseCurrency(m: Mandate): string {
  return (m.base_currency || m.currencies?.[0] || "USD").toUpperCase();
}

function toBase(amount: number | null, ccy: string, m: Mandate | undefined, file: MandateFile): number | null {
  if (amount === null || !m) return amount;
  const base = baseCurrency(m);
  if (!ccy || ccy === base) return amount;
  const rate = file.fx_rates?.[ccy];
  return rate ? amount * rate : null;
}

export function checkPayments(file: MandateFile, payments: Payment[]): CheckResult {
  const checked: CheckedPayment[] = payments.map((p) => {
    const { mandate, finding } = findMandate(p, file);
    const findings: Finding[] = finding ? [finding] : [];
    return { ...p, mandate, amount_base: toBase(p.amount, p.currency, mandate, file), verdict: "OK", findings, audit_complete: true };
  });

  // --- Per-payment checks -------------------------------------------------
  for (const p of checked) {
    const m = p.mandate;
    const missing: string[] = [];
    if (!p.payment_id) missing.push("payment id");
    if (!p.timestamp) missing.push(p.timestamp_raw ? `timestamp ("${p.timestamp_raw}" unreadable)` : "timestamp");
    if (!p.agent_id) missing.push("agent");
    if (!p.payee) missing.push("payee");
    if (p.amount === null) missing.push("amount");
    if (!p.currency) missing.push("currency");
    if (missing.length) p.findings.push(f("MISSING_CORE_FIELDS", `Missing: ${missing.join(", ")}.`));
    if (!p.purpose) p.findings.push(f("NO_PURPOSE", "No purpose recorded, so nobody can later say why the agent paid."));
    if (!p.mandate_id && m) p.findings.push(f("NO_MANDATE_REFERENCE", `Payment did not cite a mandate; assumed ${m.id}.`));

    if (p.approved_by && p.agent_id && p.approved_by.toLowerCase() === p.agent_id.toLowerCase()) {
      p.findings.push(f("SELF_APPROVAL", `"${p.approved_by}" is the agent itself, not a human.`));
    }
    if (p.approval_time && p.timestamp && p.approval_time.getTime() > p.timestamp.getTime()) {
      const mins = Math.round((p.approval_time.getTime() - p.timestamp.getTime()) / 60000);
      p.findings.push(f("APPROVAL_AFTER_PAYMENT", `Approval logged ${mins} min after payment.`));
    }
    if (!m) continue;

    if (p.timestamp && !isActive(m, p.timestamp)) {
      p.findings.push(f("MANDATE_NOT_ACTIVE", `Mandate ${m.id} valid ${m.valid_from ?? "…"} to ${m.valid_to ?? "…"}; payment on ${p.timestamp.toISOString().slice(0, 10)}.`));
    }
    if (m.currencies?.length && p.currency && !m.currencies.map((c) => c.toUpperCase()).includes(p.currency)) {
      p.findings.push(f("CURRENCY_NOT_ALLOWED", `${p.currency} not in allowed ${m.currencies.join(", ")}.`));
    }
    if (p.amount !== null && p.currency && p.amount_base === null) {
      p.findings.push(f("NO_FX_RATE", `No fx_rates entry for ${p.currency} → ${baseCurrency(m)}; limits not checked for this payment.`));
    }
    if (m.allowed_payees?.length && p.payee) {
      const ok = m.allowed_payees.some((a) => normaliseName(a) === normaliseName(p.payee));
      if (!ok) p.findings.push(f("PAYEE_NOT_ALLOWED", `"${p.payee}" is not one of the ${m.allowed_payees.length} allowed payees.`));
    }
    const cat = p.category.toLowerCase();
    if (cat && m.blocked_categories?.some((c) => c.toLowerCase() === cat)) {
      p.findings.push(f("CATEGORY_BLOCKED", `Category "${p.category}" is blocked.`));
    } else if (cat && m.allowed_categories?.length && !m.allowed_categories.some((c) => c.toLowerCase() === cat)) {
      p.findings.push(f("CATEGORY_NOT_ALLOWED", `Category "${p.category}" not in ${m.allowed_categories.join(", ")}.`));
    }
    if (p.amount_base !== null && m.per_payment_limit !== undefined && p.amount_base > m.per_payment_limit) {
      p.findings.push(f("OVER_PER_PAYMENT_LIMIT", `${fmt(p.amount_base)} ${baseCurrency(m)} > limit ${fmt(m.per_payment_limit)}.`));
    }
    if (p.amount_base !== null && m.human_approval_above !== undefined && p.amount_base > m.human_approval_above) {
      const human = p.approved_by && p.approved_by.toLowerCase() !== p.agent_id.toLowerCase();
      if (!human) p.findings.push(f("NO_HUMAN_APPROVAL", `${fmt(p.amount_base)} ${baseCurrency(m)} needs a human approver above ${fmt(m.human_approval_above)}.`));
    }
    if (p.timestamp && (m.allowed_hours || m.allowed_weekdays)) {
      const off = m.allowed_hours?.utc_offset_minutes ?? 0;
      const local = new Date(p.timestamp.getTime() + off * 60000);
      const mins = local.getUTCHours() * 60 + local.getUTCMinutes();
      const reasons: string[] = [];
      if (m.allowed_hours) {
        const s = minutesOfDay(m.allowed_hours.start);
        const e = minutesOfDay(m.allowed_hours.end);
        const inside = s <= e ? mins >= s && mins <= e : mins >= s || mins <= e;
        if (!inside) reasons.push(`time ${local.toISOString().slice(11, 16)} outside ${m.allowed_hours.start}–${m.allowed_hours.end}`);
      }
      if (m.allowed_weekdays && !m.allowed_weekdays.includes(local.getUTCDay())) {
        reasons.push(`${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][local.getUTCDay()]} not an allowed day`);
      }
      if (reasons.length) p.findings.push(f("OUTSIDE_ALLOWED_TIME", reasons.join("; ") + "."));
    }
  }

  // --- Cumulative checks (per mandate, in time order, settled payments only) ---
  const settling = checked
    .filter((p) => p.mandate && p.timestamp && p.amount_base !== null && !NON_SETTLING.test(p.status))
    .sort((a, b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime());
  const dayTotals = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  const monthTotals = new Map<string, number>();
  for (const p of settling) {
    const m = p.mandate as Mandate;
    const off = m.allowed_hours?.utc_offset_minutes ?? 0;
    const dk = `${m.id}|${dayKey(p.timestamp as Date, off)}`;
    const mk = `${m.id}|${monthKey(p.timestamp as Date, off)}`;
    const amt = p.amount_base as number;
    const dt = (dayTotals.get(dk) ?? 0) + amt;
    const dc = (dayCounts.get(dk) ?? 0) + 1;
    const mt = (monthTotals.get(mk) ?? 0) + amt;
    dayTotals.set(dk, dt); dayCounts.set(dk, dc); monthTotals.set(mk, mt);
    if (m.daily_limit !== undefined && dt > m.daily_limit) {
      p.findings.push(f("OVER_DAILY_LIMIT", `Day total reached ${fmt(dt)} ${baseCurrency(m)} (limit ${fmt(m.daily_limit)}).`));
    }
    if (m.monthly_limit !== undefined && mt > m.monthly_limit) {
      p.findings.push(f("OVER_MONTHLY_LIMIT", `Month total reached ${fmt(mt)} ${baseCurrency(m)} (limit ${fmt(m.monthly_limit)}).`));
    }
    if (m.max_payments_per_day !== undefined && dc > m.max_payments_per_day) {
      p.findings.push(f("TOO_MANY_PAYMENTS", `Payment #${dc} today (max ${m.max_payments_per_day}).`));
    }
  }

  // --- Duplicates (same agent, payee, amount, currency within 24h) ---------
  const byKey = new Map<string, CheckedPayment[]>();
  for (const p of settling) {
    const k = [p.agent_id.toLowerCase(), normaliseName(p.payee), p.amount, p.currency].join("|");
    const list = byKey.get(k) ?? [];
    const prev = list.find((q) => Math.abs((p.timestamp as Date).getTime() - (q.timestamp as Date).getTime()) <= DAY_MS);
    if (prev) p.findings.push(f("POSSIBLE_DUPLICATE", `Matches ${prev.payment_id || "line " + prev.line} (${prev.timestamp_raw}).`));
    list.push(p);
    byKey.set(k, list);
  }

  // --- Split payments: ≥2 same-day payments to one payee, each under a limit, together over it ---
  const groups = new Map<string, CheckedPayment[]>();
  for (const p of settling) {
    const m = p.mandate as Mandate;
    const off = m.allowed_hours?.utc_offset_minutes ?? 0;
    const k = `${m.id}|${normaliseName(p.payee)}|${dayKey(p.timestamp as Date, off)}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const m = list[0].mandate as Mandate;
    const thresholds: [string, number | undefined][] = [
      ["approval threshold", m.human_approval_above],
      ["per-payment limit", m.per_payment_limit],
    ];
    for (const [label, limit] of thresholds) {
      if (limit === undefined) continue;
      // Structuring pattern: every payment sits just under the line (≥ 50% of it) and together they cross it.
      const justUnder = list.filter((p) => (p.amount_base as number) <= limit && (p.amount_base as number) >= limit * 0.5);
      const subtotal = justUnder.reduce((s, p) => s + (p.amount_base as number), 0);
      if (justUnder.length >= 2 && subtotal > limit) {
        for (const p of justUnder) {
          if (!p.findings.some((x) => x.rule === "SPLIT_PAYMENT_SUSPECTED")) {
            p.findings.push(f("SPLIT_PAYMENT_SUSPECTED", `${justUnder.length} payments to "${p.payee}" today total ${fmt(subtotal)}, each just under the ${label} of ${fmt(limit)}.`));
          }
        }
        break;
      }
    }
  }

  // --- Verdicts & summary ---------------------------------------------------
  const byRule: Record<string, number> = {};
  let totalValue = 0;
  let riskValue = 0;
  let complete = 0;
  for (const p of checked) {
    const sev = new Set(p.findings.map((x) => x.severity));
    p.verdict = sev.has("critical") ? "BLOCK" : sev.has("high") || sev.has("medium") ? "REVIEW" : "OK";
    const needsApprover = p.mandate?.human_approval_above !== undefined && (p.amount_base ?? 0) > (p.mandate.human_approval_above ?? Infinity);
    p.audit_complete =
      !!(p.payment_id && p.timestamp && p.agent_id && p.payee && p.amount !== null && p.currency && p.purpose && p.mandate_id) &&
      (!needsApprover || (!!p.approved_by && !!p.approval_time));
    if (p.audit_complete) complete++;
    for (const x of p.findings) byRule[x.rule] = (byRule[x.rule] ?? 0) + 1;
    const v = p.amount_base ?? 0;
    totalValue += v;
    if (p.verdict !== "OK") riskValue += v;
  }
  const used = new Set(checked.map((p) => p.mandate?.id).filter(Boolean));
  return {
    payments: checked,
    summary: {
      total: checked.length,
      block: checked.filter((p) => p.verdict === "BLOCK").length,
      review: checked.filter((p) => p.verdict === "REVIEW").length,
      ok: checked.filter((p) => p.verdict === "OK").length,
      total_value_base: round2(totalValue),
      value_at_risk_base: round2(riskValue),
      audit_trail_completeness: checked.length ? complete / checked.length : 1,
      by_rule: byRule,
      agents: [...new Set(checked.map((p) => p.agent_id).filter(Boolean))],
      mandates_unused: file.mandates.filter((m) => !used.has(m.id)).map((m) => m.id),
    },
  };
}

export function validateMandateFile(raw: unknown): { file?: MandateFile; errors: string[] } {
  const errors: string[] = [];
  const obj = raw as Partial<MandateFile> | Mandate[];
  const mandates = Array.isArray(obj) ? obj : obj?.mandates;
  if (!Array.isArray(mandates) || mandates.length === 0) return { errors: ["Mandate file must contain a non-empty \"mandates\" array."] };
  mandates.forEach((m, i) => {
    if (!m.id) errors.push(`Mandate #${i + 1} has no id.`);
    if (!m.agent_id) errors.push(`Mandate ${m.id ?? "#" + (i + 1)} has no agent_id.`);
    for (const k of ["per_payment_limit", "daily_limit", "monthly_limit", "human_approval_above", "max_payments_per_day"] as const) {
      if (m[k] !== undefined && (typeof m[k] !== "number" || (m[k] as number) < 0)) errors.push(`Mandate ${m.id}: ${k} must be a non-negative number.`);
    }
    if (m.allowed_hours && !/^\d{1,2}:\d{2}$/.test(m.allowed_hours.start + "") ) errors.push(`Mandate ${m.id}: allowed_hours.start must be HH:MM.`);
    if (m.allowed_hours && !/^\d{1,2}:\d{2}$/.test(m.allowed_hours.end + "")) errors.push(`Mandate ${m.id}: allowed_hours.end must be HH:MM.`);
  });
  const ids = mandates.map((m) => m.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) errors.push(`Duplicate mandate ids: ${[...new Set(dupes)].join(", ")}.`);
  return { file: { mandates, fx_rates: Array.isArray(obj) ? undefined : obj.fx_rates }, errors };
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
