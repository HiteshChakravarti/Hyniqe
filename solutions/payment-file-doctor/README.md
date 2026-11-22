# Payment File Doctor

Your bank rejected the payment file. This explains why in plain English and gives you a corrected file.

```bash
npm run doctor -- payments.xml              # writes payments-fixed.xml, a report and a findings CSV to out/
npm run doctor -- payments.xml --version 03 # keep version 3 if your bank still asks for it
npm run doctor -- --sample
```

**It fixes automatically:** version 3 to version 9 (namespace, execution date, BIC fields), header counts and control totals, IBANs with spaces, characters outside the SEPA character set (é becomes e, & becomes +), names and references over the length limit, SEPA charge bearer, and one-line addresses, which are split into street, number, postcode, town and country with the Hub's address rules when the town and country are identified with confidence.

**It reports but does not guess:** IBANs that fail their check digits, invalid BICs, missing amounts or names, non-euro SEPA payments, duplicate references, past or weekend dates, and addresses it cannot split safely.

Your bank may have extra rules of its own: test the corrected file before a large run. Supports credit transfer files (pain.001); direct debits (pain.008) are not supported yet.
