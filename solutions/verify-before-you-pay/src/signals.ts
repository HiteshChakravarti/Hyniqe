// Text and identity signals that show up in deepfake / impersonation payment requests.

export interface TextSignal { id: string; label: string; evidence: string }

const PATTERNS: { id: string; label: string; re: RegExp }[] = [
  { id: "URGENCY", label: "Pressure to act fast", re: /\b(urgent(ly)?|asap|immediately|right away|today without fail|within the hour|before (cut[- ]?off|close of business|eod|end of day)|time[- ]sensitive|deadline (is )?today|no time)\b/i },
  { id: "SECRECY", label: "Asks to keep it secret", re: /\b(confidential|keep (this|it) (between us|quiet|to yourself)|don'?t (tell|mention|discuss|share)|do not (tell|mention|discuss|share)|strictly private|discreet(ly)?|top secret|under nda)\b/i },
  { id: "BYPASS", label: "Asks to skip normal process", re: /\b(skip|bypass|ignore|no need (for|to)|don'?t (need|wait for)|without (the )?(usual|normal|standard)) .{0,30}(approval|process|check|verification|sign[- ]?off|procedure|policy|po\b|purchase order)|\bi('ll| will) (approve|sign off) (it )?later\b|\bexception (this|just this) (once|time)\b/i },
  { id: "UNREACHABLE", label: "Requester says they can't be called back", re: /\b(can'?t|cannot|unable to) (talk|call|take calls|speak|be reached|answer)|\b(in|stuck in) (a|an) (meeting|board meeting|flight|conference)|\bon (a )?(plane|flight)\b|\bonly (reachable|contact me) (on|via) (whatsapp|this number|email|text)\b|\bdon'?t call\b/i },
  { id: "BANK_CHANGE", label: "Mentions new or changed bank details", re: /\b(new|changed|updated|different|alternative|another) (bank|account|iban|account number|banking details|beneficiary details|sort code)|\b(bank|account) (details )?(has|have) changed\b|\bpay (it )?(in)?to (this|the following|a new) account\b/i },
  { id: "UNUSUAL_METHOD", label: "Unusual payment method", re: /\b(gift ?cards?|itunes|google play cards?|steam cards?|crypto(currency)?|bitcoin|btc|usdt|tether|wire it to my personal|western union|moneygram)\b/i },
  { id: "AUTHORITY", label: "Leans on seniority", re: /\b(ceo|cfo|coo|managing director|chairman|the board|founder|president|this is (an )?order|i'?m authori[sz]ing|on my authority)\b/i },
  { id: "ACQUISITION", label: "Secret deal / acquisition story", re: /\b(acquisition|merger|takeover|due diligence|deal (is )?closing|regulator|lawyer|legal counsel|escrow)\b/i },
  { id: "LANGUAGE_SHIFT", label: "Odd tone (unusually casual or formal for this person)", re: /\b(kindly|dear colleague|revert back|do the needful|hope this (email|message) finds you)\b/i },
];

export function textSignals(text: string): TextSignal[] {
  const out: TextSignal[] = [];
  if (!text) return out;
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (m) out.push({ id: p.id, label: p.label, evidence: snippet(text, m.index ?? 0, m[0].length) });
  }
  return out;
}

function snippet(text: string, idx: number, len: number): string {
  const start = Math.max(0, idx - 25);
  const end = Math.min(text.length, idx + len + 25);
  return (start > 0 ? "…" : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "…" : "");
}

// ---- Lookalike domains -----------------------------------------------------

const HOMOGLYPHS: Record<string, string> = { "0": "o", "1": "l", "3": "e", "5": "s", "rn": "m", "vv": "w", "cl": "d", "ι": "i", "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x" };

export function skeleton(domain: string): string {
  let s = domain.toLowerCase();
  for (const [k, v] of Object.entries(HOMOGLYPHS)) s = s.split(k).join(v);
  return s.replace(/-/g, "");
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function splitDomain(d: string): { label: string; tld: string } {
  const parts = d.toLowerCase().split(".");
  if (parts.length < 2) return { label: parts[0] ?? "", tld: "" };
  const twoPartTld = parts.length >= 3 && ["co", "com", "org", "net", "gov", "ac"].includes(parts[parts.length - 2]);
  const tldParts = twoPartTld ? 2 : 1;
  return { label: parts[parts.length - tldParts - 1], tld: parts.slice(parts.length - tldParts).join(".") };
}

const FREE_MAIL = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me", "protonmail.com", "aol.com", "gmx.com", "mail.com", "yandex.com", "live.com"];

export type DomainVerdict = { kind: "trusted" | "lookalike" | "free_mail" | "external" | "unknown"; detail: string };

/** Compare the sender's address/domain to the organisation's real domains. */
export function checkSender(sender: string, trusted: string[]): DomainVerdict {
  const s = sender.trim().toLowerCase();
  if (!s) return { kind: "unknown", detail: "No sender address given." };
  const domain = s.includes("@") ? s.split("@").pop() as string : s.includes(".") ? s : "";
  if (!domain) return { kind: "unknown", detail: `"${sender}" is not an email address or domain.` };
  const t = trusted.map((d) => d.toLowerCase().replace(/^@/, ""));
  if (t.includes(domain)) return { kind: "trusted", detail: `${domain} is a trusted domain (note: a real mailbox can still be compromised).` };
  if (FREE_MAIL.includes(domain)) return { kind: "free_mail", detail: `${domain} is a personal webmail address, not a company domain.` };
  const d = splitDomain(domain);
  for (const real of t) {
    const r = splitDomain(real);
    const sameSkeleton = skeleton(d.label) === skeleton(r.label);
    const dist = levenshtein(d.label, r.label);
    const embeds = d.label.includes(r.label) && d.label !== r.label;
    if (sameSkeleton || (dist > 0 && dist <= 2 && r.label.length >= 4) || (d.label === r.label && d.tld !== r.tld) || embeds) {
      return { kind: "lookalike", detail: `${domain} imitates the trusted domain ${real}.` };
    }
  }
  return { kind: "external", detail: `${domain} is an outside domain.` };
}

const EXEC_TITLES = /\b(ceo|cfo|coo|cto|chief|president|chair(man|woman|person)?|founder|managing director|md|director|owner|partner|vp|vice president|head of finance|treasurer)\b/i;
export function isSenior(title: string): boolean {
  return EXEC_TITLES.test(title);
}
