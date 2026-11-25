// Marketing health check from the command line:
//   npm run check -- https://yourcompany.com
//   npm run check -- ./page.html
import { existsSync, readFileSync } from 'node:fs';
import { fetchSite, runHealthCheck } from '../src/checks/health-check.ts';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npm run check -- <url or html file>');
  process.exit(2);
}
const snap = existsSync(arg) ? { url: arg, html: readFileSync(arg, 'utf8') } : await fetchSite(arg);
const h = runHealthCheck(snap);
console.log(`\n${h.verdict.toUpperCase()} · ${h.score}/100\n${h.summary}\n`);
for (const f of h.findings.filter((x) => !x.passed)) console.log(`[${f.severity}] ${f.title}\n   ${f.evidence}\n   Fix: ${f.fix}\n`);
process.exit(h.verdict === 'Leaking leads' ? 1 : 0);
