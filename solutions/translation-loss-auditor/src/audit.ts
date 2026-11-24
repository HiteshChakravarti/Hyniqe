// Translation Data-Loss Auditor
// Compares an ISO 20022 pacs.008 customer credit transfer with the MT103 produced from (or alongside) it, and flags
// data that was truncated, dropped or changed in translation: names cut at 35 characters, lost ultimate parties,
// remittance info over 140 characters, structured data flattened, LEIs and purpose codes lost, and critical mismatches
// in UETR, amount, currency, date, account or charges.

import { at, findAll, parseXml, textAt, textsAt, type XNode } from "../../shared/xml-reader.ts";
import { normName } from "../../shared/text.ts";

export type Sev = "critical" | "high" | "medium" | "info";
export interface Finding { rule: string; severity: Sev; field: string; mx: string; mt: string; message: string }

export interface Party { name: string; lines: string[]; account: string; town: string; country: string; lei: string; structured: boolean }
export interface Mx { uetr: string; e2e: string; amount: string; ccy: string; date: string; charges: string; dbtr: Party; cdtr: Party; ultDbtr: string; ultCdtr: string; ustrd: string; strd: boolean; purpose: string; cdtrAgt: string; dbtrAgt: string }
export interface Mt { uetr: string; ref: string; amount: string; ccy: string; date: string; charges: string; dbtr: Party; cdtr: Party; f70: string; f72: string; f57: string; f52: string; raw: string }

function party(p: XNode | undefined, acct: XNode | undefined): Party {
  const adr = at(p, "PstlAdr");
  const structured = !!adr && ["StrtNm", "TwnNm", "PstCd", "BldgNb"].some((f) => textAt(adr, f));
  const lines = adr ? [textAt(adr, "StrtNm") + (textAt(adr, "BldgNb") ? " " + textAt(adr, "BldgNb") : ""), textAt(adr, "PstCd") + " " + textAt(adr, "TwnNm"), ...textsAt(adr, "AdrLine")].map((s) => s.trim()).filter(Boolean) : [];
  return {
    name: textAt(p, "Nm"), lines, structured,
    account: textAt(acct, "Id/IBAN") || textAt(acct, "Id/Othr/Id"),
    town: textAt(adr, "TwnNm"), country: textAt(adr, "Ctry"),
    lei: textAt(p, "Id/OrgId/LEI"),
  };
}

export function parsePacs008(xml: string): Mx {
  const doc = parseXml(xml);
  const tx = findAll(doc, "CdtTrfTxInf")[0];
  if (!tx) throw new Error("No CdtTrfTxInf found: is this a pacs.008?");
  const amt = at(tx, "IntrBkSttlmAmt");
  const grpDate = textAt(findAll(doc, "GrpHdr")[0], "IntrBkSttlmDt");
  return {
    uetr: textAt(tx, "PmtId/UETR").toLowerCase(), e2e: textAt(tx, "PmtId/EndToEndId"), amount: amt?.text.trim() ?? "", ccy: amt?.attrs.Ccy ?? "",
    date: textAt(tx, "IntrBkSttlmDt") || grpDate, charges: textAt(tx, "ChrgBr"),
    dbtr: party(at(tx, "Dbtr"), at(tx, "DbtrAcct")), cdtr: party(at(tx, "Cdtr"), at(tx, "CdtrAcct")),
    ultDbtr: textAt(tx, "UltmtDbtr/Nm"), ultCdtr: textAt(tx, "UltmtCdtr/Nm"),
    ustrd: textsAt(at(tx, "RmtInf"), "Ustrd").join(" ").trim(), strd: !!at(tx, "RmtInf/Strd"), purpose: textAt(tx, "Purp/Cd"),
    cdtrAgt: textAt(tx, "CdtrAgt/FinInstnId/BICFI"), dbtrAgt: textAt(tx, "DbtrAgt/FinInstnId/BICFI"),
  };
}

function fields(mt: string): Map<string, string> {
  const body = mt.includes("{4:") ? mt.slice(mt.indexOf("{4:") + 3) : mt;
  const map = new Map<string, string>();
  let cur = "";
  for (const line of body.replace(/\r/g, "").split("\n")) {
    const m = line.match(/^:(\d{2}[A-Z]?):(.*)$/);
    if (m) { cur = m[1]; map.set(cur, m[2]); }
    else if (cur && line !== "-}" && line !== "-") map.set(cur, map.get(cur) + "\n" + line);
  }
  return map;
}

function mtParty(value: string | undefined, option: string): Party {
  const p: Party = { name: "", lines: [], account: "", town: "", country: "", lei: "", structured: false };
  if (!value) return p;
  let lines = value.split("\n").map((l) => l.trimEnd());
  if (lines[0]?.startsWith("/")) { p.account = lines[0].slice(1).replace(/\s/g, ""); lines = lines.slice(1); }
  if (option === "F") {
    p.structured = true;
    const get = (n: string) => lines.filter((l) => l.startsWith(n + "/")).map((l) => l.slice(2));
    p.name = get("1").join(" ");
    p.lines = get("2");
    const town = get("3")[0] ?? "";
    p.country = town.split("/")[0] ?? "";
    p.town = town.split("/").slice(1).join("/");
  } else {
    p.name = lines[0] ?? "";
    p.lines = lines.slice(1);
  }
  return p;
}

export function parseMt103(mt: string): Mt {
  const f = fields(mt);
  const opt = (tag: string) => [...f.keys()].find((k) => k.startsWith(tag)) ?? "";
  const k50 = opt("50"), k59 = opt("59");
  const f32 = f.get("32A") ?? "";
  const m32 = f32.match(/^(\d{6})([A-Z]{3})([\d,]+)/);
  return {
    uetr: (mt.match(/\{121:([0-9a-f-]{36})\}/i)?.[1] ?? "").toLowerCase(), ref: f.get("20") ?? "",
    amount: m32 ? m32[3].replace(",", ".").replace(/\.$/, "") : "", ccy: m32?.[2] ?? "", date: m32 ? `20${m32[1].slice(0, 2)}-${m32[1].slice(2, 4)}-${m32[1].slice(4, 6)}` : "",
    charges: f.get("71A") ?? "", dbtr: mtParty(f.get(k50), k50.slice(2)), cdtr: mtParty(f.get(k59), k59.slice(2)),
    f70: (f.get("70") ?? "").split("\n").join(""), f72: (f.get("72") ?? "").split("\n").join(" "), f57: (f.get("57A") ?? "").replace(/^\/.*\n/, "").trim(), f52: (f.get("52A") ?? "").replace(/^\/.*\n/, "").trim(), raw: mt,
  };
}

const CHG: Record<string, string> = { DEBT: "OUR", CRED: "BEN", SHAR: "SHA" };
const num = (s: string) => Number(s.replace(",", "."));
const squash = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

function compareName(label: string, mx: string, mt: string, mtAll: string, out: Finding[]) {
  if (!mx) return;
  const a = squash(mx), b = squash(mt.replace(/\+$/, ""));
  if (a === b) return;
  if (squash(mtAll).includes(a)) { out.push({ rule: "NAME_SPLIT", severity: "info", field: label, mx, mt, message: `${label} spread over several MT lines (35-character limit).` }); return; }
  if (b && a.startsWith(b)) { out.push({ rule: "TRUNCATED_NAME", severity: "high", field: label, mx, mt, message: `${label} cut from ${mx.length} to ${mt.replace(/\+$/, "").length} characters${mt.endsWith("+") ? " (\"+\" truncation marker)" : ""}. Screening and matching downstream see a different name.` }); return; }
  out.push({ rule: "NAME_MISMATCH", severity: "critical", field: label, mx, mt, message: `${label} differs between the two messages.` });
}

export function audit(mx: Mx, mt: Mt): Finding[] {
  const out: Finding[] = [];
  const add = (rule: string, severity: Sev, field: string, a: string, b: string, message: string) => out.push({ rule, severity, field, mx: a, mt: b, message });
  // critical identity of the payment
  if (mx.uetr && mt.uetr !== mx.uetr) add(mt.uetr ? "UETR_MISMATCH" : "UETR_LOST", "critical", "UETR", mx.uetr, mt.uetr, mt.uetr ? "Different UETRs: these may not be the same payment, or tracking will break." : "UETR missing from MT block 3 (field 121): the payment can't be tracked end to end.");
  if (mx.amount && mt.amount && Math.abs(num(mx.amount) - num(mt.amount)) > 0.001) add("AMOUNT_MISMATCH", "critical", "Amount", mx.amount, mt.amount, "Settlement amount differs.");
  if (mx.ccy && mt.ccy && mx.ccy !== mt.ccy) add("CURRENCY_MISMATCH", "critical", "Currency", mx.ccy, mt.ccy, "Currency differs.");
  if (mx.date && mt.date && mx.date !== mt.date) add("DATE_MISMATCH", "critical", "Settlement date", mx.date, mt.date, "Settlement date differs.");
  if (mx.charges && mt.charges && CHG[mx.charges] !== mt.charges) add("CHARGES_MISMATCH", "critical", "Charges", `${mx.charges} (= ${CHG[mx.charges]})`, mt.charges, "Charge bearer translated wrongly: the beneficiary may receive the wrong amount.");
  if (mx.cdtr.account && mt.cdtr.account && squash(mx.cdtr.account) !== squash(mt.cdtr.account)) add("ACCOUNT_MISMATCH", "critical", "Creditor account", mx.cdtr.account, mt.cdtr.account, "Creditor account differs.");
  if (mx.cdtrAgt && mt.f57 && !squash(mt.f57).startsWith(squash(mx.cdtrAgt).slice(0, 8))) add("AGENT_MISMATCH", "critical", "Creditor agent", mx.cdtrAgt, mt.f57, "Beneficiary bank differs.");

  // parties
  compareName("Debtor name", mx.dbtr.name, mt.dbtr.name, [mt.dbtr.name, ...mt.dbtr.lines].join(" "), out);
  compareName("Creditor name", mx.cdtr.name, mt.cdtr.name, [mt.cdtr.name, ...mt.cdtr.lines].join(" "), out);
  for (const [label, p, q] of [["Debtor", mx.dbtr, mt.dbtr], ["Creditor", mx.cdtr, mt.cdtr]] as const) {
    const mtText = squash([q.name, ...q.lines, q.town, q.country].join(" "));
    if (p.town && !mtText.includes(squash(p.town))) add("ADDRESS_LOST", "medium", `${label} town`, p.town, q.town || "(none)", `${label} town missing in MT; sanctions screening and the beneficiary bank lose it.`);
    if (p.country && !(q.country === p.country || mtText.includes(squash(p.country)))) add("ADDRESS_LOST", "medium", `${label} country`, p.country, q.country || "(none)", `${label} country missing in MT.`);
    if (p.structured && !q.structured) add("STRUCTURE_LOST", "info", `${label} address`, "structured", "free text", `${label} address flattened to free-text lines.`);
    if (p.lei && !mt.raw.includes(p.lei)) add("LEI_LOST", "medium", `${label} LEI`, p.lei, "(none)", `${label} LEI dropped: MT103 has no field for it.`);
  }
  for (const [label, v] of [["Ultimate debtor", mx.ultDbtr], ["Ultimate creditor", mx.ultCdtr]] as const) {
    if (v && !squash(mt.raw).includes(squash(v))) add("ULTIMATE_PARTY_LOST", "high", label, v, "(none)", `${label} dropped: MT103 has no field for it, so screening downstream can't see who the money is really for/from.`);
  }

  // remittance & purpose
  if (mx.ustrd) {
    // remove codeword segments banks add to :70: (/PURP/…, /LEI/…, /ULTD/…, /ULTB/…, /ROC/…) before comparing
    let f70 = mt.f70;
    for (const [code, val] of [["ULTD", mx.ultDbtr], ["ULTB", mx.ultCdtr], ["LEI", mx.dbtr.lei], ["PURP", mx.purpose], ["ROC", mx.e2e]] as const) if (val) f70 = f70.split(`/${code}/${val}`).join(" ");
    f70 = f70.replace(/\/(PURP|LEI|ULTD|ULTB|ROC|RFB|INV)\/\S*/g, " ");
    const a = squash(mx.ustrd), b = squash(f70);
    if (a !== b) {
      if (b && a.startsWith(b)) add("REMITTANCE_TRUNCATED", "medium", "Remittance info", `${mx.ustrd.length} chars`, `${f70.trim().length} chars`, "Remittance information cut (MT :70: holds 4×35 = 140 characters). Reconciliation at the beneficiary may fail.");
      else if (!b) add("REMITTANCE_LOST", "medium", "Remittance info", mx.ustrd.slice(0, 60), "(none)", "Remittance information missing in MT.");
      else if (!a.includes(b) && !b.includes(a)) add("REMITTANCE_MISMATCH", "high", "Remittance info", mx.ustrd.slice(0, 60), mt.f70.slice(0, 60), "Remittance information differs.");
    }
  }
  if (mx.strd) add("STRUCTURED_REMITTANCE_LOST", "medium", "Structured remittance", "present", mt.f70 ? "flattened" : "(none)", "Structured remittance (invoice numbers, amounts) can't be carried in MT103.");
  if (mx.purpose && !new RegExp(`/PURP/${mx.purpose}\\b`).test(mt.f70 + mt.f72)) add("PURPOSE_LOST", "medium", "Purpose code", mx.purpose, "(none)", "Purpose code dropped. Some corridors require it.");
  return out;
}

export function verdict(f: Finding[]): "CRITICAL" | "DATA LOST" | "MINOR" | "CLEAN" {
  return f.some((x) => x.severity === "critical") ? "CRITICAL" : f.some((x) => x.severity === "high" || x.severity === "medium") ? "DATA LOST" : f.length ? "MINOR" : "CLEAN";
}
