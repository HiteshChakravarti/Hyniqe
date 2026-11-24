# DORA Register Pre-Check

**Catch the errors that get your DORA Register of Information rejected, before you submit.**

Under DORA, EU financial entities must keep and submit a Register of Information on all their ICT third-party
arrangements. The 2025 and 2026 submission cycles showed the same story everywhere: data-quality and validation errors,
resubmissions, and late filers. Most firms build the register in a spreadsheet before converting it to the official
xBRL-CSV format, and that's the point where errors are cheapest to fix.

Load your working register (one row per contractual arrangement). The tool checks:

| Area | Checks |
| --- | --- |
| Identifiers | Entity and provider LEIs (real ISO 17442 check digits), EUID format, identifier type stated and consistent |
| Codes & formats | Countries (ISO 3166: "UK" is wrong, "GB" is right), currencies (ISO 4217), dates in YYYY-MM-DD, numeric notice periods and costs |
| Logic | End before start, arrangements that ended before the reporting year, data stored but no storage location, cost without currency |
| Structure | Mandatory fields, duplicate arrangement references, subcontracting links pointing to arrangements that don't exist |
| Consistency | Same provider with different names/countries, or same name with different identifiers |
| Critical or important functions | Missing substitutability assessment, exit plan, reintegration possibility, notice period, data location or governing law. No exit plan is warned |

Runs locally. Nothing is uploaded.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Check register*.

**Command line** (Node 22+):

```bash
node cli.ts --register samples/register.csv --reference-date 2026-12-31 --out out/
```

Columns (matched loosely): `arrangement_ref, entity_lei, provider_name, provider_id, provider_id_type, provider_country,
subcontractor_of, ict_service_type, function_name, function_critical, start_date, end_date, notice_period_entity,
notice_period_provider, governing_law_country, data_location_country, stores_data, substitutability, exit_plan,
reintegration_possible, annual_cost, currency, intra_group`.

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

2,000 synthetic arrangements (seeded), ~45% with one injected error across 12 types, scored per row:

| Run | Precision | Recall |
| --- | --- | --- |
| First run | 99.3% | 99.5% |
| After correcting the benchmark's own labels | 100% | 100% |

All 12 first-run differences were correct detections. Changing one row's reference had broken later rows' links, and a
"duplicate" copied from an already-changed row wasn't a duplicate. The benchmark now derives those labels properly.

## Limits

- **This is a pre-check on your working register, not the official validation.** It doesn't produce or validate the
  xBRL-CSV templates; run the ESAs' / your authority's validation rules on the converted files too.
- Doesn't check LEIs against the GLEIF database (only the check digits) or whether the LEI is active.
- Not legal or regulatory advice.

Part of [Hyniqe Hub](../../README.md).
