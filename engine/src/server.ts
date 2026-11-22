// Live dashboard server. Zero dependencies: node:http + the engine.
// Usage: npm start   (then open http://localhost:4317)

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Engine } from './engine.ts';
import { installPaymentDataOps, loadVendorMaster } from './skills/payment-data-ops.ts';
import { parseCsv, toCsv, allRecords, type SourceRow } from './records.ts';
import { validateAtSource } from './rules.ts';
import { snapshot } from './state.ts';
import { renderHealthCheck } from './report/healthcheck.ts';
import { useGeoNamesIfConfigured } from './address/geonames-env.ts';

const geo = useGeoNamesIfConfigured();
if (geo) console.log(geo);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 4317);
const TICK_MS = Number(process.env.HYNIQE_TICK_MS ?? 700);
const COMPANY = process.env.HYNIQE_COMPANY ?? 'Larkspur Payment Data Ops';
const MAX_BODY = 5 * 1024 * 1024;

let engine = boot();
let busy = false;

function boot(): Engine {
  const e = new Engine(process.env.HYNIQE_DB ?? ':memory:');
  installPaymentDataOps(e, { companyName: COMPANY });
  return e;
}

setInterval(async () => {
  if (busy) return;
  busy = true;
  try {
    await engine.tick();
  } catch (err) {
    console.error('heartbeat error', err);
  } finally {
    busy = false;
  }
}, TICK_MS);

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json'): void {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > MAX_BODY) throw new Error('Body too large');
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function rowsFromCsv(text: string): SourceRow[] {
  const rows = parseCsv(text) as unknown as SourceRow[];
  if (!rows.length || !('vendor_id' in rows[0]) || !('name' in rows[0])) {
    throw new Error('CSV needs at least vendor_id and name columns, plus address_text or street/town/country');
  }
  return rows;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return send(res, 200, readFileSync(join(ROOT, 'public', 'dashboard.html'), 'utf8'), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, snapshot(engine));

    if (req.method === 'POST' && url.pathname === '/api/load-sample') {
      if (engine.taskCount('ingest') > 0) return send(res, 409, { error: 'Data already loaded. Reset first.' });
      const rows = rowsFromCsv(readFileSync(join(ROOT, 'data', 'vendor_master_sample.csv'), 'utf8'));
      return send(res, 200, { taskId: loadVendorMaster(engine, rows), records: rows.length });
    }
    if (req.method === 'POST' && url.pathname === '/api/upload') {
      if (engine.taskCount('ingest') > 0) return send(res, 409, { error: 'Data already loaded. Reset first.' });
      const rows = rowsFromCsv(await readBody(req));
      return send(res, 200, { taskId: loadVendorMaster(engine, rows), records: rows.length });
    }
    const m = url.pathname.match(/^\/api\/approvals\/([\w-]+)$/);
    if (req.method === 'POST' && m) {
      const body = JSON.parse((await readBody(req)) || '{}') as { decision?: string; note?: string; by?: string };
      if (body.decision !== 'approved' && body.decision !== 'rejected') return send(res, 400, { error: 'decision must be approved or rejected' });
      return send(res, 200, engine.decide(m[1], body.decision, (body.by || 'board').slice(0, 60), body.note?.slice(0, 500)));
    }
    if (req.method === 'POST' && url.pathname === '/api/validate') {
      const row = JSON.parse((await readBody(req)) || '{}') as SourceRow;
      return send(res, 200, validateAtSource(engine, row));
    }
    if (req.method === 'GET' && url.pathname === '/api/export.csv') {
      const rows = allRecords(engine).map((r) => ({
        vendor_id: r.source_id, name: r.name, status: r.status, method: r.method, confidence: r.confidence,
        StrtNm: r.address?.StrtNm ?? '', BldgNb: r.address?.BldgNb ?? '', BldgNm: r.address?.BldgNm ?? '', Flr: r.address?.Flr ?? '',
        Room: r.address?.Room ?? '', PstBx: r.address?.PstBx ?? '', PstCd: r.address?.PstCd ?? '', TwnNm: r.address?.TwnNm ?? '',
        CtrySubDvsn: r.address?.CtrySubDvsn ?? '', Ctry: r.address?.Ctry ?? '', AdrLine: (r.address?.AdrLine ?? []).join(' / '),
        resolved_by: r.resolved_by ?? '',
      }));
      res.setHeader('content-disposition', 'attachment; filename="structured_addresses.csv"');
      return send(res, 200, toCsv(rows), 'text/csv; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/api/healthcheck.html') {
      if (engine.taskCount('ingest') === 0) return send(res, 409, { error: 'Load vendor data first' });
      const client = (url.searchParams.get('client') || COMPANY).slice(0, 80);
      return send(res, 200, renderHealthCheck(engine, { client }), 'text/html; charset=utf-8');
    }
    if (req.method === 'POST' && url.pathname === '/api/reset') {
      engine = boot();
      return send(res, 200, { ok: true });
    }
    send(res, 404, { error: 'Not found' });
  } catch (err) {
    send(res, 400, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`Hyniqe engine running: http://localhost:${PORT}  (heartbeat every ${TICK_MS} ms)`);
  console.log('No authentication: keep this on localhost until auth is added.');
});
