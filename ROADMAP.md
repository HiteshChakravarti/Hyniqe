# Roadmap

Planned solutions, in rough priority order. Open or upvote a GitHub issue to tell us which one you need first.

| Solution | Problem | Status |
|---|---|---|
| Settlement fail predictor | Score pending instructions for fail risk on the intended settlement date and estimate the CSDR cash penalty | Planned |
| CSDR penalty estimator | Estimate cash penalties for failing settlement instructions from the official ESMA reference rates | Needs the official rate tables first |
| LEI status checker | Lapsed or retired LEIs in counterparty data | Needs a live GLEIF lookup, which conflicts with nothing-uploaded; planned as an optional download |
| Verification of Payee readiness | Predict which beneficiary names will return a close match or no match | Later: many banks already offer this |
| KYC document checker | List missing and expiring documents for each client file | Later |

## Principles for every new solution
1. Explainable: every flag states its reason and a suggested fix.
2. Measured: a labelled benchmark with quality gates in CI before it goes live.
3. Private by default: runs in the browser or on the user's own servers.
4. Plain inputs: a CSV export from the systems teams already have.
