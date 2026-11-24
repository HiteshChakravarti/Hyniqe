import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeData, decodeField, layout, parseCopybook, picInfo, type Field } from "../src/copybook.ts";
import { dataCsv, dictionaryCsv, dictionaryMarkdown } from "../src/report.ts";

const cpy = readFileSync(new URL("../samples/CUSTREC.cpy", import.meta.url), "utf8");
const data = new Uint8Array(readFileSync(new URL("../samples/CUSTMAST.dat", import.meta.url)));
const expected: Record<string, string>[] = JSON.parse(readFileSync(new URL("./expected.json", import.meta.url), "utf8"));
const l = layout(parseCopybook(cpy).root);

test("layout: record length, offsets, redefines, occurs, 88 levels", () => {
  assert.equal(l.recordLength, 114);
  const f = (p: string) => l.fields.find((x) => x.path.endsWith(p))!;
  assert.equal(f("BALANCE").offset, 47); assert.equal(f("BALANCE").length, 7);
  assert.equal(f("OPEN-DATE-R").offset, f("OPEN-DATE").offset);
  assert.equal(f("ADDRESS-LINE(2)").offset, 85);
  assert.equal(f("RISK-SCORE").length, 2);
  assert.equal(f("CUST-TYPE").values.length, 2);
});

test("decodes every field of 40 records exactly as the independent (Python) encoder wrote them", () => {
  const d = decodeData(l.fields, data, { encoding: "ebcdic", recordLength: l.recordLength });
  assert.equal(d.records, 40);
  assert.equal(d.leftover, 0);
  let checked = 0;
  d.rows.forEach((row, i) => d.columns.forEach((c, j) => {
    const exp = expected[i][c];
    if (exp === undefined) return;
    if (exp === "PROBLEM") assert.ok(d.problems.some((p) => p.record === i + 1 && p.field.endsWith(c)));
    else assert.equal(row[j], exp, `record ${i + 1} ${c}`);
    checked++;
  }));
  assert.equal(checked, 440);
});

const fld = (o: Partial<Field>): Field => ({ path: "X", name: "X", level: 5, offset: 0, length: 0, kind: "numeric", pic: "", usage: "DISPLAY", digits: 0, scale: 0, signed: false, signSeparate: false, signLeading: false, values: [], redefines: false, leaf: true, ...o });
test("ASCII zoned overpunch, sign separate, signed binary", () => {
  const enc = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));
  assert.equal(decodeField(fld({ signed: true, scale: 2, digits: 5 }), enc("1234}"), "ascii").value, "-123.40");
  assert.equal(decodeField(fld({ signed: true, digits: 3 }), enc("12C"), "ascii").value, "123");
  assert.equal(decodeField(fld({ signed: true, signSeparate: true, signLeading: true, digits: 3 }), enc("-042"), "ascii").value, "-42");
  assert.equal(decodeField(fld({ usage: "BINARY", signed: true, digits: 4 }), new Uint8Array([0xff, 0xfe]), "ebcdic").value, "-2");
});
test("picture clauses", () => {
  assert.deepEqual(picInfo("S9(7)V99"), { kind: "numeric", digits: 9, scale: 2, signed: true, chars: 9 });
  assert.equal(picInfo("X(12)").chars, 12);
  assert.equal(picInfo("ZZ,ZZ9.99").kind, "edited");
});
test("group USAGE, OCCURS of a group, free-format copybook", () => {
  const src = `01 REC.\n  05 AMTS COMP-3 OCCURS 3.\n    10 AMT PIC S9(5)V99.\n    10 QTY PIC 9(3).\n  05 TAIL PIC X(2).`;
  const lay = layout(parseCopybook(src).root);
  assert.equal(lay.recordLength, 3 * (4 + 2) + 2);
  assert.ok(lay.fields.some((f) => f.path.endsWith("AMTS(3).AMT(3)") || f.path.endsWith("AMT(3)")));
  assert.equal(lay.fields.find((f) => f.name.startsWith("AMT") && f.leaf)!.usage, "COMP-3");
});
test("reports render", () => {
  const d = decodeData(l.fields, data, { encoding: "ebcdic", recordLength: l.recordLength });
  assert.match(dictionaryMarkdown(l.fields, l.recordLength, []), /Record length: 114/);
  assert.match(dictionaryCsv(l.fields), /^level,path,start/);
  assert.match(dataCsv(d), /^CUST-ID,CUST-NAME/);
});
