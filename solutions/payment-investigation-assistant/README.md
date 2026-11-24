# Payment Investigation Assistant

**Paste a payment query. Get the case type, the key references, what's missing, the next steps and a draft reply.**

Payment investigations ("where's my money?", recalls, amendments, fee disputes) are still slow and manual: free-text
MT199s and emails, several back-and-forths per case, and a large industry-wide cost. From November 2026, Swift Case
Management's Stop and Recall service becomes mandatory for recalls.

This tool reads the message (an MT n99, an email or call notes) and gives the investigator:

- the **case type**: fraud recall, recall/cancellation, non-receipt, amendment, unable to apply, return, fees, status,
  request for information. Fraud is always marked **URGENT**;
- the **references**: UETR, amount and currency, dates, references, BICs (from SWIFT headers or context, so plain words
  aren't mistaken for bank codes), valid IBANs, beneficiary, charges option;
- a **checklist of missing information** to ask for;
- the **next steps** for that case type, e.g. "look up the UETR in the gpi tracker", "verify amendments through a trusted channel";
- a **draft reply** to the other bank.

Runs locally. Nothing is uploaded.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → paste a query or load a sample → *Analyse*.

**Command line** (Node 22+):

```bash
node cli.ts --file samples/mt199-non-receipt.txt
node cli.ts --text "URGENT - client fell for invoice fraud, GBP 125,000, UETR 8f2d…, please recall"
```

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

`bench/cases.txt` has 40 hand-written queries in varied wording (bank MT text, corporate emails, call notes), written
before the first run.

| Run | Case-type accuracy | Fraud recalls missed |
| --- | --- | --- |
| First run | **97.5%** (39/40) | 0 |
| After fixing the one miss ("paid this invoice twice") | 100% (no longer blind) | 0 |

## Limits

- Keyword-based classification; unusual wording falls back to "Unclear: needs triage".
- It doesn't connect to the gpi tracker or Case Management; it tells you what to do there.
- Always verify amendment and recall requests through a trusted channel before acting. Not legal advice.

Part of [Hyniqe Hub](../../README.md).
