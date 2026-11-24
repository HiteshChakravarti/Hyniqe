// T+1 Settlement Fail Predictor
// Europe (EU, UK, Switzerland) moves securities settlement from T+2 to T+1 on 11 October 2027. This checks a trade
// blotter and the standing settlement instructions (SSIs) behind it, and flags trades likely to fail under T+1:
// wrong settlement cycle, missing/expired/ambiguous SSIs, allocations, affirmations or instructions that miss the
// same-day window, late trades and FX funding needs.

import { type Row, pick, parseTimestamp } from "../../shared/table.ts";
import { checkBic, checkIsin } from "../../shared/ids.ts";
import { normName } from "../../shared/text.ts";

export interface Config {
  go_live: string;            // date T+1 applies from (YYYY-MM-DD)
  assume_t1: boolean;         // treat all trades as T+1 regardless of trade date (for testing readiness now)
  instruction_cutoff: string; // HH:MM on trade date (times in the file are read as market local time, e.g. CET)
  late_trade_after: string;   // HH:MM: trades after this leave little time on T
  ssi_review_months: number;  // SSIs not verified for longer than this are "stale"
  holidays: string[];         // YYYY-MM-DD market holidays (weekends are always non-business days)
}
export const DEFAULT_CONFIG: Config = { go_live: "2027-10-11", assume_t1: false, instruction_cutoff: "23:59", late_trade_after: "18:00", ssi_review_months: 12, holidays: [] };

export interface Trade {
  line: number; id: string; trade_date: string; trade_time: string; settlement_date: string; isin: string; side: string;
  quantity: string; currency: string; counterparty: string; place: string; account_currency: string;
  allocation_time: Date | null; affirmation_time: Date | null; instruction_time: Date | null;
}
export interface Ssi { counterparty: string; place: string; currency: string; agent_bic: string; account: string; valid_from: string; valid_to: string; last_verified: string }

export type Sev = "high" | "medium" | "low";
export interface Issue { rule: string; severity: Sev; message: string; fix: string }
export interface Assessed { trade: Trade; issues: Issue[]; risk: "HIGH" | "MEDIUM" | "LOW"; t1_applies: boolean; expected_settlement: string }

export const RULES: Record<string, { severity: Sev; title: string; fix: string }> = {
  WRONG_CYCLE: { severity: "high", title: "Settlement date is not T+1", fix: "Update the settlement-date calculation (and static data) to T+1 for in-scope markets." },
  NON_BUSINESS_DAY: { severity: "high", title: "Settlement date is a weekend/holiday", fix: "Roll to the next business day using the market calendar." },
  NO_SSI: { severity: "high", title: "No SSI for counterparty / market", fix: "Obtain and load SSIs before trade date; under T+1 there's no day to chase." },
  SSI_EXPIRED: { severity: "high", title: "SSI expired or not yet valid", fix: "Refresh the SSI with the counterparty and re-verify." },
  SSI_AMBIGUOUS: { severity: "medium", title: "More than one SSI matches", fix: "Mark one SSI as default for this market/currency." },
  SSI_INVALID: { severity: "high", title: "SSI data invalid (BIC/account)", fix: "Correct the SSI record; validate the BIC and account." },
  SSI_STALE: { severity: "low", title: "SSI not re-verified recently", fix: "Re-confirm SSIs with counterparties on a regular cycle." },
  LATE_ALLOCATION: { severity: "high", title: "Allocation missing or after trade date", fix: "Allocate on trade date; automate allocations with the client/broker." },
  LATE_AFFIRMATION: { severity: "high", title: "Not affirmed/confirmed on trade date", fix: "Move to same-day (ideally automated) affirmation." },
  LATE_INSTRUCTION: { severity: "high", title: "Settlement instruction after cut-off on T", fix: "Send instructions to the CSD/custodian on trade date before the cut-off." },
  LATE_TRADE: { severity: "medium", title: "Executed late in the day", fix: "Prioritise late trades in the post-trade queue; check end-of-day processing windows." },
  FX_FUNDING: { severity: "medium", title: "Needs FX to fund settlement", fix: "Execute the FX on trade date (FX for T+1 settlement may need to be T+0)." },
  INVALID_ISIN: { severity: "medium", title: "ISIN invalid", fix: "Correct the security identifier before instructing." },
  MISSING_DATA: { severity: "high", title: "Trade record missing key fields", fix: "Complete the trade record (dates, ISIN, counterparty, quantity)." },
};

export function readTrades(rows: Row[]): Trade[] {
  return rows.map((r, i) => {
    const td = pick(r, "trade_date", "tradedate", "td");
    const tt = pick(r, "trade_time", "execution_time", "time");
    return {
      line: i + 2, id: pick(r, "trade_id", "id", "reference", "trade_ref"), trade_date: isoDate(td), trade_time: tt.match(/\d{1,2}:\d{2}/)?.[0] ?? (td.match(/\d{1,2}:\d{2}/)?.[0] ?? ""),
      settlement_date: isoDate(pick(r, "settlement_date", "settle_date", "value_date", "sd")), isin: pick(r, "isin", "security_id"), side: pick(r, "side", "buy_sell", "direction"),
      quantity: pick(r, "quantity", "qty", "nominal"), currency: pick(r, "currency", "ccy", "settlement_currency").toUpperCase(), counterparty: pick(r, "counterparty", "broker", "cpty"),
      place: pick(r, "place_of_settlement", "place", "csd", "market", "settlement_location").toUpperCase(), account_currency: pick(r, "account_currency", "cash_account_currency", "funding_currency").toUpperCase(),
      allocation_time: parseTimestamp(pick(r, "allocation_time", "allocated_at", "allocation")), affirmation_time: parseTimestamp(pick(r, "affirmation_time", "affirmed_at", "confirmation_time", "confirmed_at")),
      instruction_time: parseTimestamp(pick(r, "instruction_time", "instructed_at", "instruction_sent")),
    };
  });
}

export function readSsis(rows: Row[]): Ssi[] {
  return rows.map((r) => ({
    counterparty: pick(r, "counterparty", "broker", "cpty"), place: pick(r, "place_of_settlement", "place", "csd", "market").toUpperCase(), currency: pick(r, "currency", "ccy").toUpperCase(),
    agent_bic: pick(r, "agent_bic", "bic", "custodian_bic", "settlement_agent"), account: pick(r, "account", "safekeeping_account", "account_number"),
    valid_from: isoDate(pick(r, "valid_from", "effective_date")), valid_to: isoDate(pick(r, "valid_to", "expiry_date", "end_date")), last_verified: isoDate(pick(r, "last_verified", "verified_on", "last_confirmed")),
  }));
}

export function isoDate(raw: string): string {
  const d = parseTimestamp(raw);
  return d ? d.toISOString().slice(0, 10) : "";
}

export function addBusinessDays(date: string, n: number, holidays: Set<string>): string {
  let d = new Date(date + "T00:00:00Z");
  let left = n;
  while (left > 0) {
    d = new Date(d.getTime() + 86400000);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6 && !holidays.has(d.toISOString().slice(0, 10))) left--;
  }
  return d.toISOString().slice(0, 10);
}

function isBusinessDay(date: string, holidays: Set<string>): boolean {
  const wd = new Date(date + "T00:00:00Z").getUTCDay();
  return wd !== 0 && wd !== 6 && !holidays.has(date);
}

const minutes = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };
const day = (d: Date) => d.toISOString().slice(0, 10);
const hm = (d: Date) => d.toISOString().slice(11, 16);

export function assessTrades(trades: Trade[], ssis: Ssi[], cfg: Config = DEFAULT_CONFIG): Assessed[] {
  const hol = new Set(cfg.holidays);
  return trades.map((t) => {
    const issues: Issue[] = [];
    const add = (rule: string, message: string) => issues.push({ rule, severity: RULES[rule].severity, message, fix: RULES[rule].fix });
    const missing = [!t.trade_date && "trade date", !t.settlement_date && "settlement date", !t.isin && "ISIN", !t.counterparty && "counterparty"].filter(Boolean);
    if (missing.length) add("MISSING_DATA", `Missing ${missing.join(", ")}.`);
    const t1 = cfg.assume_t1 || (!!t.trade_date && t.trade_date >= cfg.go_live);
    const expected = t.trade_date ? addBusinessDays(t.trade_date, t1 ? 1 : 2, hol) : "";
    if (t.trade_date && t.settlement_date) {
      if (!isBusinessDay(t.settlement_date, hol)) add("NON_BUSINESS_DAY", `${t.settlement_date} is not a business day.`);
      else if (t1 && t.settlement_date > expected) add("WRONG_CYCLE", `Settles ${t.settlement_date}; T+1 is ${expected}${t.settlement_date === addBusinessDays(t.trade_date, 2, hol) ? " (still on T+2)" : ""}.`);
    }
    if (t.isin && !checkIsin(t.isin).ok) add("INVALID_ISIN", `${t.isin}: ${checkIsin(t.isin).reason}.`);

    // SSIs: same counterparty (normalised); narrow by place and currency where given
    const cp = normName(t.counterparty);
    let cands = ssis.filter((s) => normName(s.counterparty) === cp);
    if (t.place) { const byPlace = cands.filter((s) => !s.place || s.place === t.place); cands = byPlace; }
    if (t.currency) { const byCcy = cands.filter((s) => !s.currency || s.currency === t.currency); if (byCcy.length) cands = byCcy; }
    if (t.counterparty && !cands.length) add("NO_SSI", `No SSI for ${t.counterparty}${t.place ? " at " + t.place : ""}${t.currency ? " in " + t.currency : ""}.`);
    const sd = t.settlement_date || expected;
    const valid = cands.filter((s) => (!s.valid_to || s.valid_to >= sd) && (!s.valid_from || s.valid_from <= sd));
    if (cands.length && !valid.length) add("SSI_EXPIRED", `SSI valid ${cands[0].valid_from || "…"} to ${cands[0].valid_to || "…"}, settlement ${sd}.`);
    if (valid.length > 1) add("SSI_AMBIGUOUS", `${valid.length} SSIs match ${t.counterparty} for this market/currency.`);
    const ssi = valid[0];
    if (ssi) {
      const bad = [ssi.agent_bic && !checkBic(ssi.agent_bic).ok ? `agent BIC ${ssi.agent_bic} ${checkBic(ssi.agent_bic).reason}` : "", !ssi.account ? "no account" : ""].filter(Boolean);
      if (bad.length) add("SSI_INVALID", bad.join("; ") + ".");
      if (ssi.last_verified && t.trade_date) {
        const months = (Date.parse(t.trade_date) - Date.parse(ssi.last_verified)) / (30.44 * 86400000);
        if (months > cfg.ssi_review_months) add("SSI_STALE", `Last verified ${ssi.last_verified} (${Math.round(months)} months before trade).`);
      }
    }

    if (t1 && t.trade_date) {
      if (!t.allocation_time || day(t.allocation_time) > t.trade_date) add("LATE_ALLOCATION", t.allocation_time ? `Allocated ${day(t.allocation_time)} ${hm(t.allocation_time)}.` : "No allocation time recorded.");
      if (!t.affirmation_time || day(t.affirmation_time) > t.trade_date) add("LATE_AFFIRMATION", t.affirmation_time ? `Affirmed ${day(t.affirmation_time)} ${hm(t.affirmation_time)}.` : "No affirmation/confirmation recorded.");
      if (!t.instruction_time || day(t.instruction_time) > t.trade_date || (day(t.instruction_time) === t.trade_date && minutes(hm(t.instruction_time)) > minutes(cfg.instruction_cutoff))) {
        add("LATE_INSTRUCTION", t.instruction_time ? `Instructed ${day(t.instruction_time)} ${hm(t.instruction_time)} (cut-off ${cfg.instruction_cutoff} on ${t.trade_date}).` : "No instruction time recorded.");
      }
      if (t.trade_time && minutes(t.trade_time) >= minutes(cfg.late_trade_after)) add("LATE_TRADE", `Executed at ${t.trade_time}.`);
    }
    if (t.account_currency && t.currency && t.account_currency !== t.currency) add("FX_FUNDING", `Settles in ${t.currency}, cash account in ${t.account_currency}.`);

    const highs = issues.filter((i) => i.severity === "high").length;
    const meds = issues.filter((i) => i.severity === "medium").length;
    const risk = highs ? "HIGH" : meds ? "MEDIUM" : "LOW";
    return { trade: t, issues, risk, t1_applies: t1, expected_settlement: expected };
  });
}
