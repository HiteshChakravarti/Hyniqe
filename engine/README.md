# Hyniqe Engine: Payment Data Ops

A company of AI agents that fixes vendor and beneficiary address data **at the source** for ISO 20022 structured addresses (CBPR+), sends anything uncertain to a human, and keeps a tamper-evident record of every change.

It works like Paperclip (an org chart of agents, a task board, budgets, heartbeats and approvals), but it's built for one regulated job, where a bank or corporate has to be able to show an auditor *why* each change was made.

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
npm test                  # 28 unit + end-to-end tests
npm install && npm run typecheck
```

In the dashboard, click **Hand over the sample vendor master**, watch the team work, then approve or reject decisions on the right. Try the onboarding gate after activating some rules.

### Your own data

CSV columns: `vendor_id`, `name`, and either `address_text` **or** `street`, `building`, `postcode`, `town`, `country`. Optional: `iban`, `bic`, `owner`. **Use synthetic or anonymised data only.** There is no authentication yet.

### Optional: Claude for unresolved addresses

Set `ANTHROPIC_API_KEY` (see `.env.example`). The Repair Analyst will then ask Claude about addresses the rules cannot resolve. AI suggestions are capped below the auto-accept threshold, so **they always go to a human**. Each call costs the agent 25 credits from its budget.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/state` | Full company snapshot (agents, tasks, records, approvals, rules, audit) |
| POST | `/api/load-sample` | Hand the sample vendor master to the team |
| POST | `/api/upload` | Hand over your own CSV (request body = CSV text) |
| POST | `/api/approvals/:id` | `{ "decision": "approved" \| "rejected", "note": "…" }` |
| POST | `/api/validate` | Onboarding gate: check one vendor against active rules |
| GET | `/api/export.csv` | Structured addresses, ready to load back into the ERP |
| POST | `/api/reset` | Start over |

## CI/CD

The workflows live at the repo root (`.github/workflows/`) and run inside `engine/`.

- **`ci.yml`** runs on every push to `main` and every PR that touches `engine/`, on Node 22 and 24: type check, tests, a full agent-company run, a run summary on the job page, and the report, state and CSV uploaded as an artifact.
- **`pages.yml`** publishes the dashboard snapshot to GitHub Pages. It's manual for now (Actions tab → *Publish demo report* → *Run workflow*) because Pages on a private repo needs a paid GitHub plan. One-time setup: *Settings → Pages → Source: GitHub Actions*.

## Known limits (honest list)

- The built-in gazetteer covers about 150 commercial cities. Production should load GeoNames or plug in [Swift's open-source address structuring model](https://www.swift.com/standards/iso-20022/iso-20022-faqs/swift-ai-address-structuring-model) behind `parseAddress`.
- The sample data is synthetic. Accuracy on real vendor masters needs measuring on an anonymised pilot set.
- State is in memory by default (`HYNIQE_DB=data/hyniqe.db` to persist). Single process; no auth or multi-tenant isolation yet.
- Outreach emails are drafted and approved but not sent (hand-off point for an email connector).
- The Claude path is unit-tested with a mocked API; it has not been run against the live API in this repo's tests.
- Analyst time saved assumes 6 minutes per manual repair, and the dashboard labels it as an assumption.

## Roadmap

1. Swift address model and GeoNames behind the parser; accuracy benchmark on anonymised real data.
2. Auth, Postgres, multi-tenant workspaces (reusing the Hyniqe front-end's workspace/agency model).
3. ERP connectors (SAP, Oracle, NetSuite vendor master), with write-back after approval.
4. A second company template: exceptions and investigations (camt.110/111).
