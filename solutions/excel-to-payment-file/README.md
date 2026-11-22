# Excel to Payment File

Turns a spreadsheet of payments (saved as CSV) into a SEPA credit transfer file your bank can import (pain.001 version 9).

```bash
npm run excel-to-payment -- payments.csv --name "Example Trading Ltd" --iban DE89370400440532013000 --date 2026-11-27
```

Columns: payee, IBAN, amount and reference; optionally BIC, a one-line address, or street, postcode, town and country. Amounts in either `1,234.56` or `1.234,56` style are understood. Every row is checked; rows with an invalid IBAN, amount or currency are left out and listed. Names and references are converted to the bank character set, one-line addresses are split when the town and country are certain, and the finished file is run through the Payment File Doctor before it is written.
