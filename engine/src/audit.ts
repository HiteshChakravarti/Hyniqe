// Append-only, hash-chained audit log. Each entry's hash covers the previous
// hash, so editing or deleting any past entry breaks verification.

import { createHash } from 'node:crypto';
import type { DB } from './db.ts';

export interface AuditEntry {
  seq: number;
  ts: string;
  company_id: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: string;
  prev_hash: string;
  hash: string;
}

const GENESIS = '0'.repeat(64);

function digest(prev: string, e: Omit<AuditEntry, 'seq' | 'hash' | 'prev_hash'>): string {
  return createHash('sha256')
    .update(prev)
    .update('|')
    .update(JSON.stringify([e.ts, e.company_id, e.actor, e.action, e.entity, e.entity_id, e.details]))
    .digest('hex');
}

export function appendAudit(
  db: DB,
  e: { companyId: string; actor: string; action: string; entity: string; entityId?: string | null; details?: unknown },
): string {
  const last = db.prepare('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1').get() as { hash: string } | undefined;
  const prev = last?.hash ?? GENESIS;
  const row = {
    ts: new Date().toISOString(),
    company_id: e.companyId,
    actor: e.actor,
    action: e.action,
    entity: e.entity,
    entity_id: e.entityId ?? null,
    details: JSON.stringify(e.details ?? {}),
  };
  const hash = digest(prev, row);
  db.prepare(
    'INSERT INTO audit (ts, company_id, actor, action, entity, entity_id, details, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?,?)',
  ).run(row.ts, row.company_id, row.actor, row.action, row.entity, row.entity_id, row.details, prev, hash);
  return hash;
}

export function verifyAudit(db: DB): { ok: boolean; entries: number; brokenAt?: number } {
  const rows = db.prepare('SELECT * FROM audit ORDER BY seq').all() as unknown as AuditEntry[];
  let prev = GENESIS;
  for (const r of rows) {
    if (r.prev_hash !== prev || digest(prev, r) !== r.hash) return { ok: false, entries: rows.length, brokenAt: r.seq };
    prev = r.hash;
  }
  return { ok: true, entries: rows.length };
}
