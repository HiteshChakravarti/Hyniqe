// Spreadsheet (EUC) Risk Scanner
// Banks run critical processes on spreadsheets ("end-user computing"). Regulators expect firms to know which
// spreadsheets matter and how risky they are. This opens .xlsx/.xlsm files (without Excel) and builds an EUC register:
// macros, links to other files, database connections (and passwords inside them), hidden and very-hidden sheets,
// broken references and error values, hard-coded numbers inside formulas, volatile functions, and who last changed it.

import { type Inflate, isOle2, isZip, readZip } from "../../shared/zip.ts";
import { findAll, parseXml } from "../../shared/xml-reader.ts";

export interface SheetInfo { name: string; state: "visible" | "hidden" | "veryHidden"; formulas: number; hardcoded: number; volatile: number; errors: number; longFormulas: number; externalRefs: number; protected: boolean }
export interface Finding { rule: string; points: number; message: string }
export interface FileReport {
  file: string; size: number; format: "xlsx" | "xlsm" | "xls (legacy binary)" | "not a spreadsheet"; author: string; lastModifiedBy: string; modified: string; application: string;
  sheets: SheetInfo[]; macros: boolean; externalLinks: string[]; connections: { name: string; type: string; hasPassword: boolean }[]; brokenNames: string[];
  formulas: number; score: number; tier: "HIGH" | "MEDIUM" | "LOW"; findings: Finding[]; examples: { sheet: string; cell: string; formula: string; why: string }[];
}

const dec = new TextDecoder();
const VOLATILE = /\b(INDIRECT|OFFSET|NOW|TODAY|RAND|RANDBETWEEN|CELL|INFO)\s*\(/i;
// numeric literals in a formula that are not part of a cell reference, sheet name or function name
function hardcodedConstants(f: string): string[] {
  const cleaned = f.replace(/"[^"]*"/g, "\"\"").replace(/'[^']*'!/g, "").replace(/\$?[A-Z]{1,3}\$?\d+(:\$?[A-Z]{1,3}\$?\d+)?/g, "REF").replace(/\[\d+\]/g, "");
  return (cleaned.match(/(?<![A-Z_\d.])\d+(\.\d+)?(?![\d(A-Z_])/gi) ?? []).filter((n) => !["0", "1", "2", "100", "12", "365", "1000"].includes(n));
}

export async function scanWorkbook(file: string, bytes: Uint8Array, inflate: Inflate): Promise<FileReport> {
  const r: FileReport = { file, size: bytes.length, format: "xlsx", author: "", lastModifiedBy: "", modified: "", application: "", sheets: [], macros: false, externalLinks: [], connections: [], brokenNames: [], formulas: 0, score: 0, tier: "LOW", findings: [], examples: [] };
  const add = (rule: string, points: number, message: string) => r.findings.push({ rule, points, message });
  if (isOle2(bytes)) {
    r.format = "xls (legacy binary)";
    add("LEGACY_FORMAT", 3, "Old binary .xls format: can't be inspected here (and may contain macros). Save as .xlsx/.xlsm to scan it.");
    return finish(r);
  }
  if (!isZip(bytes)) { r.format = "not a spreadsheet"; add("UNREADABLE", 0, "Not an Excel workbook."); return finish(r); }
  const entries = readZip(bytes, inflate);
  const get = async (name: string) => { const e = entries.find((x) => x.name.toLowerCase() === name.toLowerCase()); return e ? dec.decode(await e.read()) : ""; };
  r.macros = entries.some((e) => /vbaProject\.bin$/i.test(e.name));
  if (r.macros) { r.format = "xlsm"; add("MACROS", 3, "Contains VBA macros: code that runs inside the spreadsheet, usually without testing or change control."); }

  const core = parseXml(await get("docProps/core.xml"));
  r.author = findAll(core, "creator")[0]?.text.trim() ?? "";
  r.lastModifiedBy = findAll(core, "lastModifiedBy")[0]?.text.trim() ?? "";
  r.modified = (findAll(core, "modified")[0]?.text.trim() ?? "").slice(0, 10);
  r.application = findAll(parseXml(await get("docProps/app.xml")), "Application")[0]?.text.trim() ?? "";

  // workbook: sheets, defined names
  const wb = parseXml(await get("xl/workbook.xml"));
  const rels = parseXml(await get("xl/_rels/workbook.xml.rels"));
  const relTarget = new Map(findAll(rels, "Relationship").map((x) => [x.attrs.Id, x.attrs.Target]));
  const sheetDefs = findAll(wb, "sheet").map((s) => ({ name: s.attrs.name, state: (s.attrs.state ?? "visible") as SheetInfo["state"], target: relTarget.get(s.attrs.id) ?? "" }));
  r.brokenNames = findAll(wb, "definedName").filter((n) => n.text.includes("#REF!")).map((n) => n.attrs.name);
  if (r.brokenNames.length) add("BROKEN_NAMES", 2, `${r.brokenNames.length} named range(s) point to deleted cells (#REF!): ${r.brokenNames.slice(0, 5).join(", ")}.`);

  // external links
  for (const e of entries.filter((x) => /^xl\/externalLinks\/_rels\/.*\.rels$/i.test(x.name))) {
    for (const rel of findAll(parseXml(dec.decode(await e.read())), "Relationship")) if (rel.attrs.Target) r.externalLinks.push(decodeURIComponent(rel.attrs.Target.replace(/^file:\/\/\/?/, "")));
  }
  if (r.externalLinks.length) add("EXTERNAL_LINKS", 2, `Pulls data from ${r.externalLinks.length} other file(s): ${r.externalLinks.slice(0, 3).join("; ")}. If those move or change, results silently go wrong.`);

  // data connections
  const conns = parseXml(await get("xl/connections.xml"));
  for (const c of findAll(conns, "connection")) {
    const dbPr = c.children.find((x) => x.name === "dbPr");
    const cs = dbPr?.attrs.connection ?? "";
    r.connections.push({ name: c.attrs.name ?? "", type: cs ? (/(odbc|dsn=)/i.test(cs) ? "ODBC" : /provider=/i.test(cs) ? "OLE DB" : "database") : c.attrs.type === "4" ? "web" : "other", hasPassword: /(password|pwd)\s*=\s*[^;"]+/i.test(cs) });
  }
  if (r.connections.length) add("CONNECTIONS", 2, `${r.connections.length} live data connection(s) (${r.connections.map((c) => c.type).join(", ")}).`);
  if (r.connections.some((c) => c.hasPassword)) add("PASSWORD_IN_CONNECTION", 4, "A database password is stored inside the workbook's connection string.");

  // sheets
  for (const sd of sheetDefs) {
    const path = sd.target.startsWith("/") ? sd.target.slice(1) : "xl/" + sd.target.replace(/^\.\//, "");
    const xml = await get(path);
    const info: SheetInfo = { name: sd.name, state: sd.state, formulas: 0, hardcoded: 0, volatile: 0, errors: 0, longFormulas: 0, externalRefs: 0, protected: /<(\w+:)?sheetProtection\b/.test(xml) };
    if (xml) {
      const doc = parseXml(xml);
      for (const c of findAll(doc, "c")) {
        const fNode = c.children.find((x) => x.name === "f");
        const vNode = c.children.find((x) => x.name === "v");
        if (c.attrs.t === "e" && vNode) { info.errors++; if (r.examples.length < 40 && /#REF!/.test(vNode.text)) r.examples.push({ sheet: sd.name, cell: c.attrs.r, formula: fNode?.text ?? "", why: `shows ${vNode.text}` }); }
        if (!fNode) continue;
        const f = fNode.text;
        if (!f && fNode.attrs.t === "shared") { info.formulas++; continue; }
        info.formulas++;
        const consts = hardcodedConstants(f);
        if (consts.length) { info.hardcoded++; if (r.examples.length < 40 && info.hardcoded <= 3) r.examples.push({ sheet: sd.name, cell: c.attrs.r, formula: f, why: `hard-coded ${consts.slice(0, 3).join(", ")}` }); }
        if (VOLATILE.test(f)) info.volatile++;
        if (f.length > 250) info.longFormulas++;
        if (/\[\d+\]|'[A-Z]:\\|\\\\/.test(f)) info.externalRefs++;
        if (/#REF!/.test(f)) { info.errors++; if (r.examples.length < 40) r.examples.push({ sheet: sd.name, cell: c.attrs.r, formula: f, why: "formula refers to a deleted range (#REF!)" }); }
      }
    }
    r.sheets.push(info);
  }
  r.formulas = r.sheets.reduce((s, x) => s + x.formulas, 0);
  const veryHidden = r.sheets.filter((s) => s.state === "veryHidden"), hidden = r.sheets.filter((s) => s.state === "hidden");
  if (veryHidden.length) add("VERY_HIDDEN_SHEETS", 2, `${veryHidden.length} "very hidden" sheet(s) (${veryHidden.map((s) => s.name).join(", ")}). These can only be unhidden with VBA, so reviewers usually never see them.`);
  if (hidden.length) add("HIDDEN_SHEETS", 1, `${hidden.length} hidden sheet(s): ${hidden.map((s) => s.name).join(", ")}.`);
  const errors = r.sheets.reduce((s, x) => s + x.errors, 0);
  if (errors) add("ERRORS", 2, `${errors} cell(s) show errors (#REF!, #N/A, #DIV/0!…) or refer to deleted ranges.`);
  const hard = r.sheets.reduce((s, x) => s + x.hardcoded, 0);
  if (hard >= 5) add("HARDCODED", hard >= 25 ? 2 : 1, `${hard} formulas contain typed-in numbers (e.g. rates, thresholds, FX). Changes to those assumptions are invisible.`);
  const vol = r.sheets.reduce((s, x) => s + x.volatile, 0);
  if (vol) add("VOLATILE", 1, `${vol} formulas use INDIRECT/OFFSET/NOW/TODAY/RAND: results depend on when or how the file is opened.`);
  const ext = r.sheets.reduce((s, x) => s + x.externalRefs, 0);
  if (ext && !r.externalLinks.length) add("EXTERNAL_LINKS", 2, `${ext} formulas reference other workbooks.`);
  const long = r.sheets.reduce((s, x) => s + x.longFormulas, 0);
  if (long) add("COMPLEX_FORMULAS", 1, `${long} very long formulas (over 250 characters): hard to review.`);
  if (r.formulas >= 500) add("SIZE", 1, `${r.formulas.toLocaleString("en-US")} formulas: a model, not a list.`);
  if (r.lastModifiedBy && r.author && r.lastModifiedBy !== r.author) r.findings.push({ rule: "OWNERSHIP", points: 0, message: `Created by ${r.author}, last changed by ${r.lastModifiedBy}. Confirm who owns it.` });
  return finish(r);
}

function finish(r: FileReport): FileReport {
  r.score = r.findings.reduce((s, f) => s + f.points, 0);
  r.tier = r.score >= 6 ? "HIGH" : r.score >= 3 ? "MEDIUM" : "LOW";
  return r;
}
