# Solution catalog

Every Hyniqe Hub solution follows the same pattern: explainable rules, a report a manager can read, a CSV of findings, and a benchmark with quality gates in CI.

## SSI Checker
**Folder:** `solutions/ssi-checker` · **Status:** live · **Who it's for:** settlement, custody and static-data teams preparing for T+1 in the EU, UK and Switzerland (11 October 2027).

**Input:** a CSV of standing settlement instructions; optionally a second CSV from a golden source (counterparty-published SSIs or an industry SSI database export).

**Checks:**
- Missing counterparty, market, currency, place of settlement, agent or safekeeping account
- BIC format and country; LEI check digits (ISO 17442); cash IBAN check digits
- Place of settlement is a central securities depository for the market (EU, UK, Swiss CSDs, the two ICSDs and the US)
- Conflicting SSIs for the same counterparty, market, asset class and currency
- SSIs not verified within 365 days (configurable), or received by email, PDF or phone
- Field-by-field differences from the golden source, ignoring case, spacing and BIC8/BIC11 differences

**Output:** T+1 readiness report (HTML), issues CSV.
**Benchmark:** 2000 SSIs, 100.0% of injected defects found, 0.00% of clean SSIs flagged.

## Duplicate Payment Finder
**Folder:** `solutions/duplicate-payments` · **Status:** live · **Who it's for:** accounts payable, treasury and internal audit.

**Input:** a CSV of payments or paid invoices.

**Finds:**
- High confidence: same supplier, amount and invoice; re-keyed invoice numbers (prefix dropped, swapped digits); the same supplier set up twice in the vendor master
- Medium confidence: same supplier and amount paid within 30 days under different references
- Low confidence (CSV only): same invoice with different amounts, and round amounts repeated
- Recurring series such as rent and subscriptions are recognised and not flagged

**Output:** duplicate review report (HTML) with amount at risk, groups CSV.
**Benchmark:** 9264 payments, 94.7% of injected duplicates found, 100.0% of high-confidence flags correct.

## Payment Data Repair
**Folder:** `solutions/payment-data-repair` (rules in `engine/src/address`) · **Status:** live · **Who it's for:** payment operations and vendor master data teams moving to structured addresses in payment messages.

**Input:** a CSV of vendors or beneficiaries with free-text addresses or split fields.

**Does:** structures addresses into street, building, postcode, town, region and country; repairs automatically only at 80% confidence or above; sends the rest to review; checks IBAN validity and bank, BIC and address country consistency.

**Output:** repair report (HTML), structured addresses CSV. The engine's full Health Check adds agent approvals and an audit seal.
**Benchmark:** 840 held-out addresses, 57.6% repaired automatically, no wrong automatic repairs after fixes (96.3% on the first blind run).

## Payment File Doctor
**Folder:** `solutions/payment-file-doctor` · **Status:** live · **Input:** a pain.001 credit transfer file (version 03 or 09). **Output:** a corrected pain.001.001.09 file and a report.
**Checks and fixes:** version upgrade, missing namespace, number of transactions and control sum, characters outside the SEPA set (transliterated), unstructured addresses (structured where the rules are sure), IBAN spacing and check digits, BIC format and country, past or weekend execution dates, charge bearer, amounts, duplicate references, field lengths.
**Benchmark:** 60 generated files; 100% of defects reported, 100% of fixable defects repaired, no false alarms on clean files.

## Bank Statement Converter
**Folder:** `solutions/bank-statement-converter` · **Status:** live · **Input:** camt.052, camt.053, camt.054, MT940 or MT942. **Output:** a spreadsheet (CSV with friendly headers) and a summary. Bank transaction codes are translated into plain words, MT940 field 86 is split into counterparty, account and reference, and opening plus movements is checked against the closing balance.

## Excel to Payment File
**Folder:** `solutions/excel-to-payment-file` · **Status:** live · **Input:** a CSV with payee, IBAN, amount and reference (BIC and address optional), plus the payer's name, IBAN and date. **Output:** a pain.001.001.09 file checked by the Payment File Doctor before download; rows with problems are left out and listed.

## Corporate Actions Checker
**Folder:** `solutions/corporate-actions-checker` · **Status:** live · **Input:** one row per event per source (custodian, vendors). **Output:** report and findings CSV.
**Checks:** ex, record and pay dates, rates, currencies, ratios, options, default option and mandatory/voluntary flag that differ between sources (format differences ignored); missing values; impossible date order; ISIN check digit; voluntary events with no deadline, a passed deadline, one within three business days, or a source deadline after the market deadline.
**Benchmark:** 887 notices for 360 events; 100% of injected problems found, 0 of 201 clean events flagged.

## Vendor Master Cleanup
**Folder:** `solutions/vendor-master-cleanup` · **Status:** live · **Input:** a vendor master export. **Output:** report and findings CSV.
**Checks:** suppliers set up more than once (names compared word by word without legal forms; joined by same country, bank account or VAT number), bank accounts shared by different suppliers, IBAN check digits and country, BIC format and country, VAT formats for 31 countries and Indian GSTIN, missing name, bank account, country and tax ID.
**Benchmark:** 1908 records; 100% of injected problems found, 0 of 1440 clean records flagged.

## Returns and Rejects Triage
**Folder:** `solutions/payment-returns-triage` · **Status:** live · **Input:** pain.002, pacs.002, pacs.004 or a CSV with a reason code column. **Output:** report and CSV.
About 50 ISO 20022 reason codes explained in plain English, grouped into root causes, with who acts and the data fix; beneficiaries returned more than once listed separately.
**Benchmark:** 748 returns in five formats, all read correctly.

## Data Quality Scorecard
**Folder:** `solutions/data-quality-scorecard` · **Status:** live · **Input:** any CSV. **Output:** scorecard report and per-column CSV.
Column types recognised automatically (IBAN, BIC, LEI, ISIN, currency, country, date, email, amount, identifier); completeness, validity with check digits and real dates, uniqueness of identifiers and rows, consistency of style, and IBAN/country/BIC cross-checks.
**Benchmark:** 3060 rows across six tables; every injected defect counted exactly.
