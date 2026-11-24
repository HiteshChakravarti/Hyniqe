# Spreadsheet (EUC) Risk Scanner

**Find the risky spreadsheets your processes depend on, without opening Excel.**

In many large financial institutions, most reconciliations and a lot of reporting still run in Excel or other
"end-user computing" (EUC) tools. Regulators expect firms to keep an inventory of the spreadsheets that matter and to
control them. Few firms know what's inside them: macros, links to files on someone's old drive, database passwords,
"very hidden" sheets, typed-in FX rates.

Point the tool at a folder (or pick files in the browser). For every .xlsx/.xlsm it reports:

| Risk signal | Why it matters |
| --- | --- |
| VBA macros | Untested code running inside the file |
| Links to other workbooks | Results change silently when the other file moves or changes |
| Database connections, **passwords stored in connection strings** | Live data pulls; credentials exposed to anyone with the file |
| Hidden and **"very hidden"** sheets | Very hidden sheets can only be unhidden with VBA, so reviewers never see them |
| Broken named ranges, `#REF!`, error values | Something was deleted and the logic is broken |
| Hard-coded numbers inside formulas (e.g. `=B2*1.0035`) | Assumptions changed without anyone noticing |
| Volatile functions (INDIRECT, OFFSET, TODAY…) | Results depend on when/how the file is opened |
| Very long formulas, size, author vs. last editor | Review difficulty and ownership |
| Old binary .xls | Can't be inspected; flagged rather than assumed safe |

You get a **risk tier per file**, examples (sheet, cell, formula, why), and an **EUC register CSV** with empty
`owner`, `purpose` and `criticality` columns ready for the business to fill in.

Runs locally. Files are read, never changed or uploaded.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → choose files or a folder → *Scan* (or *Scan samples*).

**Command line** (Node 22+):

```bash
node cli.ts samples --out out/          # writes euc-register.md and euc-register.csv
node cli.ts "/shared/Finance/Month End" --out out/
```

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

24 workbooks generated with **openpyxl** (an independent Excel library, so the test files aren't written by the
scanner's own code), with 49 risk features planted at random across 9 types (`bench/labels.json`):
**100% precision and 100% recall** on the first run.

## Limits

- Doesn't run macros or recalculate formulas; it reads the file structure. Macro *content* isn't analysed, only presence.
- Hard-coded detection is a heuristic (common numbers like 0, 1, 12, 100, 365 are ignored).
- Encrypted/password-protected workbooks and the old .xls binary format can't be inspected.
- Not audit advice.

Part of [Hyniqe Hub](../../README.md).
