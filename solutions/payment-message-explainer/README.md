# Payment Message Explainer

Paste an MT103 or a pacs.008 and get it in plain English: who pays whom, how much, through which banks and who pays the charges. Every field is listed with its MT tag, its pacs.008 equivalent and what it means.

```bash
npm run explain -- message.txt
npm run explain -- pacs008.xml
```

It also checks the message (mandatory fields, BIC format, IBAN check digits, the 71A BEN / 71F rule, missing UETR, missing exchange rate) and, for the November 2026 CBPR+ change, whether the payer and beneficiary addresses carry town and country in their own fields. Free-text addresses are turned into structured ones where the town and country can be found with confidence, keeping the town as written.

The same payment is produced in the other format: MT103 to pacs.008 (CBPR+ style, with the structured addresses) and pacs.008 to MT103 (with 50F/59F where the address is structured, and warnings where names or characters do not fit MT).
