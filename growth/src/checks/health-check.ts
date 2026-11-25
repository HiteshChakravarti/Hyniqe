// Marketing Health Check: the Shield pattern applied to marketing.
// Scan a web page → a plain verdict → a fix for every problem, each handed to
// the agent that will fix it. It only reads the page; it never changes it.
// The rules live in health-core.ts so the website can run them in the browser.

import { readFileSync } from 'node:fs';
import type { HealthCheck } from '../core/types.ts';
import { checkPage, type Rule, type SiteSnapshot } from './health-core.ts';

export type { Rule, SiteSnapshot };

export const RULES: Rule[] = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));

export function runHealthCheck(s: SiteSnapshot): HealthCheck {
  return checkPage(RULES, s);
}

/** Fetch a live page (and /llms.txt). Used by the server on the user's own machine. */
export async function fetchSite(url: string, fetchImpl: typeof fetch = fetch): Promise<SiteSnapshot> {
  const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  const res = await fetchImpl(u, { redirect: 'follow', signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'HyniqeGrowth-HealthCheck/0.1 (+https://github.com/HiteshChakravarti/Hyniqe)' } });
  if (!res.ok) throw new Error(`The site answered ${res.status}`);
  const html = (await res.text()).slice(0, 2_000_000);
  let llmsTxt = false;
  try {
    const l = await fetchImpl(new URL('/llms.txt', res.url), { signal: AbortSignal.timeout(5000) });
    llmsTxt = l.ok && !/<html/i.test((await l.text()).slice(0, 200));
  } catch {
    llmsTxt = false;
  }
  return { url: res.url || u.href, html, llmsTxt };
}
