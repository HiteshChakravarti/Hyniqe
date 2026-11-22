# Duplicate Payment Finder

Finds the same obligation paid twice, including the near-duplicates that exact-match ERP checks miss.

```bash
npm run duplicates -- payments.csv --client "My Company"
npm run duplicates -- --sample
node --disable-warning=ExperimentalWarning solutions/duplicate-payments/bench.ts
```

Options: `--out dir`, `--window days` (default 30) for same-supplier, same-amount payments under different references.

**Columns:** vendor name, amount, invoice number, payment date; optionally currency, vendor ID, IBAN or bank account, payment ID. Amounts like `1.234,56`, `1,234.56` and `(250.00)` are all understood.

| Confidence | Meaning |
|---|---|
| High | Same amount and the same or nearly the same invoice for one supplier, including a supplier set up twice in the vendor master |
| Medium | Same supplier and amount within the window, different references |
| Low (CSV only) | Same invoice with different amounts; round amounts repeated |

Recurring series (rent, subscriptions) are detected and excluded. Nothing is blocked automatically; every group lists its reasons.
