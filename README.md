# Hyniqe Hub

Free, open-source solutions for the data problems that make trades fail and payments go wrong.
Each solution is a set of explainable checks with a report and a published benchmark. Use them in your browser, from the command line, or on your own servers.

**Use it now:** [hiteshchakravarti.github.io/Hyniqe](https://hiteshchakravarti.github.io/Hyniqe/). Drop in a CSV and get a report. Your file is processed in your browser and never uploaded.

## Solutions

| Solution | What it finds | Status |
|---|---|---|
| [SSI Checker](solutions/ssi-checker/) | Standing settlement instructions that will fail or go unmatched under T+1: wrong place of settlement, invalid BIC, LEI or IBAN, conflicting or stale SSIs, differences from the golden source | Live |
| [Duplicate Payment Finder](solutions/duplicate-payments/) | The same invoice paid twice, including re-keyed invoice numbers, suppliers set up twice and second-channel payments | Live |
| [Payment Data Repair](solutions/payment-data-repair/) | Free-text vendor and beneficiary addresses turned into structured fields, plus bank-detail consistency checks | Live |

See [CATALOG.md](CATALOG.md) for inputs, outputs and accuracy, and [ROADMAP.md](ROADMAP.md) for what comes next.

## Three ways to use it

**1. In the browser.** Open the website, pick a solution, drop in a CSV. No install, no account, no upload.

**2. From the command line** (Node.js 22.18 or later, no dependencies to install):

```bash
git clone https://github.com/HiteshChakravarti/Hyniqe.git && cd Hyniqe
npm run ssi -- my-ssis.csv --golden golden-source.csv --client "My Bank"
npm run duplicates -- payments.csv
npm run repair -- vendors.csv
```

Each command writes an HTML report (prints cleanly to PDF) and a CSV of findings to `out/`. Add `--sample` to the first two to try them on generated data.

**3. Inside your own systems.** The solutions are plain TypeScript modules with no dependencies. Import `checkSsis`, `findDuplicates` or `repairRecords` directly, or run the full agent team in [`engine/`](engine/), which adds task queues, budgets, human approvals and a tamper-evident audit trail.

## How the pieces fit

```
engine/              Hyniqe Engine: agent runtime, approvals, budgets, audit chain   (Apache-2.0)
solutions/
  ssi-checker/       T+1 standing settlement instruction checks                       (AGPL-3.0)
  duplicate-payments/ duplicate and near-duplicate payment detection                  (AGPL-3.0)
  payment-data-repair/ address structuring and bank-detail controls                   (AGPL-3.0)
  shared/            CSV and report helpers
docs/                the website; scripts/build-site.ts adds the browser modules and samples, GitHub Pages serves it
```

## Accuracy

Every solution has a benchmark that runs in CI on every change and fails the build if quality drops:

- SSI Checker: 2000 SSIs, 100.0% of injected defects found, 0.00% of clean SSIs flagged.
- Duplicate Payment Finder: 9264 payments, 94.7% of injected duplicates found, 100.0% of high-confidence flags correct.
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

The engine is Apache-2.0. The solutions and website are AGPL-3.0, with a commercial license available for organisations that want to embed them without AGPL obligations. See [LICENSING.md](LICENSING.md).
