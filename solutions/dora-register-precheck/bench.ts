// Synthetic benchmark: 2,000 register rows (seeded), ~45% with one injected error of 12 types. Row-level scoring.
// Run: node bench.ts
import { rng, choice, printScores, type Score } from "../shared/bench.ts";
import { leiWithCheck } from "../shared/ids.ts";
import { parseCsv } from "../shared/table.ts";
import { precheck, readRegister } from "./src/precheck.ts";

const r = rng(2554);
const hex = (k: number) => Array.from({ length: k }, () => "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(r() * 34)]).join("");
const ent = leiWithCheck("529900HYNIQEBANK01");
const providers = Array.from({ length: 200 }, (_, i) => ({ name: `Provider ${i} Ltd`, lei: leiWithCheck(hex(18)), ctry: choice(r, ["IE", "DE", "FR", "NL", "LU", "US", "GB"]) }));
const KINDS = ["MISSING", "INVALID_LEI", "INVALID_EUID", "INVALID_COUNTRY", "INVALID_CURRENCY", "DATE_FORMAT", "DATE_ORDER", "DUPLICATE_REF", "BROKEN_REFERENCE", "CRITICAL_GAP", "NUMBER", "DATA_LOCATION"];
let csv = "arrangement_ref,entity_lei,provider_name,provider_id,provider_id_type,provider_country,subcontractor_of,ict_service_type,function_name,function_critical,start_date,end_date,notice_period_entity,notice_period_provider,governing_law_country,data_location_country,stores_data,substitutability,exit_plan,reintegration_possible,annual_cost,currency\n";
const labels: string[][] = [];
for (let i = 0; i < 2000; i++) {
  const p = providers[i % 200];
  const crit = r() < 0.3;
  const o: Record<string, string> = { ref: `CA-${i}`, ent, name: p.name, id: p.lei, type: "LEI", ctry: p.ctry, parent: i > 10 && r() < 0.1 ? `CA-${i - 5}` : "", svc: "Cloud services", fn: "Function " + (i % 40), crit: crit ? "yes" : "no", start: "2024-01-01", end: r() < 0.3 ? "2028-12-31" : "", ne: "90", np: "90", law: "IE", loc: "DE", stores: "yes", sub: "medium", exit: "yes", rein: "yes", cost: String(1000 + Math.floor(r() * 1e6)), ccy: "EUR" };
  const lab: string[] = [];
  if (r() < 0.45) {
    const k = choice(r, KINDS); lab.push(k);
    ({ MISSING: () => (o.svc = ""), INVALID_LEI: () => (o.id = o.id.slice(0, 19) + ((Number(o.id[19]) + 1) % 10)), INVALID_EUID: () => { o.type = "EUID"; o.id = "HRB 12345 Munich"; },
      INVALID_COUNTRY: () => (o.law = choice(r, ["UK", "EN", "EU"])), INVALID_CURRENCY: () => (o.ccy = choice(r, ["EURO", "UKP", "US$"])), DATE_FORMAT: () => (o.start = "01/01/2024"), DATE_ORDER: () => (o.end = "2023-06-30"),
      DUPLICATE_REF: () => (i > 0 ? (o.ref = `CA-${i - 1}`) : lab.pop()), BROKEN_REFERENCE: () => (o.parent = `CA-X${i}`), CRITICAL_GAP: () => { o.crit = "yes"; o.sub = ""; }, NUMBER: () => (o.ne = "three months"), DATA_LOCATION: () => (o.loc = "") } as Record<string, () => void>)[k]();
  }
  // DATE_ORDER with an end date also before the reference year: label EXPIRED too (both are true)
  if (lab[0] === "DATE_ORDER") lab.push("EXPIRED");
  if (lab[0] === "DATA_LOCATION" && o.crit === "yes") lab.push("CRITICAL_GAP");
  csv += [o.ref, o.ent, o.name, o.id, o.type, o.ctry, o.parent, o.svc, o.fn, o.crit, o.start, o.end, o.ne, o.np, o.law, o.loc, o.stores, o.sub, o.exit, o.rein, o.cost, o.ccy].join(",") + "\n";
  labels.push(lab);
}
// derive cascading truths: links to references that no longer exist ARE broken; "duplicates" of a missing ref are not
{
  const rowsParsed = parseCsv(csv);
  const seen = new Set<string>();
  rowsParsed.forEach((row, idx) => {
    if (labels[idx].includes("DUPLICATE_REF") && !seen.has(row.arrangement_ref)) labels[idx] = labels[idx].filter((l) => l !== "DUPLICATE_REF");
    seen.add(row.arrangement_ref);
  });
  rowsParsed.forEach((row, idx) => { if (row.subcontractor_of && !seen.has(row.subcontractor_of) && !labels[idx].includes("BROKEN_REFERENCE")) labels[idx].push("BROKEN_REFERENCE"); });
}
const issues = precheck(readRegister(parseCsv(csv)), { referenceDate: "2026-12-31" }).filter((i) => i.rule !== "PROVIDER_INCONSISTENT");
const got = new Map<number, Set<string>>();
for (const i of issues) (got.get(i.line) ?? got.set(i.line, new Set()).get(i.line)!).add(i.rule);
const per = new Map<string, Score>();
labels.forEach((lab, idx) => {
  const g = got.get(idx + 2) ?? new Set(); const e = new Set(lab);
  for (const k of new Set([...g, ...e])) { const s = per.get(k) ?? { label: k, tp: 0, fp: 0, fn: 0 }; if (g.has(k) && e.has(k)) s.tp++; else if (g.has(k)) s.fp++; else s.fn++; per.set(k, s); }
});
const o = printScores("DORA Register Pre-Check — synthetic benchmark (2,000 arrangements)", [...per.values()].sort((a, b) => a.label.localeCompare(b.label)));
if (o.recall < 0.95 || o.precision < 0.95) process.exitCode = 1;
