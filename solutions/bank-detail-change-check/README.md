# Bank Detail Change Check

Checks a payment run before you release it: every payee's bank account is compared with the details you already trust (a vendor master export or earlier payment runs). It flags the patterns behind payment-redirection fraud.

```bash
npm run bank-check -- payment-run.csv --trusted vendor-master-or-history.csv
npm run bank-check -- --sample
```

Flags, by risk:
- **Stop:** account changed since the last trusted payment, new account in a different country, paying a supplier into another supplier's account, a large first payment to a new payee, an invalid IBAN, a missing account.
- **Check:** new payee, bank details changed in the last 30 days, an amount far above anything paid to that payee before, one account used for several payees in the run.

Payees are matched by ID, or by name when there is no ID, ignoring legal forms, case and punctuation. Spaced or lower-case IBANs are treated as the same account.
