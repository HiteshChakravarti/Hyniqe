// Small, dependency-free table helpers shared by the Hyniqe Hub solutions in this batch.
// Runs unchanged in Node (22+, type stripping) and in the browser after `tsc`.

export type Row = Record<string, string>;

/** Parse CSV text into rows keyed by lower-cased, trimmed headers (spaces → underscores).
 *  Handles quoted fields, escaped quotes, BOM, CRLF, and comma / semicolon / tab separators. */
export function parseCsv(text: string): Row[] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const sep = pickSeparator(firstLine);
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += ch; }
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === sep) { record.push(field); field = ""; continue; }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      record.push(field); field = "";
      if (record.some((f) => f.trim() !== "")) records.push(record);
      record = [];
      continue;
    }
    field += ch;
  }
  record.push(field);
  if (record.some((f) => f.trim() !== "")) records.push(record);
  if (records.length === 0) return [];
  const headers = records[0].map(normaliseHeader);
  return records.slice(1).map((r) => {
    const row: Row = {};
    headers.forEach((h, idx) => { row[h] = (r[idx] ?? "").trim(); });
    return row;
  });
}

export function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function pickSeparator(line: string): string {
  const counts: [string, number][] = [",", ";", "\t"].map((s) => [s, line.split(s).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

/** Serialise rows to CSV with a fixed column order. */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
}

/** Render a simple Markdown table. */
export function mdTable(headers: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => String(v).replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [
    `| ${headers.map(cell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`),
  ].join("\n");
}

/** Read the first non-empty value among several possible column names. */
export function pick(row: Row, ...names: string[]): string {
  for (const n of names) {
    const v = row[normaliseHeader(n)];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/[^\d.,\-]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    const parts = s.split(",");
    s = parts.length === 2 && parts[1].length !== 3 ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseBool(raw: string): boolean | null {
  const s = raw.trim().toLowerCase();
  if (["y", "yes", "true", "1", "done", "passed", "pass"].includes(s)) return true;
  if (["n", "no", "false", "0", "not done", "failed", "fail", ""].includes(s)) return s === "" ? null : false;
  return null;
}

/** Parse ISO-ish timestamps ("2026-11-24 14:05", "2026-11-24T14:05:00Z", "24/11/2026 14:05"). */
export function parseTimestamp(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dmy) {
    const [, d, m, y, hh = "0", mm = "0", ss = "0"] = dmy;
    return new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss));
  }
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const withZone = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + (iso.length > 10 ? "Z" : "T00:00:00Z");
  const d = new Date(withZone);
  return Number.isNaN(d.getTime()) ? null : d;
}
