import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsv } from "../../shared/table.ts";
import { precheck, readRegister } from "../src/precheck.ts";
import { toIssuesCsv, toMarkdown } from "../src/report.ts";

const list = readRegister(parseCsv(readFileSync(new URL("../samples/register.csv", import.meta.url), "utf8")));
const issues = precheck(list, { referenceDate: "2026-12-31" });
const at = (line: number) => issues.filter((i) => i.line === line).map((i) => i.rule);

test("clean critical arrangement passes", () => assert.deepEqual(at(2), []));
test("provider inconsistency, invalid LEI", () => { assert.ok(at(3).includes("PROVIDER_INCONSISTENT")); assert.ok(at(4).includes("INVALID_LEI")); });
test("critical function gaps and missing data location", () => { assert.ok(at(5).includes("CRITICAL_GAP")); assert.ok(at(5).includes("DATA_LOCATION")); });
test("EUID accepted; expired arrangement warned", () => { assert.ok(!at(6).includes("INVALID_EUID")); assert.ok(at(7).includes("EXPIRED")); });
test("date format, bad country, missing LEI, duplicates, broken links, date order", () => {
  for (const r of ["DATE_FORMAT", "INVALID_COUNTRY", "MISSING"]) assert.ok(at(8).includes(r), r);
  for (const r of ["DUPLICATE_REF", "BROKEN_REFERENCE", "DATE_ORDER"]) assert.ok(at(9).includes(r), r);
});
test("reports render", () => { assert.match(toMarkdown(list, issues), /Fix list/); assert.match(toIssuesCsv(issues), /^line,ref/); });
