// Vendor / beneficiary records being cleaned, plus small CSV helpers.

import { randomUUID } from 'node:crypto';
import type { Engine } from './engine.ts';
import { j } from './db.ts';
import type { Issue, PostalAddress } from './address/parse.ts';

export interface SourceRow {
  vendor_id: string;
  name: string;
  address_text?: string;
  street?: string;
  building?: string;
  postcode?: string;
  town?: string;
  country?: string;
  iban?: string;
  bic?: string;
  owner?: string;
}

export type RecordStatus =
  | 'new'
  | 'compliant_pending_controls'
  | 'repaired_pending_controls'
  | 'needs_repair'
  | 'in_review'
  | 'needs_data'
  | 'awaiting_data'
  | 'compliant'
  | 'repaired';

export interface RecordRow {
  id: string;
  company_id: string;
  source_id: string;
  name: string;
  owner: string | null;
  source: string;
  iban: string | null;
  bic: string | null;
  status: RecordStatus;
  format_before: string | null;
  format_after: string | null;
  address: string | null;
  confidence: number | null;
  method: string | null;
  evidence: string | null;
  issues: string | null;
  resolved_by: string | null;
  updated_at: string | null;
}

export interface RecordView extends Omit<RecordRow, 'source' | 'address' | 'evidence' | 'issues'> {
  source: SourceRow;
  address: PostalAddress | null;
  evidence: string[];
  issues: Issue[];
}

export function view(r: RecordRow): RecordView {
  return {
    ...r,
    source: j<SourceRow>(r.source, { vendor_id: r.source_id, name: r.name }),
    address: j<PostalAddress | null>(r.address, null),
    evidence: j<string[]>(r.evidence, []),
    issues: j<Issue[]>(r.issues, []),
  };
}

export function insertRecords(engine: Engine, rows: SourceRow[]): string[] {
  const stmt = engine.db.prepare(
    'INSERT INTO records (id, company_id, source_id, name, owner, source, iban, bic, updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
  );
  const ids: string[] = [];
  for (const r of rows) {
    const id = `rc_${randomUUID().slice(0, 8)}`;
    stmt.run(id, engine.companyId, r.vendor_id, r.name, r.owner ?? null, JSON.stringify(r), r.iban || null, r.bic || null, new Date().toISOString());
    ids.push(id);
  }
  return ids;
}

export function getRecords(engine: Engine, ids: string[]): RecordView[] {
  if (!ids.length) return [];
  const rows = engine.db.prepare(`SELECT * FROM records WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) as unknown as RecordRow[];
  return rows.map(view);
}

export function allRecords(engine: Engine): RecordView[] {
  return (engine.db.prepare('SELECT * FROM records WHERE company_id = ? ORDER BY source_id').all(engine.companyId) as unknown as RecordRow[]).map(view);
}

export function recordsByStatus(engine: Engine, status: RecordStatus): RecordView[] {
  return (engine.db.prepare('SELECT * FROM records WHERE company_id = ? AND status = ? ORDER BY source_id').all(engine.companyId, status) as unknown as RecordRow[]).map(view);
}

export function updateRecord(
  engine: Engine,
  id: string,
  patch: Partial<{
    status: RecordStatus;
    format_before: string;
    format_after: string | null;
    address: PostalAddress | null;
    confidence: number | null;
    method: string;
    evidence: string[];
    issues: Issue[];
    resolved_by: string;
  }>,
): void {
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k} = ?`);
    vals.push(v === null || v === undefined ? null : typeof v === 'object' ? JSON.stringify(v) : (v as string | number));
  }
  sets.push('updated_at = ?');
  vals.push(new Date().toISOString());
  engine.db.prepare(`UPDATE records SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id);
}

// ----- CSV (RFC 4180, quoted fields may contain commas and newlines) -----

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((x) => x !== '')) rows.push(row); }
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n') + '\n';
}
