import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsv } from "../../shared/table.ts";
import { addBusinessDays, assessTrades, DEFAULT_CONFIG, readSsis, readTrades } from "../src/predict.ts";
import { toMarkdown, toResultCsv } from "../src/report.ts";

const read = (f: string) => parseCsv(readFileSync(new URL(`../samples/${f}`, import.meta.url), "utf8"));
const res = assessTrades(readTrades(read("trades.csv")), readSsis(read("ssis.csv")));
const rules = (id: string) => res.find((a) => a.trade.id === id)!.issues.map((i) => i.rule);

test("business-day arithmetic skips weekends and holidays", () => {
  assert.equal(addBusinessDays("2027-10-15", 1, new Set()), "2027-10-18");
  assert.equal(addBusinessDays("2027-12-24", 1, new Set(["2027-12-27"])), "2027-12-28");
});
test("clean T+1 trade passes", () => assert.deepEqual(rules("T-1001"), []));
test("T+2 settlement after go-live is flagged", () => assert.ok(rules("T-1002").includes("WRONG_CYCLE")));
test("expired SSI, late affirmation/instruction and FX funding", () => {
  for (const r of ["SSI_EXPIRED", "LATE_AFFIRMATION", "LATE_INSTRUCTION", "FX_FUNDING"]) assert.ok(rules("T-1003").includes(r), r);
});
test("ambiguous SSIs, late allocation, late trade", () => {
  for (const r of ["SSI_AMBIGUOUS", "LATE_ALLOCATION", "LATE_TRADE"]) assert.ok(rules("T-1004").includes(r), r);
});
test("invalid SSI BIC/account, missing SSI, weekend settlement, bad ISIN", () => {
  assert.ok(rules("T-1005").includes("SSI_INVALID"));
  assert.ok(rules("T-1006").includes("NO_SSI"));
  assert.ok(rules("T-1007").includes("NON_BUSINESS_DAY"));
  assert.ok(rules("T-1007").includes("INVALID_ISIN"));
});
test("before go-live, T+2 is not flagged unless assume_t1", () => {
  const t = readTrades(parseCsv("trade_id,trade_date,settlement_date,isin,counterparty\nX,2026-11-24,2026-11-26,DE0007164600,Alpha"));
  assert.ok(!assessTrades(t, [])[0].issues.some((i) => i.rule === "WRONG_CYCLE"));
  assert.ok(assessTrades(t, [], { ...DEFAULT_CONFIG, assume_t1: true })[0].issues.some((i) => i.rule === "WRONG_CYCLE"));
});
test("reports render", () => { assert.match(toMarkdown(res), /Why trades would fail/); assert.match(toResultCsv(res), /^line,trade_id/); });
