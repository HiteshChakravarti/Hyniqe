# Roadmap

Planned solutions, in rough priority order. Open or upvote a GitHub issue to tell us which one you need first.

| Solution | Problem | Status |
|---|---|---|
| Corporate actions notice checker | Event details differ between custodian and vendor notices; manual cleansing and interpretation is a large share of processing cost | Planned |
| Settlement fail predictor | Score pending instructions for fail risk on the intended settlement date and estimate the CSDR cash penalty | Planned |
| Vendor master cleanup | Suppliers that exist twice, missing tax IDs, bank accounts shared across unrelated vendors | Planned |
| Payment exception triage | Group returns and rejects by root cause and draft the fix | Planned |
| Verification of Payee readiness | Predict which beneficiary names will return a close match or no match | Planned |
| KYC document checker | List missing and expiring documents for each client file | Planned |
| Data quality rule builder | Turn recurring defects into validation rules at the point of entry | Planned |

## Principles for every new solution
1. Explainable: every flag states its reason and a suggested fix.
2. Measured: a labelled benchmark with quality gates in CI before it goes live.
3. Private by default: runs in the browser or on the user's own servers.
4. Plain inputs: a CSV export from the systems teams already have.
