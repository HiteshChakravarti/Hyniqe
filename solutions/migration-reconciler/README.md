# Migration Reconciler

**Prove the data in the new system is the data from the old one, with an evidence pack you can sign.**

Core banking and data migrations rarely fail on the target platform; they fail on the data. Records quietly go missing,
addresses get truncated, consent flags get lost, balances shift, and days and months get swapped. If that happens,
the institution can be non-compliant from day one. Meanwhile, reconciliation reports drown in "differences" that are
just new date or number formats.

Load the source extract (legacy) and the target extract (new system), say which column is the key, and map any renamed
columns. You get:

- **Record-level reconciliation:** counts, records missing in the target, extra records, duplicate keys on either side;
- **Control totals** for every numeric column;
- **Field-by-field results** that separate **real differences** (truncated, emptied, changed numbers, changed dates
  incl. day/month swaps, other changes) from **harmless ones** (date/number format, Y/N ↔ true/false, case, spacing,
  leading zeros in keys);
- a **verdict** (✅ RECONCILED / ❌ NOT RECONCILED), examples of each problem, a full differences CSV and a **sign-off block**.

Runs locally. Your customer data never leaves your machine.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Reconcile*.

**Command line** (Node 22+):

```bash
node cli.ts --source samples/legacy-customers.csv --target samples/new-core-customers.csv --key customer_id \
  --map "customer_id:cust_no,full_name:customer_name,address_line:address,postcode:post_code,date_of_birth:dob,balance:balance_amt,marketing_consent:consent_marketing" \
  --ignore-leading-zeros --ignore-case --out out/
```

Options: `--tolerance 0.01` for numeric rounding, `--ignore updated_at,load_id` for columns expected to differ, and
composite keys via `--key account,currency`.

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

A synthetic 10,000-customer migration (seeded) with injected defects (dropped, extra and duplicated records, truncated
addresses, lost consent flags, changed balances, swapped day/month, changed names) **and** harmless transformations
on every record (new date and number formats, Y/N → true/false, lower-case segments, leading zeros removed from keys).

| Check | Result |
| --- | --- |
| Defects found (precision / recall, 8 types) | **100% / 100%** on the first run |
| Harmless format changes wrongly reported | **0** |

The reconciliation rules are deterministic and the generator is ours. Real migrations bring transformations it doesn't
know (e.g. code-table remapping), and those show as "changed" until you map or ignore them.

## Limits

- Compares two extracts; it can't tell whether the extracts themselves are complete. Record their counts at the source.
- Day/month ambiguity: dates are read as day-first when written with slashes.
- Very large files (millions of rows) are better run from the command line than in the browser.

Part of [Hyniqe Hub](../../README.md).
