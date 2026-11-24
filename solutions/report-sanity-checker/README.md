# "Valid but Wrong" Report Checker

**Your report passed validation. Is it actually right?**

Regulators are shifting from "did you report?" to "is the data true?". Reports routinely pass format validation while
containing wrong identifiers, impossible dates or duplicate trades. Recent enforcement includes an A$2 million
penalty over reporting errors affecting 260,000+ derivatives transactions, and the ECB has found flawed prudential data
from most EU banks in a quarter.

Load any report extract as CSV (transaction reporting, derivatives, securities, payments, prudential templates). The
tool **recognises columns by name** and runs plausibility checks that format validation misses:

| Check | Examples |
| --- | --- |
| Identifiers with real check digits | LEI (ISO 17442), ISIN (ISO 6166), BIC, IBAN |
| Code lists | Currency (ISO 4217), country (ISO 3166). "UK" isn't a country code; "GB" is |
| Date logic | Maturity before trade date, effective before execution, trade dates after the report date, unreadable dates |
| Duplicates | The same UTI / trade ID / transaction ID twice |
| Counterparties | Firm reported as its own counterparty |
| Amounts | Negative notionals/quantities, zero notionals, outliers (100× the typical value, usually a unit or decimal error), wrong decimals for the currency |
| Placeholders | `N/A`, `TBD`, `XXXX`, `9999-12-31`, `0000` left in real fields |
| Required fields | `--required uti,notional` |

Runs locally. Nothing is uploaded.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Check report*.

**Command line** (Node 22+):

```bash
node cli.ts --report samples/derivatives-report.csv --out out/
node cli.ts --report my-extract.csv --required uti,notional,maturity_date --report-date 2026-11-24
```

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

3,000 synthetic derivatives-report rows (seeded), ~40% with one injected error across 12 types, scored per row:

| Run | Precision | Recall |
| --- | --- | --- |
| First run | 97.1% | 97.0% |
| After fixing a labelling overlap in the benchmark ("XX" was planted as a bad country but is also, correctly, a placeholder) | 100% | 99.9% (one ×1000 outlier missed) |

## Limits

- Checks are generic. They don't replace the regulator's own validation rules, or reconciliation against your source systems and trade repositories.
- Column recognition is name-based: rename unusual headers (e.g. to `counterparty_lei`) for best results.
- Outlier detection needs at least 20 rows per currency.
- Not legal or regulatory advice.

Part of [Hyniqe Hub](../../README.md).
