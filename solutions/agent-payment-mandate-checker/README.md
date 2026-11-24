# Agent Payment Mandate Checker

**When an AI agent pays a bill, can you prove who allowed it, within what limit, and why?**

Finance teams are starting to let AI agents pay invoices, book travel and buy software. Each agent should act under a
*mandate*: a written authority from a named human saying which payees, categories, currencies and amounts it may use,
and when a human must approve. This tool checks every payment an agent made against that mandate and tells you, in plain
English, which payments had no valid authority, which broke a limit, and where the audit trail has gaps.

Runs locally. Nothing is uploaded.

## What it checks

| Severity | Check |
| --- | --- |
| Critical → **BLOCK** | No mandate for the agent · mandate belongs to another agent · mandate expired / not yet valid · payee not allowed · blocked category · over per-payment limit · agent approved its own payment |
| High → **REVIEW** | Over approval threshold with no human approver · approval logged after the payment · daily or monthly cumulative limit exceeded · same-day payments split to stay under a limit · currency not allowed · record missing core fields |
| Medium → **REVIEW** | Category not on allowed list · too many payments in a day · possible duplicate (same payee, amount, currency within 24h) · outside allowed hours/days · no FX rate to check limits |
| Low (noted) | No purpose recorded · payment doesn't cite the mandate it relied on |

It also scores **audit-trail completeness**: the share of payments that carry id, time, agent, payee, amount, currency,
purpose, mandate reference and, where required, a timed human approval. Rejected, failed and reversed payments are kept in
the report but left out of limit totals.

## Inputs

**1. Mandates (JSON)**: one entry per agent authority.

```json
{
  "fx_rates": { "EUR": 1.08 },
  "mandates": [{
    "id": "M-AP-001", "agent_id": "ap-agent", "owner": "Finance Controller",
    "valid_from": "2026-11-01", "valid_to": "2027-01-31",
    "base_currency": "USD", "currencies": ["USD", "EUR"],
    "per_payment_limit": 5000, "daily_limit": 12000, "monthly_limit": 60000,
    "max_payments_per_day": 10, "human_approval_above": 2000,
    "allowed_payees": ["Acme Cloud Ltd"], "allowed_categories": ["software"], "blocked_categories": ["gift cards"],
    "allowed_hours": { "start": "08:00", "end": "19:00", "utc_offset_minutes": 0 }, "allowed_weekdays": [1,2,3,4,5]
  }]
}
```

Every field except `id` and `agent_id` is optional; checks only run for rules you set. `fx_rates` converts other
currencies into each mandate's base currency (1 unit = rate × base).

**2. Agent payment log (CSV)**: column names are matched loosely (`payee` / `beneficiary` / `vendor` all work):
`payment_id, timestamp, agent_id, mandate_id, payee, amount, currency, category, approved_by, approval_time, purpose, status`.

Payee names are compared ignoring case, punctuation and legal suffixes (`ACME Limited` = `Acme Ltd`).

## Run it

**In your browser (no install):** open [`web/index.html`](web/index.html) and click *Load sample* to try it. Everything runs locally in the page.

**From the command line** (Node 22+):

```bash
node cli.ts --mandates samples/mandates.json --payments samples/agent-payments.csv --out out/
```

Writes `mandate-check.md` (readable report), `mandate-check.csv` (one row per payment with verdict and rules) and
`mandate-check.json`. Exit code is `1` if any payment is BLOCK, so it can gate a pipeline.

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

2,000 synthetic agent payments, about 40% with one injected breach across 12 breach types (seeded, reproducible):

| | Precision | Recall |
| --- | --- | --- |
| All injected breach types | 100% | 100% |
| Clean-vs-flagged verdict | 100% accuracy | |

The rules are deterministic, so this shows they fire exactly as designed on synthetic data. It is not a measure of
real-world fraud detection. The two pattern rules (duplicate and split payments) are heuristics and will flag some
legitimate payments; treat them as review prompts.

## Limits

- Checks the payment log you give it. It does not connect to banks or agent platforms.
- Split-payment detection looks for 2+ same-day payments to one payee, each between 50% and 100% of a threshold, that
  together cross it.
- A control check, not legal or audit advice.

Part of [Hyniqe Hub](../../README.md).
