# Verify-Before-You-Pay

**A familiar voice or face on a call is no longer proof. Check before you pay.**

Criminals now clone executives' voices and faces to ask finance staff for urgent transfers, and fake supplier emails
to redirect invoices. This tool helps finance teams catch those requests and prove they checked properly.

It works in two ways:

1. **Check one request**: paste the email or message (and, if you know them, who sent it, their title and the channel).
   You get a red/amber/green risk level, the warning signs it found, the checks your policy requires, a **callback script**
   and **challenge questions**.
2. **Audit an approval log**: load a CSV of past payment requests and what was done about them. It shows which requests
   skipped a required check and which risky payments went out unverified, so you can start a recall.

Runs locally. Nothing is uploaded.

## What it looks for

- **Pressure language**: urgency, secrecy, "skip the usual process", "I can't take calls", acquisition or regulator stories.
- **Money going somewhere new**: new payee, changed bank details (and how recently), gift cards or crypto.
- **Fakeable channels**: senior people asking by voice, video, Teams/Zoom, WhatsApp or SMS; executives on personal webmail.
- **Lookalike senders**: `g1obex.com`, `acrne.com` (rn → m), `acme.co` for `acme.com`, `acme-payments.com`.
- **Context**: large or round amounts, out-of-hours requests, and the classic combination of pressure plus new destination.

## Checks it enforces (configurable)

| Check | Required when |
| --- | --- |
| Callback to a number from **your own records** | Amount ≥ 10,000 · bank details changed · new payee · senior request by voice/video/chat · high or critical risk |
| Challenge (code word or private question) | Senior request by voice, video or chat app |
| Two different approvers | Amount ≥ 25,000 or critical risk |
| Segregation of duties | Always: requester, approvers and releaser should be different people |
| Cooling-off after bank change | Bank details changed (default 24h before first payment) |
| Never gift cards / crypto | Always |

Override any setting with `--policy policy.json`, for example
`{"callback_above": 5000, "dual_approval_above": 20000, "bank_change_cooling_hours": 48}`. Pass your own and key suppliers'
domains with `--domains` so lookalikes can be caught.

## Run it

**In your browser (no install):** open [`web/index.html`](web/index.html) and click *Load sample* to try it. Everything runs locally in the page.

**From the command line** (Node 22+):

```bash
# one pasted request
node cli.ts --domains acme.com --from "John Smith" --title CEO --channel whatsapp \
  --text "Need \$48,500 sent today for a confidential acquisition. Can't talk, in a board meeting."

# audit a log
node cli.ts --log samples/approval-log.csv --domains northwind-demo.com,globex-logistics.com --out out/
```

Log columns (matched loosely): `request_id, received_at, requested_by, requester_title, channel, sender, amount, currency,
payee, payee_new, bank_details_changed, bank_change_at, message, callback_done, callback_source, callback_by,
challenge_passed, approver_1, approver_2, released_by, paid_at, outcome`.

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

3,000 synthetic requests (seeded), 627 of them impersonation attempts built from realistic message fragments. Legitimate
requests sometimes carry warning signs and attacks sometimes hide them.

| Flag = HIGH or CRITICAL | Result |
| --- | --- |
| Attacks caught (recall) | 99.0% |
| Precision | 91.1% |
| Legitimate requests held for checking | 2.6% |

Synthetic data is cleaner than real life. Real attackers adapt, so treat the score as a prompt to verify, never as proof
a request is genuine. **A LOW score does not mean "safe to skip your process".**

## Limits

- It cannot detect a deepfake from audio or video. It checks the *request* and the *process* around it.
- A compromised real mailbox shows as "trusted domain"; the content and process checks still apply.
- Not legal advice. If money has left for a suspected scam, call your bank immediately to request a recall.

Part of [Hyniqe Hub](../../README.md).
