import { esc } from '../common.js';
import { explain } from '../../lib/solutions/payment-message-explainer/src/explain.js';
import { renderExplanation } from '../../lib/solutions/payment-message-explainer/src/report.js';

export default {
  samples: ['mt103.txt'],
  run({ main }) {
    const e = explain(main || '');
    const errors = e.findings.filter((f) => f.level === 'error').length;
    const report = renderExplanation(e);
    const checks = e.findings.map((f) => `<tr><td><span class="sev ${f.level}">${f.level}</span></td><td>${esc(f.where)}</td><td>${esc(f.message)}<br><small>${esc(f.action)}</small></td></tr>`).join('');
    const fields = e.rows.map((r) => `<tr><td>${esc(r.name)}<br><small><code>${esc(r.mt)}</code> · <code>${esc(r.mx)}</code></small></td><td colspan="2">${esc(r.value)}<br><small>${esc(r.meaning)}</small></td></tr>`).join('');
    return {
      verdict: e.summary,
      stats: [[e.format, 'message'], [errors, 'problems', errors ? 'bad' : 'good'], (() => {
        const addr = e.findings.filter((f) => f.code === 'ADDRESS_UNSTRUCTURED');
        if (!addr.length) return ['Ready', 'addresses for Nov 2026', 'good'];
        return addr.every((f) => f.level === 'warning') ? ['Fixed', 'addresses structured in the conversion', 'warn'] : ['Not ready', 'addresses for Nov 2026', 'bad'];
      })(), [e.converted.format, 'converted to']],
      table: `<tr><th></th><th>Where</th><th>Finding</th></tr>${checks || '<tr><td><span class="sev ok">ok</span></td><td colspan="2">No problems found.</td></tr>'}<tr><th colspan="3">Field by field (MT103 tag · pacs.008 element)</th></tr>${fields}`,
      note: '',
      main: { label: `Download as ${e.converted.format}`, content: e.converted.text, filename: e.converted.filename, type: e.converted.format === 'pacs.008' ? 'application/xml' : 'text/plain' },
      report,
      csv: null,
      name: 'message',
    };
  },
};
