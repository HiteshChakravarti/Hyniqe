// Payment Data Health Check: run the agent team on a client's vendor master
// and produce a client-ready report.
//
// Usage: node scripts/healthcheck.ts --input vendors.csv --client "Acme Ltd" [--out out/healthcheck] [--benchmark out/benchmark-holdout.json] [--pdf]
// --pdf uses headless Chrome/Chromium (CHROME_PATH, or google-chrome / chromium on PATH).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Engine } from '../src/engine.ts';
import { installPaymentDataOps, loadVendorMaster } from '../src/skills/payment-data-ops.ts';
import { parseCsv, type SourceRow } from '../src/records.ts';
import { snapshot } from '../src/state.ts';
import { structuredCsv } from '../src/export.ts';
import { renderHealthCheck, type BenchmarkSummary } from '../src/report/healthcheck.ts';
import { useGeoNamesIfConfigured } from '../src/address/geonames-env.ts';

const args = process.argv.slice(2);
const opt = (n: string, d = '') => (args.indexOf(`--${n}`) >= 0 ? args[args.indexOf(`--${n}`) + 1] ?? d : d);
const input = opt('input');
const client = opt('client', 'Client');
const out = opt('out', 'out/healthcheck');
const benchPath = opt('benchmark');
if (!input) {
  console.error('Usage: node scripts/healthcheck.ts --input vendors.csv --client "Acme Ltd" [--out dir] [--benchmark file] [--pdf]');
  process.exit(2);
}

const geo = useGeoNamesIfConfigured();
if (geo) console.log(geo);

const rows = parseCsv(readFileSync(input, 'utf8')) as unknown as SourceRow[];
if (!rows.length || !('vendor_id' in rows[0])) throw new Error('CSV needs vendor_id and name columns, plus address_text or street/town/country');

const engine = new Engine();
installPaymentDataOps(engine, { companyName: `${client} · Payment Data Health Check` });
loadVendorMaster(engine, rows);
await engine.runUntilIdle();

const bench = benchPath && existsSync(benchPath) ? (JSON.parse(readFileSync(benchPath, 'utf8')) as BenchmarkSummary) : null;
mkdirSync(out, { recursive: true });
const htmlPath = join(out, 'health-check.html');
writeFileSync(htmlPath, renderHealthCheck(engine, { client, benchmark: bench }));
writeFileSync(join(out, 'structured_addresses.csv'), structuredCsv(engine));
writeFileSync(join(out, 'state.json'), JSON.stringify(snapshot(engine), null, 2));

let pdf = '';
if (args.includes('--pdf')) {
  const candidates = [process.env.CHROME_PATH, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean) as string[];
  const chrome = candidates.find((c) => spawnSync(c, ['--version'], { stdio: 'ignore' }).status === 0);
  if (!chrome) console.warn('No Chrome/Chromium found: skipping PDF (set CHROME_PATH).');
  else {
    pdf = join(out, 'health-check.pdf');
    const r = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${resolve(pdf)}`, `file://${resolve(htmlPath)}`], { stdio: 'pipe' });
    if (r.status !== 0 || !existsSync(pdf)) { console.warn(`PDF generation failed: ${r.stderr?.toString().slice(0, 300)}`); pdf = ''; }
  }
}

const s = snapshot(engine).metrics;
console.log(`Health check for ${client}: ${s.total} vendors · readiness ${s.qualityBefore}% -> ${s.qualityNow}% · ${s.autoRepaired} fixed · ${s.inReview} decisions · ${s.needsData} missing data`);
console.log(`Report: ${htmlPath}${pdf ? ` and ${pdf}` : ''} · structured_addresses.csv · state.json`);
