# Hyniqe Hub

Free, open-source solutions for the data problems that make trades fail and payments go wrong.
Each solution is a set of explainable checks with a report and a published benchmark. Use them in your browser, from the command line, or on your own servers.

**Use it now:** [hiteshchakravarti.github.io/Hyniqe](https://hiteshchakravarti.github.io/Hyniqe/). Drop in a file and get a report or a fixed file. Your file is processed in your browser and never uploaded.

## Solutions

| Solution | What it finds | Status |
|---|---|---|
| [SSI Checker](solutions/ssi-checker/) | Standing settlement instructions that will fail or go unmatched under T+1: wrong place of settlement, invalid BIC, LEI or IBAN, conflicting or stale SSIs, differences from the golden source | Live |
| [Duplicate Payment Finder](solutions/duplicate-payments/) | The same invoice paid twice, including re-keyed invoice numbers, suppliers set up twice and second-channel payments | Live |
| [Payment Data Repair](solutions/payment-data-repair/) | Free-text vendor and beneficiary addresses turned into structured fields, plus bank-detail consistency checks | Live |
| [Payment File Doctor](solutions/payment-file-doctor/) | Why a bank rejected a pain.001 payment file, and a corrected file (version upgrade, totals, characters, structured addresses, IBANs, dates) | Live |
| [Bank Statement Converter](solutions/bank-statement-converter/) | camt.052/053/054 and MT940/942 statements turned into a spreadsheet, with a balance check | Live |
| [Excel to Payment File](solutions/excel-to-payment-file/) | A valid pain.001 payment file built from a spreadsheet of payments, self-checked before download | Live |
| [Corporate Actions Checker](solutions/corporate-actions-checker/) | Dates, rates, ratios and options that differ between custodian and vendor notices, and election deadlines too close to act on | Live |
| [Vendor Master Cleanup](solutions/vendor-master-cleanup/) | Suppliers set up more than once, bank accounts shared by unrelated suppliers, invalid VAT numbers, missing details | Live |
| [Returns and Rejects Triage](solutions/payment-returns-triage/) | Every rejected or returned payment (pain.002, pacs.002, pacs.004 or CSV) explained and grouped by root cause | Live |
| [E-invoice Viewer & Checker](solutions/e-invoice-checker/) | Any Peppol, XRechnung, ZUGFeRD or Factur-X invoice shown as a readable invoice, with every broken EN 16931 rule explained | Live |
| [Payment Message Explainer](solutions/payment-message-explainer/) | An MT103 or pacs.008 in plain English, field by field, with CBPR+ address checks and conversion to the other format | Live |
| [Bank Reconciliation](solutions/bank-reconciliation/) | A bank statement (camt.053, MT940 or CSV) matched to your ledger by reference, combined and part payments, charges, amount, date and name, with every difference explained | Live |
| [Bank Detail Change Check](solutions/bank-detail-change-check/) | Payments in a run going to changed, foreign or another supplier's bank account, before you release them | Live |
| [Data Quality Scorecard](solutions/data-quality-scorecard/) | Completeness, validity, uniqueness and consistency for any table, with finance formats checked properly | Live |
| [T+1 Settlement Fail Predictor](solutions/t1-settlement-predictor/) | Trades that will fail to settle under T+1 and why: missing or stale SSIs, late allocation, affirmation or instruction, FX funding gaps | Live |
| [VoP Pre-Checker](solutions/vop-precheck/) | The Verification of Payee result each payment in a bulk file is likely to get (match, close match, no match), and the fix | Live |
| [Payment Investigation Assistant](solutions/payment-investigation-assistant/) | A pasted payment query or MT199 turned into a case: type, references, missing information, next steps and a draft reply | Live |
| [Translation Data-Loss Auditor](solutions/translation-loss-auditor/) | Data truncated, dropped or changed when a pacs.008 is translated to an MT103 | Live |
| [Agent Payment Mandate Checker](solutions/agent-payment-mandate-checker/) | Payments by AI agents that break their mandate (limits, payees, categories) or lack an audit trail | Live |
| [Verify-Before-You-Pay](solutions/verify-before-you-pay/) | Deepfake and impersonation fraud signals in payment requests, with a callback script and skipped controls | Live |
| [Sanctions False-Positive Analyser](solutions/sanctions-fp-analyser/) | What drives sanctions screening false positives, analyst hours lost, and tuning changes that are safe to test | Live |
| ["Valid but Wrong" Report Checker](solutions/report-sanity-checker/) | Regulatory report rows that pass validation but are wrong: check digits, dates, duplicates, outliers, placeholders | Live |
| [DORA Register Pre-Check](solutions/dora-register-precheck/) | Errors that get a DORA Register of Information rejected, including gaps for critical or important functions | Live |
| [AI Use Register](solutions/ai-use-register/) | An AI inventory turned into an EU AI Act register with indicative risk tiers, obligations and evidence gaps | Live |
| [Post-Quantum Crypto Inventory](solutions/pqc-crypto-inventory/) | Cryptography in code that is broken today or vulnerable to quantum computers, with a CycloneDX CBOM | Live |
| [Copybook Decoder](solutions/copybook-decoder/) | A COBOL copybook as a data dictionary, and mainframe data (EBCDIC, packed decimal) decoded to CSV | Live |
| [Migration Reconciler](solutions/migration-reconciler/) | Records lost, truncated or changed between source and target in a data migration, with control totals and sign-off | Live |
| [Spreadsheet (EUC) Risk Scanner](solutions/euc-risk-scanner/) | Macros, external links, hidden sheets, errors and hard-coded values across a folder of workbooks, as an EUC register | Live |
| [Batch Dependency Mapper](solutions/batch-dependency-mapper/) | How JCL, Control-M, cron and scripts depend on each other: run order, missing conditions, risks and a diagram | Live |
| [Legacy Runbook Builder](solutions/legacy-runbook-builder/) | Handover notes and scripts turned into a runbook, with knowledge gaps and questions for the owner | Live |

See [CATALOG.md](CATALOG.md) for inputs, outputs and accuracy, and [ROADMAP.md](ROADMAP.md) for what comes next.

## Three ways to use it

**1. In the browser.** Open the website, pick a solution, drop in a CSV. No install, no account, no upload.

**2. From the command line** (Node.js 22.18 or later, no dependencies to install):

```bash
git clone https://github.com/HiteshChakravarti/Hyniqe.git && cd Hyniqe
npm run ssi -- my-ssis.csv --golden golden-source.csv --client "My Bank"
npm run duplicates -- payments.csv
npm run repair -- vendors.csv
npm run doctor -- rejected-file.xml
npm run statement -- statement.mt940
npm run excel-to-payment -- payments.csv --name "My Company" --iban DE89370400440532013000 --date 2026-12-01
npm run corporate-actions -- notices.csv
npm run vendors -- vendors.csv
npm run returns -- status-report.xml
npm run scorecard -- any-table.csv
npm run einvoice -- invoice.xml
npm run explain -- mt103.txt
npm run bank-check -- payment-run.csv --trusted vendor-master.csv
npm run reconcile -- statement.xml --ledger cash-ledger.csv
```

Each command writes an HTML report (prints cleanly to PDF) and a CSV or corrected file to `out/`. Most accept `--sample` to try them on generated data.

**3. Inside your own systems.** The solutions are plain TypeScript modules with no dependencies. Import `checkSsis`, `findDuplicates` or `repairRecords` directly, or run the full agent team in [`engine/`](engine/), which adds task queues, budgets, human approvals and a tamper-evident audit trail.

## How the pieces fit

```
engine/              Hyniqe Engine: agent runtime, approvals, budgets, audit chain   (AGPL-3.0)
solutions/
  ssi-checker/       T+1 standing settlement instruction checks                       (AGPL-3.0)
  duplicate-payments/ duplicate and near-duplicate payment detection                  (AGPL-3.0)
  payment-data-repair/ address structuring and bank-detail controls                   (AGPL-3.0)
  payment-file-doctor/, bank-statement-converter/, excel-to-payment-file/,
  corporate-actions-checker/, vendor-master-cleanup/, payment-returns-triage/,
  data-quality-scorecard/                                                              (AGPL-3.0)
  shared/            CSV, XML and report helpers
site/                website pages, styles and the browser adapter for each tool
docs/                the website; scripts/build-site.ts adds the browser modules and samples, GitHub Pages serves it
```

## Accuracy

Every solution has a benchmark that runs in CI on every change and fails the build if quality drops:

- SSI Checker: 2000 SSIs, 100.0% of injected defects found, 0.00% of clean SSIs flagged.
- Duplicate Payment Finder: 9264 payments, 94.7% of injected duplicates found, 100.0% of high-confidence flags correct.
- Payment File Doctor: 60 files, 100% of injected defects reported, 100% of fixable ones repaired, 0 false alarms on 60 clean files.
- Corporate Actions Checker: 887 notices, 100% of injected disagreements and deadline problems found, 0 of 201 clean events flagged.
- Vendor Master Cleanup: 1908 supplier records, 100% of injected problems found, 0 of 1440 clean records flagged.
- Returns and Rejects Triage: 748 returns in five formats, 100% read correctly.
- E-invoice Checker: 440 UBL and CII invoices, 100% of injected rule breaks found, 0 of 110 correct invoices flagged, 20 of 20 Factur-X PDFs read.
- Payment Message Explainer: 500 MT103 / pacs.008 pairs read and converted with every core field unchanged; every structured address suggested was correct.
- Bank Detail Change Check: 100% of injected redirection patterns found, no normal payment flagged.
- Data Quality Scorecard: 3060 rows, every injected defect counted exactly in 60 of 60 columns.
- Payment Data Repair: on a held-out set of 840 addresses, 57.6% repaired automatically with no wrong automatic repairs; the first blind run, before fixes, was 96.3% precise.

These are synthetic, labelled test sets. They show the rules catch known defects; they are not a promise about your data. A Health Check on real data is the real test.

## Free, and how to get more

Everything here is free to use. Teams that want the checks run on their real data with them, explained, and turned into a prioritised fix plan can [request a Health Check](https://github.com/HiteshChakravarti/Hyniqe/issues/new?title=Health%20Check%20request). Ongoing monitoring, integrations, support and commercial licenses are available on request.

## Development

```bash
npm install            # TypeScript, for type-checking only
npm test               # solution tests
npm run bench          # benchmarks with quality gates
npm run build:site     # build the website into docs/ (also runs benchmarks)
npm run site           # preview the website at http://localhost:8000
cd engine && npm install && npm test   # engine tests
```

## Licensing

Everything is AGPL-3.0, with a commercial license available for organisations that want to embed Hyniqe without AGPL obligations. "Hyniqe" is the project name and may not be used for modified versions. See [LICENSING.md](LICENSING.md).
