// Verification of Payee Pre-Checker
// Since 9 October 2025 euro-area banks check, before every SEPA credit transfer, that the payee name matches the
// account (IBAN). Bulk payment files from companies get "close match" / "no match" answers when names differ from what
// the payee's bank holds. This predicts the likely outcome for each payment before the file is sent, and flags data
// problems (bad IBANs, names too long for SEPA, one IBAN paid under different names).

import { type Row, pick, parseAmount } from "../../shared/table.ts";
import { checkIban, cleanIban, SEPA_COUNTRIES } from "../../shared/ids.ts";
import { normName, sameTokens, similarity, stripAccents } from "../../shared/text.ts";

export type Outcome = "MATCH" | "LIKELY CLOSE MATCH" | "LIKELY NO MATCH" | "UNKNOWN" | "WILL BE REJECTED" | "NOT IN VOP SCOPE";

export interface Payment { line: number; name: string; iban: string; amount: number | null; reference: string }
export interface MasterEntry { iban: string; legal_name: string; trading_names: string[] }
export interface Result { payment: Payment; outcome: Outcome; reason: string; suggestion: string; warnings: string[]; master?: MasterEntry }

export function readPayments(rows: Row[]): Payment[] {
  return rows.map((r, i) => ({
    line: i + 2,
    name: pick(r, "payee_name", "beneficiary_name", "name", "creditor_name", "payee", "beneficiary", "vendor_name"),
    iban: cleanIban(pick(r, "iban", "account", "beneficiary_iban", "creditor_iban")),
    amount: parseAmount(pick(r, "amount", "value")),
    reference: pick(r, "reference", "remittance", "invoice", "end_to_end_id", "id"),
  }));
}

export function readMaster(rows: Row[]): MasterEntry[] {
  return rows.map((r) => ({
    iban: cleanIban(pick(r, "iban", "account", "bank_account")),
    legal_name: pick(r, "account_holder_name", "legal_name", "registered_name", "account_name", "name", "vendor_name"),
    trading_names: pick(r, "trading_names", "trading_name", "aliases", "also_known_as").split(/[;|]/).map((s) => s.trim()).filter(Boolean),
  }));
}

// SEPA basic Latin character set (EPC); other characters may be converted or rejected by banks
const SEPA_CHARS = /^[A-Za-z0-9/\-?:().,'+ ]*$/;

export function compareNames(given: string, onFile: string): { outcome: Outcome; reason: string } {
  const raw = (s: string) => stripAccents(s.toLowerCase()).replace(/[^a-z0-9]+/g, " ").trim();
  if (raw(given) === raw(onFile)) return { outcome: "MATCH", reason: "Same name (ignoring case, accents and punctuation)." };
  const a = normName(given), b = normName(onFile);
  if (a && a === b) return { outcome: "LIKELY CLOSE MATCH", reason: "Same name except legal form (Ltd/GmbH/SA…). Some banks return match, others close match." };
  if (a && sameTokens(a, b)) return { outcome: "LIKELY CLOSE MATCH", reason: "Same words in a different order." };
  const sim = similarity(a, b);
  if (sim >= 0.85) return { outcome: "LIKELY CLOSE MATCH", reason: `Very similar (${Math.round(sim * 100)}%): looks like a typo or spelling variant.` };
  const at = new Set(a.split(" ")), bt = new Set(b.split(" "));
  const shared = [...at].filter((t) => bt.has(t) && t.length > 2).length;
  if (shared && shared >= Math.min(at.size, bt.size)) return { outcome: "LIKELY CLOSE MATCH", reason: "One name is a shortened form of the other." };
  return { outcome: "LIKELY NO MATCH", reason: `Different name from the one held for this account (${Math.round(sim * 100)}% similar).` };
}

export function precheck(payments: Payment[], master: MasterEntry[] = []): Result[] {
  const byIban = new Map(master.filter((m) => m.iban).map((m) => [m.iban, m]));
  const namesPerIban = new Map<string, Set<string>>();
  for (const p of payments) if (p.iban) namesPerIban.set(p.iban, (namesPerIban.get(p.iban) ?? new Set()).add(normName(p.name)));
  const seen = new Map<string, number>();

  return payments.map((p) => {
    const warnings: string[] = [];
    if (p.name.length > 70) warnings.push(`Name is ${p.name.length} characters; SEPA allows 70, so it will be cut.`);
    if (p.name && !SEPA_CHARS.test(p.name)) warnings.push("Contains characters outside the basic SEPA set; banks may convert or reject them.");
    if (/\b(c\/o|care of|attn|on behalf of|account|acct)\b/i.test(p.name)) warnings.push("Name contains extra text (c/o, attn, 'account'), which often causes a mismatch.");
    if ((namesPerIban.get(p.iban)?.size ?? 0) > 1) warnings.push("This IBAN is paid under different names in this file.");
    const dupKey = `${p.iban}|${p.amount}`;
    if (p.iban && p.amount !== null) {
      if (seen.has(dupKey)) warnings.push(`Same IBAN and amount as line ${seen.get(dupKey)} (possible duplicate).`);
      else seen.set(dupKey, p.line);
    }

    if (p.iban && /^[A-Z]{2}/.test(p.iban) && !SEPA_COUNTRIES.has(p.iban.slice(0, 2))) {
      return { payment: p, outcome: "NOT IN VOP SCOPE", reason: `${p.iban.slice(0, 2)} account is outside SEPA, so VoP doesn't apply${checkIban(p.iban).ok ? "" : " (and it isn't a valid IBAN: many non-European countries don't use IBANs)"}.`, suggestion: "Use your normal beneficiary controls for non-SEPA payments.", warnings };
    }
    const iban = checkIban(p.iban);
    if (!p.iban || !iban.ok) return { payment: p, outcome: "WILL BE REJECTED", reason: `IBAN ${p.iban ? iban.reason : "missing"}.`, suggestion: "Correct the IBAN with the payee before sending.", warnings };
    if (!p.name.trim()) return { payment: p, outcome: "LIKELY NO MATCH", reason: "No payee name.", suggestion: "Add the payee's legal name as held by their bank.", warnings };

    const m = byIban.get(p.iban);
    if (!m) return { payment: p, outcome: "UNKNOWN", reason: "IBAN not in your supplier master, so no name to compare.", suggestion: "Ask the supplier for the exact account-holder name on their bank account and store it.", warnings };
    const candidates = [m.legal_name, ...m.trading_names].filter(Boolean);
    let best = compareNames(p.name, m.legal_name);
    if (best.outcome !== "MATCH") {
      for (const tn of m.trading_names) {
        const c = compareNames(p.name, tn);
        if (c.outcome === "MATCH" || (c.outcome === "LIKELY CLOSE MATCH" && best.outcome === "LIKELY NO MATCH")) {
          best = { outcome: "LIKELY CLOSE MATCH", reason: `Matches trading name "${tn}", not the account holder's legal name "${m.legal_name}". Banks usually hold the legal name.` };
          break;
        }
      }
    }
    const suggestion = best.outcome === "MATCH" ? "No change needed." : `Use the account-holder name exactly: "${m.legal_name}".`;
    return { payment: p, outcome: best.outcome, reason: best.reason, suggestion: candidates.length ? suggestion : "", warnings, master: m };
  });
}
