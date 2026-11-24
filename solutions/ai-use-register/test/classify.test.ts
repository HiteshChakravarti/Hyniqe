import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsv } from "../../shared/table.ts";
import { classify, readUseCases, type UseCase } from "../src/classify.ts";
import { templateCsv, toMarkdown, toRegisterCsv } from "../src/report.ts";

const uc = (o: Partial<UseCase>): UseCase => ({ ...readUseCases([{ name: "x" }])[0], ...o });
const today = new Date("2026-11-24T00:00:00Z");

test("consumer credit is high-risk, corporate credit and fraud are not", () => {
  assert.equal(classify(uc({ description: "Scores retail applicants for personal loan approval", users: "customers" })).tier, "HIGH-RISK");
  assert.equal(classify(uc({ description: "Internal risk ratings for corporate borrowers", users: "internal" })).tier, "MINIMAL");
  assert.equal(classify(uc({ description: "Detects fraudulent documents in loan applications", users: "customers" })).tier, "MINIMAL");
});

test("emotion recognition at work is flagged as possibly prohibited; with customers it is transparency", () => {
  assert.equal(classify(uc({ description: "Detects stress and emotion in call centre agents' voices", users: "employees" })).tier, "PROHIBITED?");
  assert.equal(classify(uc({ description: "Detects customer emotion from facial expressions on video calls", users: "customers" })).tier, "TRANSPARENCY");
});

test("face verification for login is not biometric identification", () => {
  assert.equal(classify(uc({ description: "Face verification with liveness for app login", users: "customers" })).tier, "MINIMAL");
  assert.equal(classify(uc({ description: "Facial recognition on CCTV to identify people on a watchlist", users: "public" })).tier, "HIGH-RISK");
});

test("unmatched decisions about people go to REVIEW, never silently minimal", () => {
  const e = classify(uc({ description: "Decides which tenants are accepted for flats", users: "customers" }));
  assert.ok(e.tier === "REVIEW" || e.tier === "HIGH-RISK");
});

test("overlays: automated decision, model risk, third party, personal data, genai", () => {
  const e = classify(uc({ description: "Automatically approves or declines credit card applications", users: "customers", decision: "automated", vendor: "Acme AI", personal_data: true, model: "LLM" }));
  const ids = e.overlays.map((o) => o.id);
  for (const id of ["AUTOMATED_DECISION", "MODEL_RISK", "THIRD_PARTY", "PERSONAL_DATA", "GENAI"]) assert.ok(ids.includes(id), id);
});

test("evidence: stale validation detected and readiness computed", () => {
  const e = classify(uc({ name: "AML", description: "Scores transactions for money laundering risk for investigators", owner: "MLRO", risk_assessment: true, monitoring: true, documentation: "link", last_validated: new Date("2024-01-01") }), today);
  const v = e.evidence.find((x) => x.id === "validation");
  assert.equal(v?.status, "stale");
  assert.equal(e.priority, "P2");
  assert.ok(e.readiness > 0 && e.readiness < 1);
});

test("high-risk live with gaps is P1", () => {
  const e = classify(uc({ description: "Ranks job applicants CVs for shortlisting", users: "candidates", status: "pilot" }));
  assert.equal(e.tier, "HIGH-RISK");
  assert.equal(e.priority, "P1");
});

test("sample inventory end to end + template", () => {
  const rows = parseCsv(readFileSync(new URL("../samples/ai-inventory.csv", import.meta.url), "utf8"));
  const list = readUseCases(rows).map((u) => classify(u, today));
  assert.equal(list.length, 12);
  assert.match(toMarkdown(list), /What to fix first/);
  assert.match(toRegisterCsv(list), /^use_case_id,name/);
  assert.equal(parseCsv(templateCsv()).length, 1);
});
