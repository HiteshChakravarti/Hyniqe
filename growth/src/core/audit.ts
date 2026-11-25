// Append-only, hash-chained record of everything agents and people do.
// Each entry's hash covers the previous one, so editing or deleting any past
// entry breaks verification. Same idea as engine/src/audit.ts.

import { createHash } from 'node:crypto';
import type { AuditEntry, Company } from './types.ts';
import { now } from './util.ts';

const GENESIS = '0'.repeat(64);

function digest(prev: string, e: Pick<AuditEntry, 'ts' | 'actor' | 'action' | 'ref' | 'details'>): string {
  return createHash('sha256')
    .update(prev)
    .update('|')
    .update(JSON.stringify([e.ts, e.actor, e.action, e.ref, e.details]))
    .digest('hex');
}

export function audit(c: Company, actor: string, action: string, ref: string, details: unknown = ''): AuditEntry {
  const prevHash = c.audit.at(-1)?.hash ?? GENESIS;
  const base = {
    ts: now(),
    actor,
    action,
    ref,
    details: typeof details === 'string' ? details : JSON.stringify(details),
  };
  const entry: AuditEntry = { seq: c.audit.length + 1, ...base, prevHash, hash: digest(prevHash, base) };
  c.audit.push(entry);
  return entry;
}

export function verifyAudit(entries: AuditEntry[]): { ok: boolean; brokenAt?: number; count: number } {
  let prev = GENESIS;
  for (const e of entries) {
    if (e.prevHash !== prev || digest(prev, e) !== e.hash) return { ok: false, brokenAt: e.seq, count: entries.length };
    prev = e.hash;
  }
  return { ok: true, count: entries.length };
}
