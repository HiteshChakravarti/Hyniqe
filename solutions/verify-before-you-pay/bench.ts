// Synthetic benchmark: 3,000 payment requests (20% impersonation attempts) built from realistic message fragments.
// Legitimate requests sometimes carry warning signs (urgency, new payees, real bank changes) and attacks
// sometimes hide them, so this measures how well the score separates the two, not a perfect-rules check.
// Run: node bench.ts
import { rng, choice } from "../shared/bench.ts";
import { assess, DEFAULT_POLICY, requestFromText, type PaymentRequest } from "./src/assess.ts";

const r = rng(424242);
const policy = { ...DEFAULT_POLICY, company_domains: ["northwind.com", "globex.com", "contoso.com"] };
const legitText = [
  "Invoice {n} for services in October, as per PO {p}.",
  "Please process the attached invoice {n} by the due date.",
  "Monthly retainer, invoice {n}. Thanks.",
  "Renewal per contract {p}; invoice {n} attached.",
  "Hi, invoice {n} is due Friday, could you schedule it? Thanks",
  "Reminder: invoice {n} is now overdue, please pay asap.",
  "Our bank details changed last quarter; the new details are already in your vendor portal. Invoice {n}.",
];
const scamParts = {
  open: ["Are you at your desk?", "I need a quick favour.", "Hi, are you available?", "", "Kindly assist with a payment."],
  ask: ["Please wire {a} to the account below today", "I need {a} sent urgently to our new legal counsel", "Pay invoice {n} to our new bank account", "Buy {a} in gift cards for a client", "Process a payment of {a} immediately"],
  why: ["for the acquisition we're closing.", "for a confidential deal.", "the regulator needs it before cut-off.", "", "our bank account has changed due to an audit."],
  hush: ["Keep this between us.", "Don't mention it to anyone yet.", "", "", "Strictly confidential."],
  reach: ["I'm in a board meeting and can't talk.", "I'm boarding a flight, just email me.", "", "", "Only contact me on WhatsApp."],
};
const fill = (s: string, amount: number) => s.replace("{a}", "$" + amount.toLocaleString("en-US")).replace("{n}", String(1000 + Math.floor(r() * 9000))).replace("{p}", "PO-" + Math.floor(r() * 9999));

let tp = 0, fp = 0, fn = 0, tn = 0, scams = 0;
const levels: Record<string, [number, number]> = { LOW: [0, 0], MEDIUM: [0, 0], HIGH: [0, 0], CRITICAL: [0, 0] };
for (let i = 0; i < 3000; i++) {
  const scam = r() < 0.2;
  let req: PaymentRequest;
  if (scam) {
    scams++;
    const amount = choice(r, [9500, 24000, 48500, 75000, 120000, 6200.4]);
    const msg = [choice(r, scamParts.open), fill(choice(r, scamParts.ask), amount), choice(r, scamParts.why), choice(r, scamParts.hush), choice(r, scamParts.reach)].join(" ");
    const imp = choice(r, ["exec_video", "exec_email_lookalike", "exec_whatsapp", "vendor_lookalike", "vendor_real_compromised"]);
    req = requestFromText(msg, {
      id: `S${i}`, amount, currency: "USD",
      requested_by: imp.startsWith("exec") ? "Dana Wu" : "Globex AR",
      requester_title: imp.startsWith("exec") ? choice(r, ["CEO", "CFO", "Managing Director"]) : "Supplier",
      channel: { exec_video: "video", exec_email_lookalike: "email", exec_whatsapp: "whatsapp", vendor_lookalike: "email", vendor_real_compromised: "email" }[imp],
      sender: { exec_video: "", exec_email_lookalike: choice(r, ["dana@northwind.co", "dana@n0rthwind.com", "dana@northwind-group.com"]), exec_whatsapp: "+44 7700 900111", vendor_lookalike: choice(r, ["ar@g1obex.com", "ar@globex.co"]), vendor_real_compromised: "ar@globex.com" }[imp],
      payee_new: r() < 0.6, bank_details_changed: imp.startsWith("vendor") ? r() < 0.85 : null,
      received_at: new Date(Date.UTC(2026, 10, 16 + Math.floor(r() * 5), r() < 0.3 ? 20 : 10 + Math.floor(r() * 8))),
    });
  } else {
    const amount = Math.round((200 + r() * (r() < 0.15 ? 80000 : 15000)) * 100) / 100;
    const msg = fill(choice(r, legitText), amount);
    const senior = r() < 0.1;
    req = requestFromText(msg, {
      id: `L${i}`, amount, currency: "USD",
      requested_by: senior ? "Leo Martins" : "AP Team", requester_title: senior ? "Head of Procurement" : "Clerk",
      channel: senior && r() < 0.5 ? "teams" : "email", sender: choice(r, ["ap@northwind.com", "billing@initech.com", "ar@globex.com", "accounts@contoso.com"]),
      payee_new: r() < 0.12, bank_details_changed: msg.includes("bank details") ? true : r() < 0.02,
      bank_change_at: new Date(Date.UTC(2026, 7, 1)),
      received_at: new Date(Date.UTC(2026, 10, 16 + Math.floor(r() * 5), r() < 0.05 ? 20 : 9 + Math.floor(r() * 9))),
    });
  }
  const a = assess(req, policy);
  levels[a.level][scam ? 1 : 0]++;
  const flagged = a.level === "HIGH" || a.level === "CRITICAL";
  if (flagged && scam) tp++; else if (flagged) fp++; else if (scam) fn++; else tn++;
}
const pct = (x: number) => (x * 100).toFixed(1) + "%";
console.log("\nVerify-Before-You-Pay — synthetic benchmark (3,000 requests, " + scams + " impersonation attempts)");
console.log("level      legit   attack");
for (const [l, [lg, at]] of Object.entries(levels)) console.log(l.padEnd(10) + String(lg).padStart(6) + String(at).padStart(9));
console.log(`\nFlag = HIGH or CRITICAL → attacks caught (recall): ${pct(tp / (tp + fn))} · precision: ${pct(tp / (tp + fp))} · legit requests wrongly held: ${pct(fp / (fp + tn))}`);
if (tp / (tp + fn) < 0.9) process.exitCode = 1;
