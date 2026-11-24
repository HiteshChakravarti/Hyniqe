# AI Use Register Generator

**Regulators want to know every place you use AI, how risky it is, and what evidence you hold. Start that list in minutes.**

Most banks can't answer "where do we use AI?" in one document. Use cases sit in spreadsheets, vendor contracts and
people's heads. This tool turns a rough inventory into a structured register:

- an **indicative risk tier** based on the EU AI Act's categories: *possibly prohibited*, *high-risk*, *review*,
  *transparency*, *minimal*;
- **other obligations** banks usually face for the same system: automated decisions about individuals, model risk
  management, third-party/outsourcing registers, personal data, and generative-AI controls;
- the **evidence** each use case needs, what's present, missing or out of date, and a **readiness %**;
- **P1/P2/P3 priorities** and the follow-up questions to ask each owner.

Runs locally. Nothing is uploaded.

## Run it

**In your browser (no install):** open [`web/index.html`](web/index.html) and click *Load sample* to try it. Everything runs locally in the page.

**From the command line** (Node 22+):

```bash
node cli.ts --template > my-ai-inventory.csv          # blank inventory with a hint row explaining each column
node cli.ts --inventory samples/ai-inventory.csv --out out/
```

Writes `ai-register.md` (summary + "what to fix first"), `ai-register.csv` (the register, ready for Excel) and
`ai-register.json`. Exit code `1` if anything is P1.

Only `name` and `description` are needed. Every other column (owner, vendor, users, decision, personal data, human
review, validation date, monitoring, bias testing, DPIA, transparency notice, vendor due diligence, documentation,
incident process, logging) makes the register sharper, and blanks show up as gaps.

## How classification works

Each use case's name and description are matched against concept patterns for the EU AI Act's prohibited practices
(e.g. emotion recognition of workers, social scoring, exploiting vulnerable people), high-risk areas (e.g. consumer
creditworthiness, life/health insurance pricing, employment decisions, remote biometric identification, education,
essential services) and transparency duties (chatbots, synthetic media). Built-in carve-outs: fraud detection isn't
treated as credit scoring, 1:1 face verification for login isn't biometric identification, and corporate credit ratings
aren't consumer credit.

**Safety net:** anything that makes or supports decisions about people but matches no known area is marked **REVIEW**,
never silently minimal.

## Benchmark (honest version)

| Set | Cases | Before fixes | After fixes | Dangerous misses* after |
| --- | --- | --- | --- | --- |
| Tuning set (written with the rules) | 50 | 100% | 100% | 0 |
| Held-out set (different wording) | 20 | **60%** | 100% (no longer blind) | 0 |
| Blind set (written after the fixes, run once) | 15 | **66.7%** | 86.7% | 0 |

\*Dangerous miss = a possibly-prohibited or high-risk use case reported as transparency or minimal.

The first blind runs showed that keyword rules miss differently-worded descriptions. The fixes broadened each concept and
added the REVIEW safety net; the remaining blind-set misses are on the cautious side (high-risk → review, review →
high-risk). Expect the same on your own wording: **the tier is a first pass for your compliance and legal team, not a
legal classification.** Labels are our indicative reading of the Act's categories. Check the current application date
of each obligation, as timelines have been subject to change.

Run: `node bench.ts` (tuning set), `node bench.ts holdout`, `node bench.ts blind` · Tests: `node --test test/*.test.ts`

## Limits

- Classifies from what you write. Vague descriptions give vague results; the follow-up questions help.
- Indicative only, and not legal advice. Sector rules (model risk, consumer duty, fair lending, data protection) vary by country.
- Doesn't discover AI you don't know about; pair it with a review of vendor contracts and software lists.

Part of [Hyniqe Hub](../../README.md).
