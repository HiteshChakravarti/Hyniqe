// Lead scoring: fit + intent + source, with plain-English reasons, so a person
// can see why a lead is A, B or C. Rules, not a black box.

import type { Lead } from '../core/types.ts';

const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|live|icloud|aol|proton(mail)?|gmx|yandex|rediffmail)\./i;

const SENIOR = /\b(founder|co-?founder|ceo|cfo|coo|cto|cmo|owner|director|head|vp|vice president|partner|president|chief|manager)\b/i;

const INTENT: { re: RegExp; pts: number; why: string }[] = [
  { re: /\b(pricing|price|cost|quote|budget|how much)\b/i, pts: 20, why: 'asked about price' },
  { re: /\b(demo|call|meeting|talk|book|catering|event|order)\b/i, pts: 15, why: 'wants a conversation or order' },
  { re: /\b(asap|urgent|this week|today|tomorrow|deadline|soon)\b/i, pts: 15, why: 'has a deadline' },
  { re: /\b(switch|replace|moving from|alternative to|currently use)\b/i, pts: 10, why: 'is switching from another provider' },
  { re: /\b(team of|employees|staff|people|guests|\d{2,} (users|people|guests|staff))\b/i, pts: 8, why: 'mentioned size' },
];

const SPAM = /\b(seo services|backlinks|crypto|casino|loan offer|guest post|rank you #?1)\b/i;

const SOURCE_PTS: Record<string, number> = { 'demo-request': 20, 'contact-form': 12, 'booking': 20, 'ad': 8, 'newsletter': 3, 'social': 6, 'referral': 15 };

export function scoreLead(l: Pick<Lead, 'email' | 'company' | 'title' | 'message' | 'source'>): { score: number; grade: Lead['grade']; reasons: string[] } {
  const reasons: string[] = [];
  let score = 10;
  if (SPAM.test(l.message)) return { score: 0, grade: 'C', reasons: ['looks like spam or a sales pitch'] };
  if (l.email && !FREE_MAIL.test(l.email)) {
    score += 15;
    reasons.push('uses a company email');
  }
  if (l.company.trim()) {
    score += 5;
    reasons.push(`works at ${l.company.trim()}`);
  }
  if (SENIOR.test(l.title)) {
    score += 15;
    reasons.push(`is a decision-maker (${l.title.trim()})`);
  }
  for (const i of INTENT) {
    if (i.re.test(l.message)) {
      score += i.pts;
      reasons.push(i.why);
    }
  }
  const src = SOURCE_PTS[l.source] ?? 5;
  score += src;
  reasons.push(`came from ${l.source}`);
  score = Math.min(100, score);
  const grade = score >= 65 ? 'A' : score >= 40 ? 'B' : 'C';
  return { score, grade, reasons };
}
