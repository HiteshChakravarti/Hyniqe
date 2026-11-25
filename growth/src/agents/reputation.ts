import type { Agent, Draft } from './base.ts';
import { compose } from './base.ts';

export const reputation: Agent = {
  id: 'reputation',
  name: 'Ren',
  title: 'Reviews & Community Manager',
  replaces: 'Community / reputation manager',
  does: 'Replies to new reviews and comments in your voice and asks happy customers for reviews.',
  async produce(ctx) {
    const c = ctx.company;
    const reviews = REVIEWS[c.template] ?? REVIEWS.saas!;
    const out: Draft[] = [];
    for (const rv of reviews) {
      const r = await compose(
        ctx,
        'community manager',
        `Write a public reply (under 60 words) to this ${rv.stars}-star review: "${rv.text}". Thank them by first name, be specific, and if negative, apologise once and offer to fix it offline.`,
        () =>
          rv.stars >= 4
            ? `Thank you, ${rv.name}! We're really glad ${rv.hook}. See you again soon. The ${c.name} team`
            : `Hi ${rv.name}, thank you for telling us, and we're sorry ${rv.hook}. That's not the experience we want for anyone. Could you email us at ${c.owner.email ?? 'our support address'} so we can put it right?`,
      );
      out.push({ day: 'Tue', title: `Reply to ${rv.stars}★ review from ${rv.name}`, channel: 'reviews', action: 'reply', body: `> ${rv.text}\n\n${r.text}`, meta: { stars: rv.stars }, source: r.source });
    }
    return out;
  },
};

// Sample reviews for the demo. A review connector (Google Business Profile,
// Trustpilot, G2) replaces these with real ones.
const REVIEWS: Record<string, { name: string; stars: number; text: string; hook: string }[]> = {
  'local-business': [
    { name: 'Priya', stars: 5, text: 'Best chai and samosas around, and the staff remembered my order!', hook: 'the chai and samosas hit the spot' },
    { name: 'Tom', stars: 2, text: 'Waited 25 minutes for a takeaway on Saturday.', hook: 'you waited so long on Saturday' },
  ],
  saas: [
    { name: 'Dana', stars: 5, text: 'Set up in an afternoon and month-end is so much calmer.', hook: 'month-end feels calmer' },
    { name: 'Marco', stars: 3, text: 'Good product but the bank sync broke twice last month.', hook: 'the bank sync let you down' },
  ],
  fintech: [{ name: 'Leah', stars: 4, text: 'Clear pricing and fast onboarding.', hook: 'onboarding was quick and clear' }],
  agency: [{ name: 'Sam', stars: 5, text: 'They doubled our qualified leads in a quarter.', hook: 'the quarter went so well' }],
};
