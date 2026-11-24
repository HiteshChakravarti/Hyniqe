// Migration Reconciler
// Compares a source extract (legacy system) with a target extract (new system) after a data migration: record counts,
// records missing or added, duplicate keys, and field-by-field differences classified so that real problems stand out:
// values truncated, emptied (e.g. consent flags lost), or changed, versus harmless differences in case, spacing or
// number/date formatting. Produces control totals and an evidence pack for sign-off.

import { type Row, normaliseHeader, parseAmount, parseTimestamp } from "../../shared/table.ts";

export type DiffKind = "TRUNCATED" | "EMPTIED" | "POPULATED" | "CHANGED" | "NUMBER_CHANGED" | "DATE_CHANGED" | "CASE_SPACING" | "FORMAT_ONLY";
export const SERIOUS: DiffKind[] = ["TRUNCATED", "EMPTIED", "CHANGED", "NUMBER_CHANGED", "DATE_CHANGED"];

export interface Options { key: string[]; map?: Record<string, string>; tolerance?: number; ignoreCase?: boolean; ignoreLeadingZeros?: boolean; ignoreFields?: string[] }
export interface Diff { key: string; field: string; source: string; target: string; kind: DiffKind }
export interface FieldStat { field: string; target: string; compared: number; same: number; kinds: Partial<Record<DiffKind, number>>; sourceSum?: number; targetSum?: number }
export interface Result {
  sourceRows: number; targetRows: number; matched: number; missing: string[]; extra: string[]; dupSource: string[]; dupTarget: string[];
  diffs: Diff[]; fields: FieldStat[]; unmappedSource: string[]; unmappedTarget: string[]; recordsWithSeriousDiffs: number;
}

const isNum = (s: string) => /^[+-]?[\d.,' ]*\d[\d.,' ]*$/.test(s.trim()) && parseAmount(s) !== null;
const looksDate = (s: string) => /\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}/.test(s) || /^\d{8}$/.test(s.trim());
function asDate(s: string): string | null {
  const t = s.trim();
  if (/^\d{8}$/.test(t)) return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
  const d = parseTimestamp(t);
  return d ? d.toISOString().slice(0, 10) : null;
}

export function classify(src: string, tgt: string, tol = 0): DiffKind | null {
  if (src === tgt) return null;
  const s = src.trim(), t = tgt.trim();
  if (s === t) return "CASE_SPACING";
  if (!t && s) return "EMPTIED";
  if (!s && t) return "POPULATED";
  if (s.toLowerCase().replace(/\s+/g, " ") === t.toLowerCase().replace(/\s+/g, " ")) return "CASE_SPACING";
  if (isNum(s) && isNum(t)) {
    const a = parseAmount(s) as number, b = parseAmount(t) as number;
    return Math.abs(a - b) <= tol + 1e-9 ? "FORMAT_ONLY" : "NUMBER_CHANGED";
  }
  if (looksDate(s) && looksDate(t)) {
    const a = asDate(s), b = asDate(t);
    if (a && b) return a === b ? "FORMAT_ONLY" : "DATE_CHANGED";
  }
  if (t.length < s.length && s.toLowerCase().startsWith(t.toLowerCase().replace(/[+…]$/, ""))) return "TRUNCATED";
  // Y/N vs true/false vs 1/0 style booleans
  const bool = (x: string) => (/^(y|yes|true|1|t)$/i.test(x) ? "T" : /^(n|no|false|0|f)$/i.test(x) ? "F" : null);
  if (bool(s) && bool(s) === bool(t)) return "FORMAT_ONLY";
  return "CHANGED";
}

export function reconcile(source: Row[], target: Row[], opts: Options): Result {
  const srcCols = source.length ? Object.keys(source[0]) : [];
  const tgtCols = target.length ? Object.keys(target[0]) : [];
  const map: Record<string, string> = {};
  const userMap = Object.fromEntries(Object.entries(opts.map ?? {}).map(([a, b]) => [normaliseHeader(a), normaliseHeader(b)]));
  for (const c of srcCols) { const t = userMap[c] ?? (tgtCols.includes(c) ? c : undefined); if (t && tgtCols.includes(t)) map[c] = t; }
  const ignore = new Set((opts.ignoreFields ?? []).map(normaliseHeader));
  const keyCols = opts.key.map(normaliseHeader);
  for (const k of keyCols) { if (!srcCols.includes(k)) throw new Error(`Key column "${k}" not found in source (columns: ${srcCols.join(", ")}).`); if (!map[k]) throw new Error(`Key column "${k}" has no matching column in target. Use --map ${k}:<target column>.`); }
  const normKey = (v: string) => { let x = v.trim(); if (opts.ignoreCase) x = x.toUpperCase(); if (opts.ignoreLeadingZeros) x = x.replace(/^0+(?=.)/, ""); return x; };
  const keyOf = (r: Row, side: "s" | "t") => keyCols.map((k) => normKey(r[side === "s" ? k : map[k]] ?? "")).join("|");

  const index = (rows: Row[], side: "s" | "t") => {
    const m = new Map<string, Row>(), dups: string[] = [];
    for (const r of rows) { const k = keyOf(r, side); if (m.has(k)) dups.push(k); else m.set(k, r); }
    return { m, dups };
  };
  const S = index(source, "s"), T = index(target, "t");
  const missing = [...S.m.keys()].filter((k) => !T.m.has(k));
  const extra = [...T.m.keys()].filter((k) => !S.m.has(k));
  const compareCols = Object.keys(map).filter((c) => !keyCols.includes(c) && !ignore.has(c));
  const stats = new Map<string, FieldStat>(compareCols.map((c) => [c, { field: c, target: map[c], compared: 0, same: 0, kinds: {} }]));
  const diffs: Diff[] = [];
  const seriousKeys = new Set<string>();
  let matched = 0;
  for (const [k, s] of S.m) {
    const t = T.m.get(k);
    if (!t) continue;
    matched++;
    for (const c of compareCols) {
      const st = stats.get(c) as FieldStat;
      st.compared++;
      const kind = classify(s[c] ?? "", t[map[c]] ?? "", opts.tolerance ?? 0);
      if (!kind) { st.same++; continue; }
      st.kinds[kind] = (st.kinds[kind] ?? 0) + 1;
      if (kind === "FORMAT_ONLY" || kind === "CASE_SPACING") { st.same++; continue; }
      diffs.push({ key: k, field: c, source: s[c] ?? "", target: t[map[c]] ?? "", kind });
      if (SERIOUS.includes(kind)) seriousKeys.add(k);
    }
  }
  // control totals for numeric columns (all rows, each side)
  for (const c of compareCols) {
    const sVals = source.map((r) => r[c] ?? "").filter((v) => v.trim());
    if (sVals.length && sVals.every(isNum)) {
      const st = stats.get(c) as FieldStat;
      st.sourceSum = round(sVals.reduce((a, v) => a + (parseAmount(v) as number), 0));
      st.targetSum = round(target.map((r) => r[map[c]] ?? "").filter((v) => isNum(v)).reduce((a, v) => a + (parseAmount(v) as number), 0));
    }
  }
  return {
    sourceRows: source.length, targetRows: target.length, matched, missing, extra, dupSource: S.dups, dupTarget: T.dups, diffs, fields: [...stats.values()],
    unmappedSource: srcCols.filter((c) => !map[c]), unmappedTarget: tgtCols.filter((c) => !Object.values(map).includes(c)), recordsWithSeriousDiffs: seriousKeys.size,
  };
}

const round = (n: number) => Math.round(n * 100) / 100;
