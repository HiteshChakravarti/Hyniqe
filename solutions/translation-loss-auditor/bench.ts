// Synthetic benchmark: 800 pacs.008/MT103 pairs from varied parties; ~60% with 1–3 injected translation faults.
// Faithful translations must produce no high/critical findings. Run: node bench.ts
import { rng, choice, printScores, type Score } from "../shared/bench.ts";
import { leiWithCheck, ibanWithCheck } from "../shared/ids.ts";
import { audit, parseMt103, parsePacs008 } from "./src/audit.ts";
import { type Fault, mt103, pacs008, type Spec } from "./bench/gen.ts";

const r = rng(20022);
const names = ["Nordic Timber AB", "Müller Logistik GmbH", "Sivasubramanian Chandrasegarampillai Trading Solutions Private Limited", "Société Générale de Fournitures Industrielles et Commerciales SA", "Acme Ltd", "Van der Berg International Consulting and Engineering B.V.", "Rossi Forniture Srl", "Global Commodities Trading and Shipping Corporation Limited", "O'Brien Accountants", "Papadopoulos Shipping"];
const towns: [string, string][] = [["Stockholm", "SE"], ["Hamburg", "DE"], ["Chennai", "IN"], ["Lyon", "FR"], ["London", "GB"], ["Rotterdam", "NL"], ["Milan", "IT"], ["Dublin", "IE"], ["Piraeus", "GR"]];
const FAULTS: Fault[] = ["TRUNCATED_NAME", "ULTIMATE_PARTY_LOST", "REMITTANCE_TRUNCATED", "PURPOSE_LOST", "LEI_LOST", "ADDRESS_LOST", "UETR_LOST", "AMOUNT_MISMATCH", "CHARGES_MISMATCH", "ACCOUNT_MISMATCH"];
const hex = (n: number) => Array.from({ length: n }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join("");
const per = new Map<string, Score>();
let cleanFalse = 0, clean = 0;
for (let i = 0; i < 800; i++) {
  const [dt, dc] = choice(r, towns), [ct, cc] = choice(r, towns);
  const s: Spec = { uetr: `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`, amount: (1000 + Math.floor(r() * 900000)).toFixed(2), ccy: choice(r, ["EUR", "USD", "GBP"]), date: "2026-11-2" + Math.floor(r() * 7), chrg: choice(r, ["DEBT", "CRED", "SHAR"] as const),
    dbtr: choice(r, names), dbtrStreet: "Main Street " + (1 + Math.floor(r() * 300)), dbtrTown: dt, dbtrCtry: dc, dbtrLei: r() < 0.5 ? leiWithCheck(("LEI" + hex(15)).toUpperCase()) : undefined, dbtrIban: ibanWithCheck("DE", "37040044" + String(1e9 + i).slice(0, 10)),
    cdtr: choice(r, names), cdtrStreet: "Harbour Road " + (1 + Math.floor(r() * 90)), cdtrTown: ct, cdtrCtry: cc, cdtrIban: ibanWithCheck("NL", "ABNA0" + String(417164300 + i)), cdtrAgt: choice(r, ["ABNANL2AXXX", "ESSESESSXXX", "BNPAFRPPXXX"]),
    ultDbtr: r() < 0.4 ? "Ultimate Holding " + hex(4).toUpperCase() + " Ltd" : undefined, ultCdtr: r() < 0.2 ? "End Beneficiary " + hex(4).toUpperCase() : undefined,
    ustrd: r() < 0.5 ? "Invoice " + hex(6) : "Invoices " + Array.from({ length: 8 }, () => "INV-" + hex(6)).join(", ") + " for deliveries and services under the framework agreement", purp: r() < 0.5 ? choice(r, ["GDDS", "SUPP", "TRAD"]) : undefined };
  // only inject faults that are observable for this spec
  const possible = FAULTS.filter((f) => (f !== "TRUNCATED_NAME" || s.dbtr.length > 35 || s.cdtr.length > 35) && (f !== "ULTIMATE_PARTY_LOST" || s.ultDbtr || s.ultCdtr) && (f !== "REMITTANCE_TRUNCATED" || s.ustrd.length + 40 > 140) && (f !== "PURPOSE_LOST" || s.purp) && (f !== "LEI_LOST" || s.dbtrLei));
  const faults: Fault[] = [];
  if (r() < 0.6) { const k = 1 + Math.floor(r() * 3); while (faults.length < k) { const f = choice(r, possible); if (!faults.includes(f)) faults.push(f); } }
  const found = audit(parsePacs008(pacs008(s)), parseMt103(mt103(s, faults)));
  const got = new Set(found.filter((f) => f.severity !== "info").map((f) => (f.rule === "ADDRESS_LOST" ? "ADDRESS_LOST" : f.rule)));
  const exp = new Set<string>(faults);
  if (!faults.length) { clean++; if (found.some((f) => f.severity === "critical" || f.severity === "high")) cleanFalse++; }
  for (const k of new Set([...got, ...exp])) { const sc = per.get(k) ?? { label: k, tp: 0, fp: 0, fn: 0 }; if (got.has(k) && exp.has(k)) sc.tp++; else if (got.has(k)) sc.fp++; else sc.fn++; per.set(k, sc); }
}
const o = printScores("Translation Data-Loss Auditor — synthetic benchmark (800 pairs)", [...per.values()].sort((a, b) => a.label.localeCompare(b.label)));
console.log(`Faithful translations with a false high/critical finding: ${cleanFalse}/${clean}`);
if (o.recall < 0.95 || cleanFalse) process.exitCode = 1;
