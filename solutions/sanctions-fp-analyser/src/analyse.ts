// Sanctions False-Positive Analyser
// Reads an export of closed screening alerts and explains where the false positives come from: the same
// customer/list-entry pairs cleared again and again, hits on address/city fields, short or common name tokens,
// score bands with no true matches, lists and message types that generate noise, and re-alerting after clearance.
// It estimates the analyst time involved and proposes changes to TEST. It never clears an alert, and it refuses to
// propose suppressing any group that contains a true match.

import { type Row, pick, parseAmount, parseTimestamp } from "../../shared/table.ts";
import { normName } from "../../shared/text.ts";

export interface Alert {
  id: string; created: Date | null; screened: string; matched: string; list: string; score: number | null; field: string; msgType: string;
  disposition: "FP" | "TRUE" | "ESCALATED" | "OPEN"; minutes: number | null; customer: string;
}

export function readAlerts(rows: Row[]): Alert[] {
  return rows.map((r, i) => {
    const d = pick(r, "disposition", "outcome", "decision", "status", "resolution").toLowerCase();
    const disposition: Alert["disposition"] = /true|confirmed|positive match|real match|blocked|reported/.test(d) && !/false/.test(d) ? "TRUE" : /false|fp|cleared|no match|discount/.test(d) ? "FP" : /escalat|referr|l2|review/.test(d) ? "ESCALATED" : "OPEN";
    return {
      id: pick(r, "alert_id", "id", "case_id") || `A${i + 1}`, created: parseTimestamp(pick(r, "created_at", "alert_date", "date", "timestamp")),
      screened: pick(r, "screened_name", "screened_value", "input_name", "party_name", "customer_name", "hit_text"),
      matched: pick(r, "matched_name", "list_entry", "watchlist_name", "matched_entity", "sanctioned_name"),
      list: pick(r, "list", "watchlist", "list_name", "source"), score: parseAmount(pick(r, "match_score", "score", "similarity")),
      field: pick(r, "matched_field", "field", "hit_field", "screened_field").toLowerCase() || "name", msgType: pick(r, "message_type", "msg_type", "transaction_type", "channel"),
      disposition, minutes: parseAmount(pick(r, "handling_minutes", "minutes", "time_spent_min", "duration_min")), customer: pick(r, "customer_id", "party_id", "client_id", "account"),
    };
  });
}

export interface Driver { id: string; title: string; alerts: number; fps: number; trues: number; minutes: number; detail: string; action: string; safe: boolean }
export interface PairStat { screened: string; matched: string; list: string; clears: number; trues: number; minutes: number; first: string; last: string }

export interface Analysis {
  total: number; fps: number; trues: number; escalated: number; open: number; fpRate: number; fpMinutes: number; minutesAssumed: boolean;
  drivers: Driver[]; goodGuys: PairStat[]; byField: [string, number, number][]; byList: [string, number, number][]; byBand: [string, number, number][]; byMsg: [string, number, number][];
}

const COMMON_TOKENS = new Set(["ali", "mohamed", "mohammed", "muhammad", "ahmed", "ahmad", "hassan", "hussein", "khan", "kim", "lee", "park", "wang", "li", "zhang", "chen", "liu", "singh", "kumar", "garcia", "lopez", "ivanov", "petrov", "smith", "jones", "bank", "trading", "shipping", "international", "group", "company", "holding", "global", "al", "el", "abu", "bin"]);

export function analyse(alerts: Alert[], opts: { defaultMinutes?: number; minClears?: number } = {}): Analysis {
  const defaultMin = opts.defaultMinutes ?? 30;
  const minClears = opts.minClears ?? 3;
  const mins = (a: Alert) => a.minutes ?? defaultMin;
  const closed = alerts.filter((a) => a.disposition === "FP" || a.disposition === "TRUE");
  const fps = alerts.filter((a) => a.disposition === "FP");
  const trues = alerts.filter((a) => a.disposition === "TRUE");
  const group = <K extends string>(key: (a: Alert) => K) => {
    const m = new Map<K, Alert[]>();
    for (const a of alerts) m.set(key(a), [...(m.get(key(a)) ?? []), a]);
    return m;
  };
  const stat = (list: Alert[]) => ({ alerts: list.length, fps: list.filter((a) => a.disposition === "FP").length, trues: list.filter((a) => a.disposition === "TRUE").length, minutes: list.filter((a) => a.disposition === "FP").reduce((s, a) => s + mins(a), 0) });
  const table = (m: Map<string, Alert[]>) => [...m.entries()].map(([k, l]) => [k || "(blank)", stat(l).fps, stat(l).trues] as [string, number, number]).sort((a, b) => b[1] - a[1]);

  // 1. repeat pairs (good-guy candidates)
  const pairs = group((a) => `${normName(a.screened, false)}|${normName(a.matched, false)}|${a.list.toLowerCase()}`);
  const goodGuys: PairStat[] = [];
  for (const [, l] of pairs) {
    const s = stat(l);
    if (s.fps >= minClears && s.trues === 0) {
      const dates = l.map((a) => a.created?.toISOString().slice(0, 10) ?? "").filter(Boolean).sort();
      goodGuys.push({ screened: l[0].screened, matched: l[0].matched, list: l[0].list, clears: s.fps, trues: 0, minutes: s.minutes, first: dates[0] ?? "", last: dates[dates.length - 1] ?? "" });
    }
  }
  goodGuys.sort((a, b) => b.clears - a.clears);
  const drivers: Driver[] = [];
  if (goodGuys.length) {
    const n = goodGuys.reduce((s, g) => s + g.clears, 0);
    drivers.push({ id: "REPEAT_PAIRS", title: "Same party cleared against the same list entry again and again", alerts: n, fps: n, trues: 0, minutes: goodGuys.reduce((s, g) => s + g.minutes, 0),
      detail: `${goodGuys.length} party/list-entry pair(s) were cleared ${minClears}+ times each and never confirmed.`,
      action: "Candidates for a governed good-guy (whitelist) rule: suppress the exact pair, re-review on every list update and periodically. Never suppress the list entry itself.", safe: true });
  }

  // 2. non-name fields
  const byFieldMap = group((a) => (/(addr|street|city|town|country|place|location)/.test(a.field) ? "address/location" : /(bank|bic|agent)/.test(a.field) ? "bank/agent" : /(narr|remit|free|text|70|72|purpose)/.test(a.field) ? "free text/narrative" : /(vessel|ship|imo)/.test(a.field) ? "vessel" : "name"));
  for (const [k, l] of byFieldMap) {
    if (k === "name") continue;
    const s = stat(l);
    if (s.fps >= 5 && s.fps / Math.max(1, s.fps + s.trues) >= 0.95) {
      drivers.push({ id: `FIELD_${k.toUpperCase().replace(/[^A-Z]/g, "_")}`, title: `Hits on the ${k} field`, ...s, safe: s.trues === 0,
        detail: `${s.fps} false positives from ${k} data (e.g. a street or town that shares a word with a sanctioned place or name)${s.trues ? `, but ${s.trues} true match(es) too` : ""}.`,
        action: s.trues ? "Keep screening this field; tune matching rules for it instead (e.g. require a full-token match on country/place names)." : `Review how the ${k} field is screened: country/place lists vs. names, token rules, and which list types apply to this field. Test before changing.` });
    }
  }

  // 3. short / common tokens
  const tokenOf = (a: Alert) => {
    const ms = normName(a.matched, false).split(" ");
    const ss = new Set(normName(a.screened, false).split(" "));
    const shared = ms.filter((t) => ss.has(t));
    return shared.length === 1 ? shared[0] : "";
  };
  const byToken = group(tokenOf);
  const weak: string[] = [];
  let weakStat = { alerts: 0, fps: 0, trues: 0, minutes: 0 };
  for (const [t, l] of byToken) {
    if (!t) continue;
    const s = stat(l);
    if ((t.length <= 3 || COMMON_TOKENS.has(t)) && s.fps >= 3) {
      weak.push(`"${t}" (${s.fps} FP${s.trues ? `, ${s.trues} TRUE` : ""})`);
      weakStat = { alerts: weakStat.alerts + s.alerts, fps: weakStat.fps + s.fps, trues: weakStat.trues + s.trues, minutes: weakStat.minutes + s.minutes };
    }
  }
  if (weak.length) drivers.push({ id: "WEAK_TOKENS", title: "Alerts triggered by one short or very common word", ...weakStat, safe: weakStat.trues === 0,
    detail: `Single shared words: ${weak.slice(0, 10).join(", ")}.`, action: "Require more than one matching token (or a date of birth/country) before alerting on very common words; review weak aliases on the list side. Test against known true matches first." });

  // 4. score bands
  const band = (a: Alert) => (a.score === null ? "" : `${Math.floor(Math.min(a.score, 99.99) / 5) * 5}-${Math.floor(Math.min(a.score, 99.99) / 5) * 5 + 5}`);
  const byBandMap = group(band);
  const byBand = [...byBandMap.entries()].filter(([k]) => k).map(([k, l]) => [k, stat(l).fps, stat(l).trues] as [string, number, number]).sort((a, b) => Number(a[0].split("-")[0]) - Number(b[0].split("-")[0]));
  const lowestTrue = Math.min(...trues.map((a) => a.score ?? Infinity));
  const quiet = byBand.filter(([k, f, t]) => t === 0 && f >= 10 && Number(k.split("-")[1]) <= (Number.isFinite(lowestTrue) ? lowestTrue : 0));
  if (quiet.length) {
    const f = quiet.reduce((s, q) => s + q[1], 0);
    const l = alerts.filter((a) => quiet.some(([k]) => band(a) === k));
    drivers.push({ id: "LOW_SCORE_BANDS", title: "Score bands with many false positives and no true matches", alerts: l.length, fps: f, trues: 0, minutes: stat(l).minutes, safe: true,
      detail: `Bands ${quiet.map((q) => q[0]).join(", ")} produced ${f} false positives and no true matches; the lowest-scoring true match was ${Number.isFinite(lowestTrue) ? lowestTrue : "n/a"}.`,
      action: "Run a below-the-line test (re-screen historical true matches and test names) before considering any threshold change. Absence of true matches in this sample is not proof." });
  }

  // 5. message types
  const byMsgMap = group((a) => a.msgType);
  for (const [k, l] of byMsgMap) {
    const s = stat(l);
    if (k && /(950|940|camt\.05[234]|statement|report|mt9\d\d)/i.test(k) && s.fps >= 3) drivers.push({ id: "STATEMENT_MESSAGES", title: `Screening of ${k} messages`, ...s, safe: s.trues === 0,
      detail: `${s.fps} false positives from ${k} (statement/reporting messages).`, action: "Confirm with Compliance whether these message types need real-time screening, or whether the underlying payments are already screened." });
  }

  // 6. re-alerting after clearance (same customer + entry)
  const byCust = group((a) => (a.customer ? `${a.customer}|${normName(a.matched, false)}` : ""));
  let realert = 0, realertMin = 0, realertTrue = 0;
  for (const [k, l] of byCust) { if (!k) continue; const s = stat(l); if (s.fps >= minClears) { realert += s.fps - 1; realertMin += (s.minutes * (s.fps - 1)) / s.fps; realertTrue += s.trues; } }
  if (realert >= 3) drivers.push({ id: "NO_ALERT_MEMORY", title: "Customers re-alerted after being cleared", alerts: realert, fps: realert, trues: realertTrue, minutes: Math.round(realertMin), safe: realertTrue === 0,
    detail: `${realert} repeat alerts on customers already cleared for the same list entry.`, action: "Carry forward previous decisions (alert memory) and only re-alert when the customer data or the list entry changes." });

  // any driver that contains a true match is marked unsafe
  for (const d of drivers) if (d.trues > 0) d.safe = false;
  drivers.sort((a, b) => b.minutes - a.minutes);
  return {
    total: alerts.length, fps: fps.length, trues: trues.length, escalated: alerts.filter((a) => a.disposition === "ESCALATED").length, open: alerts.filter((a) => a.disposition === "OPEN").length,
    fpRate: closed.length ? fps.length / closed.length : 0, fpMinutes: fps.reduce((s, a) => s + mins(a), 0), minutesAssumed: alerts.some((a) => a.minutes === null),
    drivers, goodGuys, byField: table(byFieldMap), byList: table(group((a) => a.list)), byBand, byMsg: table(byMsgMap),
  };
}
