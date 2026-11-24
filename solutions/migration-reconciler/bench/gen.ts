// Synthetic legacy → new-core migration: source customer extract and a target extract with injected defects
// (dropped/added/duplicated records, truncations, lost consent flags, changed balances/dates/names) plus harmless
// format changes that must NOT be reported (date format, number format, Y/N → true/false, case and spacing).
import { rng, choice } from "../../shared/bench.ts";

export function generate(seed: number, n: number) {
  const r = rng(seed);
  const first = ["Anna", "Rahul", "Maria", "John", "Wei", "Fatima", "Lars", "Chiara", "Olu", "Sophie"], last = ["Mueller", "Sharma", "Garcia", "Smith", "Zhang", "Khan", "Nilsson", "Rossi", "Adeyemi", "Martin"];
  const streets = ["High Street", "Station Road", "Avenue des Champs-Elysees", "Hauptstrasse", "Long Winding Countryside Lane"];
  const src = ["customer_id,full_name,address_line,postcode,date_of_birth,balance,marketing_consent,segment"];
  const tgt = ["cust_no,customer_name,address,post_code,dob,balance_amt,consent_marketing,segment"];
  const truth = { missing: new Set<string>(), extra: new Set<string>(), dupTarget: new Set<string>(), serious: new Map<string, string>() };
  for (let i = 0; i < n; i++) {
    const id = String(100000 + i).padStart(8, "0");
    const name = `${choice(r, first)} ${choice(r, last)}${r() < 0.2 ? "-" + choice(r, last) : ""}`;
    const addr = `${1 + Math.floor(r() * 200)} ${choice(r, streets)}${r() < 0.3 ? ", Flat " + (1 + Math.floor(r() * 30)) : ""}`;
    const pc = `${choice(r, ["SW1A", "EC2V", "M1", "LS6"])} ${1 + Math.floor(r() * 9)}AB`;
    const dob = `${1940 + Math.floor(r() * 60)}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`;
    const bal = (Math.floor(r() * 5000000) / 100).toFixed(2);
    const consent = r() < 0.6 ? "Y" : "N";
    const seg = choice(r, ["RETAIL", "PREMIER", "SME"]);
    src.push([id, `"${name}"`, `"${addr}"`, pc, dob, bal, consent, seg].join(","));
    // harmless transformations in the new system
    let t = { id: id.replace(/^0+/, ""), name, addr, pc, dob: `${dob.slice(8, 10)}/${dob.slice(5, 7)}/${dob.slice(0, 4)}`, bal: Number(bal).toLocaleString("en-US", { minimumFractionDigits: 2 }), consent: consent === "Y" ? "true" : "false", seg: seg.toLowerCase() };
    const k = r();
    if (k < 0.01) { truth.missing.add(id.replace(/^0+/, "")); continue; }
    else if (k < 0.03) { t.addr = t.addr.slice(0, 20); if (addr.length > 20) truth.serious.set(t.id, "TRUNCATED"); }
    else if (k < 0.045) { t.consent = ""; truth.serious.set(t.id, "EMPTIED"); }
    else if (k < 0.055) { t.bal = (Number(bal) + 10).toFixed(2); truth.serious.set(t.id, "NUMBER_CHANGED"); }
    else if (k < 0.065) { t.dob = `${dob.slice(5, 7)}/${dob.slice(8, 10)}/${dob.slice(0, 4)}`; if (dob.slice(5, 7) !== dob.slice(8, 10)) truth.serious.set(t.id, "DATE_CHANGED"); }
    else if (k < 0.07) { t.name = t.name.split(" ").reverse().join(" "); truth.serious.set(t.id, "CHANGED"); }
    else if (k < 0.075) { tgt.push([t.id, `"${t.name}"`, `"${t.addr}"`, t.pc, t.dob, `"${t.bal}"`, t.consent, t.seg].join(",")); truth.dupTarget.add(t.id); }
    tgt.push([t.id, `"${t.name}"`, `"${t.addr}"`, t.pc, t.dob, `"${t.bal}"`, t.consent, t.seg].join(","));
  }
  for (let j = 0; j < Math.round(n * 0.005); j++) { const id = String(900000 + j); tgt.push([id, '"New Person"', '"1 New Road"', "N1 1AA", "01/01/1990", '"0.00"', "false", "retail"].join(",")); truth.extra.add(id); }
  return { source: src.join("\n") + "\n", target: tgt.join("\n") + "\n", truth };
}
