import { readFileSync } from 'node:fs';
import { createCompany, recordHealth, type NewCompany } from '../src/core/orchestrator.ts';
import { runHealthCheck } from '../src/checks/health-check.ts';
import type { Company } from '../src/core/types.ts';

process.env.GROWTH_DEMO = '1'; // never call the Claude API from tests
delete process.env.GROWTH_WEBHOOK_URL;

const DEMO = new URL('../data/demo/', import.meta.url);
const DEFS = JSON.parse(readFileSync(new URL('companies.json', DEMO), 'utf8')) as (NewCompany & { site: string })[];

export function demo(which: 'autopilot' | 'copilot'): Company {
  const d = DEFS.find((x) => x.mode === which)!;
  const c = createCompany(d);
  recordHealth(c, runHealthCheck({ url: d.website, html: readFileSync(new URL(`sites/${d.site}`, DEMO), 'utf8'), llmsTxt: false }));
  return c;
}

export function site(name: string): string {
  return readFileSync(new URL(`sites/${name}`, DEMO), 'utf8');
}
