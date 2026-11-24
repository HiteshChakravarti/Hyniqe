# VoP Pre-Checker (Verification of Payee)

**Find the payments your bank will flag as "close match" or "no match" before you send the file.**

Since 9 October 2025, banks in the euro area must check, before every SEPA transfer, that the payee name matches the
account (IBAN). Banks outside the euro area in the EEA must follow by 9 July 2027. Real names rarely match neatly:
trading names, missing "GmbH", accents, typos, "c/o" text. Bulk payment files then come back full of warnings that someone
has to resolve, or payments go out with the payer carrying the risk.

Load your payment file, and ideally your supplier master with the account-holder names. You get a predicted result for
every payment, the reason, and the exact fix.

Runs locally. Nothing is uploaded.

## What it predicts

| Prediction | When |
| --- | --- |
| ⛔ Will be rejected | IBAN invalid (wrong length or check digits) |
| 🔴 Likely no match | Name differs from the account holder's name on file |
| 🟠 Likely close match | Same name but a different legal form, word order, accents/typo, or a trading name instead of the legal name |
| 🟢 Match | Same name ignoring case, accents and punctuation |
| ⚪ Unknown | IBAN not in your supplier master. Ask the supplier for the exact account-holder name |
| ➖ Not in VoP scope | Non-SEPA account |

It also warns about names over SEPA's 70-character limit, characters outside the basic SEPA set, "c/o"/"attn"/"account"
text, one IBAN paid under several names, and possible duplicate payments.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Check payments*.

**Command line** (Node 22+):

```bash
node cli.ts --payments samples/payments.csv --master samples/supplier-master.csv --out out/
```

Payments: `payee_name, iban, amount` (+ optional `reference`). Master: `iban, account_holder_name, trading_names`
(trading names separated by `;`).

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

1,200 name variants built from 60 realistic European company names, labelled by how each was changed:

| Change | Correct |
| --- | --- |
| Exact, case, accents, legal form, word order, trading name, different company | 100% |
| 1–2 letter typo | 82.3%. Missed typos are reported as "no match" rather than "close match" |
| **Overall** | **97.7%** |
| Different company predicted as MATCH (the dangerous error) | **0** |

Labels follow common VoP practice. **Every bank uses its own matching algorithm and thresholds**, so treat the result as
a prediction to fix your data, not as the bank's answer.

## Limits

- Without a supplier master it can only check IBANs and data quality, not predict name matches.
- Doesn't call any bank or VoP service.
- Not legal advice.

Part of [Hyniqe Hub](../../README.md).
