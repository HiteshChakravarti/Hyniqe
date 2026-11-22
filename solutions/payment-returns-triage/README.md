# Returns and Rejects Triage

Explains every rejected or returned payment in plain English and groups them by root cause, with who has to act and what data to fix.

```bash
npm run returns -- status-report.xml
npm run returns -- returns.csv
npm run returns -- --sample
```

Reads pain.002 (versions 03 to 12), pacs.002 and pacs.004 files, or any CSV with a reason code column. Covers about 50 of the ISO 20022 status and return reason codes seen most often (AC01, AC04, AM04, BE04, RR03, MS03 and others). Beneficiaries returned more than once are listed separately, because their vendor master record is the thing to fix.
