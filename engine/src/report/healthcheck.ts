// "Payment Data Health Check": a client-facing, print-ready report of what the
// agent team found and fixed in a vendor master, what still needs the client,
// and how to stop the problems coming back.

import type { Engine } from '../engine.ts';
import { allRecords, type RecordView } from '../records.ts';
import { allRules } from '../rules.ts';
import { metrics } from '../metrics.ts';
import { countryName, isCountryCode } from '../address/countries.ts';
import { AUTO_ACCEPT_CONFIDENCE } from '../skills/payment-data-ops.ts';

export interface BenchmarkSummary {
  set: string;
  gazetteer: string;
  overall: { cases: number; autoRate: number; autoPrecision: number; silentErrorRate: number };
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const fields = (a: RecordView['address']) =>
  !a ? '<span class="muted">not determined</span>' :
    Object.entries(a).filter(([, v]) => v && (!Array.isArray(v) || v.length)).map(([k, v]) => `<span class="f"><b>${k}</b> ${esc(Array.isArray(v) ? v.join(' / ') : v)}</span>`).join(' ');
const original = (r: RecordView) => r.source.address_text || [r.source.building, r.source.street, r.source.postcode, r.source.town, r.source.country].filter(Boolean).join(' | ');

export function renderHealthCheck(engine: Engine, opts: { client: string; benchmark?: BenchmarkSummary | null; generatedAt?: Date }): string {
  const m = metrics(engine);
  const recs = allRecords(engine);
  const rules = allRules(engine);
  const audit = engine.verifyAudit();
  const head = (engine.db.prepare('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1').get() as { hash: string } | undefined)?.hash ?? '';
  const date = (opts.generatedAt ?? new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pending = engine.pendingApprovals();
  const outreach = engine.db.prepare('SELECT * FROM outreach WHERE company_id = ?').all(engine.companyId) as { owner: string; record_ids: string }[];

  const review = recs.filter((r) => r.status === 'in_review');
  const missing = recs.filter((r) => r.status === 'needs_data' || r.status === 'awaiting_data');
  const fixed = recs.filter((r) => r.status === 'repaired');
  const pct = (n: number) => (m.total ? Math.round((n / m.total) * 1000) / 10 : 0);
  const atRisk = m.total - m.compliantNow;

  // Root causes
  const causes: [string, number, string][] = [
    ['Address held as free text', recs.filter((r) => r.format_before === 'unstructured').length, 'Town and country are not in separate fields, so payments can be rejected once structured addresses are enforced.'],
    ['Country written as a name or legacy code', recs.filter((r) => r.source.country && !(r.source.country.length === 2 && isCountryCode(r.source.country))).length, 'Values like "Deutschland" or "UK" instead of ISO codes (DE, GB).'],
    ['Town or country missing entirely', missing.length, 'Only the vendor can supply this. Outreach has been drafted.'],
    ['Ambiguous town name', recs.filter((r) => r.issues.some((i) => i.code === 'AMBIGUOUS_TOWN')).length, 'Towns like London or Springfield exist in several countries or states.'],
    ['Bank country differs from address country', recs.filter((r) => r.evidence.some((e) => /^Control: Bank/.test(e))).length, 'Often legitimate, but must be confirmed before payment.'],
    ['Invalid IBAN checksum', recs.filter((r) => r.evidence.some((e) => /IBAN checksum/.test(e))).length, 'The account number fails its own check digits.'],
  ].filter(([, n]) => (n as number) > 0) as [string, number, string][];

  // By country
  const byCountry = new Map<string, { total: number; before: number; now: number }>();
  for (const r of recs) {
    const c = r.address?.Ctry ?? 'Unknown';
    const e = byCountry.get(c) ?? { total: 0, before: 0, now: 0 };
    e.total++;
    if (r.format_before === 'structured') e.before++;
    if (r.status === 'compliant' || r.status === 'repaired') e.now++;
    byCountry.set(c, e);
  }
  const countryRows = [...byCountry.entries()].sort((a, b) => b[1].total - a[1].total);

  const missingByOwner = new Map<string, RecordView[]>();
  for (const r of missing) missingByOwner.set(r.owner ?? 'unassigned', [...(missingByOwner.get(r.owner ?? 'unassigned') ?? []), r]);

  const examples = fixed.filter((r) => r.format_before === 'unstructured').slice(0, 8);
  const bench = opts.benchmark;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Payment Data Health Check · ${esc(opts.client)}</title>
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  :root { --ink:#14161a; --ink2:#4a505a; --ink3:#7a818c; --line:#e4e7ec; --soft:#f6f7f9; --accent:#3b3fd8; --ok:#13795b; --warn:#a15c07; --bad:#b42318; }
  * { box-sizing: border-box; }
  body { margin: 0; color: var(--ink); font: 11pt/1.5 Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #fff; }
  main { max-width: 820px; margin: 0 auto; padding: 32px 28px 48px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid var(--accent); padding-bottom: 14px; margin-bottom: 22px; }
  .brand { font-weight: 700; color: var(--accent); letter-spacing: .02em; }
  h1 { font-size: 24pt; line-height: 1.1; margin: 6px 0 4px; letter-spacing: -.02em; }
  h2 { font-size: 14pt; margin: 28px 0 8px; break-after: avoid; }
  .meta { color: var(--ink3); font-size: 9.5pt; text-align: right; }
  .muted { color: var(--ink3); }
  .lead { font-size: 12pt; color: var(--ink2); }
  .score { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 10px; margin: 16px 0 6px; }
  .tile { border: 1px solid var(--line); border-radius: 8px; padding: 12px 14px; break-inside: avoid; }
  .tile .k { font-size: 9pt; color: var(--ink3); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
  .tile .v { font-size: 22pt; font-weight: 700; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
  .tile .v small { font-size: 12pt; color: var(--ink3); font-weight: 600; }
  .bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; margin: 10px 0 6px; background: var(--soft); }
  .bar i { display: block; height: 100%; }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 9pt; color: var(--ink2); }
  .legend span::before { content: ""; display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-right: 5px; background: var(--c); }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 6px; }
  th { text-align: left; color: var(--ink3); font-weight: 600; border-bottom: 1px solid var(--line); padding: 5px 6px; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .03em; }
  td { border-bottom: 1px solid #eef0f3; padding: 6px; vertical-align: top; }
  tr { break-inside: avoid; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums; }
  .f { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 8pt; background: var(--soft); border-radius: 3px; padding: 0 4px; white-space: nowrap; }
  .f b { color: var(--ink3); font-weight: 500; }
  .callout { background: var(--soft); border-left: 3px solid var(--accent); padding: 10px 14px; border-radius: 0 6px 6px 0; margin: 12px 0; font-size: 10pt; break-inside: avoid; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  ol, ul { padding-left: 18px; margin: 6px 0; }
  li { margin: 3px 0; }
  .seal { font-family: ui-monospace, Menlo, monospace; font-size: 8pt; word-break: break-all; color: var(--ink2); }
  footer { margin-top: 32px; border-top: 1px solid var(--line); padding-top: 10px; font-size: 8.5pt; color: var(--ink3); }
  .pagebreak { break-before: page; }
  @media print { main { padding: 0; } }
  @media (max-width: 640px) { .score, .two { grid-template-columns: 1fr 1fr; } }
</style></head>
<body><main>
<header>
  <div><div class="brand">HYNIQE</div><h1>Payment Data Health Check</h1><div class="lead">${esc(opts.client)}</div></div>
  <div class="meta">${esc(date)}<br>${m.total} vendor records analysed<br>Audit chain ${audit.ok ? 'verified' : '<b style="color:var(--bad)">BROKEN</b>'} · ${audit.entries} entries</div>
</header>

<h2 style="margin-top:0">Summary</h2>
<p class="lead">${pct(m.compliantBefore)}% of your vendor addresses were ready for ISO 20022 structured-address payments. After an automated repair pass, <b>${pct(m.compliantNow)}%</b> are ready. <b>${atRisk}</b> vendor${atRisk === 1 ? '' : 's'} still need${atRisk === 1 ? 's' : ''} attention: ${m.inReview} decision${m.inReview === 1 ? '' : 's'} for your team and ${m.needsData} vendor${m.needsData === 1 ? '' : 's'} missing information only they can supply.</p>
<div class="score">
  <div class="tile"><div class="k">Readiness</div><div class="v"><small>${pct(m.compliantBefore)}% →</small> ${pct(m.compliantNow)}%</div></div>
  <div class="tile"><div class="k">Fixed automatically</div><div class="v">${m.autoRepaired}</div></div>
  <div class="tile"><div class="k">Your decisions</div><div class="v" style="color:var(--warn)">${m.inReview}</div></div>
  <div class="tile"><div class="k">Missing data</div><div class="v" style="color:var(--bad)">${m.needsData}</div></div>
</div>
<div class="bar">
  <i style="width:${pct(m.compliantBefore)}%;background:#9aa0aa"></i>
  <i style="width:${pct(m.autoRepaired)}%;background:var(--ok)"></i>
  <i style="width:${pct(m.inReview)}%;background:#e9a23b"></i>
  <i style="width:${pct(m.needsData)}%;background:var(--bad)"></i>
</div>
<div class="legend"><span style="--c:#9aa0aa">Already compliant ${m.compliantBefore}</span><span style="--c:var(--ok)">Fixed automatically ${m.autoRepaired}</span><span style="--c:#e9a23b">Needs your decision ${m.inReview}</span><span style="--c:var(--bad)">Missing vendor data ${m.needsData}</span></div>
<div class="callout"><b>Why it matters.</b> Cross-border payment messages must carry the beneficiary's town and country in separate fields. Unstructured addresses risk rejection, delays and manual repair costs once the rule is enforced. Swift has postponed its November 2026 cut-over and is expected to announce a revised timeline; the data work is the same either way.</div>

<h2>What we found</h2>
<table><thead><tr><th>Issue</th><th class="n">Vendors</th><th>What it means</th></tr></thead><tbody>
${causes.map(([k, n, d]) => `<tr><td><b>${esc(k)}</b></td><td class="n">${n}</td><td>${esc(d)}</td></tr>`).join('')}
</tbody></table>

<h2>Readiness by country</h2>
<table><thead><tr><th>Country</th><th class="n">Vendors</th><th class="n">Ready before</th><th class="n">Ready now</th><th class="n">Needs attention</th></tr></thead><tbody>
${countryRows.map(([c, e]) => `<tr><td>${c === 'Unknown' ? 'Not determined' : `${esc(countryName(c))} (${c})`}</td><td class="n">${e.total}</td><td class="n">${e.before}</td><td class="n">${e.now}</td><td class="n">${e.total - e.now || ''}</td></tr>`).join('')}
</tbody></table>

<h2>Decisions for your team (${review.length})</h2>
<p class="muted">Each item has a proposed fix. Approve, correct or reject it; nothing changes in your systems until you do.</p>
<table><thead><tr><th>Vendor</th><th>Why it needs a person</th><th>Proposed</th></tr></thead><tbody>
${review.slice(0, 30).map((r) => {
    const ap = pending.find((a) => a.kind === 'record_review' && a.payload.includes(r.id));
    const reasons = ap ? (JSON.parse(ap.payload).reasons as string[]) : r.issues.filter((i) => i.severity === 'review').map((i) => i.message);
    return `<tr><td><b>${esc(r.source_id)}</b><br><span class="muted">${esc(r.name)}</span></td><td>${esc(reasons.join('; '))}</td><td>${fields(r.address)}</td></tr>`;
  }).join('')}
</tbody></table>
${review.length > 30 ? `<p class="muted">+ ${review.length - 30} more in the accompanying file.</p>` : ''}

<h2>Vendors missing information (${missing.length})</h2>
<div class="two">${[...missingByOwner.entries()].map(([owner, list]) => `<div><b>${esc(owner)}</b> · ${list.length} vendor${list.length === 1 ? '' : 's'}<ul>${list.slice(0, 10).map((r) => `<li>${esc(r.source_id)} ${esc(r.name)}: <span class="muted">"${esc(original(r))}"</span></li>`).join('')}</ul></div>`).join('')}</div>
<p class="muted">${outreach.length} outreach email${outreach.length === 1 ? ' has' : 's have'} been drafted for these owners and will only be sent once you approve them.</p>

<h2>Examples of automatic repairs</h2>
<table><thead><tr><th>Before</th><th>After (ISO 20022)</th><th class="n">Confidence</th></tr></thead><tbody>
${examples.map((r) => `<tr><td>${esc(original(r))}</td><td>${fields(r.address)}</td><td class="n">${Math.round((r.confidence ?? 0) * 100)}%</td></tr>`).join('')}
</tbody></table>

<h2>Stop it coming back: recommended rules</h2>
<ol>${rules.map((r) => `<li><b>${esc(r.code)} ${esc(r.title)}</b>. ${esc(r.rationale)} <span class="muted">Seen ${r.evidence_count} times.</span></li>`).join('')}</ol>
<p class="muted">Once approved, these rules check every new vendor at onboarding, so the same defects are blocked at source instead of repaired later.</p>

<h2>How this was done</h2>
<ul>
  <li>An AI agent team (profiling, repair, payment controls, outreach and rule design) worked under human oversight. Repairs were accepted automatically only at ${Math.round(AUTO_ACCEPT_CONFIDENCE * 100)}% confidence or above, with no open issues; everything else is listed above for a person.</li>
  <li>Every decision is recorded with its evidence in a hash-chained audit log. Editing any past entry breaks the chain.</li>
  <li>No email was sent and no system was changed. The structured addresses are supplied as a file for your team to load.</li>
  ${bench ? `<li>Engine accuracy on our labelled benchmark (${esc(bench.overall.cases)} addresses, ${esc(bench.gazetteer)}): ${bench.overall.autoRate}% handled automatically, of which ${bench.overall.autoPrecision}% fully correct; ${bench.overall.silentErrorRate}% of addresses were wrong but auto-accepted. Benchmark data is synthetic and built from real place names.</li>` : ''}
</ul>
<p class="seal">Audit seal: ${esc(head)}</p>

<footer>Prepared by Hyniqe Payment Data Ops for ${esc(opts.client)} on ${esc(date)}. This report describes data quality against ISO 20022 CBPR+ structured-address requirements; it is not legal or regulatory advice. Accompanying files: structured_addresses.csv (all records, before and after), state.json (full run), audit log.</footer>
</main></body></html>`;
}
