import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../../shared/table.ts";
import { checkReport, classifyColumns } from "../src/check.ts";
import { toIssuesCsv, toMarkdown } from "../src/report.ts";
import { leiWithCheck } from "../../shared/ids.ts";

const firm = leiWithCheck("529900HYNIQEDEMO01");
test("columns are recognised by name", () => {
  const r = classifyColumns(["UTI", "Reporting LEI", "ISIN", "Notional Amount", "Notional Currency", "Trade Date", "Maturity Date", "Counterparty Country", "Price"]);
  assert.deepEqual(Object.values(r), ["id", "lei", "isin", "amount", "currency", "date", "date", "country", "price"]);
});
test("catches identifier, date, duplicate, self-counterparty and placeholder errors", () => {
  const csv = `uti,reporting_lei,counterparty_lei,isin,notional,currency,trade_date,maturity_date,country
U1,${firm},${firm},US0378331005,1000000,USD,2026-11-01,2027-11-01,US
U1,${firm},5493001KJTIIGC8Y1R13,US0378331006,-5,EUD,2026-11-01,2026-10-01,UK
U3,${firm},TBD,N/A,0,EUR,2026-11-01,9999-12-31,DE`;
  const rules = checkReport(parseCsv(csv)).issues.map((i) => `${i.row}:${i.rule}`);
  for (const x of ["2:SELF_COUNTERPARTY", "3:DUPLICATE_ID", "3:INVALID_LEI", "3:INVALID_ISIN", "3:NEGATIVE", "3:INVALID_CURRENCY", "3:DATE_ORDER", "3:INVALID_COUNTRY", "4:PLACEHOLDER"]) assert.ok(rules.includes(x), x);
});
test("required columns and report date", () => {
  const res = checkReport(parseCsv("uti,execution_date,notional\n,2026-12-01,5"), { required: ["uti"], reportDate: "2026-11-24" });
  const rules = res.issues.map((i) => i.rule);
  assert.ok(rules.includes("MISSING"));
  assert.ok(rules.includes("FUTURE_DATE"));
});
test("valid rows produce no errors", () => {
  const res = checkReport(parseCsv(`uti,reporting_lei,counterparty_lei,isin,notional,currency,trade_date,maturity_date\nA,${firm},${leiWithCheck("HYNIQECPTY00000001")},DE0007164600,250000,EUR,2026-11-01,2027-11-01`));
  assert.equal(res.issues.length, 0);
});
test("reports render", () => {
  const res = checkReport(parseCsv("isin\nUS0378331006"));
  assert.match(toMarkdown(res), /ISIN fails/);
  assert.match(toIssuesCsv(res.issues), /^row,column/);
});
