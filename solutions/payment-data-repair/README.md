# Payment Data Repair

Turns free-text vendor and beneficiary addresses into structured fields (street, building number, postcode, town, region, country) for structured-address payment messages, and checks that bank account, BIC and address countries agree.

```bash
npm run repair -- vendors.csv --client "My Company"
```

The rules live in `engine/src/address/` and are shared with the agent team in `engine/`, which adds approvals, outreach to vendors for missing data, onboarding rules and a tamper-evident audit trail (`cd engine && npm run healthcheck:sample`).

**Columns:** name and either a full address (`address_text`, `address`) or split fields (`street`, `building`, `postcode`, `town` or `city`, `country`); optionally IBAN, BIC, ID.

A record is repaired automatically only at 80% confidence or above with no open issue. Everything else goes to review or is marked as missing data, never guessed. Benchmark: `cd engine && npm run benchmark`.
