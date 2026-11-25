// Content guard: flags copy that could get a company into legal, regulatory or
// brand trouble before anyone sees it published. Any flag raises the task's
// risk to high, which always needs a human, in every mode and trust level.

import type { BrandBrain, Task } from '../core/types.ts';

const RISKY: { re: RegExp; why: string }[] = [
  { re: /\bguarantee(d|s)?\b/i, why: 'Promises a guaranteed result' },
  { re: /\brisk[- ]free\b|\bno risk\b/i, why: 'Claims there is no risk' },
  { re: /(#1\b|\bnumber one\b|\bno\. ?1\b)/i, why: 'Ranking claim ("#1") needs proof' },
  { re: /\bbest (in|on) (the )?(world|market|industry|town|city)\b/i, why: 'Superlative claim needs proof' },
  { re: /\b100 ?%\b/i, why: 'Absolute "100%" claim' },
  { re: /\b(double|triple|10x) your (money|income|revenue|returns?)\b/i, why: 'Financial outcome promise' },
  { re: /\b(get rich|passive income|guaranteed returns?)\b/i, why: 'Financial promotion language' },
  { re: /\b(cures?|heals?|treats?) \w+/i, why: 'Health claim' },
  { re: /\blimited time\b.*\b(today only|ends tonight)\b/i, why: 'Pressure/urgency claim; check it is true' },
];

export function scanCopy(text: string, brand: BrandBrain): string[] {
  const flags = new Set<string>();
  for (const r of RISKY) if (r.re.test(text)) flags.add(r.why);
  for (const banned of brand.bannedClaims) {
    if (banned.trim() && text.toLowerCase().includes(banned.toLowerCase())) flags.add(`Uses a banned claim: "${banned}"`);
  }
  return [...flags];
}

/** Channel-specific rules that come from law or platform policy, not taste. */
export function scanTask(task: Task, brand: BrandBrain, weeklyAdBudget: number): string[] {
  const flags = scanCopy(`${task.title}\n${task.body}`, brand);
  if (task.action === 'send' && task.channel === 'email' && !/unsubscribe/i.test(task.body)) {
    flags.push('Marketing email has no unsubscribe line (CAN-SPAM / GDPR)');
  }
  if (task.action === 'spend') {
    const budget = Number(task.meta.budget ?? 0);
    if (budget > weeklyAdBudget) flags.push(`Ad budget ${budget} is above the weekly limit of ${weeklyAdBudget}`);
  }
  if (task.action === 'outreach' && !/(reply\s+["']?stop|opt out|not interested)/i.test(task.body)) {
    flags.push('Outreach message gives no easy way to opt out');
  }
  return flags;
}
