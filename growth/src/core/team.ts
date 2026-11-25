// Copilot mode: the company's own marketing team. Each teammate owns some
// agents' work and reviews it, can reassign it to someone else, and comments.

import type { AgentId, Company, Teammate } from './types.ts';
import { audit } from './audit.ts';
import { id } from './util.ts';

export function personName(c: Company, who: string): string {
  if (who === 'owner') return `${c.owner.name} (owner)`;
  if (who === 'auto') return 'Auto-approved';
  return c.team.find((m) => m.id === who)?.name ?? who;
}

export function addTeammate(c: Company, m: { name: string; role: string; email?: string; reviews?: AgentId[] }, by = 'owner'): Teammate {
  if (!m.name?.trim()) throw new Error('A teammate needs a name.');
  const t: Teammate = { id: id('tm'), name: m.name.trim(), role: (m.role ?? '').trim() || 'Marketing', reviews: m.reviews ?? [], ...(m.email ? { email: m.email } : {}) };
  // An agent has one owner: take it away from whoever had it.
  for (const other of c.team) other.reviews = other.reviews.filter((a) => !t.reviews.includes(a));
  c.team.push(t);
  audit(c, by, 'team.added', t.id, { name: t.name, reviews: t.reviews });
  return t;
}

export function setOwnership(c: Company, teammateId: string, reviews: AgentId[], by = 'owner'): void {
  const t = c.team.find((m) => m.id === teammateId);
  if (!t) throw new Error('No such teammate.');
  for (const other of c.team) if (other !== t) other.reviews = other.reviews.filter((a) => !reviews.includes(a));
  t.reviews = [...new Set(reviews)];
  audit(c, by, 'team.ownership', t.id, { reviews: t.reviews });
}

export function removeTeammate(c: Company, teammateId: string, by = 'owner'): void {
  const t = c.team.find((m) => m.id === teammateId);
  if (!t) throw new Error('No such teammate.');
  c.team = c.team.filter((m) => m.id !== teammateId);
  // Their open reviews fall back to the owner.
  for (const task of c.tasks) {
    if (task.approver === teammateId && (task.status === 'pending_approval' || task.status === 'changes_requested')) task.approver = 'owner';
  }
  audit(c, by, 'team.removed', teammateId, { name: t.name });
}
