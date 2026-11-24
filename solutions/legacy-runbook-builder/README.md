# Legacy Runbook Builder

**When the person who "just knows" how a process works retires, the process shouldn't retire with them.**

Bank operations run on handover emails, old Word procedures, shell scripts, mainframe JCL and cron jobs that only a
few people understand. This tool reads that material and turns it into a draft runbook, and, more importantly, shows
the **knowledge gaps** that would hurt if those people left.

Give it any mix of: handover notes / emails / SOP text, shell or batch scripts, JCL, crontabs, SQL.

You get:

- **Steps** in order, with scripts and JCL translated into plain English ("Step STEP020: run program SORT, runs only if
  earlier steps ended with code 4 or lower"; "Delete /data/payments/outbound/*.fin").
- **Schedule and cut-offs**: times, EOD, month-end, and cron schedules decoded ("Mon–Fri at 06:15").
- **Systems, servers and files** it depends on.
- **People it depends on**: "ask Raj", "only Maria knows".
- **Knowledge gaps**: vague checks ("looks ok", "as usual"), single-person dependencies, passwords in documents
  (masked in every output), hard-coded servers, destructive commands, manual spreadsheets and macros, TODOs and
  workarounds, end-of-life technology, no failure path, no owner, no schedule, unexplained acronyms.
- A **documentation completeness score**, a **checklist of questions for the process owner**, and a glossary with
  common banking terms filled in.
- An **AI prompt** (secrets masked) you can paste into Claude to turn the draft into polished prose without inventing facts.

Runs locally. Nothing is uploaded.

## Run it

**In your browser (no install):** open [`web/index.html`](web/index.html) and click *Load sample* to try it. Everything runs locally in the page.

**From the command line** (Node 22+):

```bash
node cli.ts samples --title "Payments ops" --out out/   # writes runbook.md, knowledge-gaps.csv, runbook.json, ai-prompt.txt
node cli.ts samples --prompt                             # print the AI prompt
```

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

`bench/gaps.txt` has 44 procedure lines labelled with the gaps a reviewer would flag, including 14 well-written lines
that should raise nothing. It was written before the first run.

| Run | Precision | Recall | Clean lines with no false gap |
| --- | --- | --- | --- |
| First run | 96.4% | 90.0% | 14 / 14 |
| After fixing the 4 issues it found (sentence-initial "Call/Wait for <name>", `sqlplus user/pass@db`, "usually does" read as vague) | 100% | 100% | 14 / 14 |

The second row is no longer a blind test. Real documents are messier; expect to edit the draft.

## Limits

- Extraction is rule-based. It finds structure and gaps; it doesn't understand the business logic. Every step must be
  confirmed with the current owner.
- Person-name detection relies on capitalised names after phrases like "ask", "call", "only… knows".
- It reads text files. Convert Word/PDF procedures to text first.

Part of [Hyniqe Hub](../../README.md).
