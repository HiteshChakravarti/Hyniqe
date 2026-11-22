// Hyniqe Hub website: runs the solutions entirely in the browser. No data leaves the page.
import { parseCsv, toCsv } from './lib/solutions/shared/csv.js';
import { esc } from './lib/solutions/shared/html.js';
import { checkSsis, compareSsis, daysToT1, COLUMNS as SSI_COLUMNS } from './lib/solutions/ssi-checker/src/ssi.js';
import { renderSsiReport, label as ssiLabel } from './lib/solutions/ssi-checker/src/report.js';
import { findDuplicates, COLUMNS as DUP_COLUMNS } from './lib/solutions/duplicate-payments/src/duplicates.js';
import { renderDuplicateReport, clustersToRows } from './lib/solutions/duplicate-payments/src/report.js';
import { repairRecords, addressLine } from './lib/solutions/payment-data-repair/src/repair.js';
import { renderRepairReport } from './lib/solutions/payment-data-repair/src/report.js';
import { BENCHMARKS } from './lib/benchmarks.js';

const $ = (id) => document.getElementById(id);
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : '–');
const money = (cents, cur) => `${cur} ${(cents / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const columnTable = (rows) =>
  `<table><tr><th>Field</th><th>Column names we recognise</th><th></th></tr>${rows.map(([f, names, req]) => `<tr><td>${f}</td><td><code>${names.join('</code>, <code>')}</code></td><td>${req ? 'required' : 'optional'}</td></tr>`).join('')}</table><p class="note">Headers are matched without regard to case, spaces or punctuation. Save Excel files as CSV first.</p>`;

const SOLUTIONS = {
  ssi: {
    title: 'SSI Checker',
    what: 'Checks every standing settlement instruction for the defects that cause unmatched instructions and failed trades: the wrong place of settlement, invalid BICs, LEIs and IBANs, conflicting instructions, stale or emailed SSIs. Add a golden-source file to compare yours field by field.',
    dropTitle: 'Drop your SSI file (CSV) here, or choose a file',
    golden: true,
    samples: [['ssi-ours.csv', 'sample SSIs'], ['ssi-golden-source.csv', 'sample golden source']],
    columns: () =>
      columnTable([
        ['Counterparty', SSI_COLUMNS.counterparty, true], ['Market (country)', SSI_COLUMNS.market, true], ['Currency', SSI_COLUMNS.currency, true],
        ['Place of settlement BIC', SSI_COLUMNS.pset, true], ['Settlement agent BIC', SSI_COLUMNS.agentBic, true], ['Safekeeping account', SSI_COLUMNS.safekeeping, true],
        ['LEI', SSI_COLUMNS.lei, false], ['Asset class', SSI_COLUMNS.assetClass, false], ['Cash agent BIC', SSI_COLUMNS.cashAgentBic, false], ['Cash account / IBAN', SSI_COLUMNS.cashAccount, false],
        ['Last verified date', SSI_COLUMNS.lastVerified, false], ['Source / channel', SSI_COLUMNS.source, false], ['SSI reference', SSI_COLUMNS.id, false],
      ]),
  },
  dup: {
    title: 'Duplicate Payment Finder',
    what: 'Finds the same invoice paid twice, including the near-duplicates exact-match ERP checks miss: re-keyed invoice numbers, a supplier set up twice in the vendor master, and the same bill paid through a second channel. Monthly rent and subscriptions are recognised and left alone.',
    dropTitle: 'Drop your payments file (CSV) here, or choose a file',
    golden: false,
    samples: [['payments.csv', 'sample payments']],
    columns: () =>
      columnTable([
        ['Vendor name', DUP_COLUMNS.vendor, true], ['Amount', DUP_COLUMNS.amount, true], ['Invoice number', DUP_COLUMNS.invoice, true], ['Payment date', DUP_COLUMNS.paymentDate, true],
        ['Currency', DUP_COLUMNS.currency, false], ['Vendor ID', DUP_COLUMNS.vendorId, false], ['Bank account / IBAN', DUP_COLUMNS.iban, false], ['Payment ID', DUP_COLUMNS.id, false],
      ]),
  },
  pdr: {
    title: 'Payment Data Repair',
    what: 'Turns free-text vendor and beneficiary addresses into structured fields (street, building, postcode, town, country) for structured-address payment messages, and checks that bank account, BIC and address countries agree. Records it is unsure about go to review instead of being guessed.',
    dropTitle: 'Drop your vendor or beneficiary file (CSV) here, or choose a file',
    golden: false,
    samples: [['vendors.csv', 'sample vendor master']],
    columns: () =>
      columnTable([
        ['Name', ['name', 'vendor_name', 'supplier_name', 'beneficiary_name'], true],
        ['Full address as text', ['address_text', 'address', 'full_address'], false],
        ['Or split fields', ['street', 'building', 'postcode', 'town', 'city', 'country'], false],
        ['IBAN', ['iban', 'bank_account'], false], ['BIC', ['bic', 'swift'], false], ['ID', ['vendor_id', 'id', 'supplier_id'], false],
      ]),
  },
};

let current = 'ssi';
let files = { main: null, golden: null };
let output = null;

function select(id) {
  current = id;
  files = { main: null, golden: null };
  output = null;
  const s = SOLUTIONS[id];
  document.querySelectorAll('.switcher button').forEach((b) => {
    const on = b.dataset.solution === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
    if (on) $('panel').setAttribute('aria-labelledby', b.id);
  });
  $('sol-title').textContent = s.title;
  $('sol-what').textContent = s.what;
  $('sol-columns').innerHTML = s.columns();
  $('drop-main-title').textContent = s.dropTitle;
  $('drop-golden').hidden = !s.golden;
  $('file-main').value = '';
  $('file-golden').value = '';
  $('file-main-name').textContent = 'No file chosen';
  $('file-golden-name').textContent = 'No file chosen';
  $('sample-links').innerHTML = `Download ${s.samples.map(([f, l]) => `<a href="samples/${f}" download>${l}</a>`).join(' or ')}`;
  $('run').disabled = true;
  $('results').hidden = true;
  hideError();
}

function showError(msg) {
  $('error').textContent = msg;
  $('error').hidden = false;
}
function hideError() {
  $('error').hidden = true;
}

async function readFile(f) {
  return await f.text();
}

function rowsOrError(text, what) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error(`The ${what} has no data rows. Check that it is a CSV with a header row.`);
  return rows;
}

function run(mainText, goldenText, isSample) {
  hideError();
  try {
    const rows = rowsOrError(mainText, 'file');
    if (current === 'ssi') runSsi(rows, goldenText ? rowsOrError(goldenText, 'golden-source file') : null, isSample);
    else if (current === 'dup') runDup(rows, isSample);
    else runPdr(rows, isSample);
    $('results').hidden = false;
    $('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e));
  }
}

function stats(items) {
  $('res-stats').innerHTML = items.map(([v, l, cls]) => `<div class="stat ${cls || ''}"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
}

function runSsi(rows, golden, isSample) {
  const asOf = isSample ? new Date(Date.UTC(2026, 10, 1)) : new Date();
  const check = checkSsis(rows, { asOf });
  if (!check.ssis.some((s) => s.pset || s.agentBic)) throw new Error('No place-of-settlement or agent BIC columns found. Open "Which columns does my file need?" for the accepted column names.');
  const compare = golden ? compareSsis(rows, golden) : null;
  const findings = [...check.findings, ...(compare?.findings ?? [])];
  const blocking = new Set(findings.filter((f) => f.severity !== 'info').map((f) => f.ssiId));
  const errors = new Set(findings.filter((f) => f.severity === 'error').map((f) => f.ssiId)).size;
  const ready = check.ssis.length - blocking.size;
  $('res-headline').textContent = `${pct(ready, check.ssis.length)} of your ${check.ssis.length} SSIs are ready for T+1. ${errors} would cause a failed or unmatched settlement.`;
  stats([
    [pct(ready, check.ssis.length), 'ready for T+1', 'matched'],
    [String(errors), 'would fail', 'failed'],
    [String(blocking.size - errors), 'need review', 'pending'],
    ...(compare ? [[`${compare.matched}/${compare.compared}`, 'match the golden source']] : []),
  ]);
  const order = { error: 0, review: 1, info: 2 };
  const top = [...findings].sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 25);
  $('res-table').innerHTML = `<tr><th>SSI</th><th>Counterparty</th><th>Market</th><th>Issue</th><th>What to do</th></tr>${top.map((f) => `<tr><td><code>${esc(f.ssiId)}</code></td><td>${esc(f.counterparty)}</td><td>${esc(f.market)}</td><td><span class="sev ${f.severity}">${f.severity}</span> ${esc(ssiLabel(f.code))}<br>${esc(f.message)}</td><td>${esc(f.fix)}</td></tr>`).join('')}`;
  $('res-note').textContent = findings.length > 25 ? `Showing the 25 most serious of ${findings.length} findings. The full list is in the report and the CSV.` : '';
  output = {
    report: renderSsiReport({ check, compare, asOf, client: isSample ? 'Sample data' : undefined }),
    csv: toCsv(findings, ['ssiId', 'counterparty', 'market', 'field', 'severity', 'code', 'message', 'fix']),
    name: 'ssi-readiness',
  };
}

function runDup(rows, isSample) {
  const r = findDuplicates(rows);
  if (!r.payments.length) throw new Error('No payments with an amount were found. Open "Which columns does my file need?" for the accepted column names.');
  const high = r.clusters.filter((c) => c.confidence === 'high');
  const medium = r.clusters.filter((c) => c.confidence === 'medium');
  const atRisk = Object.entries(r.exposure).map(([cur, c]) => money(c, cur)).join(' + ') || '0.00';
  const dupCount = high.reduce((n, c) => n + c.duplicates.length, 0);
  $('res-headline').textContent = high.length
    ? `${dupCount} payment${dupCount === 1 ? '' : 's'} look${dupCount === 1 ? 's' : ''} like ${dupCount === 1 ? 'a duplicate' : 'duplicates'}, putting ${atRisk} at risk.`
    : 'No high-confidence duplicates found.';
  stats([
    [String(dupCount), 'likely duplicate payments', 'failed'],
    [atRisk, 'at risk', 'failed'],
    [String(medium.length), 'worth a second look', 'pending'],
    [String(r.payments.length), 'payments checked'],
  ]);
  const list = [...high, ...medium].slice(0, 40);
  $('res-table').innerHTML = `<tr><th>Group</th><th>Confidence</th><th>Original</th><th>Suspected duplicate</th><th>Why</th></tr>${list
    .map((c) => {
      const line = (p) => `<code>${esc(p.id)}</code> ${esc(p.vendor)}<br>${esc(p.invoice)} · ${esc(p.paymentDate)} · ${esc(money(p.cents, p.currency))}`;
      return `<tr><td>${esc(c.id)}</td><td><span class="sev ${c.confidence}">${c.confidence}</span></td><td>${line(c.original)}</td><td>${c.duplicates.map(line).join('<br><br>')}</td><td>${esc(c.reasons.join('; '))}</td></tr>`;
    })
    .join('')}`;
  $('res-note').textContent = r.recurringVendors ? `${r.recurringVendors} recurring payment series (rent, subscriptions) were recognised and not flagged.` : '';
  output = { report: renderDuplicateReport({ result: r, client: isSample ? 'Sample data' : undefined }), csv: toCsv(clustersToRows(r)), name: 'duplicate-payments' };
}

function runPdr(rows, isSample) {
  const s = repairRecords(rows);
  const readyAfter = s.compliantBefore + s.autoRepaired;
  $('res-headline').textContent = `Structured-address readiness goes from ${pct(s.compliantBefore, s.total)} to ${pct(readyAfter, s.total)} with automatic repair. ${s.review} records need a decision and ${s.needsData} need data from the vendor.`;
  stats([
    [pct(s.compliantBefore, s.total), 'ready before'],
    [pct(readyAfter, s.total), 'ready after repair', 'matched'],
    [String(s.review), 'need a decision', 'pending'],
    [String(s.needsData), 'missing data', 'failed'],
  ]);
  const order = { review: 0, needs_data: 1, auto: 2, compliant: 3 };
  const list = [...s.records].sort((a, b) => order[a.decision] - order[b.decision]).slice(0, 25);
  const labelOf = { auto: 'repaired', compliant: 'already ok', review: 'review', needs_data: 'missing data' };
  const cls = { auto: 'auto', compliant: 'compliant', review: 'review', needs_data: 'error' };
  $('res-table').innerHTML = `<tr><th>ID</th><th>Name</th><th>Before</th><th>Structured</th><th>Status</th><th>Notes</th></tr>${list
    .map((r) => `<tr><td><code>${esc(r.id)}</code></td><td>${esc(r.name)}</td><td>${esc(r.original)}</td><td>${esc(addressLine(r.address))}</td><td><span class="sev ${cls[r.decision]}">${labelOf[r.decision]}</span></td><td>${esc([...r.issues, ...r.controls].join('; ') || '–')}</td></tr>`)
    .join('')}`;
  $('res-note').textContent = s.total > 25 ? `Showing 25 of ${s.total} records, those needing attention first.` : '';
  output = {
    report: renderRepairReport({ summary: s, client: isSample ? 'Sample data' : undefined }),
    csv: toCsv(s.records.map((r) => ({ id: r.id, name: r.name, status: r.decision, confidence: r.confidence.toFixed(2), ...r.address, AdrLine: (r.address.AdrLine || []).join(' | '), issues: [...r.issues, ...r.controls].join('; ') }))),
    name: 'payment-data-repair',
  };
}

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function wireDrop(labelId, inputId, nameId, key) {
  const label = $(labelId);
  const input = $(inputId);
  const set = (f) => {
    files[key] = f;
    $(nameId).textContent = f ? `${f.name} (${(f.size / 1024).toFixed(0)} KB)` : 'No file chosen';
    $('run').disabled = !files.main;
  };
  input.addEventListener('change', () => set(input.files[0] || null));
  label.addEventListener('dragover', (e) => {
    e.preventDefault();
    label.classList.add('over');
  });
  label.addEventListener('dragleave', () => label.classList.remove('over'));
  label.addEventListener('drop', (e) => {
    e.preventDefault();
    label.classList.remove('over');
    if (e.dataTransfer.files[0]) set(e.dataTransfer.files[0]);
  });
}

wireDrop('drop-main', 'file-main', 'file-main-name', 'main');
wireDrop('drop-golden', 'file-golden', 'file-golden-name', 'golden');

$('run').addEventListener('click', async () => {
  if (!files.main) return showError('Choose a CSV file first.');
  run(await readFile(files.main), files.golden ? await readFile(files.golden) : null, false);
});
$('run-sample').addEventListener('click', async () => {
  const s = SOLUTIONS[current];
  try {
    const texts = await Promise.all(s.samples.map(([f]) => fetch(`samples/${f}`).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`Could not load samples/${f}`))))));
    run(texts[0], texts[1] ?? null, true);
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e));
  }
});
$('open-report').addEventListener('click', () => {
  if (!output) return;
  const url = URL.createObjectURL(new Blob([output.report], { type: 'text/html' }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
});
$('dl-report').addEventListener('click', () => output && download(output.report, `${output.name}.html`, 'text/html'));
$('dl-csv').addEventListener('click', () => output && download(output.csv, `${output.name}.csv`, 'text/csv'));

const tabs = [...document.querySelectorAll('.switcher button')];
tabs.forEach((b, i) => {
  b.addEventListener('click', () => select(b.dataset.solution));
  b.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    next.focus();
    select(next.dataset.solution);
  });
});
document.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', () => select(a.dataset.open)));

const days = daysToT1();
$('t1-line').textContent = days > 0 ? `${days} days until the EU, UK and Swiss markets move to T+1 settlement on 11 October 2027.` : 'T+1 settlement is live in the EU, UK and Switzerland.';

function accuracy() {
  const rows = [];
  const b = BENCHMARKS;
  if (b.ssi) rows.push(['SSI Checker', `${b.ssi.rows} SSIs, ${b.ssi.injected} with a known defect`, `${(100 * b.ssi.recall).toFixed(1)}% of defects found`, `${(100 * b.ssi.falseRate).toFixed(2)}% of clean SSIs wrongly flagged`]);
  if (b.duplicates) rows.push(['Duplicate Payment Finder', `${b.duplicates.rows} payments, ${b.duplicates.injected} known duplicates`, `${(100 * b.duplicates.recall).toFixed(1)}% of duplicates found`, `${(100 * b.duplicates.precisionHigh).toFixed(1)}% of high-confidence flags correct`]);
  if (b.address?.overall) {
    const o = b.address.overall;
    rows.push(['Payment Data Repair', `${o.cases} addresses from a held-out set of places`, `${o.autoRate.toFixed(1)}% repaired automatically, the rest sent to review`, `${o.autoPrecision.toFixed(1)}% of automatic repairs correct (96.3% on the first blind run, before fixes)`]);
  }
  $('acc-table').innerHTML = `<tr><th>Solution</th><th>Test set</th><th>Coverage</th><th>Precision</th></tr>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}`;
}
accuracy();
select('ssi');
