// Tool pages: wires the drop zones and buttons to the solution adapter for this page.
// Every adapter runs locally; nothing is sent anywhere.
import { $, download, initTheme } from './common.js';

initTheme();
const workspace = document.querySelector('[data-tool]');
const slug = workspace.dataset.tool;
let adapter = null;
try {
  adapter = (await import(`./adapters/${slug}.js`)).default;
} catch {
  adapter = null;
}

const files = { main: null, second: null };
let output = null;
const runBtn = $('run');
const sampleBtn = $('run-sample');

function showError(msg) {
  $('error').textContent = msg;
  $('error').hidden = false;
}
function clearError() {
  $('error').hidden = true;
}

function wire(n, key) {
  const label = $(`drop-${n}`);
  const input = $(`file-${n}`);
  if (!label) return;
  const set = (f) => {
    files[key] = f;
    $(`file-${n}-name`).textContent = f ? `${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB)` : 'No file chosen';
    runBtn.disabled = !files.main || !adapter;
    clearError();
  };
  input.addEventListener('change', () => set(input.files[0] || null));
  label.addEventListener('dragover', (e) => { e.preventDefault(); label.classList.add('over'); });
  label.addEventListener('dragleave', () => label.classList.remove('over'));
  label.addEventListener('drop', (e) => {
    e.preventDefault();
    label.classList.remove('over');
    if (e.dataTransfer.files[0]) set(e.dataTransfer.files[0]);
  });
}
wire(1, 'main');
wire(2, 'second');

function fields() {
  const out = {};
  document.querySelectorAll('.fields input').forEach((i) => (out[i.id.replace(/^f-/, '')] = i.value.trim()));
  return out;
}

function show(o) {
  output = o;
  $('verdict').textContent = o.verdict;
  $('stats').innerHTML = o.stats.map(([v, l, c]) => `<div class="stat ${c || ''}"><b>${v}</b><span>${l}</span></div>`).join('');
  $('table').innerHTML = o.table;
  $('table-note').textContent = o.note || '';
  $('dl-main').hidden = !o.main;
  if (o.main) $('dl-main').textContent = o.main.label;
  $('open-report').hidden = !o.report;
  $('dl-csv').hidden = !o.csv;
  $('results').hidden = false;
  $('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

async function run(texts, isSample) {
  clearError();
  try {
    show(await adapter.run({ main: texts[0], second: texts[1] ?? null, fields: fields(), sample: isSample }));
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e));
  }
}

if (!adapter) {
  sampleBtn.disabled = true;
  runBtn.disabled = true;
} else {
  runBtn.addEventListener('click', async () => {
    if (!files.main) return showError('Choose a file first.');
    run([await files.main.text(), files.second ? await files.second.text() : null], false);
  });
  sampleBtn.addEventListener('click', async () => {
    try {
      const texts = await Promise.all(adapter.samples.map((f) => fetch(`../../samples/${f}`).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`Could not load the sample file ${f}.`))))));
      run(texts, true);
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e));
    }
  });
}
$('dl-main').addEventListener('click', () => output?.main && download(output.main.content, output.main.filename, output.main.type));
$('dl-csv').addEventListener('click', () => output?.csv && download(output.csv, `${output.name}.csv`, 'text/csv'));
$('open-report').addEventListener('click', () => {
  if (!output?.report) return;
  const url = URL.createObjectURL(new Blob([output.report], { type: 'text/html' }));
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
});
