# Hyniqe Engine

The agent runtime behind [Hyniqe Hub](../README.md): a team of AI agents with roles, a task board, budgets, heartbeats and human approvals, plus a tamper-evident record of every change. It is built for regulated finance operations, where a bank or corporate has to be able to show an auditor *why* each change was made.

The first team template, **Payment Data Ops**, fixes vendor and beneficiary address data at the source for structured payment addresses (ISO 20022 PostalAddress24, CBPR+) and sends anything uncertain to a person. Its rules also power the stand-alone [Payment Data Repair](../solutions/payment-data-repair/) solution and the Hub website. Licensed under AGPL-3.0 (see [LICENSING.md](../LICENSING.md)); a commercial license is available.

```
                 ┌───────────────────────────┐
                 │  The board (you)          │  approves anything uncertain,
                 └─────────────┬─────────────┘  client-facing or rule-changing
                 ┌─────────────┴─────────────┐
                 │ Orin · Head of Payment    │  plans, delegates, writes the
                 │        Data Ops (CEO)     │  board report
                 └─────────────┬─────────────┘
   ┌───────────┬───────────────┼──────────────┬──────────────┐
 Nivi        Esha            Karo           Turbo          Dex
 Data        Address         Payments       Vendor         Validation
 Quality     Repair          Controls       Outreach       Rule Engineer
 Profiler    Analyst         Reviewer       Coordinator    (the "dev" agent)
```

## What a run does

1. **Ingest.** The board hands over a vendor master extract (CSV). Orin splits it into batches and assigns them.
2. **Profile.** Nivi sorts records into *already structured*, *fields present but invalid* (e.g. `Deutschland`, `UK`) and *free text*.
3. **Repair.** Esha converts each address into PostalAddress24 fields (`StrtNm`, `BldgNb`, `PstCd`, `TwnNm`, `CtrySubDvsn`, `Ctry`, `AdrLine`…) with a confidence score and written evidence. Anything below 0.8 confidence, or ambiguous (e.g. "London" with no country), goes to a human. Addresses with no town or country are marked *missing data*.
4. **Controls.** Karo cross-checks the address country against the IBAN and BIC country, and validates the IBAN checksum. Mismatches go to a human.
5. **Outreach.** Turbo drafts one email per data owner listing the vendors with missing data. Nothing is sent without approval.
6. **Prevent.** Dex turns recurring defects into validation rules (e.g. *country must be an ISO code*). Once approved, they are enforced at vendor onboarding through the gate (`POST /api/validate`).
7. **Report.** Orin writes the board report and rewrites it whenever your decisions change the picture.

On the 240-record sample: compliance goes **22.9% → 85.4%** with no human input, with 156 records repaired automatically. After one simulated board session (rules and outreach approved, ambiguous towns confirmed) it reaches 86.3%. Twenty bank/address country mismatches are deliberately left for a person to judge.

## Engine features

| Concept | Where |
|---|---|
| Companies, org chart, agents with titles and reporting lines | `src/engine.ts` (`createCompany`) |
| Task board with **atomic checkout** (single `UPDATE … RETURNING`; two agents can never take the same task) | `Engine.checkout` |
| **Per-agent budgets** in credits; an agent pauses when exhausted and asks the board for more | `Engine.charge` |
| **Heartbeats**: agents wake on a schedule, managers plan, workers pull tasks | `Engine.tick` |
| **Human approvals** with typed handlers | `Engine.requestApproval` / `decide` |
| **Hash-chained audit log** (SHA-256); editing any past entry breaks verification | `src/audit.ts` |
| Pluggable skills per role | `src/skills/payment-data-ops.ts` |

There are no runtime dependencies. It runs on Node ≥ 22.18 (built-in SQLite and TypeScript type stripping).

## Quick start

From the `engine/` folder of the Hyniqe repo:

```bash
cd engine
npm start                 # generates the sample data, then the live dashboard at http://localhost:4317
npm run demo              # headless run → out/report.html, state.json, structured_addresses.csv
npm run demo:board        # same, plus a simulated first board session
npm test                  # 34 unit, end-to-end and report tests
npm run benchmark         # accuracy benchmark with quality gates
npm run healthcheck:sample # client-ready Health Check report (HTML + PDF) for the sample data
npm install && npm run typecheck
```

In the dashboard, click **Hand over the sample vendor master**, watch the team work, then approve or reject decisions on the right. Try the onboarding gate after activating some rules.

### Your own data

CSV columns: `vendor_id`, `name`, and either `address_text` **or** `street`, `building`, `postcode`, `town`, `country`. Optional: `iban`, `bic`, `owner`. **Use synthetic or anonymised data only.** There is no authentication yet.

### Optional: Claude for unresolved addresses

Set `ANTHROPIC_API_KEY` (see `.env.example`). The Repair Analyst will then ask Claude about addresses the rules cannot resolve. AI suggestions are capped below the auto-accept threshold, so **they always go to a human**. Each call costs the agent 25 credits from its budget.

## Payment Data Health Check (the paid entry product)

Run the agent team on a client's (anonymised) vendor master and hand them a report:

```bash
node scripts/healthcheck.ts --input vendors.csv --client "Acme Ltd" --out out/acme \
  --benchmark out/benchmark-holdout.json --pdf
```

You get `health-check.html` (and `health-check.pdf` when Chrome or Chromium is installed), `structured_addresses.csv` with every record before and after, and `state.json` with the full run. The report covers readiness before and after, root causes, readiness by country, the decisions the client must take, vendors missing data (grouped by owner), example repairs, recommended prevention rules, and the method with the audit seal (the head hash of the audit chain). The live server serves the same report at `/api/healthcheck.html?client=Acme%20Ltd`.

## Accuracy benchmark

`scripts/benchmark.ts` builds labelled addresses from real places written the messy ways vendor masters contain them (upper case, "Attn:" lines, missing country or postcode, ISO3 codes, local country names, single-line text, units and floors), runs each through the same parser and decision rule the Repair Analyst uses, and reports:

- **auto-accept rate**: how much needs no human;
- **auto-accept precision**: of those, how many have country, town and postcode all right;
- **silent-error rate**: wrong but auto-accepted. This is the number that matters to a bank.

Two sets: `bench/cities.ts` (113 places, 34 countries, used while tuning) and `bench/holdout.ts` (42 places, 32 countries). CI gates precision at 99% on the tuning set and 95% on the holdout set, and also runs both against the full GeoNames city list.

| Run | Auto-accepted | Precision | Silent errors |
|---|---|---|---|
| Tuning set, first run | 52.4% | 97.8% | 1.2% |
| Holdout, first blind run | 58.6% | 96.3% | 2.1% |
| Both sets after fixes | ~58% | 100% | 0% |

Every silent error found came from a general bug (a town read out of a street name such as "Colombo Street" or "Calle Santiago", a missing postcode format, a town/postcode country conflict, or a junk town in single-line text), and each was fixed with a general rule. **The holdout is no longer blind after those fixes, so the honest estimate for unseen data is the first blind run: about 96% precision and 2% silent errors.** Measure again on anonymised client data before quoting accuracy to a buyer.

With GeoNames (`HYNIQE_GEONAMES=/path/to/cities15000.txt`), towns outside the built-in list are recognised. A country guessed only from a GeoNames town name always goes to a human, because the world list contains everyday words ("Riverside", "Sale").

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/state` | Full company snapshot (agents, tasks, records, approvals, rules, audit) |
| POST | `/api/load-sample` | Hand the sample vendor master to the team |
| POST | `/api/upload` | Hand over your own CSV (request body = CSV text) |
| POST | `/api/approvals/:id` | `{ "decision": "approved" \| "rejected", "note": "…" }` |
| POST | `/api/validate` | Onboarding gate: check one vendor against active rules |
| GET | `/api/export.csv` | Structured addresses, ready to load back into the ERP |
| GET | `/api/healthcheck.html?client=Name` | The client-ready Health Check report for the current run |
| POST | `/api/reset` | Start over |

## CI/CD

The workflows live at the repo root (`.github/workflows/`) and run inside `engine/`.

- **`ci.yml`** runs on every push to `main` and every PR. The `hub` job tests and benchmarks the solutions and builds the website; the engine job runs on Node 22 and 24: type check, tests, the accuracy benchmark with quality gates, a full agent-team run, and on Node 22 the GeoNames benchmark and a sample Health Check (HTML + PDF). Results appear on the job page; the dashboard snapshot, benchmark results and Health Check are uploaded as an artifact.
- **`pages.yml`** builds and publishes the Hyniqe Hub website to GitHub Pages on every push to `main`. One-time setup: *Settings → Pages → Source: GitHub Actions* (free for public repositories).

## Known limits (honest list)

- The built-in gazetteer covers about 150 commercial cities; GeoNames extends it (CI downloads it). [Swift's open-source address structuring model](https://www.swift.com/standards/iso-20022/iso-20022-faqs/swift-ai-address-structuring-model) could be added behind `parseAddress` as a second opinion.
- The sample data is synthetic. Accuracy on real vendor masters needs measuring on an anonymised pilot set.
- State is in memory by default (`HYNIQE_DB=data/hyniqe.db` to persist). Single process; no auth or multi-tenant isolation yet.
- Outreach emails are drafted and approved but not sent (hand-off point for an email connector).
- The Claude path is unit-tested with a mocked API; it has not been run against the live API in this repo's tests.
- Analyst time saved assumes 6 minutes per manual repair, and the dashboard labels it as an assumption.

## Roadmap

1. Accuracy benchmark on anonymised real client data; Swift's address model as a second opinion.
2. Auth, Postgres, multi-tenant workspaces (reusing the Hyniqe front-end's workspace/agency model).
3. ERP connectors (SAP, Oracle, NetSuite vendor master), with write-back after approval.
4. More team templates: SSI maintenance with counterparty outreach, and payment exceptions and investigations.
