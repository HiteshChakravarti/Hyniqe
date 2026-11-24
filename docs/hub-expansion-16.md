# Hyniqe Hub: 16 new solutions (Hub total: 30)

Every solution is an instant tool: load a file, get a plain-English report. Each runs **locally**, in the browser
(`web/index.html`, one self-contained page) or from the command line (`node cli.ts`, Node 22+, no dependencies), with
tests, a benchmark and a README that reports first-run results honestly.

## Payments & settlement

| Solution | Problem | Input → Output |
| --- | --- | --- |
| [T+1 Settlement Fail Predictor](../solutions/t1-settlement-predictor/) | Europe moves to T+1 on 11 Oct 2027 | Trades + SSIs → trades likely to fail and why, worst counterparties |
| [VoP Pre-Checker](../solutions/vop-precheck/) | Verification of Payee "close/no match" on bulk payments | Payment file + supplier master → predicted VoP result per payment and the fix |
| [Payment Investigation Assistant](../solutions/payment-investigation-assistant/) | Slow, manual payment investigations | Pasted query → case type, references, missing info, next steps, draft reply |
| [Translation Data-Loss Auditor](../solutions/translation-loss-auditor/) | Data silently lost translating ISO 20022 ↔ MT | pacs.008 + MT103 → truncated, dropped and changed fields |
| [Agent Payment Mandate Checker](../solutions/agent-payment-mandate-checker/) | AI agents paying bills | Mandates + agent payment log → BLOCK/REVIEW/OK, audit-trail completeness |
| [Verify-Before-You-Pay](../solutions/verify-before-you-pay/) | Deepfake / impersonation payment fraud | Request or approval log → risk, callback script, skipped controls |

## Compliance & reporting

| Solution | Problem | Input → Output |
| --- | --- | --- |
| [Sanctions False-Positive Analyser](../solutions/sanctions-fp-analyser/) | 85–95% false-positive screening alerts | Closed alerts → FP drivers, analyst hours, safe-to-test changes, good-guy candidates |
| ["Valid but Wrong" Report Checker](../solutions/report-sanity-checker/) | Reports that pass validation but are wrong | Report extract → check-digit, date-logic, duplicate, outlier and placeholder errors |
| [DORA Register Pre-Check](../solutions/dora-register-precheck/) | Rejected DORA Registers of Information | Working register → fix list incl. critical-function gaps |
| [AI Use Register Generator](../solutions/ai-use-register/) | "Where do you use AI?" | AI inventory → indicative EU AI Act tier, obligations, evidence gaps |
| [PQC Crypto Inventory](../solutions/pqc-crypto-inventory/) | Quantum computers will break RSA/ECC | Code folder → broken-today vs quantum-vulnerable crypto, CBOM |

## Legacy & operations

| Solution | Problem | Input → Output |
| --- | --- | --- |
| [Copybook Decoder](../solutions/copybook-decoder/) | Unreadable mainframe files | COBOL copybook (+ data) → data dictionary, decoded CSV |
| [Migration Reconciler](../solutions/migration-reconciler/) | Data lost or changed in migrations | Source + target extracts → reconciliation, control totals, sign-off pack |
| [Spreadsheet (EUC) Risk Scanner](../solutions/euc-risk-scanner/) | Critical processes running in Excel | Folder of workbooks → EUC register with risk tiers |
| [Batch Dependency Mapper](../solutions/batch-dependency-mapper/) | Nobody knows how the batch connects | JCL, Control-M, cron, scripts → dependency map, run order, risks, diagram |
| [Legacy Runbook Builder](../solutions/legacy-runbook-builder/) | Knowledge leaving with retiring staff | Handover notes + scripts → runbook, knowledge gaps, owner questions |

## Shared building blocks (`solutions/shared/`)

`table.ts` (CSV/Markdown), `ids.ts` (IBAN, BIC, LEI, ISIN, currency, country validators), `text.ts` (name
normalisation, fuzzy matching), `xml-reader.ts` (dependency-free XML reader), `zip.ts` (ZIP reader for Node and browser),
`cli.ts` (Node CLI helpers), `bench.ts` (seeded RNG + scoring). These are designed to become the toolbox that
Hyniqe agents call (e.g. via an MCP server).

## Developing

```bash
cd solutions/<solution>
node --test test/*.test.ts                      # tests
node bench.ts                                   # benchmark
node ../../scripts/build-solution-pages.mjs     # rebuild all web pages after changing src/ (needs tsc ≥ 5.7)
```
