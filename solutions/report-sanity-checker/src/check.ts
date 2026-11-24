// "Valid but Wrong" Report Checker
// Regulatory and transaction reports can pass the regulator's format validation and still be wrong. This checks a
// report extract (CSV) for errors that format checks miss: identifiers with bad check digits (LEI, ISIN, BIC, IBAN),
// unknown currency/country codes, impossible date orders, duplicate trade identifiers, a firm reporting itself as its
// own counterparty, negative or zero notionals, placeholder values and outliers. Columns are recognised by their names.

import { type Row, normaliseHeader, parseAmount, parseTimestamp } from "../../shared/table.ts";
import { checkBic, checkCountry, checkCurrency, checkIban, checkIsin, checkLei } from "../../shared/ids.ts";

export type Sev = "error" | "warning";
export interface Issue { row: number; column: string; value: string; rule: string; severity: Sev; message: string }

export type Role = "lei" | "isin" | "bic" | "iban" | "currency" | "country" | "id" | "date" | "amount" | "quantity" | "price" | "other";

export const RULE_TITLES: Record<string, string> = {
  INVALID_LEI: "LEI fails ISO 17442 check", INVALID_ISIN: "ISIN fails check digit", INVALID_BIC: "BIC malformed", INVALID_IBAN: "IBAN fails check", INVALID_CURRENCY: "Not an ISO 4217 currency",
  INVALID_COUNTRY: "Not an ISO 3166 country", BAD_DATE: "Date unreadable", DATE_ORDER: "Dates in an impossible order", FUTURE_DATE: "Date after the report date", DUPLICATE_ID: "Duplicate trade/transaction identifier",
  SELF_COUNTERPARTY: "Reporting party is its own counterparty", NEGATIVE: "Negative amount or quantity", ZERO: "Zero amount or quantity", PLACEHOLDER: "Placeholder value", OUTLIER: "Amount far outside the usual range",
  MISSING: "Required value missing", CURRENCY_DECIMALS: "Too many decimals for the currency",
};

/** Guess what each column holds from its header. */
export function classifyColumns(headers: string[]): Record<string, Role> {
  const out: Record<string, Role> = {};
  for (const h of headers) {
    const n = normaliseHeader(h);
    out[h] =
      /(^|_)lei($|_)|legal_entity_identifier/.test(n) ? "lei"
        : /(^|_)isin($|_)/.test(n) ? "isin"
          : /(^|_)(bic|swift|bic_code)($|_)/.test(n) ? "bic"
            : /(^|_)iban($|_)/.test(n) ? "iban"
              : /(^|_)(ccy|currency)($|_)|_ccy$|currency_\d/.test(n) ? "currency"
                : /(^|_)(country|ctry|jurisdiction|domicile)($|_)/.test(n) ? "country"
                  : /(^|_)(uti|usi|trade_id|transaction_id|tx_id|report_id|reference|trn|unique_.*identifier)($|_)/.test(n) ? "id"
                    : /(^|_)(date|dt)($|_)|_date$|date_|timestamp|_time$|^time/.test(n) ? "date"
                      : /(notional|amount|value|consideration|principal|market_value|exposure|nominal)/.test(n) ? "amount"
                        : /(quantity|qty|units|volume)/.test(n) ? "quantity"
                          : /(price|rate|strike|yield)/.test(n) ? "price" : "other";
  }
  return out;
}

const PLACEHOLDERS = /^(n\/?a|na|tbd|tba|unknown|xxx+|x+|test|dummy|default|0{4,}|9{6,}|1900-01-01|9999-12-31|01\/01\/1900|31\/12\/9999|-|\?+|null|none)$/i;
const ZERO_DEC = new Set(["JPY", "KRW", "CLP", "ISK", "VND", "XOF", "XAF", "UGX", "PYG", "KMF", "GNF", "RWF", "DJF", "VUV", "XPF", "BIF"]);
const THREE_DEC = new Set(["BHD", "KWD", "OMR", "JOD", "TND", "LYD", "IQD"]);

function dateRank(col: string): number {
  const n = normaliseHeader(col);
  if (/(trade|execution|exec|transaction|deal)/.test(n)) return 1;
  if (/(effective|start|value|settlement|settle|clearing)/.test(n)) return 2;
  if (/(maturity|expir|end|termination)/.test(n)) return 3;
  return 0;
}

export function checkReport(rows: Row[], opts: { required?: string[]; reportDate?: string } = {}): { issues: Issue[]; roles: Record<string, Role>; rows: number } {
  const issues: Issue[] = [];
  if (!rows.length) return { issues, roles: {}, rows: 0 };
  const headers = Object.keys(rows[0]);
  const roles = classifyColumns(headers);
  const add = (row: number, column: string, value: string, rule: string, severity: Sev, message: string) => issues.push({ row, column, value, rule, severity, message });
  const reportDateCol = headers.find((h) => /report(ing)?_?(date|timestamp)|submission/.test(normaliseHeader(h)));
  const fixedReportDate = opts.reportDate ? parseTimestamp(opts.reportDate) : null;
  const ccyCol = headers.find((h) => roles[h] === "currency");
  const idCols = headers.filter((h) => roles[h] === "id");
  const leiCols = headers.filter((h) => roles[h] === "lei");
  const amountCols = headers.filter((h) => roles[h] === "amount" || roles[h] === "quantity");
  const dateCols = headers.filter((h) => roles[h] === "date" && dateRank(h) > 0);

  rows.forEach((r, i) => {
    const rowNo = i + 2;
    for (const h of headers) {
      const v = (r[h] ?? "").trim();
      const role = roles[h];
      if ((opts.required ?? []).map(normaliseHeader).includes(normaliseHeader(h)) && !v) add(rowNo, h, v, "MISSING", "error", "Required value is empty.");
      if (!v) continue;
      if (PLACEHOLDERS.test(v) && role !== "other") { add(rowNo, h, v, "PLACEHOLDER", "error", "Looks like a placeholder, not real data."); continue; }
      const check = role === "lei" ? checkLei(v) : role === "isin" ? checkIsin(v) : role === "bic" ? checkBic(v) : role === "iban" ? checkIban(v) : role === "currency" ? checkCurrency(v) : role === "country" ? checkCountry(v) : null;
      if (check && !check.ok) add(rowNo, h, v, `INVALID_${role.toUpperCase()}`, "error", check.reason ?? "invalid");
      if (role === "date" && !parseTimestamp(v)) add(rowNo, h, v, "BAD_DATE", "error", "Can't read this date.");
      if (role === "amount" || role === "quantity") {
        const n = parseAmount(v);
        if (n !== null && n < 0 && !/(mtm|market_value|valuation|pnl|p_l|exposure)/.test(normaliseHeader(h))) add(rowNo, h, v, "NEGATIVE", "error", "Negative value where a positive one is expected (direction should be a separate field).");
        if (n === 0 && /(notional|quantity|qty|nominal|principal)/.test(normaliseHeader(h))) add(rowNo, h, v, "ZERO", "warning", "Zero notional/quantity.");
        const ccy = ccyCol ? (r[ccyCol] ?? "").toUpperCase() : "";
        const dec = v.includes(".") ? v.split(".").pop()!.length : 0;
        if (ccy && role === "amount" && ((ZERO_DEC.has(ccy) && dec > 0 && Number(v.split(".")[1]) !== 0) || (!ZERO_DEC.has(ccy) && !THREE_DEC.has(ccy) && dec > 2 && /(amount|consideration|principal)/.test(normaliseHeader(h))))) add(rowNo, h, v, "CURRENCY_DECIMALS", "warning", `${ccy} amounts normally have ${ZERO_DEC.has(ccy) ? 0 : 2} decimals.`);
      }
    }
    // date order
    const dated = dateCols.map((h) => ({ h, rank: dateRank(h), d: parseTimestamp(r[h] ?? "") })).filter((x) => x.d) as { h: string; rank: number; d: Date }[];
    for (const a of dated) for (const b of dated) {
      if (a.rank < b.rank && a.d.getTime() > b.d.getTime() + 86400000 - 1) add(rowNo, `${a.h} > ${b.h}`, `${r[a.h]} > ${r[b.h]}`, "DATE_ORDER", "error", `${a.h} is after ${b.h}.`);
    }
    const rep = fixedReportDate ?? (reportDateCol ? parseTimestamp(r[reportDateCol] ?? "") : null);
    if (rep) for (const x of dated) if (x.rank === 1 && x.d.getTime() > rep.getTime() + 86400000) add(rowNo, x.h, r[x.h], "FUTURE_DATE", "error", "Trade/execution date is after the report date.");
    // self counterparty
    if (leiCols.length >= 2) {
      const rep1 = leiCols.find((c) => /(report|submit|own|entity|firm)/.test(normaliseHeader(c))) ?? leiCols[0];
      for (const c of leiCols) if (c !== rep1 && /(counterparty|other|cpty|client|issuer|beneficiary)/.test(normaliseHeader(c)) && r[c] && r[c].trim().toUpperCase() === (r[rep1] ?? "").trim().toUpperCase()) add(rowNo, c, r[c], "SELF_COUNTERPARTY", "error", `Same LEI as ${rep1}.`);
    }
  });

  // duplicates
  for (const c of idCols) {
    const seen = new Map<string, number>();
    rows.forEach((r, i) => { const v = (r[c] ?? "").trim(); if (!v) return; if (seen.has(v)) add(i + 2, c, v, "DUPLICATE_ID", "error", `Same identifier as row ${seen.get(v)}.`); else seen.set(v, i + 2); });
  }
  // outliers: per amount column (and currency), value > 100× median or < median/1000
  for (const c of amountCols) {
    const groups = new Map<string, { i: number; v: number }[]>();
    rows.forEach((r, i) => { const n = parseAmount(r[c] ?? ""); if (n && n > 0) { const k = ccyCol ? (r[ccyCol] ?? "") : ""; groups.set(k, [...(groups.get(k) ?? []), { i, v: n }]); } });
    for (const [, list] of groups) {
      if (list.length < 20) continue;
      const sorted = list.map((x) => x.v).sort((a, b) => a - b);
      const med = sorted[Math.floor(sorted.length / 2)];
      for (const x of list) if (x.v > med * 100 || x.v < med / 1000) add(x.i + 2, c, rows[x.i][c], "OUTLIER", "warning", `${x.v > med ? "Over 100×" : "Under 1/1000 of"} the typical value (${med.toLocaleString("en-US")}). Check for a missing decimal point or wrong unit.`);
    }
  }
  return { issues, roles, rows: rows.length };
}
