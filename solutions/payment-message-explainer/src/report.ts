// Payment message explanation report.
import { esc, reportPage } from '../../shared/html.ts';
import type { Explanation } from './explain.ts';

export function renderExplanation(e: Explanation, opts: { generatedAt?: Date } = {}): string {
  const body = `
<h2>In plain English</h2>
<p>${esc(e.summary)}</p>
<div class="tiles"><div class="tile"><b>${e.format}</b><span>message type</span></div><div class="tile"><b>${e.findings.filter((f) => f.level === 'error').length}</b><span>problems</span></div><div class="tile"><b>${e.addressReady ? 'Yes' : 'No'}</b><span>addresses ready for Nov 2026</span></div></div>
<h2>Checks</h2>
<table><tr><th></th><th>Where</th><th>Finding</th><th>What to do</th></tr>
${e.findings.map((f) => `<tr><td><span class="pill ${f.level === 'error' ? 'error' : f.level === 'warning' ? 'review' : 'info'}">${f.level}</span></td><td>${esc(f.where)}</td><td>${esc(f.message)}</td><td>${esc(f.action)}</td></tr>`).join('') || '<tr><td colspan="4">No problems found.</td></tr>'}</table>
<h2>Field by field</h2>
<table><tr><th>Field</th><th>MT103</th><th>pacs.008</th><th>Value</th><th>What it means</th></tr>
${e.rows.map((r) => `<tr><td>${esc(r.name)}</td><td><code>${esc(r.mt)}</code></td><td><code>${esc(r.mx)}</code></td><td>${esc(r.value)}</td><td>${esc(r.meaning)}</td></tr>`).join('')}</table>
<h2>The same payment as ${e.converted.format}</h2>
<pre>${esc(e.converted.text)}</pre>
<p>The converted message is a starting point for testing and investigation, not a substitute for your bank's own conversion. It follows CBPR+ usage for the fields an MT103 carries.</p>`;
  return reportPage({ title: 'Payment message explained', subtitle: e.format, body, generatedAt: opts.generatedAt });
}
