// "Payment Data Ops" company template: an agent team that fixes vendor and
// beneficiary address data at the source for ISO 20022 structured addresses,
// with human approval for anything uncertain and a full audit trail.

import type { Engine, Skill, AgentDef, SkillContext } from '../engine.ts';
import { j } from '../db.ts';
import { validateAddress, type PostalAddress } from '../address/parse.ts';
import { isCountryCode } from '../address/countries.ts';
import { ibanCountry } from '../address/iban.ts';
import { AUTO_ACCEPT_CONFIDENCE, controlReasons, decide, sourceText, structureRecord, type RepairDecision } from '../address/repair.ts';

export { AUTO_ACCEPT_CONFIDENCE, decide, type RepairDecision };
import { getRecords, insertRecords, recordsByStatus, updateRecord, type SourceRow, type RecordView } from '../records.ts';
import { metrics } from '../metrics.ts';
import { allRules, type RuleCheck } from '../rules.ts';
import { llmEnabled, suggestAddress } from '../llm.ts';

const BATCH = 40;
const chunk = <T>(xs: T[], n: number): T[][] => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

export const AGENTS: AgentDef[] = [
  { key: 'lead', name: 'Orin', title: 'Head of Payment Data Ops', role: 'lead', budget: 300 },
  { key: 'profiler', name: 'Nivi', title: 'Data Quality Profiler', role: 'profiler', reportsTo: 'lead', budget: 400 },
  { key: 'repair', name: 'Esha', title: 'Address Repair Analyst', role: 'repair', reportsTo: 'lead', budget: 800 },
  { key: 'controls', name: 'Karo', title: 'Payments Controls Reviewer', role: 'controls', reportsTo: 'lead', budget: 400 },
  { key: 'outreach', name: 'Turbo', title: 'Vendor Outreach Coordinator', role: 'outreach', reportsTo: 'lead', budget: 150 },
  { key: 'rules', name: 'Dex', title: 'Validation Rule Engineer', role: 'rule_engineer', reportsTo: 'lead', budget: 200 },
];

// ----- Orin: Head of Payment Data Ops (the CEO agent) -------------------

const lead: Skill = {
  role: 'lead',
  costPerTask: 3,
  handle(task, payload, ctx) {
    if (task.kind === 'ingest') {
      const rows = payload.rows as SourceRow[];
      const ids = insertRecords(ctx.engine, rows);
      const batches = chunk(ids, BATCH);
      batches.forEach((b, i) =>
        ctx.createTask({ kind: 'profile', role: 'profiler', title: `Profile batch ${i + 1}/${batches.length} (${b.length} records)`, payload: { recordIds: b } }),
      );
      ctx.log('plan.delegated', 'company', ctx.engine.companyId, { records: ids.length, batches: batches.length });
      return { records: ids.length, batches: batches.length };
    }
    if (task.kind === 'report') {
      const m = metrics(ctx.engine);
      const rules = allRules(ctx.engine);
      const pending = ctx.engine.pendingApprovals();
      const report = {
        signature: payload.signature,
        generatedAt: new Date().toISOString(),
        metrics: m,
        summary:
          `Of ${m.total} vendor records, ${m.compliantBefore} (${m.qualityBefore}%) were already ISO 20022 compliant. ` +
          `The team repaired ${m.autoRepaired} automatically with recorded evidence, and ${m.humanApproved} more after human review. ` +
          `${m.inReview} records are waiting for a reviewer decision and ${m.needsData} are missing data that only the vendor can supply. ` +
          `Compliance moved from ${m.qualityBefore}% to ${m.qualityNow}%.`,
        highlights: [
          `${pending.length} decisions are waiting for the board`,
          `${rules.filter((r) => r.status === 'active').length} of ${rules.length} prevention rules are active at vendor onboarding`,
          `${m.creditsUsed} credits used of ${m.creditsBudget} budgeted`,
        ],
      };
      ctx.engine.db.prepare('UPDATE companies SET report = ? WHERE id = ?').run(JSON.stringify(report), ctx.engine.companyId);
      return { qualityNow: m.qualityNow, pending: pending.length };
    }
    throw new Error(`Lead cannot handle ${task.kind}`);
  },
  manage(ctx) {
    const e = ctx.engine;
    if (e.taskCount('ingest') === 0) return; // waiting for the board to load data
    if (e.openTaskCount(['ingest', 'profile', 'repair', 'control', 'report']) > 0) return;

    const need = recordsByStatus(e, 'needs_data');
    if (need.length) {
      for (const r of need) updateRecord(e, r.id, { status: 'awaiting_data' });
      ctx.createTask({
        kind: 'outreach',
        role: 'outreach',
        title: `Request missing address data for ${need.length} vendor(s)`,
        payload: { recordIds: need.map((r) => r.id) },
      });
    }
    if (e.taskCount('rules') === 0) {
      ctx.createTask({ kind: 'rules', role: 'rule_engineer', title: 'Turn recurring defects into onboarding validation rules', priority: -1 });
      return;
    }
    if (e.openTaskCount() > 0) return;

    const m = metrics(e);
    const signature = JSON.stringify([m.compliantNow, m.inReview, m.needsData, e.pendingApprovals().length, allRules(e).map((r) => r.status)]);
    const company = e.db.prepare('SELECT report FROM companies WHERE id = ?').get(e.companyId) as { report: string | null };
    if (j<{ signature?: string }>(company.report, {}).signature !== signature) {
      ctx.createTask({ kind: 'report', role: 'lead', title: 'Write the board report', payload: { signature } });
    }
  },
};

// ----- Nivi: Data Quality Profiler ---------------------------------------

const profiler: Skill = {
  role: 'profiler',
  costPerTask: 4,
  handle(_task, payload, ctx) {
    const recs = getRecords(ctx.engine, payload.recordIds as string[]);
    const toRepair: string[] = [];
    const toControl: string[] = [];
    for (const r of recs) {
      const s = r.source;
      const hasFields = !!(s.town || s.street);
      if (hasFields && s.town && s.country && s.country.length === 2 && isCountryCode(s.country)) {
        const address: PostalAddress = {
          ...(s.street ? { StrtNm: s.street } : {}),
          ...(s.building ? { BldgNb: s.building } : {}),
          ...(s.postcode ? { PstCd: s.postcode } : {}),
          TwnNm: s.town,
          Ctry: s.country.toUpperCase(),
        };
        const issues = validateAddress(address);
        if (!issues.length) {
          updateRecord(ctx.engine, r.id, { status: 'compliant_pending_controls', format_before: 'structured', format_after: 'structured', address, confidence: 1, method: 'already-structured', evidence: ['Town and country already held as separate ISO-valid fields'], issues: [] });
          ctx.log('record.profiled', 'record', r.id, { vendor: r.source_id, format: 'structured' });
          toControl.push(r.id);
          continue;
        }
      }
      updateRecord(ctx.engine, r.id, { status: 'needs_repair', format_before: hasFields ? 'fields-invalid' : 'unstructured' });
      ctx.log('record.profiled', 'record', r.id, { vendor: r.source_id, format: hasFields ? 'fields-invalid' : 'unstructured' });
      toRepair.push(r.id);
    }
    if (toRepair.length) ctx.createTask({ kind: 'repair', role: 'repair', title: `Repair ${toRepair.length} addresses`, payload: { recordIds: toRepair } });
    if (toControl.length) ctx.createTask({ kind: 'control', role: 'controls', title: `Run payment controls on ${toControl.length} compliant records`, payload: { recordIds: toControl } });
    return { profiled: recs.length, compliant: toControl.length, needsRepair: toRepair.length };
  },
};

// ----- Esha: Address Repair Analyst --------------------------------------

function requestReview(ctx: SkillContext, r: RecordView, suggested: PostalAddress | null, reasons: string[]): void {
  ctx.requestApproval({
    kind: 'record_review',
    subject: `${r.source_id} ${r.name}: ${reasons.join('; ')}`,
    payload: { recordId: r.id, suggested, reasons, original: sourceText(r.source), iban: r.iban },
  });
}

const repair: Skill = {
  role: 'repair',
  costPerTask: 6,
  async handle(_task, payload, ctx) {
    const recs = getRecords(ctx.engine, payload.recordIds as string[]);
    const toControl: string[] = [];
    let review = 0;
    let missing = 0;
    let llm = 0;
    for (const r of recs) {
      const s = r.source;
      const { result, method } = structureRecord(s);
      const reviewIssues = result.issues.filter((i) => i.severity === 'review');
      const base = { address: result.address, confidence: result.confidence, method, evidence: result.evidence, issues: result.issues };

      const verdict = decide(result);
      if (verdict === 'needs_data') {
        if (llmEnabled() && ctx.charge(25, 'Claude suggestion for unresolved address')) {
          try {
            const sug = await suggestAddress({ text: sourceText(s), countryHint: s.country, bankCountry: ibanCountry(r.iban) });
            if (sug && !validateAddress(sug.address).some((i) => i.severity === 'block')) {
              updateRecord(ctx.engine, r.id, { ...base, status: 'in_review', address: sug.address, confidence: sug.confidence, method: 'llm-suggestion', evidence: [...result.evidence, `Claude: ${sug.reasoning}`], format_after: sug.address.AdrLine?.length ? 'hybrid' : 'structured' });
              requestReview(ctx, r, sug.address, ['AI suggestion for an address the rules could not resolve']);
              llm++;
              continue;
            }
          } catch (err) {
            ctx.log('llm.error', 'record', r.id, { error: err instanceof Error ? err.message : String(err) });
          }
        }
        updateRecord(ctx.engine, r.id, { ...base, status: 'needs_data', format_after: null });
        ctx.log('record.needs_data', 'record', r.id, { vendor: r.source_id, issues: result.issues.map((i) => i.code) });
        missing++;
        continue;
      }
      if (verdict === 'review') {
        updateRecord(ctx.engine, r.id, { ...base, status: 'in_review', format_after: result.format });
        ctx.log('record.escalated', 'record', r.id, { vendor: r.source_id, confidence: result.confidence, issues: reviewIssues.map((i) => i.code) });
        requestReview(ctx, r, result.address, reviewIssues.length ? reviewIssues.map((i) => i.message) : [`Confidence ${result.confidence} is below ${AUTO_ACCEPT_CONFIDENCE}`]);
        review++;
        continue;
      }
      updateRecord(ctx.engine, r.id, { ...base, status: 'repaired_pending_controls', format_after: result.format, resolved_by: ctx.agent.name });
      ctx.log('record.repaired', 'record', r.id, { vendor: r.source_id, method, confidence: result.confidence, format: result.format, address: result.address });
      toControl.push(r.id);
    }
    if (toControl.length) ctx.createTask({ kind: 'control', role: 'controls', title: `Run payment controls on ${toControl.length} repaired records`, payload: { recordIds: toControl } });
    return { repaired: toControl.length, sentToReview: review, missingData: missing, aiSuggestions: llm };
  },
};

// ----- Karo: Payments Controls Reviewer ----------------------------------

const controls: Skill = {
  role: 'controls',
  costPerTask: 4,
  handle(_task, payload, ctx) {
    const recs = getRecords(ctx.engine, payload.recordIds as string[]);
    let passed = 0;
    let flagged = 0;
    for (const r of recs) {
      const reasons = controlReasons(r);
      if (reasons.length) {
        updateRecord(ctx.engine, r.id, { status: 'in_review', evidence: [...r.evidence, ...reasons.map((x) => `Control: ${x}`)] });
        requestReview(ctx, r, r.address, reasons);
        ctx.log('record.control_failed', 'record', r.id, { vendor: r.source_id, reasons });
        flagged++;
      } else {
        updateRecord(ctx.engine, r.id, {
          status: r.status === 'compliant_pending_controls' ? 'compliant' : 'repaired',
          evidence: [...r.evidence, 'Control: bank, BIC and address countries are consistent'],
        });
        ctx.log('record.control_passed', 'record', r.id, { vendor: r.source_id });
        passed++;
      }
    }
    return { passed, flagged };
  },
};

// ----- Turbo: Vendor Outreach Coordinator --------------------------------

const outreach: Skill = {
  role: 'outreach',
  costPerTask: 8,
  handle(_task, payload, ctx) {
    const recs = getRecords(ctx.engine, payload.recordIds as string[]);
    const byOwner = new Map<string, RecordView[]>();
    for (const r of recs) {
      const k = r.owner || 'vendor-master@company.example';
      byOwner.set(k, [...(byOwner.get(k) ?? []), r]);
    }
    let drafts = 0;
    for (const [owner, list] of byOwner) {
      const lines = list.map((r) => {
        const missing = r.issues.filter((i) => i.severity === 'block').map((i) => i.code.replace('MISSING_', '').toLowerCase());
        return `- ${r.source_id} ${r.name}: missing ${missing.join(' and ') || 'confirmed address'} (current: "${sourceText(r.source).replace(/\n/g, ', ')}")`;
      });
      const subject = `Action needed: complete address details for ${list.length} vendor(s)`;
      const body = [
        `Hello,`,
        ``,
        `Cross-border payments now need the town and country of each beneficiary in separate fields (ISO 20022 structured address). We could not determine them for the vendors below, so their payments are at risk of rejection.`,
        ``,
        ...lines,
        ``,
        `Please update these vendors in the vendor master, or reply with the full address (street, building number, postcode, town and country).`,
        ``,
        `Thank you,`,
        `Payment Data Ops`,
      ].join('\n');
      const id = `or_${Math.random().toString(36).slice(2, 10)}`;
      ctx.engine.db.prepare('INSERT INTO outreach (id, company_id, owner, subject, body, record_ids, created_at) VALUES (?,?,?,?,?,?,?)').run(
        id, ctx.engine.companyId, owner, subject, body, JSON.stringify(list.map((r) => r.id)), new Date().toISOString(),
      );
      ctx.requestApproval({ kind: 'outreach_send', subject: `Send to ${owner}: ${subject}`, payload: { outreachId: id } });
      drafts++;
    }
    return { drafts, vendors: recs.length };
  },
};

// ----- Dex: Validation Rule Engineer (the "dev" agent) -------------------

const ruleEngineer: Skill = {
  role: 'rule_engineer',
  costPerTask: 15,
  handle(_task, _payload, ctx) {
    const recs = getRecords(ctx.engine, (ctx.engine.db.prepare('SELECT id FROM records WHERE company_id = ?').all(ctx.engine.companyId) as { id: string }[]).map((r) => r.id));
    const has = (r: RecordView, code: string) => r.issues.some((i) => i.code === code);
    const candidates: { code: string; title: string; rationale: string; check: RuleCheck; evidence: number }[] = [
      {
        code: 'VR-001',
        title: 'Capture town and country as separate fields at onboarding',
        rationale: 'Free-text addresses are the root cause of most repairs.',
        check: { type: 'required', fields: ['town', 'country'] },
        evidence: recs.filter((r) => r.format_before === 'unstructured').length,
      },
      {
        code: 'VR-002',
        title: 'Country must be an ISO 3166 alpha-2 code',
        rationale: 'Country names and legacy codes (e.g. "UK", "Deutschland") had to be normalised.',
        check: { type: 'iso_country', field: 'country' },
        evidence: recs.filter((r) => r.source.country && !(r.source.country.length === 2 && isCountryCode(r.source.country))).length,
      },
      {
        code: 'VR-003',
        title: 'Postcode must match the country format',
        rationale: 'Postcodes that do not fit the country format suggest a wrong country or a typo.',
        check: { type: 'postcode_format' },
        evidence: recs.filter((r) => has(r, 'POSTCODE_FORMAT')).length,
      },
      {
        code: 'VR-004',
        title: 'Bank account country must match address country, or be justified',
        rationale: 'Mismatches were the most common reason for control escalations.',
        check: { type: 'bank_country_match' },
        evidence: recs.filter((r) => r.evidence.some((e) => /^Control: Bank (account|\(BIC\)) country/.test(e))).length,
      },
      {
        code: 'VR-005',
        title: 'Ambiguous town names need a country',
        rationale: 'Towns like London or Springfield exist in several countries or states.',
        check: { type: 'unambiguous_town' },
        evidence: recs.filter((r) => has(r, 'AMBIGUOUS_TOWN')).length,
      },
    ];
    let proposed = 0;
    for (const c of candidates.filter((x) => x.evidence > 0)) {
      const id = `ru_${c.code}`;
      ctx.engine.db.prepare(
        'INSERT INTO rules (id, company_id, code, title, rationale, definition, evidence_count, proposed_by, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      ).run(id, ctx.engine.companyId, c.code, c.title, c.rationale, JSON.stringify(c.check), c.evidence, ctx.agent.name, new Date().toISOString());
      ctx.requestApproval({ kind: 'rule_activation', subject: `Activate ${c.code}: ${c.title} (seen ${c.evidence} times)`, payload: { ruleId: id } });
      proposed++;
    }
    return { proposed };
  },
};

export const SKILLS: Skill[] = [lead, profiler, repair, controls, outreach, ruleEngineer];

export function installPaymentDataOps(engine: Engine, opts: { companyName?: string } = {}): string {
  for (const s of SKILLS) engine.registerSkill(s);

  engine.onApproval('record_review', (e, ap, p, decision, by) => {
    const [r] = getRecords(e, [p.recordId]);
    if (!r) return;
    if (decision === 'approved') {
      const wasCompliant = r.format_before === 'structured';
      updateRecord(e, r.id, {
        status: wasCompliant ? 'compliant' : 'repaired',
        address: p.suggested ?? r.address,
        format_after: (p.suggested ?? r.address)?.AdrLine?.length ? 'hybrid' : 'structured',
        resolved_by: `human:${by}`,
        evidence: [...r.evidence, `Approved by ${by}${ap.note ? `: ${ap.note}` : ''}`],
      });
    } else {
      updateRecord(e, r.id, { status: 'needs_data', evidence: [...r.evidence, `Rejected by ${by}${ap.note ? `: ${ap.note}` : ''}; vendor must confirm`] });
    }
  });

  engine.onApproval('outreach_send', (e, _ap, p, decision, by) => {
    e.db.prepare('UPDATE outreach SET status = ? WHERE id = ?').run(decision === 'approved' ? 'approved' : 'cancelled', p.outreachId);
    e.audit(by, decision === 'approved' ? 'outreach.released' : 'outreach.cancelled', 'outreach', p.outreachId, {
      note: 'Sending is handed to the email connector; this demo does not send email.',
    });
  });

  engine.onApproval('rule_activation', (e, _ap, p, decision, by) => {
    e.db.prepare('UPDATE rules SET status = ? WHERE id = ?').run(decision === 'approved' ? 'active' : 'rejected', p.ruleId);
    e.audit(by, decision === 'approved' ? 'rule.activated' : 'rule.rejected', 'rule', p.ruleId, {});
  });

  return engine.createCompany({
    name: opts.companyName ?? 'Payment Data Ops',
    mission: 'Make every vendor and beneficiary address ISO 20022 compliant at the source, with evidence for every change.',
    template: 'payment-data-ops',
    agents: AGENTS,
  });
}

/** The board hands the team a vendor master extract. */
export function loadVendorMaster(engine: Engine, rows: SourceRow[], by = 'board'): string {
  return engine.createTask({
    kind: 'ingest',
    role: 'lead',
    title: `Clean vendor master extract (${rows.length} records)`,
    payload: { rows },
    priority: 10,
    createdBy: by,
  });
}
