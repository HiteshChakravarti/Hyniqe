import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv } from '../../shared/csv.ts';
import { generateSsis, leiWithCheck } from '../src/sample.ts';
import { renderSsiReport } from '../src/report.ts';
import { bic11, checkSsis, compareSsis, leiValid } from '../src/ssi.ts';

const asOf = new Date(Date.UTC(2026, 10, 1));
const base = {
  ssi_id: 'A1', counterparty: 'Aldgate Capital', counterparty_lei: leiWithCheck('549300ABCDEFGHJK12'), asset_class: 'EQU', market: 'DE', currency: 'EUR',
  pset_bic: 'DAKVDEFFXXX', agent_bic: 'AGNTDEFFXXX', safekeeping_account: '12345678', cash_agent_bic: 'AGNTDEFFXXX',
  cash_account: 'DE89370400440532013000', last_verified: '2026-09-01', source: 'SSI platform',
};
const codes = (rows: Record<string, string>[]): string[] => checkSsis(rows, { asOf }).findings.map((f) => f.code);

test('a clean SSI passes', () => {
  assert.deepEqual(codes([base]), []);
});

test('agent BIC in the PSET field is caught', () => {
  assert.ok(codes([{ ...base, pset_bic: 'AGNTDEFFXXX' }]).includes('PSET_NOT_CSD'));
});

test('a CSD from another market is caught for equities but only reviewed for bonds', () => {
  const eq = checkSsis([{ ...base, pset_bic: 'SICVFRPPXXX' }], { asOf }).findings.find((f) => f.code === 'PSET_MARKET_MISMATCH');
  const fi = checkSsis([{ ...base, asset_class: 'FI', pset_bic: 'SICVFRPPXXX' }], { asOf }).findings.find((f) => f.code === 'PSET_MARKET_MISMATCH');
  assert.equal(eq?.severity, 'error');
  assert.equal(fi?.severity, 'review');
  assert.deepEqual(codes([{ ...base, asset_class: 'FI', pset_bic: 'MGTCBEBEECL' }]), []);
});

test('LEI, IBAN and BIC validation', () => {
  assert.ok(leiValid(base.counterparty_lei));
  assert.ok(!leiValid(base.counterparty_lei.slice(0, -1) + '0') || base.counterparty_lei.endsWith('0'));
  assert.ok(codes([{ ...base, cash_account: 'DE89370400440532013001' }]).includes('CASH_IBAN_INVALID'));
  assert.ok(codes([{ ...base, agent_bic: 'AG0TDEFFXXX' }]).includes('BIC_FORMAT'));
  assert.equal(bic11('DAKVDEFF'), 'DAKVDEFFXXX');
});

test('staleness, channel and conflicts', () => {
  assert.ok(codes([{ ...base, last_verified: '2024-01-01' }]).includes('STALE'));
  assert.ok(codes([{ ...base, source: 'email from ops' }]).includes('UNAUTHENTICATED_SOURCE'));
  const c = codes([base, { ...base, ssi_id: 'A2', safekeeping_account: '999' }]);
  assert.ok(c.includes('CONFLICT'));
  assert.ok(codes([base, { ...base, ssi_id: 'A2' }]).includes('DUPLICATE'));
});

test('golden-source comparison ignores cosmetic differences', () => {
  const ours = [{ ...base, agent_bic: 'agntdeff', cash_account: 'DE89 3704 0044 0532 0130 00' }];
  assert.equal(compareSsis(ours, [base]).matched, 1);
  const diff = compareSsis([{ ...base, safekeeping_account: '87654321' }], [base]);
  assert.equal(diff.findings[0].code, 'MISMATCH_SAFEKEEPING');
});

test('every injected defect is detected and no clean SSI is flagged', () => {
  const g = generateSsis({ count: 800, seed: 3 });
  const all = [...checkSsis(g.rows, { asOf }).findings, ...compareSsis(g.rows, g.golden).findings].filter((f) => f.severity !== 'info');
  for (const [id, code] of g.labels) assert.ok(all.some((f) => f.ssiId === id && f.code === code), `${id} ${code}`);
  const flagged = new Set(all.map((f) => f.ssiId));
  for (const r of g.rows) if (!g.labels.has(r.ssi_id)) assert.ok(!flagged.has(r.ssi_id), `false flag ${r.ssi_id}`);
});

test('CSV input with other column names and a report renders', () => {
  const csv = 'Reference;Counterparty;LEI;Market;CCY;Place of Settlement;Custodian BIC;Securities Account;IBAN;Verified On\nX1;Brightwater;' + base.counterparty_lei + ';Germany;EUR;DAKVDEFF;AGNTDEFFXXX;111;DE89370400440532013000;01/09/2026\n';
  const res = checkSsis(parseCsv(csv), { asOf });
  assert.equal(res.ssis[0].market, 'DE');
  assert.deepEqual(res.findings.map((f) => f.code), []);
  const html = renderSsiReport({ check: res, asOf, client: 'Test' });
  assert.match(html, /T\+1 SSI Readiness Report/);
  assert.match(html, /100\.0%/);
});
