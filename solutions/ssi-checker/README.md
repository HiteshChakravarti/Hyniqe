# SSI Checker

Finds the standing settlement instruction (SSI) defects that cause unmatched instructions and failed settlements, before the EU, UK and Swiss markets move to T+1 on 11 October 2027.

```bash
npm run ssi -- my-ssis.csv                              # check one file
npm run ssi -- my-ssis.csv --golden golden-source.csv   # also compare with a golden source
npm run ssi -- --sample                                 # try it on generated data
node --disable-warning=ExperimentalWarning solutions/ssi-checker/bench.ts   # benchmark
```

Options: `--client "Name"` for the report title, `--out dir`, `--max-age days` (default 365).

**Columns** (names are matched without regard to case or punctuation): counterparty, market (ISO country or name), currency, PSET BIC, settlement agent BIC, safekeeping account; optionally LEI, asset class, cash agent BIC, cash account or IBAN, last verified date, source or channel, SSI reference. See `COLUMNS` in `src/ssi.ts` for every accepted name.

**In code:**

```ts
import { checkSsis, compareSsis } from './src/ssi.ts';
const result = checkSsis(rows, { maxAgeDays: 365 });
const diff = compareSsis(rows, goldenRows);
```

**Reference data:** `src/csd.ts` lists the CSDs for the T+1 markets, the two ICSDs and the US. Verify it against your market data before production use. All test data is synthetic.
