// A JSON snapshot of the whole company, used by the live dashboard and by the
// static report export.

import type { Engine, TaskRow, ApprovalRow } from './engine.ts';
import { j } from './db.ts';
import { allRecords } from './records.ts';
import { allRules } from './rules.ts';
import { metrics } from './metrics.ts';
import { toPstlAdrXml } from './address/xml.ts';
import { llmEnabled } from './llm.ts';

export function snapshot(engine: Engine) {
  const db = engine.db;
  const cid = engine.companyId;
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(cid) as Record<string, string | null> | undefined;
  const tasks = db.prepare('SELECT * FROM tasks WHERE company_id = ? ORDER BY rowid').all(cid) as unknown as TaskRow[];
  const agents = engine.agents();
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  const approvals = db.prepare('SELECT * FROM approvals WHERE company_id = ? ORDER BY created_at').all(cid) as unknown as ApprovalRow[];
  const audit = db.prepare('SELECT seq, ts, actor, action, entity, entity_id, details, hash FROM audit ORDER BY seq DESC LIMIT 120').all() as Record<string, string | number>[];
  const outreach = db.prepare('SELECT * FROM outreach WHERE company_id = ? ORDER BY created_at').all(cid) as Record<string, string>[];

  return {
    generatedAt: new Date().toISOString(),
    tick: engine.tickCount,
    llm: llmEnabled(),
    company: company
      ? { id: company.id, name: company.name, mission: company.mission, template: company.template, createdAt: company.created_at, report: j(company.report, null) }
      : null,
    started: engine.taskCount('ingest') > 0,
    metrics: metrics(engine),
    agents: agents.map((a) => ({
      ...a,
      reports_to_name: a.reports_to ? nameOf.get(a.reports_to) ?? null : null,
      current_task_title: a.current_task ? tasks.find((t) => t.id === a.current_task)?.title ?? null : null,
    })),
    tasks: tasks.map((t) => ({
      id: t.id, kind: t.kind, role: t.role, title: t.title, status: t.status,
      assignee: t.assignee ? nameOf.get(t.assignee) ?? t.assignee : null,
      created_by: t.created_by, created_at: t.created_at, finished_at: t.finished_at,
      result: j(t.result, null), error: t.error,
    })),
    approvals: approvals.map((a) => ({ ...a, payload: j(a.payload, {}) })),
    records: allRecords(engine).map((r) => ({
      id: r.id,
      vendor: r.source_id,
      name: r.name,
      owner: r.owner,
      status: r.status,
      formatBefore: r.format_before,
      formatAfter: r.format_after,
      original: r.source.address_text || [r.source.building, r.source.street, r.source.postcode, r.source.town, r.source.country].filter(Boolean).join(' | '),
      countryField: r.source.country || null,
      iban: r.iban,
      bic: r.bic,
      address: r.address,
      xml: r.address ? toPstlAdrXml(r.address) : null,
      confidence: r.confidence,
      method: r.method,
      evidence: r.evidence,
      issues: r.issues,
      resolvedBy: r.resolved_by,
    })),
    rules: allRules(engine).map((r) => ({ ...r, definition: j(r.definition, {}) })),
    outreach: outreach.map((o) => ({ ...o, record_ids: j(o.record_ids, []) })),
    audit: {
      ...engine.verifyAudit(),
      tail: audit.map((a) => ({ ...a, details: j(a.details as string, {}) })),
    },
  };
}

export type Snapshot = ReturnType<typeof snapshot>;
