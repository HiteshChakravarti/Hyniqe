# Bank Reconciliation

Matches a bank statement against the cash ledger and explains everything that is left, so the difference adds up to the cent.

```bash
npm run reconcile -- statement.xml --ledger cash-ledger.csv
npm run reconcile -- --sample
```

**Statement:** camt.053 / camt.052, MT940 / MT942, or any bank CSV export (one signed amount column, or money in / money out columns; with or without a name column).
**Ledger:** a CSV of the bank account's entries from your accounting system (signed amount, or debit and credit columns). A ledger exported with the opposite sign is detected and flipped.

Matching runs in the order an accountant would:

1. Same reference and amount. References are read however the payer wrote them: `INV-10412`, `INV10412`, `Rechnung 10412`, `Facture N° 10412`, end-to-end IDs. Dates, IBANs and amounts in the text are ignored.
2. One payment covering several invoices, all referenced.
3. Several part payments for one invoice.
4. Same reference with a small difference: bank charges taken off or an exchange difference (up to 50.00 or 2%).
5. Same amount within 5 days, with the name deciding between candidates. When the bank file has no name column, the name is found in the text. Same amount with a different name is never matched.
6. One payment covering several open items of the same customer, without references, when the amounts add up exactly and only one combination fits.

When two entries fit equally well nothing is matched; both are shown next to the bank line. What is left is classified: bank charges and interest to post, unknown receipts and payments to investigate, receipts and payments still in transit.

The report proves the reconciliation: bank movements − ledger movements = open bank items − open ledger items + differences on matched items, with 0.00 unexplained.

**Benchmark** (`node solutions/bank-reconciliation/bench.ts`): 8 generated months, each in camt.053, MT940, CSV and CSV without names. Gate: at least 99% of bank lines reconciled exactly right, no wrong matches, no same-amount decoy taken, every in-transit ledger item left open, every reconciliation adding up.
