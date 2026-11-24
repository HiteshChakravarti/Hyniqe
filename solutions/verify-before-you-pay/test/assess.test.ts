import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../../shared/table.ts";
import { assess, DEFAULT_POLICY, readRequests, requestFromText, type PaymentRequest } from "../src/assess.ts";
import { checkSender, levenshtein, skeleton, textSignals } from "../src/signals.ts";
import { toMarkdown, toResultCsv } from "../src/report.ts";

const policy = { ...DEFAULT_POLICY, company_domains: ["acme.com", "globex.com"] };
const base = (o: Partial<PaymentRequest>): PaymentRequest => ({ ...requestFromText(""), id: "T", ...o });

test("text signals pick up urgency, secrecy, bypass, unreachable, bank change, gift cards", () => {
  const ids = textSignals("URGENT: keep this between us, skip the usual approval. I'm in a board meeting and can't talk. Pay to this new account. Buy Google Play cards.").map((s) => s.id);
  for (const id of ["URGENCY", "SECRECY", "BYPASS", "UNREACHABLE", "BANK_CHANGE", "UNUSUAL_METHOD"]) assert.ok(ids.includes(id), id);
  assert.equal(textSignals("Please find invoice 123 for October services attached.").length, 0);
});

test("lookalike domains", () => {
  assert.equal(checkSender("ceo@acme.com", policy.company_domains).kind, "trusted");
  assert.equal(checkSender("ceo@acrne.com", policy.company_domains).kind, "lookalike"); // rn → m
  assert.equal(checkSender("ceo@acme.co", policy.company_domains).kind, "lookalike"); // tld swap
  assert.equal(checkSender("ap@g1obex.com", policy.company_domains).kind, "lookalike"); // 1 → l
  assert.equal(checkSender("ap@acme-payments.com", policy.company_domains).kind, "lookalike"); // embeds
  assert.equal(checkSender("ceo@gmail.com", policy.company_domains).kind, "free_mail");
  assert.equal(checkSender("ap@initech.com", policy.company_domains).kind, "external");
  assert.equal(skeleton("rnicr0soft"), "microsoft");
  assert.equal(levenshtein("kitten", "sitting"), 3);
});

test("classic CEO deepfake request scores critical and requires callback + challenge + dual approval", () => {
  const a = assess(base({ requested_by: "Dana", requester_title: "CEO", channel: "video", amount: 90000, currency: "USD", payee_new: true, message: "Need this paid today, confidential acquisition, I can't take calls." }), policy);
  assert.equal(a.level, "CRITICAL");
  const req = a.controls.filter((c) => c.required).map((c) => c.id);
  for (const c of ["CALLBACK", "CHALLENGE", "DUAL_APPROVAL"]) assert.ok(req.includes(c), c);
  assert.ok(a.callback_script[0].includes("own directory"));
});

test("ordinary invoice is low risk", () => {
  const a = assess(base({ requested_by: "AP Clerk", requester_title: "Clerk", channel: "email", sender: "ap@acme.com", amount: 1234.56, currency: "USD", payee_new: false, bank_details_changed: false, message: "Invoice 55 per PO 77." }), policy);
  assert.equal(a.level, "LOW");
  assert.equal(a.breaches.length, 0);
});

test("approval log: skipped controls are breaches; good practice passes", () => {
  const csv =
    "request_id,received_at,requested_by,requester_title,channel,amount,currency,payee,payee_new,bank_details_changed,bank_change_at,message,callback_done,callback_source,challenge_passed,approver_1,approver_2,released_by,paid_at\n" +
    "A,2026-11-19 10:00,Dana,CFO,voice,30000,USD,X,yes,no,,urgent,no,,no,Sam,,Sam,2026-11-19 11:00\n" +
    "B,2026-11-19 10:00,Vendor,Supplier,email,20000,USD,Y,no,yes,2026-11-19 09:00,new account,yes,number in the email,,Sam,Ana,Joe,2026-11-19 12:00\n" +
    "C,2026-11-19 10:00,Dana,CFO,voice,30000,USD,X,no,no,,renewal,yes,directory,yes,Sam,Ana,Joe,2026-11-19 12:00\n";
  const [a, b, c] = readRequests(parseCsv(csv)).map((r) => assess(r, policy));
  const ids = (x: typeof a) => x.breaches.map((y) => y.id);
  for (const id of ["CALLBACK", "CHALLENGE", "DUAL_APPROVAL", "SEGREGATION", "PAID_WITHOUT_VERIFICATION"]) assert.ok(ids(a).includes(id), id);
  assert.ok(ids(b).includes("INDEPENDENT_NUMBER"));
  assert.ok(ids(b).includes("COOLING_OFF"));
  assert.deepEqual(ids(c), []);
});

test("free text parsing extracts amount, currency and sender", () => {
  const r = requestFromText("From boss@acme-corp.co: wire €12.500,00 now");
  assert.equal(r.amount, 12500);
  assert.equal(r.currency, "EUR");
  assert.equal(r.sender, "boss@acme-corp.co");
  assert.equal(requestFromText("pay USD 25k to them").amount, 25000);
});

test("reports render", () => {
  const list = [assess(base({ amount: 50000, message: "urgent and confidential", requested_by: "X", requester_title: "CEO", channel: "whatsapp" }), policy)];
  assert.match(toMarkdown(list), /Callback script/);
  assert.match(toResultCsv(list), /^request_id,level/);
});
