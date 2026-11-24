// Payment Investigation Assistant
// Turns a free-text payment query (an MT199/n99, an email or call notes) into a structured case: what kind of
// investigation it is, the key references pulled out, what's missing, how urgent it is, the next steps, and a draft reply.

import { checkBic, checkIban, CURRENCIES, UUID_RE } from "../../shared/ids.ts";
import { parseAmount } from "../../shared/table.ts";

export type CaseType = "RECALL_FRAUD" | "RECALL_CANCEL" | "NON_RECEIPT" | "AMENDMENT" | "UNABLE_TO_APPLY" | "RETURN" | "FEES" | "STATUS" | "REQUEST_FOR_INFO" | "UNCLEAR";

export interface CaseInfo { title: string; urgency: "URGENT" | "HIGH" | "NORMAL"; needs: string[]; steps: string[] }

export const CASES: Record<CaseType, CaseInfo> = {
  RECALL_FRAUD: { title: "Recall: suspected fraud", urgency: "URGENT", needs: ["uetr", "amount", "value_date", "beneficiary", "reason"],
    steps: ["Act now: every hour reduces the chance of recovering funds.", "Send a recall/stop request through Swift Case Management (Stop and Recall) quoting the UETR.", "Ask the beneficiary bank to freeze the funds pending investigation.", "Raise an internal fraud case and inform the customer how to report to police/authorities.", "Record every step and timestamp for the reimbursement and regulatory file."] },
  RECALL_CANCEL: { title: "Recall / cancellation (duplicate or error)", urgency: "HIGH", needs: ["uetr", "amount", "value_date", "reason"],
    steps: ["Check whether the payment has already settled (gpi tracker / status).", "If not settled, cancel internally; if settled, send a recall request quoting the UETR and reason.", "Explain that return depends on the beneficiary's consent once funds are credited.", "Agree how charges for the return will be handled."] },
  NON_RECEIPT: { title: "Beneficiary says funds not received", urgency: "HIGH", needs: ["uetr", "amount", "value_date", "beneficiary", "beneficiary_account"],
    steps: ["Look up the payment by UETR in the gpi tracker to see the last bank in the chain and its status.", "If credited, send the beneficiary bank's confirmation (credit date and account).", "If stuck at an intermediary, raise an investigation with that bank quoting the UETR.", "If the account details were wrong, start an amendment or return case."] },
  AMENDMENT: { title: "Amend payment details", urgency: "HIGH", needs: ["uetr", "amount", "field_to_change", "correct_value"],
    steps: ["Confirm exactly which detail changes (account, name, address, remittance info) and get the correct value in writing.", "Verify the new details through a trusted channel (callback); amendment requests are a classic fraud route.", "Send the amendment request quoting the UETR; if the beneficiary bank cannot amend, request a return and re-pay.", "Update the customer's stored payee details if appropriate."] },
  UNABLE_TO_APPLY: { title: "Beneficiary bank unable to apply", urgency: "HIGH", needs: ["uetr", "amount", "reason", "beneficiary_account"],
    steps: ["Identify the reason (account closed, name mismatch, missing data, sanctions/compliance query).", "Get the corrected detail or required information from the ordering customer.", "Reply with the correction, or agree a return of funds."] },
  RETURN: { title: "Funds returned", urgency: "NORMAL", needs: ["uetr", "amount", "reason"],
    steps: ["Match the return to the original payment (UETR / reference).", "Credit the customer and explain the return reason and any charges deducted.", "Correct the payee details before re-sending."] },
  FEES: { title: "Charges / short payment query", urgency: "NORMAL", needs: ["uetr", "amount", "charges_option", "amount_received"],
    steps: ["Compare the instructed amount, the charges option (OUR/SHA/BEN) and the amount credited.", "Use the gpi tracker to see which bank deducted what.", "If OUR was instructed and charges were deducted, claim them from the deducting bank."] },
  STATUS: { title: "Status / tracking request", urgency: "NORMAL", needs: ["uetr", "amount", "value_date"],
    steps: ["Look up the UETR in the gpi tracker.", "Reply with the current status, the last bank and the time of the last update.", "If there's no update for over 24 hours, open an investigation with the last bank in the chain."] },
  REQUEST_FOR_INFO: { title: "Request for information (compliance / missing data)", urgency: "HIGH", needs: ["uetr", "amount", "information_requested"],
    steps: ["Identify exactly what information is requested (purpose, ordering party address, invoice, relationship).", "Obtain it from the customer; don't guess or add details yourself.", "Reply within the requested deadline, or the payment may be returned."] },
  UNCLEAR: { title: "Unclear: needs triage", urgency: "NORMAL", needs: ["uetr", "amount", "what_the_customer_needs"],
    steps: ["Ask the requester what outcome they need (track, cancel, amend, confirm credit, explain charges).", "Collect the UETR or payment reference first."] },
};

const PATTERNS: [CaseType, RegExp][] = [
  ["RECALL_FRAUD", /\b(fraud\w*|scam\w*|phish\w*|compromised|hacked|impersonat\w+|not authori[sz]ed|unauthori[sz]ed|account takeover|deceived|tricked)\b/i],
  ["RECALL_CANCEL", /\b(recall|cancel\w*|stop (the )?payment|return (the )?funds|duplicate(d)? payment|paid (\w+ ){0,3}twice|return the (second|duplicate) payment|sent in error|wrong(ly)? sent|by mistake|erroneous\w*|reverse the payment|request (a )?refund)\b/i],
  ["UNABLE_TO_APPLY", /\b(unable to (apply|credit|process)|cannot (apply|credit)|account (is )?(closed|blocked|inactive|dormant)|no such account|invalid account|name (does not|doesn't) match|beneficiary unknown|unknown beneficiary)\b/i],
  ["REQUEST_FOR_INFO", /\b(rfi|request for information|please provide|kindly provide|provide (us with )?(the )?(purpose|full address|invoice|relationship|details of)|purpose of (the )?payment|source of funds|compliance (query|review|check)|sanctions? (check|query|screening))\b/i],
  ["AMENDMENT", /\b(amend\w*|correct(ion|ed)? (of )?(the )?(beneficiary|account|name|iban|address|details)|wrong (beneficiary|account|iban|name|details)|incorrect (beneficiary|account|iban|name|details)|change (the )?(beneficiary|account|details)|update (the )?(beneficiary|account) details)\b/i],
  ["RETURN", /\b(returned|has been returned|return reason|funds (were|have been) returned|bounced back|rejected (and|&) returned)\b/i],
  ["FEES", /\b(charges?|fees?|deduct\w*|short(fall)? (payment|amount)|received less|amount received (is|was) (lower|less)|less than (the )?(instructed|invoiced|expected) amount)\b/i],
  ["NON_RECEIPT", /\b(not (been )?(received|credited|arrived)|(has|have) not (received|arrived|been credited)|hasn't (arrived|been (received|credited))|never (arrived|received)|still waiting|missing (funds|payment)|non[- ]?receipt|please confirm (the )?credit|confirm (if|whether) (the )?(funds|payment)( has| have)? (been )?(credited|received))\b/i],
  ["STATUS", /\b(status|track(ing)?|where is (the|my|our) (payment|transfer|money)|any update|trace|follow[- ]?up|confirm (the )?status|gpi)\b/i],
];

export interface Extracted {
  uetr?: string; references: string[]; amounts: { amount: number; currency: string }[]; value_dates: string[]; bics: string[]; ibans: string[];
  charges_option?: string; beneficiary?: string;
}

export function extract(text: string): Extracted {
  const uetr = text.match(UUID_RE)?.[0].toLowerCase();
  const references = [...new Set([...text.matchAll(/(?::20:|\b(?:our|your|ref(?:erence)?|end[- ]to[- ]end(?: id)?|e2e|trn|transaction)\s*(?:ref(?:erence)?|no\.?|number|id)?\s*[:#]?)\s*([A-Z0-9][A-Z0-9\/\-]{5,34})/gi)].map((m) => m[1]).filter((r) => !UUID_RE.test(r) && /\d/.test(r)))];
  const amounts: Extracted["amounts"] = [];
  for (const m of text.matchAll(/\b([A-Z]{3})\s?([\d][\d,.' ]*\d|\d)\b|([\d][\d,.' ]*\d)\s?([A-Z]{3})\b|:32A:\d{6}([A-Z]{3})([\d,]+)/g)) {
    const ccy = m[1] ?? m[4] ?? m[5];
    const amt = parseAmount((m[2] ?? m[3] ?? m[6] ?? "").replace(/[' ]/g, ""));
    if (ccy && CURRENCIES.has(ccy) && amt !== null && amt > 0) amounts.push({ amount: amt, currency: ccy });
  }
  const value_dates = [...new Set([...text.matchAll(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})\b/gi), ...text.matchAll(/:32A:(\d{6})/g)].map((m) => m[1]))];
  // BICs: from SWIFT header blocks, or next to "BIC"/"SWIFT", or containing a digit / XXX branch (plain words like CUSTOMER also fit the BIC pattern)
  const fromHeaders = [...text.matchAll(/\{1:F01([A-Z0-9]{8})[A-Z0-9]([A-Z0-9]{3})|\{2:O\d{3}\d{4}\d{6}([A-Z0-9]{8})[A-Z0-9]([A-Z0-9]{3})|\{2:O\d{13}([A-Z0-9]{8})([A-Z0-9]{4})?|\{2:I\d{3}([A-Z0-9]{8})[A-Z0-9]([A-Z0-9]{3})/g)]
    .map((m) => { const b8 = m[1] ?? m[3] ?? m[5] ?? m[7]; const br = m[2] ?? m[4] ?? (m[6] ? m[6].slice(m[6].length - 3) : undefined) ?? m[8]; return b8 + (br && br !== "XXX" ? br : ""); });
  const fromContext = [...text.matchAll(/\b(?:BIC|SWIFT(?: code)?|via|through|bank)\s*[:\-]?\s*([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/gi)].map((m) => m[1].toUpperCase());
  const shaped = [...text.matchAll(/\b([A-Z]{4}[A-Z]{2}(?:[A-Z0-9]\d|\d[A-Z0-9])(?:[A-Z0-9]{3})?|[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}XXX)\b/g)].map((m) => m[1]);
  const bics = [...new Set([...fromHeaders, ...fromContext, ...shaped].filter((b) => b && checkBic(b).ok))];
  const ibans = [...new Set([...text.matchAll(/\b([A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?)\b/g)].map((m) => m[1].replace(/\s/g, "")).filter((i) => checkIban(i).ok))];
  const charges_option = text.match(/:71A:(OUR|SHA|BEN)/)?.[1] ?? text.match(/\b(?:charges?(?: option| code)?|details of charges)\s*[:=]?\s*(OUR|SHA|BEN)\b/i)?.[1]?.toUpperCase();
  const beneficiary = text.match(/(?:beneficiary(?: name)?|payee|in favou?r of|creditor)\s*[:\-]\s*([^\n,;]{3,70})/i)?.[1]?.trim();
  return { uetr, references, amounts, value_dates, bics, ibans, charges_option, beneficiary };
}

export interface Case {
  type: CaseType; secondary: CaseType[]; info: CaseInfo; extracted: Extracted; missing: string[]; urgency: CaseInfo["urgency"]; summary: string; draft_reply: string; evidence: string[];
}

const NEED_LABEL: Record<string, string> = {
  uetr: "UETR (unique end-to-end transaction reference)", amount: "amount and currency", value_date: "value date", beneficiary: "beneficiary name", beneficiary_account: "beneficiary account / IBAN",
  reason: "reason for the request", field_to_change: "which detail must change", correct_value: "the correct value (verified)", charges_option: "charges option (OUR/SHA/BEN)",
  amount_received: "amount actually received", information_requested: "exactly what information is requested", what_the_customer_needs: "what outcome the requester needs",
};

export function analyse(text: string): Case {
  const hits = PATTERNS.filter(([, re]) => re.test(text)).map(([t]) => t);
  const type: CaseType = hits[0] ?? "UNCLEAR";
  const info = CASES[type];
  const x = extract(text);
  const has: Record<string, boolean> = {
    uetr: !!x.uetr, amount: x.amounts.length > 0, value_date: x.value_dates.length > 0, beneficiary: !!x.beneficiary || x.ibans.length > 0,
    beneficiary_account: x.ibans.length > 0 || /\baccount\s*(no\.?|number|:)\s*\w+/i.test(text), reason: type === "RECALL_FRAUD" || /\b(because|reason|due to|as the)\b/i.test(text),
    charges_option: !!x.charges_option, amount_received: x.amounts.length > 1, field_to_change: /\b(account|name|iban|address|beneficiary|remittance)\b/i.test(text),
    correct_value: x.ibans.length > 0 || /\bshould (be|read)\b|\bcorrect (one|value|details) (is|are)\b/i.test(text), information_requested: /\b(purpose|invoice|address|relationship|source of funds)\b/i.test(text),
    what_the_customer_needs: false,
  };
  const missing = info.needs.filter((n) => !has[n]).map((n) => NEED_LABEL[n]);
  const evidence = PATTERNS.filter(([t]) => hits.includes(t)).map(([t, re]) => `${CASES[t].title}: "${text.match(re)?.[0]}"`);
  const amt = x.amounts[0] ? `${x.amounts[0].currency} ${x.amounts[0].amount.toLocaleString("en-US")}` : "the payment";
  const summary = `${info.title} for ${amt}${x.uetr ? ` (UETR ${x.uetr})` : ""}.`;
  const draft = [
    "Dear colleagues,", "",
    `We refer to ${amt}${x.value_dates[0] ? ` with value date ${x.value_dates[0]}` : ""}${x.uetr ? `, UETR ${x.uetr}` : ""}${x.references[0] ? `, our reference ${x.references[0]}` : ""}.`,
    {
      RECALL_FRAUD: "Our customer reports that this payment was made as a result of fraud. We kindly request that you stop the payment if not yet credited, or freeze the funds and return them under recall. Please treat this as urgent.",
      RECALL_CANCEL: "This payment was sent in error. Please cancel it if not yet credited, or return the funds with the beneficiary's consent.",
      NON_RECEIPT: "Our customer advises that the beneficiary has not received the funds. Please confirm the date and account to which the funds were credited, or advise the current status.",
      AMENDMENT: "Please amend the payment as follows: [FIELD] should read [VERIFIED CORRECT VALUE]. If amendment is not possible, please return the funds so we can re-send.",
      UNABLE_TO_APPLY: "Further to your message that the funds could not be applied, please find the corrected information below: [CORRECTION].",
      RETURN: "We acknowledge the return of this payment. Please confirm the return reason and any charges deducted.",
      FEES: "The beneficiary received less than the instructed amount. Please advise the charges deducted and, where the charges option was OUR, refund them.",
      STATUS: "Please advise the current status of this payment.",
      REQUEST_FOR_INFO: "In response to your request, please find the information below: [INFORMATION FROM CUSTOMER].",
      UNCLEAR: "Please clarify the outcome you require for this payment.",
    }[type],
    "", "Kind regards,", "[Name / Payments Investigations]",
  ].join("\n");
  return { type, secondary: hits.slice(1), info, extracted: x, missing, urgency: info.urgency, summary, draft_reply: draft, evidence };
}
