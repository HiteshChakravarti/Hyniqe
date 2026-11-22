import type { Engine } from './engine.ts';
import { allRecords } from './records.ts';

/** Minutes an operations analyst typically spends repairing one address by hand. An assumption, shown as such in the UI. */
export const MINUTES_PER_MANUAL_REPAIR = 6;

export function metrics(engine: Engine) {
  const recs = allRecords(engine);
  const total = recs.length;
  const count = (f: (r: (typeof recs)[number]) => boolean) => recs.filter(f).length;
  const compliantBefore = count((r) => r.format_before === 'structured');
  const autoRepaired = count((r) => r.status === 'repaired' && !String(r.resolved_by ?? '').startsWith('human:'));
  const humanApproved = count((r) => r.status === 'repaired' && String(r.resolved_by ?? '').startsWith('human:'));
  const compliantNow = count((r) => r.status === 'compliant' || r.status === 'repaired');
  const inReview = count((r) => r.status === 'in_review');
  const needsData = count((r) => r.status === 'needs_data' || r.status === 'awaiting_data');
  const inFlight = total - compliantNow - inReview - needsData;
  const agents = engine.agents();
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);
  return {
    total,
    compliantBefore,
    compliantNow,
    autoRepaired,
    humanApproved,
    inReview,
    needsData,
    inFlight,
    qualityBefore: pct(compliantBefore),
    qualityNow: pct(compliantNow),
    automationRate: total - compliantBefore ? Math.round((autoRepaired / (total - compliantBefore)) * 1000) / 10 : 0,
    creditsUsed: agents.reduce((s, a) => s + a.spent, 0),
    creditsBudget: agents.reduce((s, a) => s + a.budget, 0),
    hoursSaved: Math.round(((autoRepaired * MINUTES_PER_MANUAL_REPAIR) / 60) * 10) / 10,
  };
}

export type Metrics = ReturnType<typeof metrics>;
