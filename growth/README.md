# Hyniqe Growth

**An AI digital marketing department.** A Marketing Lead agent and ten specialists plan, write, get approval, publish, capture leads and report every week. It works for companies **with no marketing team** (Autopilot) and for companies that **already have one** (Copilot).

Part of [Hyniqe](../README.md). Open source under AGPL-3.0 (see [LICENSING.md](../LICENSING.md)).

> **Status: working demo / skeleton (v0.1).** The weekly loop, agents, approval gate, content guard, lead scoring, health check, dashboard and audit log all work. Publishing connectors are **dry-run**: they record exactly what would go out. The generic webhook connector is live (see [Connectors](#connectors)).

## Run it

Needs Node.js 22.18 or later. Nothing to install.

```bash
cd growth
npm start            # dashboard at http://127.0.0.1:4400
npm run demo         # one full week for both demo companies, in the terminal
npm run check -- https://yourcompany.com   # marketing health check from the command line
npm test             # 16 tests
```

Two demo companies are loaded on first start:

| Company | Mode | What it shows |
|---|---|---|
| **Chai & Crumb**, a café in Pune | Autopilot | No marketing team. The agents run the week; the owner approves only risky items. Its website scores 24/100 ("Leaking leads"). |
| **Ledgerly**, a B2B SaaS | Copilot | A 3-person marketing team. Each agent's work goes to the person who owns that area. Its website scores 92/100. |

Press **Run week 1**, work through **Approvals**, click **Simulate this week's inbound leads**, then **Close week** to get the Friday report.

**Real copy instead of demo copy:** set `ANTHROPIC_API_KEY` (optionally `HYNIQE_MODEL`). Without a key every agent uses a built-in writer, so the whole product runs offline.

## How it works

```
Company onboarding (website, socials, goals, mode)
        │
Marketing health check ── scan → verdict → a fix for each leak, assigned to an agent
        │
Brand brain ── voice, audience, pains, offers, keywords, banned claims, learnings
        │
Marketing Lead (Nova) ── plans the week, briefs each specialist
        │
Specialists draft ── content · SEO · social · design · ads · email · SDR · web/CRO · reviews · analytics
        │
Content guard ── risky claims ("guaranteed", "#1", "best in town"), banned phrases,
        │        missing unsubscribe, no opt-out, ad budget over the limit
Approval gate
   ├─ Autopilot: auto, or the owner (by trust level: cautious / balanced / hands-off)
   └─ Copilot:   the teammate who owns that agent (can approve, edit, request changes, reassign)
        │
Connectors publish (dry-run, or your n8n / Make / Zapier webhook)
        │
Leads captured → scored A/B/C with reasons → routed → reply drafted (speed-to-lead)
        │
Analyst (Quinn) writes the Friday report → lessons go into the brand brain
        │
        └──▶ next Monday's plan starts from those lessons
```

### Rules that hold in every mode

- Internal work (plans, briefs, audits, reports) never needs approval.
- Anything the content guard flags is high risk and always needs a human.
- Spending above the weekly ad budget, and one-to-one outreach, always need a human.
- Nothing is published unless its status is `approved`. Every action is written to a hash-chained activity log that shows any later edit.
- A-grade leads always get a person. In Autopilot, B and C leads get the approved auto-reply within a minute.

## The team

| Agent | Role | Covers the job of |
|---|---|---|
| Nova | Head of Marketing | Strategist: weekly goal, focus and briefs |
| Mira | Content Writer | Blog posts and articles |
| Sol | SEO & AI Search | Keywords, on-page fixes, FAQ blocks AI assistants can quote |
| Kai | Social Media Manager | Three posts a week across your channels |
| Ivy | Designer & Video Editor | Creative pack: image and short-video prompts, sizes |
| Rex | Performance Marketer | Paid campaigns within budget, ad variants to test |
| Elle | Email & CRM | Newsletter and the new-lead follow-up sequence |
| Ash | Lead Gen / SDR | Personal first messages to ideal-customer accounts (B2B only) |
| Theo | Website & Conversion | Landing-page fixes from the health check, A/B tests |
| Ren | Reviews & Community | Review replies and review requests |
| Quinn | Marketing Analyst | Tracking check, Friday report, lessons |

## Code map

```
growth/
├── src/
│   ├── server.ts              local web server + JSON API
│   ├── demo.ts                seeds the two demo companies
│   ├── core/
│   │   ├── orchestrator.ts    the weekly loop: plan → create → guard → approve → publish → measure → learn
│   │   ├── approvals.ts       risk levels and who must approve, by mode and trust level
│   │   ├── brand-brain.ts     templates and the company's brand knowledge
│   │   ├── team.ts            Copilot teammates and which agents they own
│   │   ├── modes.ts           Autopilot / Copilot and trust levels explained
│   │   ├── audit.ts           hash-chained activity log
│   │   ├── llm.ts             Claude writer with offline fallback
│   │   ├── store.ts           one JSON file per company
│   │   └── types.ts
│   ├── agents/                one file per agent (index.ts lists them)
│   ├── checks/
│   │   ├── health-check.ts    marketing health check (19 rules in rules.json)
│   │   └── claims.ts          content guard
│   ├── leads/                 capture, scoring, routing, reply drafts
│   └── connectors/            dry-run publishers + live webhook
├── public/index.html          the dashboard (no build step)
├── templates/                 SaaS, local business, fintech, agency
├── data/demo/                 demo companies, websites and sample leads
├── scripts/                   terminal demo and health-check CLI
└── test/
```

## API

All JSON. The server listens on `127.0.0.1` only; set `GROWTH_HOST=0.0.0.0` to expose it and `GROWTH_TOKEN` to require `Authorization: Bearer <token>` on every call except lead capture.

| Method & path | What it does |
|---|---|
| `GET /api/meta` | Agents, templates, modes, trust levels, connectors |
| `GET/POST /api/companies` | List / create a company (`name, website, template, mode, ownerName, weeklyAdBudget`) |
| `GET /api/companies/:id` | Everything about one company |
| `POST /api/companies/:id/settings` | `mode`, `trust`, `weeklyAdBudget`, `goals` |
| `POST /api/companies/:id/brand` | Update the brand brain |
| `POST /api/companies/:id/health-check` | `{url}` or `{html}` |
| `POST /api/companies/:id/week/start` · `/week/close` | Run the week / write the Friday report |
| `POST /api/companies/:id/tasks/:tid/decision` | `{as, decision: approve\|reject\|changes, comment}` |
| `POST .../tasks/:tid/edit` · `/revise` · `/assign` · `/comment` | Edit copy, ask the agent to fix it, reassign, comment |
| `POST /api/companies/:id/leads` | **Lead capture** for forms, booking tools, ads (`name, email, company, title, source, message`) |
| `POST /api/companies/:id/leads/:lid/reply` | Record the reply |
| `POST /api/companies/:id/team` | Add a teammate (Copilot) |
| `GET /api/companies/:id/audit/verify` | Check the activity log has not been changed |

`as` is the person acting: `owner` or a teammate id. This demo has no login; put it behind your own auth before using it with a team.

## Connectors

| Connector | Status | Goes live with |
|---|---|---|
| Webhook (n8n / Make / Zapier) | **Live** when set | `GROWTH_WEBHOOK_URL`: every approved item is POSTed as JSON, so you can publish through tools you already use |
| WordPress, LinkedIn, Meta, X, ads platforms, email provider, Google Business Profile, HubSpot, GA4 | Dry-run | Each needs its platform's app review; the variable names are listed in the dashboard's Agents page |

## Roadmap

1. Live connectors: WordPress, email provider (Brevo/Mailchimp), LinkedIn and Meta posting, Google Business Profile reviews.
2. Real analytics in the Friday report from GA4 and ad platforms, replacing simulated numbers.
3. Prospect data for the SDR agent from a CSV, Apollo or Clay (never scraping).
4. Login and roles for teams; a hosted version.
5. Image and video generation for the design agent.
