// Home page: theme, the "What are you trying to fix?" finder and the rejected-to-fixed slip.
import { $, esc, initTheme } from './common.js';
import { TOOL_INDEX } from './tool-index.js';
import { BENCHMARKS } from '../lib/benchmarks.js';

initTheme();

// Finder: score tools by how many query words appear in their name, summary and keywords.
const input = $('find');
const pop = $('find-results');
let active = -1;
function search(q) {
  const words = q.toLowerCase().split(/[^a-z0-9.+]+/).filter((w) => w.length > 1);
  if (!words.length) return [];
  return TOOL_INDEX.map((t) => {
    const hay = `${t.name} ${t.short} ${t.keywords.join(' ')}`.toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? (t.keywords.some((k) => k.includes(w)) ? 2 : 1) : 0), 0);
    return { t, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.t);
}
function render() {
  const hits = search(input.value);
  active = hits.length ? 0 : -1;
  pop.hidden = !input.value.trim();
  input.setAttribute('aria-expanded', String(!pop.hidden));
  pop.innerHTML = hits.length
    ? hits.map((t, i) => `<a role="option" href="tools/${t.slug}/" aria-selected="${i === active}"><b>${esc(t.name)}</b><small>${esc(t.short)}</small></a>`).join('')
    : '<a href="#tools"><b>No exact match</b><small>Browse all tools below.</small></a>';
}
input.addEventListener('input', render);
input.addEventListener('keydown', (e) => {
  const opts = [...pop.querySelectorAll('a')];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    active = (active + (e.key === 'ArrowDown' ? 1 : opts.length - 1)) % opts.length;
    opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
  } else if (e.key === 'Enter' && opts[active]) {
    e.preventDefault();
    location.href = opts[active].href;
  } else if (e.key === 'Escape') pop.hidden = true;
});
document.addEventListener('click', (e) => { if (!e.target.closest('.finder')) pop.hidden = true; });
document.querySelectorAll('.tries button').forEach((b) => b.addEventListener('click', () => { input.value = b.textContent; input.focus(); render(); }));

// The slip: shows a rejected instruction, then the fixed one. Runs once, replayable.
const slip = $('slip');
const note = $('slip-note');
const REJECTED = 'Rejected: address is one line of text; the bank needs town and country as separate fields.';
const FIXED = 'Fixed: split into structured fields. Ready to send.';
function play() {
  slip.classList.remove('fixed');
  note.textContent = REJECTED;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    slip.classList.add('fixed');
    note.textContent = FIXED;
    return;
  }
  setTimeout(() => { slip.classList.add('fixed'); note.textContent = FIXED; }, 2200);
}
$('slip-replay').addEventListener('click', play);
play();

// Benchmark line from the latest CI run.
const b = BENCHMARKS;
const parts = [];
if (b.ssi) parts.push(`SSI Checker found ${(100 * b.ssi.recall).toFixed(0)}% of ${b.ssi.injected} planted defects`);
if (b.duplicates) parts.push(`Duplicate Payment Finder was right on ${(100 * b.duplicates.precisionHigh).toFixed(0)}% of its high-confidence flags`);
const n = (x) => Number(x).toLocaleString('en-GB');
const pc = (x) => `${(100 * x).toFixed(x === 1 ? 0 : 1)}%`;
const rows = [
  b.doctor && ['Payment File Doctor', `${b.doctor.files} payment files`, `${pc(b.doctor.detect)} found, ${pc(b.doctor.repair)} of fixable ones repaired`, `${b.doctor.falseAlarms} of ${b.doctor.cleanFiles} clean files`],
  b.returns && ['Returns and Rejects Triage', `${n(b.returns.returns)} returns in 5 formats`, `${pc(b.returns.accuracy)} read correctly`, `${b.returns.extra}`],
  b.duplicates && ['Duplicate Payment Finder', `${n(b.duplicates.rows)} payments`, `${pc(b.duplicates.recall)} found`, `${pc(1 - b.duplicates.precisionHigh)} of high-confidence flags`],
  b.vendors && ['Vendor Master Cleanup', `${n(b.vendors.records)} supplier records`, `${pc(b.vendors.detect)} found`, `${b.vendors.falseFlags} of ${n(b.vendors.clean)} clean records`],
  b.ssi && ['SSI Checker', `${n(b.ssi.rows)} SSIs`, `${pc(b.ssi.recall)} found`, `${b.ssi.falseFlags ?? 0} clean SSIs flagged`],
  b.corporateActions && ['Corporate Actions Checker', `${n(b.corporateActions.notices)} notices`, `${pc(b.corporateActions.detect)} found`, `${b.corporateActions.falseFlags} of ${b.corporateActions.clean} clean events`],
  b.einvoice && ['E-invoice Checker', `${n(b.einvoice.invoices)} UBL and CII invoices, ${b.einvoice.pdfs} PDFs`, `${pc(b.einvoice.detect)} of broken rules found`, `${b.einvoice.falseFlags} of ${b.einvoice.clean} correct invoices`],
  b.explainer && ['Payment Message Explainer', `${n(b.explainer.messages)} MT103 / pacs.008 pairs`, `${b.explainer.roundOk} of ${b.explainer.messages} converted and read back unchanged`, `${b.explainer.addrSuggested - b.explainer.addrRight} wrong addresses`],
  b.recon && ['Bank Reconciliation', `${n(b.recon.bankLines)} bank lines in 4 statement formats`, `${pc(b.recon.correct)} reconciled exactly right`, `${b.recon.wrongMatches} wrong matches`],
  b.bankDetail && ['Bank Detail Change Check', `${n(b.bankDetail.payments)} payments`, `${pc(b.bankDetail.detect)} of redirection patterns found`, `${b.bankDetail.falseFlags} of ${n(b.bankDetail.clean)} normal payments`],
  b.dataQuality && ['Data Quality Scorecard', `${n(b.dataQuality.rows)} rows`, `${b.dataQuality.exactColumns} of ${b.dataQuality.columns} columns counted exactly`, 'none'],
].filter(Boolean);
if (rows.length) {
  $('scores').querySelector('tbody').innerHTML = rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${c}</td>` : `<th scope="row">${c}</th>`)).join('')}</tr>`).join('');
  $('scores').hidden = false;
}
if (parts.length) $('bench-line').textContent = `Each solution ships with a benchmark that runs on every change. Latest run: ${parts.join('; ')}.`;
