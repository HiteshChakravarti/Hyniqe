// Verify-Before-You-Pay: scores a payment request for impersonation / deepfake risk, says which verification
// steps your policy requires, checks whether they were done, and writes the callback script.

import { type Row, pick, parseAmount, parseBool, parseTimestamp } from "../../shared/table.ts";
import { checkSender, isSenior, textSignals, type DomainVerdict, type TextSignal } from "./signals.ts";

export interface Policy {
  company_domains: string[];
  callback_above: number;          // callback needed at/above this amount
  dual_approval_above: number;     // two independent approvers at/above this amount
  bank_change_cooling_hours: number; // wait after a bank detail change before first payment
  office_hours: { start: string; end: string };
  high_risk_channels: string[];    // channels where a voice/face/text can be faked
  approved_callback_sources: string[]; // where a callback number may come from
}

export const DEFAULT_POLICY: Policy = {
  company_domains: [],
  callback_above: 10000,
  dual_approval_above: 25000,
  bank_change_cooling_hours: 24,
  office_hours: { start: "08:00", end: "19:00" },
  high_risk_channels: ["voice", "phone", "video", "teams", "zoom", "whatsapp", "sms", "text", "chat", "telegram", "signal", "voicemail", "email"],
  approved_callback_sources: ["directory", "master data", "vendor master", "hr system", "contract", "known number", "intranet", "crm"],
};

export interface PaymentRequest {
  id: string;
  received_at: Date | null;
  requested_by: string;
  requester_title: string;
  channel: string;
  sender: string;
  amount: number | null;
  currency: string;
  payee: string;
  payee_new: boolean | null;
  bank_details_changed: boolean | null;
  bank_change_at: Date | null;
  message: string;
  // controls actually performed (from an approval log; blank when triaging a new request)
  callback_done: boolean | null;
  callback_source: string;
  callback_by: string;
  challenge_passed: boolean | null;
  approver_1: string;
  approver_2: string;
  released_by: string;
  paid_at: Date | null;
  outcome: string;
}

export type Level = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export interface Flag { id: string; points: number; label: string; detail: string }
export interface Control { id: string; required: boolean; why: string; status: "done" | "missing" | "not logged" | "n/a"; detail?: string }

export interface Assessment {
  request: PaymentRequest;
  score: number;
  level: Level;
  flags: Flag[];
  controls: Control[];
  breaches: Control[];
  sender: DomainVerdict;
  advice: string;
  callback_script: string[];
  challenge_questions: string[];
}

export function readRequests(rows: Row[]): PaymentRequest[] {
  return rows.map((r, i) => ({
    id: pick(r, "request_id", "id", "reference") || `R${i + 1}`,
    received_at: parseTimestamp(pick(r, "received_at", "timestamp", "date", "requested_at")),
    requested_by: pick(r, "requested_by", "requester", "from_name", "from"),
    requester_title: pick(r, "requester_title", "title", "role"),
    channel: pick(r, "channel", "via", "medium").toLowerCase(),
    sender: pick(r, "sender", "sender_address", "from_email", "email", "phone"),
    amount: parseAmount(pick(r, "amount", "value")),
    currency: pick(r, "currency", "ccy").toUpperCase(),
    payee: pick(r, "payee", "beneficiary", "vendor"),
    payee_new: parseBool(pick(r, "payee_new", "new_payee", "first_payment")),
    bank_details_changed: parseBool(pick(r, "bank_details_changed", "bank_change", "account_changed")),
    bank_change_at: parseTimestamp(pick(r, "bank_change_at", "bank_change_date", "account_changed_at")),
    message: pick(r, "message", "request_text", "notes", "body"),
    callback_done: parseBool(pick(r, "callback_done", "callback", "call_back")),
    callback_source: pick(r, "callback_source", "callback_number_source", "number_source").toLowerCase(),
    callback_by: pick(r, "callback_by", "called_by"),
    challenge_passed: parseBool(pick(r, "challenge_passed", "code_word_ok", "challenge")),
    approver_1: pick(r, "approver_1", "approved_by", "approver"),
    approver_2: pick(r, "approver_2", "second_approver"),
    released_by: pick(r, "released_by", "paid_by", "executed_by"),
    paid_at: parseTimestamp(pick(r, "paid_at", "released_at", "payment_date")),
    outcome: pick(r, "outcome", "status", "result").toLowerCase(),
  }));
}

/** Build a request from free text pasted by a user (e.g. an email or chat message). */
export function requestFromText(text: string, extra: Partial<PaymentRequest> = {}): PaymentRequest {
  const amt = text.match(/(?:[$€£₹]|\b(?:usd|eur|gbp|inr|aud|cad|sgd|chf)\b)\s?([\d][\d,.\s]*\d)(\s?(k|m|thousand|million|lakh|crore))?|([\d][\d,.]*\d)\s?(usd|eur|gbp|inr|dollars|euros|pounds)\b/i);
  let amount: number | null = null;
  let currency = "";
  if (amt) {
    amount = parseAmount((amt[1] ?? amt[4] ?? "").replace(/\s/g, ""));
    const mult = (amt[3] ?? "").toLowerCase();
    if (amount !== null && mult) amount *= { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, lakh: 1e5, crore: 1e7 }[mult] ?? 1;
    const sym = amt[0].match(/[$€£₹]|usd|eur|gbp|inr|aud|cad|sgd|chf|dollars|euros|pounds/i)?.[0].toLowerCase() ?? "";
    currency = ({ $: "USD", "€": "EUR", "£": "GBP", "₹": "INR", dollars: "USD", euros: "EUR", pounds: "GBP" } as Record<string, string>)[sym] ?? sym.toUpperCase();
  }
  const sender = text.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/)?.[0] ?? "";
  const sig = textSignals(text).map((s) => s.id);
  return {
    id: "your request", received_at: null, requested_by: "", requester_title: "", channel: sender ? "email" : "", sender,
    amount, currency, payee: "", payee_new: null, bank_details_changed: sig.includes("BANK_CHANGE") ? true : null, bank_change_at: null,
    message: text, callback_done: null, callback_source: "", callback_by: "", challenge_passed: null, approver_1: "", approver_2: "",
    released_by: "", paid_at: null, outcome: "", ...extra,
  };
}

const POINTS: Record<string, number> = {
  URGENCY: 12, SECRECY: 18, BYPASS: 22, UNREACHABLE: 18, BANK_CHANGE: 20, UNUSUAL_METHOD: 30, AUTHORITY: 6, ACQUISITION: 10, LANGUAGE_SHIFT: 4,
};

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function assess(req: PaymentRequest, policy: Policy = DEFAULT_POLICY): Assessment {
  const flags: Flag[] = [];
  const add = (id: string, points: number, label: string, detail: string) => flags.push({ id, points, label, detail });

  const sender = checkSender(req.sender, policy.company_domains);
  if (sender.kind === "lookalike") add("LOOKALIKE_DOMAIN", 35, "Sender domain imitates a trusted one", sender.detail);
  if (sender.kind === "free_mail" && isSenior(req.requester_title)) add("EXEC_ON_PERSONAL_EMAIL", 20, "Senior person writing from personal email", sender.detail);

  const ch = req.channel;
  const fakeable = ["voice", "phone", "video", "teams", "zoom", "whatsapp", "voicemail"].some((c) => ch.includes(c));
  const senior = isSenior(req.requester_title) || /\b(ceo|cfo|chief|director|chairman|founder|president)\b/i.test(req.requested_by + " " + req.message.slice(0, 200));
  if (senior && fakeable) add("EXEC_VOICE_VIDEO", 18, "Senior person asking by voice, video or chat app", `Channel "${ch}" can be deepfaked; a familiar voice or face is not proof.`);
  else if (senior && ch) add("EXEC_REQUEST", 6, "Payment requested directly by a senior person", "Senior names are the most impersonated.");
  if (["whatsapp", "telegram", "signal", "sms", "text"].some((c) => ch.includes(c))) add("INFORMAL_CHANNEL", 8, "Request came through a personal messaging app", `Channel "${ch}" sits outside your approved systems.`);

  for (const s of textSignals(req.message)) add(s.id, POINTS[s.id] ?? 5, s.label, `"${s.evidence}"`);

  if (req.bank_details_changed && !flags.some((f) => f.id === "BANK_CHANGE")) add("BANK_CHANGE", 20, "Bank details changed", "Payment goes to new account details.");
  if (req.payee_new) add("NEW_PAYEE", 10, "First payment to this payee", "No payment history to compare against.");
  if (req.bank_details_changed && req.payee_new === false) add("CHANGE_ON_EXISTING", 8, "Existing supplier suddenly changed account", "Classic invoice-redirection pattern.");
  if (req.bank_details_changed && req.bank_change_at && req.received_at) {
    const hrs = (req.received_at.getTime() - req.bank_change_at.getTime()) / 3600000;
    if (hrs >= 0 && hrs < policy.bank_change_cooling_hours) add("FRESH_BANK_CHANGE", 12, "Bank details changed very recently", `Changed ${hrs.toFixed(1)}h before this request (cooling-off is ${policy.bank_change_cooling_hours}h).`);
  }
  if (req.amount !== null) {
    if (req.amount >= policy.dual_approval_above) add("LARGE_AMOUNT", 10, "Large amount", `${fmt(req.amount)} ${req.currency} is at or above the dual-approval level.`);
    else if (req.amount >= policy.callback_above) add("MATERIAL_AMOUNT", 5, "Material amount", `${fmt(req.amount)} ${req.currency} is at or above the callback level.`);
    if (req.amount >= 1000 && req.amount % 1000 === 0) add("ROUND_AMOUNT", 4, "Round amount", "Real invoices rarely land on exact thousands.");
  }
  if (req.received_at) {
    const m = req.received_at.getUTCHours() * 60 + req.received_at.getUTCMinutes();
    const wd = req.received_at.getUTCDay();
    if (wd === 0 || wd === 6 || m < minutes(policy.office_hours.start) || m > minutes(policy.office_hours.end)) {
      add("OUT_OF_HOURS", 6, "Arrived outside office hours", "Fewer people around to check it.");
    }
  }

  // Combination bonus: impersonation needs both pressure and a payment change
  const ids = new Set(flags.map((f) => f.id));
  const pressure = ["URGENCY", "SECRECY", "BYPASS", "UNREACHABLE"].filter((x) => ids.has(x)).length;
  if (pressure >= 2 && (ids.has("BANK_CHANGE") || ids.has("NEW_PAYEE") || ids.has("UNUSUAL_METHOD"))) {
    add("PATTERN_MATCH", 15, "Matches the classic impersonation pattern", "Pressure + secrecy/urgency + money going somewhere new.");
  }

  const score = Math.min(100, flags.reduce((s, f) => s + f.points, 0));
  const level: Level = score >= 60 ? "CRITICAL" : score >= 35 ? "HIGH" : score >= 15 ? "MEDIUM" : "LOW";

  const controls = requiredControls(req, policy, level, ids, senior, fakeable);
  const breaches = controls.filter((c) => c.required && c.status === "missing");
  return {
    request: req, score, level, flags: flags.sort((a, b) => b.points - a.points), controls, breaches, sender,
    advice: adviceFor(level, breaches.length),
    callback_script: callbackScript(req, ids),
    challenge_questions: challengeQuestions(req, senior),
  };
}

function requiredControls(req: PaymentRequest, policy: Policy, level: Level, ids: Set<string>, senior: boolean, fakeable: boolean): Control[] {
  const logged = req.callback_done !== null || !!req.approver_1 || !!req.released_by || !!req.paid_at;
  const status = (ok: boolean | null, applies = true): Control["status"] => (!applies ? "n/a" : !logged ? "not logged" : ok ? "done" : "missing");
  const amount = req.amount ?? 0;
  const out: Control[] = [];

  const cbReasons: string[] = [];
  if (amount >= policy.callback_above) cbReasons.push(`amount ≥ ${fmt(policy.callback_above)}`);
  if (req.bank_details_changed) cbReasons.push("bank details changed");
  if (req.payee_new) cbReasons.push("new payee");
  if (senior && fakeable) cbReasons.push("senior request by voice/video/chat");
  if (level === "HIGH" || level === "CRITICAL") cbReasons.push(`${level.toLowerCase()} risk score`);
  const cbNeeded = cbReasons.length > 0;
  out.push({ id: "CALLBACK", required: cbNeeded, why: cbNeeded ? `Required: ${cbReasons.join(", ")}.` : "Not required by policy.", status: status(req.callback_done === true, cbNeeded) });

  if (cbNeeded && req.callback_done) {
    const src = req.callback_source;
    const ok = !!src && policy.approved_callback_sources.some((s) => src.includes(s));
    out.push({
      id: "INDEPENDENT_NUMBER", required: true, why: "Callback number must come from your own records, never from the request itself.",
      status: ok ? "done" : "missing", detail: src ? `Number came from: "${src}".` : "Number source not recorded.",
    });
  }

  const chNeeded = senior && fakeable;
  out.push({ id: "CHALLENGE", required: chNeeded, why: chNeeded ? "Voice/video can be cloned: confirm with a pre-agreed code word or a question only the real person can answer." : "Not required by policy.", status: status(req.challenge_passed === true, chNeeded) });

  const dualNeeded = amount >= policy.dual_approval_above || level === "CRITICAL";
  const twoDistinct = !!req.approver_1 && !!req.approver_2 && req.approver_1.toLowerCase() !== req.approver_2.toLowerCase();
  out.push({ id: "DUAL_APPROVAL", required: dualNeeded, why: dualNeeded ? `Two different approvers needed (${amount >= policy.dual_approval_above ? "amount ≥ " + fmt(policy.dual_approval_above) : "critical risk"}).` : "Not required by policy.", status: status(twoDistinct, dualNeeded) });

  const names = [req.requested_by, req.approver_1, req.approver_2, req.released_by].map((x) => x.trim().toLowerCase()).filter(Boolean);
  const requesterApproved = !!req.requested_by && [req.approver_1, req.approver_2].some((a) => a && a.toLowerCase() === req.requested_by.toLowerCase());
  const releaserApproved = !!req.released_by && [req.approver_1, req.approver_2].some((a) => a && a.toLowerCase() === req.released_by.toLowerCase());
  out.push({
    id: "SEGREGATION", required: true, why: "The requester, approver(s) and the person releasing the payment should be different people.",
    status: !logged || names.length < 2 ? "not logged" : requesterApproved || releaserApproved ? "missing" : "done",
    detail: requesterApproved ? "Requester also approved." : releaserApproved ? "Releaser also approved." : undefined,
  });

  if (req.bank_details_changed && req.bank_change_at && req.paid_at) {
    const hrs = (req.paid_at.getTime() - req.bank_change_at.getTime()) / 3600000;
    out.push({ id: "COOLING_OFF", required: true, why: `Wait ${policy.bank_change_cooling_hours}h after a bank detail change before paying.`, status: hrs >= policy.bank_change_cooling_hours ? "done" : "missing", detail: `Paid ${hrs.toFixed(1)}h after the change.` });
  }
  if (logged && req.paid_at && req.callback_done === false && cbNeeded) {
    out.push({ id: "PAID_WITHOUT_VERIFICATION", required: true, why: "Payment was released before the required callback.", status: "missing" });
  }
  if (ids.has("UNUSUAL_METHOD")) out.push({ id: "NO_GIFT_CARDS_OR_CRYPTO", required: true, why: "Businesses don't pay suppliers or executives in gift cards or crypto. Decline.", status: logged && req.paid_at ? "missing" : "not logged" });
  return out;
}

function adviceFor(level: Level, breaches: number): string {
  const base = {
    CRITICAL: "Do not pay. Treat as attempted fraud until the real person confirms through a number you already hold. Tell your fraud/security team.",
    HIGH: "Hold the payment. Run the callback and challenge below before anyone approves it.",
    MEDIUM: "Verify before paying: do the callback below and check the payee details against your records.",
    LOW: "No strong warning signs. Follow your normal approval process.",
  }[level];
  return breaches ? `${base} ${breaches} required control(s) were skipped.` : base;
}

export function callbackScript(req: PaymentRequest, ids: Set<string>): string[] {
  const who = req.requested_by || "the requester";
  const amt = req.amount !== null ? `${fmt(req.amount)} ${req.currency}`.trim() : "the amount requested";
  const lines = [
    `Hang up / don't reply. Look up ${who}'s number in your own directory or supplier master file. Do not use any number, link or email in the request.`,
    `Call that number. Say: "I'm calling to confirm a payment request I received${req.channel ? " by " + req.channel : ""}. Did you ask for ${amt}${req.payee ? " to be paid to " + req.payee : ""}?"`,
    "Let them describe the request first. Don't read out the details for them to agree with.",
  ];
  if (ids.has("BANK_CHANGE") || req.bank_details_changed) lines.push(`Ask them to read out the new account details from their own records, then compare. Don't read yours out first.`);
  lines.push(
    "If they're 'too busy' or ask you to call another number, stop. A real executive or supplier can wait 10 minutes for a check.",
    "Write down who you called, the number, where the number came from, the time, and what they said.",
  );
  return lines;
}

export function challengeQuestions(req: PaymentRequest, senior: boolean): string[] {
  const q = [
    "Ask for your pre-agreed verbal code word for payment requests. (If you don't have one, set one up offline today.)",
    "Ask about something recent and internal that isn't on email or social media, e.g. what was decided in the last 1:1, or who else was in yesterday's meeting.",
    "Ask them to confirm the request in your payment system or ticketing tool from their own login, not by reply.",
  ];
  if (senior) q.push("On a video call, ask them to do something unscripted (turn the camera to show the room, or answer a question in a different language they speak). Real-time deepfakes often glitch on sudden changes.");
  return q;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
