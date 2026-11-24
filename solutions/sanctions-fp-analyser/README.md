# Sanctions False-Positive Analyser

**85–95% of sanctions alerts are false positives, and each takes 20–60 minutes to clear. Find out exactly why yours happen.**

Sanctions screening teams spend most of their time clearing alerts that were never real. That's expensive, it buries
the real hits, and supervisors increasingly examine how firms *manage* false positives, not just whether they screen.

Load an export of closed alerts and the tool explains what's driving the noise:

- **Repeat pairs:** the same customer cleared against the same list entry again and again (good-guy candidates, with a CSV);
- **Field hits:** address, town or free-text fields matching place names or name fragments;
- **Weak tokens:** alerts caused by one short or very common word ("Ali", "Kim", "Trading");
- **Score bands** full of false positives and no true matches;
- **Message types** such as statements (MT950/camt.053) generating noise;
- **No alert memory:** customers re-alerted after being cleared.

For each driver: how many false positives, analyst hours, and **what to test**.

**Safety rule:** any group that contains even one true match is marked "⚠️ No: contains true matches" and is never
offered as a good-guy candidate. The tool never clears or suppresses anything itself.

Runs locally. Nothing is uploaded, which matters, because alert data is sensitive.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → *Load sample* → *Analyse*.

**Command line** (Node 22+):

```bash
node cli.ts --alerts samples/alerts.csv --out out/      # writes fp-analysis.md and good-guy-candidates.csv
```

Columns (matched loosely): `alert_id, created_at, screened_name, matched_name, list, match_score, matched_field,
message_type, disposition, handling_minutes, customer_id`. Dispositions like "False positive", "Cleared – no match",
"True match", "Escalated" are understood. Where handling time isn't recorded, 30 minutes per alert is assumed (`--minutes`).

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

Synthetic alert logs (3 seeds × 3,000 alerts; all names invented, none are real sanctioned parties) with planted drivers:

| Check | Result |
| --- | --- |
| Planted drivers and good-guy pairs found | **30 / 30** |
| Groups containing a true match proposed as safe (incl. deliberately "poisoned" variants) | **0 / 27 checks** |

Synthetic logs are tidier than real ones. On your data, treat every finding as a hypothesis to test.

## Limits

- Analyses past decisions; if past decisions were wrong, the analysis inherits that.
- Recommendations are for testing (below-the-line testing, Compliance sign-off), not for direct implementation.
- Not legal or compliance advice.

Part of [Hyniqe Hub](../../README.md).
