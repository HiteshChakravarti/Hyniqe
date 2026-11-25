// Seeds the two demo companies: one with no marketing team (Autopilot) and one
// with a team (Copilot), each with a health check of its demo website.

import { readFileSync } from 'node:fs';
import type { Store } from './core/store.ts';
import type { Company } from './core/types.ts';
import { createCompany, recordHealth, type NewCompany } from './core/orchestrator.ts';
import { runHealthCheck } from './checks/health-check.ts';

const DEMO = new URL('../data/demo/', import.meta.url);

export function seedDemo(store: Store): Company[] {
  const defs = JSON.parse(readFileSync(new URL('companies.json', DEMO), 'utf8')) as (NewCompany & { site: string })[];
  const out: Company[] = [];
  for (const d of defs) {
    const c = createCompany(d);
    const html = readFileSync(new URL(`sites/${d.site}`, DEMO), 'utf8');
    recordHealth(c, runHealthCheck({ url: d.website, html, llmsTxt: false }));
    store.save(c);
    out.push(c);
  }
  return out;
}

/** The demo websites, so the health check also works offline for the demo URLs. */
export function demoSite(url: string): string | undefined {
  const defs = JSON.parse(readFileSync(new URL('companies.json', DEMO), 'utf8')) as { website: string; site: string }[];
  const hit = defs.find((d) => url.replace(/\/$/, '') === d.website);
  return hit ? readFileSync(new URL(`sites/${hit.site}`, DEMO), 'utf8') : undefined;
}
