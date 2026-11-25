// What every specialist agent looks like. Each agent reads the brand brain and
// this week's brief, and returns drafts. It never publishes anything itself:
// drafts go through the content guard and the approval gate first.

import type { ActionKind, AgentId, Company, HealthCheck, Task } from '../core/types.ts';
import { write } from '../core/llm.ts';

export interface Draft {
  day: Task['day'];
  title: string;
  channel: string;
  action: ActionKind;
  body: string;
  meta?: Record<string, string | number>;
  source: 'claude' | 'demo';
}

export interface AgentContext {
  company: Company;
  week: number;
  brief: string;
  health?: HealthCheck;
  rand: () => number;
}

export interface Agent {
  id: AgentId;
  name: string;
  title: string;
  /** The human job this agent covers. */
  replaces: string;
  does: string;
  produce(ctx: AgentContext): Promise<Draft[]>;
}

/** System prompt shared by all agents: the brand brain, in words. */
export function brandSystem(c: Company, role: string): string {
  const b = c.brand;
  return [
    `You are the ${role} in the AI marketing team for ${c.name} (${c.website}).`,
    `What the company does: ${b.oneLiner}`,
    `Audience: ${b.audience}. Their pains: ${b.painPoints.join('; ')}.`,
    `Offers: ${b.offers.map((o) => `${o.name}${o.price ? ` (${o.price})` : ''}: ${o.pitch}`).join(' | ')}.`,
    `Voice: ${b.voice}. Do: ${b.voiceDo.join('; ')}. Don't: ${b.voiceDont.join('; ')}.`,
    `Never make these claims: ${b.bannedClaims.join('; ') || 'none listed'}. Never promise guaranteed results, never claim to be #1 or best without proof.`,
    b.learnings.length ? `What we learned in past weeks: ${b.learnings.slice(-5).map((l) => l.note).join(' ')}` : '',
    'Write the final copy only, ready to review. No preamble.',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function compose(ctx: AgentContext, role: string, ask: string, fallback: () => string) {
  return write(brandSystem(ctx.company, role), `${ask}\n\nThis week's brief from the Marketing Lead: ${ctx.brief}`, fallback);
}

export function mainOffer(c: Company) {
  return c.brand.offers[0] ?? { name: c.name, pitch: c.brand.oneLiner };
}

export function cta(c: Company): string {
  const o = mainOffer(c);
  return `${o.name}${o.price ? ` from ${o.price}` : ''}: ${c.website}`;
}

export function keyword(ctx: AgentContext, offset = 0): string {
  const k = ctx.company.brand.keywords;
  return k.length ? k[(ctx.week - 1 + offset) % k.length]! : ctx.company.industry;
}

export function pain(ctx: AgentContext, offset = 0): string {
  const p = ctx.company.brand.painPoints;
  return p.length ? p[(ctx.week - 1 + offset) % p.length]! : 'wasted time';
}

/** "finance managers and founders at 20-200 person companies" → "finance managers and founders". */
export function shortAudience(c: Company): string {
  return c.brand.audience.split(/,| at | who /)[0]!.trim();
}
