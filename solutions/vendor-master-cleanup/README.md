# Vendor Master Cleanup

Finds suppliers set up more than once, bank accounts shared by unrelated suppliers, invalid VAT numbers and missing details in a vendor master export.

```bash
npm run vendors -- vendors.csv
npm run vendors -- --sample
```

Columns are recognised by common names: vendor id, name, country (or a free-text address), IBAN, BIC and VAT or tax number.

Names are compared word by word after removing legal forms, case, accents and punctuation, so "REDWOD TEXTILES" matches "Redwood Textiles GmbH" but "Falcon Textiles" does not. Records are joined when the name matches in the same country, or a similar name shares a bank account or VAT number. A bank account used by suppliers with different names is listed separately, because that is how supplier fraud and undisclosed factoring look.
