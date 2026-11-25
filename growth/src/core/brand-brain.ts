// The brand brain: everything the agents must know about a company to sound
// like it and sell for it. Starts from an industry template, then the company
// fills it in, and the Friday report adds learnings every week.

import { readFileSync, readdirSync } from 'node:fs';
import type { AgentId, BrandBrain, Mode, Teammate, TrustLevel } from './types.ts';
import { id } from './util.ts';

export interface Template {
  id: string;
  label: string;
  industry: string;
  weeklyAdBudget: number;
  trust: TrustLevel;
  goals: string[];
  brand: Omit<BrandBrain, 'learnings'>;
  team: { name: string; role: string; reviews: AgentId[] }[];
}

const DIR = new URL('../../templates/', import.meta.url);

export function listTemplates(): Template[] {
  return readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(new URL(f, DIR), 'utf8')) as Template);
}

export function loadTemplate(templateId: string): Template {
  const t = listTemplates().find((x) => x.id === templateId);
  if (!t) throw new Error(`Unknown template "${templateId}"`);
  return t;
}

export function brandFrom(t: Template, overrides: Partial<BrandBrain> = {}): BrandBrain {
  return { ...structuredClone(t.brand), learnings: [], ...overrides };
}

export function teamFrom(t: Template, mode: Mode, given?: Omit<Teammate, 'id'>[]): Teammate[] {
  if (mode === 'autopilot') return [];
  const src: Omit<Teammate, 'id'>[] = given?.length ? given : t.team;
  return src.map((m) => ({ id: id('tm'), name: m.name, role: m.role, reviews: [...m.reviews], ...(m.email ? { email: m.email } : {}) }));
}

const LIST_FIELDS = ['voiceDo', 'voiceDont', 'painPoints', 'competitors', 'channels', 'keywords', 'bannedClaims'] as const;
const TEXT_FIELDS = ['oneLiner', 'voice', 'audience', 'location'] as const;

/** Apply an edit from the dashboard, keeping only known fields with the right shape. */
export function patchBrand(b: BrandBrain, patch: Record<string, unknown>): BrandBrain {
  const next = structuredClone(b);
  for (const f of TEXT_FIELDS) {
    if (typeof patch[f] === 'string') next[f] = (patch[f] as string).slice(0, 500);
  }
  for (const f of LIST_FIELDS) {
    const v = patch[f];
    if (Array.isArray(v)) next[f] = v.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 20);
    else if (typeof v === 'string') next[f] = v.split(/\n|,/).map((s) => s.trim()).filter(Boolean).slice(0, 20);
  }
  if (Array.isArray(patch.offers)) {
    next.offers = (patch.offers as Record<string, unknown>[])
      .filter((o) => o && typeof o.name === 'string' && o.name.trim())
      .slice(0, 6)
      .map((o) => ({ name: String(o.name).trim(), pitch: String(o.pitch ?? '').trim(), ...(o.price ? { price: String(o.price).trim() } : {}) }));
  }
  return next;
}
