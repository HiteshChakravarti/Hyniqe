import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCsv } from "../../shared/table.ts";
import { analyse, readAlerts } from "../src/analyse.ts";
import { goodGuysCsv, toMarkdown } from "../src/report.ts";

const alerts = readAlerts(parseCsv(readFileSync(new URL("../samples/alerts.csv", import.meta.url), "utf8")));
const a = analyse(alerts);

test("dispositions are normalised", () => {
  const x = readAlerts(parseCsv("disposition\nFalse Positive\nTrue match\nEscalated to L2\nPending\nCleared - no match"));
  assert.deepEqual(x.map((y) => y.disposition), ["FP", "TRUE", "ESCALATED", "OPEN", "FP"]);
});
test("finds the planted drivers", () => {
  const ids = a.drivers.map((d) => d.id);
  for (const id of ["REPEAT_PAIRS", "FIELD_ADDRESS_LOCATION", "WEAK_TOKENS", "LOW_SCORE_BANDS"]) assert.ok(ids.includes(id), id);
  assert.ok(a.fpRate > 0.9);
});
test("never proposes suppressing a group with a true match", () => {
  const extra = readAlerts(parseCsv('alert_id,screened_name,matched_name,list,matched_field,disposition\nZ,"Viktor Drazen","Viktor Drazhenko",OFAC SDN,name,true match'));
  const b = analyse([...alerts, ...extra]);
  assert.ok(!b.goodGuys.some((g) => g.screened === "Viktor Drazen" && g.list === "OFAC SDN"));
  for (const d of b.drivers) if (d.trues) assert.equal(d.safe, false);
});
test("score-band advice requires bands below the lowest true match", () => {
  const band = a.drivers.find((d) => d.id === "LOW_SCORE_BANDS");
  assert.ok(band && /lowest-scoring true match was 9\d/.test(band.detail));
});
test("reports render", () => { assert.match(toMarkdown(a), /Before changing anything/); assert.match(goodGuysCsv(a), /^screened,matched/); });
