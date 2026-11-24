# Translation Data-Loss Auditor (ISO 20022 ↔ MT)

**Payments still flow, but is the data still whole? Find what got cut or dropped when ISO 20022 messages were translated to MT.**

Cross-border payments moved to ISO 20022 in November 2025, but many banks and systems still translate rich MX messages
back into MT103 format. MT fields are short: names get cut at 35 characters, remittance information at 140, and ultimate
parties, LEIs, purpose codes and structured addresses have nowhere to go. The payment settles, but screening,
reconciliation and the beneficiary all see less (or different) information. These are "silent" failures.

Load a pacs.008 and the matching MT103 (or a folder of them, paired by UETR). You get every field that was **truncated,
dropped or changed**, with what it means:

| Severity | Finding |
| --- | --- |
| Critical | UETR lost or different · amount, currency or settlement date differs · charges (DEBT/CRED/SHAR ↔ OUR/BEN/SHA) translated wrongly · creditor account or bank differs · names that don't match at all |
| High | Debtor/creditor name truncated (incl. "+" markers) · ultimate debtor/creditor dropped (a sanctions-screening blind spot) |
| Medium | Remittance information cut at 140 characters or missing · structured remittance flattened · purpose code lost · LEI lost · town/country missing |
| Info | Structured address flattened to free text · name split over several lines |

Codewords that banks put in field 70 (`/PURP/`, `/LEI/`, `/ULTD/`, `/ULTB/`, `/ROC/`) are recognised, so data carried
that way isn't reported as lost.

Runs locally. Nothing is uploaded.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Compare*.

**Command line** (Node 22+):

```bash
node cli.ts --mx samples/pacs008.xml --mt samples/mt103-translated.txt
node cli.ts --dir messages/ --out out/      # pairs every .xml with the MT file that has the same UETR
```

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

800 synthetic pacs.008/MT103 pairs (seeded) from varied parties (long Indian, French and Dutch company names, ultimate
parties, LEIs, purpose codes, long remittance), ~60% with 1–3 injected faults across 10 types.

| Run | Precision | Recall | Faithful translations with a false high/critical finding |
| --- | --- | --- | --- |
| First run | 94.9% | 94.7% | 0 / 321 |
| After fixes | 100% | 100% | 0 / 321 |

The first run exposed a real weakness: codewords in field 70 hid genuine remittance truncation, so it was reported as a
"mismatch" instead. It also exposed a bug in the benchmark's own generator. Both are fixed. The second row is no longer
blind, and real messages from your systems may contain variations the generator doesn't produce.

## Limits

- Covers pacs.008 ↔ MT103 (customer credit transfers). It doesn't validate messages against the full CBPR+ rules.
- Compares the two messages you give it. It can't tell which system did the truncation.
- Not legal or compliance advice.

Part of [Hyniqe Hub](../../README.md).
