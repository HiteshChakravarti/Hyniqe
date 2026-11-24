# T+1 Settlement Fail Predictor

**Europe, the UK and Switzerland move to T+1 settlement on 11 October 2027. Find the trades that would fail before they do.**

Under T+1, allocation, confirmation/affirmation, settlement instructions, SSIs and FX all have to be right **on trade
date**. There is no second day to chase. Load a trade blotter and your SSI file, and the tool flags every trade that would
likely fail, why, which counterparties cause the most trouble, and what to fix.

Runs locally. Nothing is uploaded.

## What it checks

| Severity | Check |
| --- | --- |
| High | Settlement date not T+1 (e.g. still T+2) · settlement on a weekend/holiday · no SSI for the counterparty/market/currency · SSI expired · SSI with invalid agent BIC or no account · allocation, affirmation or instruction not done on trade date / after cut-off · missing key trade data |
| Medium | Several SSIs match (no default) · trade executed late in the day · cash account in another currency (FX needed same day) · invalid ISIN |
| Low | SSI not re-verified in 12 months |

Trades dated before the go-live date are checked against T+2. Use `--assume-t1` to test today's blotter as if T+1 already applied.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Check trades*.

**Command line** (Node 22+):

```bash
node cli.ts --trades samples/trades.csv --ssis samples/ssis.csv --out out/
node cli.ts --trades today.csv --ssis ssis.csv --assume-t1 --holidays 2027-12-25,2027-12-26
```

Columns are matched loosely. Trades: `trade_id, trade_date, trade_time, settlement_date, isin, counterparty,
place_of_settlement, currency, account_currency, allocation_time, affirmation_time, instruction_time`. SSIs: `counterparty,
place_of_settlement, currency, agent_bic, account, valid_from, valid_to, last_verified`. Counterparty names are matched
ignoring legal suffixes ("Alpha Securities" = "Alpha Securities Ltd"). Times are read as market local time.

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

1,500 synthetic trades (seeded), ~45% with one injected problem across 12 types: **100% precision and recall** after
fixing a bug in the benchmark's own test data (the first run flagged SSIs as stale, correctly, because the synthetic
trades ran past the test SSIs' review date). The rules are deterministic, so this shows they fire as designed. It is not a
forecast of real settlement fails.

## Limits

- Uses your times and a simple weekend/holiday calendar. Check each CSD's and custodian's actual cut-offs.
- Doesn't see inventory or cash shortfalls, which also cause fails.
- Not operational or legal advice.

Part of [Hyniqe Hub](../../README.md).
