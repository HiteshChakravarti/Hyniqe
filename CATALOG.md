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
