# Corporate Actions Checker

Compares the same corporate action event as reported by several sources (custodians, data vendors) and lists every disagreement before you process it.

```bash
npm run corporate-actions -- notices.csv
npm run corporate-actions -- --sample
```

One row per event per source. Columns: source, ISIN, event type (DVCA, SPLF, TEND, RHTS...), ex date, record date, pay date; optionally rate, currency, ratio, options, default option, mandatory/voluntary flag, election deadline and market deadline.

It flags: dates, rates, currencies, ratios, options and flags that differ between sources (ignoring format differences), missing values, ex/record/pay dates in an impossible order, invalid ISINs, voluntary events with no deadline, deadlines that have passed or are within three business days, and source deadlines later than the market deadline.
