# Hyniqe

A company of AI agents that fixes payment data at the source for ISO 20022, with human approvals and a tamper-evident audit trail.

The board (you) oversees an agent team: a Head of Payment Data Ops (the CEO agent) who plans and delegates, a profiler, an address repair analyst, a payments controls reviewer, a vendor outreach coordinator and a validation rule engineer. Anything uncertain, client-facing or rule-changing comes to you for a decision.

## Repository layout

| Path | What's there |
|---|---|
| [`engine/`](engine/) | The agent engine, the Payment Data Ops company template, the live dashboard and the tests. Start with [`engine/README.md`](engine/README.md). |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | The pipeline: type check, 28 tests and a full agent-company run on Node 22 and 24, on every PR and push to `main`. |

## Quick start

```bash
cd engine
npm start      # live dashboard at http://localhost:4317
npm test       # unit and end-to-end tests
npm run demo   # headless run → out/report.html
```

Needs Node 22.18 or newer. The engine has no runtime dependencies.
