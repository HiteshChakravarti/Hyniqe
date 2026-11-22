# Data Quality Scorecard

Profiles any CSV for completeness, validity, uniqueness and consistency, and gives a score out of 100.

```bash
npm run scorecard -- table.csv
npm run scorecard -- --sample
```

Column types are recognised from names and values: IBAN, BIC, LEI, ISIN, currency, country, date, email, amount, number, identifier and text. Validity uses the real rules (IBAN, LEI and ISIN check digits, calendar dates, ISO 4217 and ISO 3166 codes). Consistency flags values written in a different style from the rest of the column (dates in two formats, lower-case codes, extra spaces, decimal commas). Across columns, the IBAN country is checked against the country column and the BIC.
