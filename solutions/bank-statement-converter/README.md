# Bank Statement Converter

Turns camt.053 (and camt.052 / camt.054) XML statements and MT940 / MT942 files into one clean spreadsheet: date, amount, in or out, counterparty, account, reference, end-to-end ID, bank reference and the transaction type in plain words. Each statement is balance-checked: opening balance plus transactions must equal the closing balance, so a missing entry is caught.

```bash
npm run statement -- statement.xml
```

Field 86 in MT940 is read in the German (`?20`, `?32`) and SWIFT keyword (`/NAME/`, `/REMI/`) layouts; other layouts are kept as free text. The CSV opens directly in Excel.
