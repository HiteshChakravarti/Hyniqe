// The approval gate. Decides, for each task, how risky it is and who must say
// yes before it reaches the outside world.
//
// Rules that hold in every mode:
//   - internal work (plans, audits, briefs, reports) never needs approval
//   - anything flagged by the content guard is high risk and needs a human
//   - spending money above the weekly budget always needs a human
//   - nothing is published unless its status is 'approved'

import type { ActionKind, AgentId, Company, Risk, Task } from './types.ts';

export const AREA: Record<AgentId, string> = {
  'marketing-lead': 'Strategy',
  content: 'Content',
  seo: 'SEO & AI search',
  social: 'Social media',
  design: 'Design & video',
  ads: 'Paid ads',
  email: 'Email & CRM',
  sdr: 'Outreach & lead gen',
  'web-cro': 'Website & conversion',
  analytics: 'Analytics',
  reputation: 'Reviews & community',
};

const BASE_RISK: Record<ActionKind, Risk> = {
  internal: 'low',
  publish: 'medium',
  reply: 'medium',
  send: 'medium',
  outreach: 'high',
  spend: 'high',
};

export function riskOf(action: ActionKind, flags: string[]): Risk {
  if (flags.length) return 'high';
  return BASE_RISK[action];
}

/** Autopilot: which actions run without asking, by trust level. */
function autoAllowed(c: Company, task: Task): boolean {
  if (task.action === 'internal') return true;
  if (task.flags.length) return false;
  if (c.trust === 'cautious') return false;
  if (c.trust === 'balanced') return task.action === 'publish' && task.channel !== 'website';
  // hands-off
  return task.action === 'publish' || task.action === 'send' || task.action === 'reply';
}

export function route(c: Company, task: Task): { approver: string; reason: string } {
  if (task.action === 'internal') return { approver: 'auto', reason: 'Internal work: nothing leaves the company.' };

  if (c.mode === 'autopilot') {
    if (autoAllowed(c, task)) {
      return { approver: 'auto', reason: `Allowed by the ${c.trust} trust level and nothing was flagged.` };
    }
    const why = task.flags.length
      ? `Flagged: ${task.flags.join('; ')}.`
      : task.action === 'spend'
        ? 'Spends money.'
        : task.action === 'outreach'
          ? 'One-to-one outreach to a prospect.'
          : `"${task.action}" needs a yes at the ${c.trust} trust level.`;
    return { approver: 'owner', reason: why };
  }

  // Copilot: the teammate who owns this agent's area reviews it.
  const reviewer = c.team.find((m) => m.reviews.includes(task.agent)) ?? c.team[0];
  if (!reviewer) return { approver: 'owner', reason: 'No teammate owns this area yet, so it goes to the owner.' };
  const why = task.flags.length ? ` Flagged: ${task.flags.join('; ')}.` : '';
  return { approver: reviewer.id, reason: `${reviewer.name} (${reviewer.role}) owns ${AREA[task.agent]}.${why}` };
}

export type Decision = 'approve' | 'reject' | 'changes';

export function canDecide(c: Company, task: Task, by: string): boolean {
  if (task.status !== 'pending_approval' && task.status !== 'changes_requested') return false;
  if (by === 'owner') return true; // the owner can always step in
  return task.approver === by;
}
