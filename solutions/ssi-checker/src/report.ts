// T+1 SSI Readiness report: one self-contained HTML page that prints to PDF.

import { esc, pct, reportPage } from '../../shared/html.ts';
import { daysToT1, type CheckResult, type CompareResult, type Finding } from './ssi.ts';

const LABELS: Record<string, string> = {
  MISSING_FIELD: 'Missing required data',
  BIC_FORMAT: 'Invalid BIC',
  BIC_COUNTRY: 'BIC with invalid country',
  LEI_MISSING: 'LEI missing',
  LEI_INVALID: 'LEI fails check digits',
  MARKET_UNKNOWN: 'Unknown market',
  PSET_NOT_CSD: 'PSET is not a CSD',
  PSET_UNLISTED: 'PSET not in reference table',
  PSET_MARKET_MISMATCH: 'PSET does not match market',
  CASH_IBAN_INVALID: 'Cash IBAN fails check digits',
  CURRENCY_FORMAT: 'Invalid currency code',
  NEVER_VERIFIED: 'Never verified',
  STALE: 'Not verified recently',
  UNAUTHENTICATED_SOURCE: 'Received by email, PDF or phone',
  CONFLICT: 'Conflicting SSIs for one route',
  DUPLICATE: 'Duplicate record',
  FUTURE_EFFECTIVE: 'Future-dated SSI',
  MISMATCH_PSET: 'PSET differs from golden source',
  MISMATCH_AGENT: 'Agent differs from golden source',
  MISMATCH_SAFEKEEPING: 'Safekeeping account differs',
  MISMATCH_CASH_AGENT: 'Cash agent differs',
  MISMATCH_CASH_ACCOUNT: 'Cash account differs',
  MISSING_IN_GOLDEN: 'Not in golden source',
};

export const label = (code: string): string => LABELS[code] ?? code;

function findingRows(fs: Finding[], limit: number): string {
  return fs
    .slice(0, limit)
    .map(
      (f) =>
        `<tr><td><code>${esc(f.ssiId)}</code></td><td>${esc(f.counterparty)}</td><td>${esc(f.market)}</td><td><span class="pill ${f.severity}">${f.severity}</span> ${esc(label(f.code))}<br><span class="sub">${esc(f.message)}</span></td><td>${esc(f.fix)}</td></tr>`,
    )
    .join('');
}

export function renderSsiReport(opts: { check: CheckResult; compare?: CompareResult | null; client?: string; asOf?: Date }): string {
  const { check, compare } = opts;
  const asOf = opts.asOf ?? new Date();
  const total = check.ssis.length;
  const findings = [...check.findings, ...(compare?.findings ?? [])];
  const blocking = new Set(findings.filter((f) => f.severity !== 'info').map((f) => f.ssiId));
  const ready = check.ssis.filter((s) => !blocking.has(s.id)).length;
  const errors = new Set(findings.filter((f) => f.severity === 'error').map((f) => f.ssiId)).size;
  const reviews = blocking.size - errors;
  const days = daysToT1(asOf);

  const counts = new Map<string, { n: number; sev: string }>();
  for (const f of findings) {
    const c = counts.get(f.code) ?? { n: 0, sev: f.severity };
    c.n++;
    counts.set(f.code, c);
  }
  const sevRank: Record<string, number> = { error: 0, review: 1, info: 2 };
  const issueTable = [...counts.entries()]
    .sort((a, b) => sevRank[a[1].sev] - sevRank[b[1].sev] || b[1].n - a[1].n)
    .map(([code, c]) => `<tr><td><span class="pill ${c.sev}">${c.sev}</span></td><td>${esc(label(code))}</td><td>${c.n}</td></tr>`)
    .join('');

  const markets = new Map<string, { total: number; ready: number }>();
  for (const s of check.ssis) {
    const m = markets.get(s.market || '?') ?? { total: 0, ready: 0 };
    m.total++;
    if (!blocking.has(s.id)) m.ready++;
    markets.set(s.market || '?', m);
  }
  const marketTable = [...markets.entries()]
    .sort((a, b) => a[1].ready / a[1].total - b[1].ready / b[1].total)
    .map(([m, v]) => `<tr><td>${esc(m)}</td><td>${v.total}</td><td>${pct(v.ready, v.total)}</td><td style="width:40%"><div class="bar"><i style="width:${(100 * v.ready) / v.total}%"></i></div></td></tr>`)
    .join('');

  const errorsList = findings.filter((f) => f.severity === 'error');
  const reviewList = findings.filter((f) => f.severity === 'review');

  const body = `
<h2>Summary</h2>
<p>${total} standing settlement instructions checked${compare ? ` and ${compare.compared} compared with the golden source` : ''}. <b>${ready} (${pct(ready, total)})</b> are ready for T+1 as they stand. ${errors} would cause an unmatched instruction or a failed settlement and need fixing; ${reviews} need a human check. ${days > 0 ? `${days} days remain until the EU, UK and Swiss markets move to T+1 on 11 October 2027.` : 'T+1 is live in the EU, UK and Switzerland.'}</p>
<div class="tiles">
<div class="tile"><b>${pct(ready, total)}</b><span>T+1 ready</span></div>
<div class="tile"><b>${errors}</b><span>SSIs that would fail</span></div>
<div class="tile"><b>${reviews}</b><span>SSIs to review</span></div>
<div class="tile"><b>${days > 0 ? days : 0}</b><span>days to T+1</span></div>
</div>
<div class="bar"><i style="width:${(100 * ready) / Math.max(total, 1)}%"></i></div>

<h2>What we found</h2>
<table><tr><th>Severity</th><th>Issue</th><th>Count</th></tr>${issueTable || '<tr><td colspan="3">No issues found.</td></tr>'}</table>

<h2>Readiness by market</h2>
<table><tr><th>Market</th><th>SSIs</th><th>Ready</th><th></th></tr>${marketTable}</table>

<h2>Fix first: SSIs that would fail</h2>
${errorsList.length ? `<table><tr><th>SSI</th><th>Counterparty</th><th>Market</th><th>Issue</th><th>Suggested fix</th></tr>${findingRows(errorsList, 200)}</table>${errorsList.length > 200 ? `<p class="sub">Showing 200 of ${errorsList.length}. The full list is in the issues CSV.</p>` : ''}` : '<p>None.</p>'}

<h2>Review</h2>
${reviewList.length ? `<table><tr><th>SSI</th><th>Counterparty</th><th>Market</th><th>Issue</th><th>Suggested fix</th></tr>${findingRows(reviewList, 100)}</table>${reviewList.length > 100 ? `<p class="sub">Showing 100 of ${reviewList.length}. The full list is in the issues CSV.</p>` : ''}` : '<p>None.</p>'}

<h2>How this was done</h2>
<p>Each SSI was checked for missing data, BIC and LEI validity (ISO 9362 format, ISO 17442 check digits), IBAN check digits, whether the place of settlement is a central securities depository for the market, conflicting instructions for the same route, how recently it was verified and whether it arrived through an unauthenticated channel.${compare ? ' Each SSI was then compared field by field with the golden source; any difference in PSET, agent or account would leave the instruction unmatched at the CSD.' : ''} The CSD reference table covers the EU, UK and Swiss markets, the two ICSDs and the US; verify it against your market data. Checks are deterministic: the same file always gives the same result.</p>`;

  return reportPage({ title: 'T+1 SSI Readiness Report', subtitle: opts.client ? `Prepared for ${opts.client}` : 'Standing Settlement Instructions', body, generatedAt: asOf });
}
