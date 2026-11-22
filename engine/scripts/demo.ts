// Headless end-to-end run: hire the team, hand over the vendor master, let the
// agents work, optionally simulate the board, then write the outputs.
//
// Usage: node scripts/demo.ts [--input data/vendor_master_sample.csv] [--out out] [--simulate-board]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Engine } from '../src/engine.ts';
import { installPaymentDataOps, loadVendorMaster } from '../src/skills/payment-data-ops.ts';
import { parseCsv, toCsv, allRecords, type SourceRow } from '../src/records.ts';
import { snapshot } from '../src/state.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name: string, dflt: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const input = opt('input', join(ROOT, 'data', 'vendor_master_sample.csv'));
const out = opt('out', join(ROOT, 'out'));
const simulateBoard = args.includes('--simulate-board');

const engine = new Engine();
installPaymentDataOps(engine, { companyName: 'Larkspur Payment Data Ops' });
const rows = parseCsv(readFileSync(input, 'utf8')) as unknown as SourceRow[];
loadVendorMaster(engine, rows);

const t0 = Date.now();
let ticks = await engine.runUntilIdle();

if (simulateBoard) {
  // A plausible first board session: activate the prevention rules, release
  // outreach, and resolve ambiguous-town reviews. Bank/address country
  // mismatches are deliberately left for a real person to judge.
  for (const ap of engine.pendingApprovals()) {
    const p = JSON.parse(ap.payload) as { reasons?: string[] };
    if (ap.kind === 'rule_activation' || ap.kind === 'outreach_send') engine.decide(ap.id, 'approved', 'board', 'First board review');
    else if (ap.kind === 'record_review' && p.reasons?.every((r) => /exists in|several states/.test(r))) {
      engine.decide(ap.id, 'approved', 'board', 'Confirmed against the vendor contract');
    }
  }
  ticks += await engine.runUntilIdle();
}
const ms = Date.now() - t0;

mkdirSync(out, { recursive: true });
const snap = snapshot(engine);
writeFileSync(join(out, 'state.json'), JSON.stringify(snap, null, 2));

const html = readFileSync(join(ROOT, 'public', 'dashboard.html'), 'utf8').replace(
  '<script>\n(() => {',
  `<script>window.__HYNIQE_SNAPSHOT__ = ${JSON.stringify(snap).replace(/</g, '\\u003c')};</script>\n<script>\n(() => {`,
);
if (!html.includes('__HYNIQE_SNAPSHOT__')) throw new Error('Could not inject snapshot into dashboard.html');
writeFileSync(join(out, 'report.html'), html);

writeFileSync(
  join(out, 'structured_addresses.csv'),
  toCsv(
    allRecords(engine).map((r) => ({
      vendor_id: r.source_id, name: r.name, status: r.status, method: r.method ?? '', confidence: r.confidence ?? '',
      StrtNm: r.address?.StrtNm ?? '', BldgNb: r.address?.BldgNb ?? '', BldgNm: r.address?.BldgNm ?? '', Flr: r.address?.Flr ?? '',
      Room: r.address?.Room ?? '', PstBx: r.address?.PstBx ?? '', PstCd: r.address?.PstCd ?? '', TwnNm: r.address?.TwnNm ?? '',
      CtrySubDvsn: r.address?.CtrySubDvsn ?? '', Ctry: r.address?.Ctry ?? '', AdrLine: (r.address?.AdrLine ?? []).join(' / '),
      resolved_by: r.resolved_by ?? '',
    })),
  ),
);

const m = snap.metrics;
const pending = snap.approvals.filter((a) => a.status === 'pending');
const lines = [
  `Hyniqe · ${snap.company?.name}`,
  `Records: ${m.total} · heartbeats: ${ticks} · ${ms} ms`,
  `ISO 20022 address compliance: ${m.qualityBefore}% -> ${m.qualityNow}%`,
  `Auto-repaired: ${m.autoRepaired} (${m.automationRate}% of records needing work) · approved by board: ${m.humanApproved}`,
  `In review: ${m.inReview} · missing vendor data: ${m.needsData} · pending decisions: ${pending.length}`,
  `Rules: ${snap.rules.map((r) => `${r.code}=${r.status}`).join(', ') || 'none'}`,
  `Credits: ${m.creditsUsed}/${m.creditsBudget} · audit chain: ${snap.audit.ok ? 'verified' : 'BROKEN'} (${snap.audit.entries} entries)`,
  `Outputs: ${join(out, 'report.html')}, state.json, structured_addresses.csv`,
];
writeFileSync(join(out, 'summary.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
if (!snap.audit.ok) process.exit(1);
