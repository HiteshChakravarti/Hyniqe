import type { Agent } from './base.ts';
import { compose, keyword, mainOffer, pain } from './base.ts';

export const ads: Agent = {
  id: 'ads',
  name: 'Rex',
  title: 'Performance Marketer',
  replaces: 'Paid ads / performance marketer',
  does: 'Plans paid campaigns on Google, Meta or LinkedIn within your weekly budget, with ad copy to test.',
  async produce(ctx) {
    const c = ctx.company;
    if (c.weeklyAdBudget <= 0) return [];
    const o = mainOffer(c);
    const platform = c.brand.channels.includes('linkedin') && c.template !== 'local-business' ? 'LinkedIn Ads' : c.brand.channels.includes('instagram') ? 'Meta Ads' : 'Google Ads';
    const budget = c.weeklyAdBudget;
    const r = await compose(
      ctx,
      'performance marketer',
      `Write a ${platform} campaign for "${o.name}". Give 3 headline variants (max 40 characters), 2 primary texts (max 125 characters), the audience targeting and one success metric. Weekly budget ${budget}.`,
      () =>
        [
          `**Platform:** ${platform}`,
          `**Objective:** leads`,
          `**Weekly budget:** ${budget} (split 70% best ad set / 30% test)`,
          `**Audience:** ${c.brand.audience}${c.brand.location ? `, within 10 km of ${c.brand.location}` : ''}`,
          '',
          '**Headlines to test**',
          `1. ${trim(`Stop ${pain(ctx).toLowerCase()}`, 40)}`,
          `2. ${trim(`${o.name}${o.price ? ` from ${o.price}` : ''}`, 40)}`,
          `3. ${trim(`${capital(keyword(ctx))}, made simple`, 40)}`,
          '',
          '**Primary text**',
          `A. ${trim(o.pitch, 125)}`,
          `B. ${trim(`Tired of ${pain(ctx).toLowerCase()}? See how ${c.name} helps.`, 125)}`,
          '',
          '**Success metric:** cost per lead. Pause any ad above 2x the average after 3 days.',
        ].join('\n'),
    );
    return [{ day: 'Tue', title: `${platform} campaign: ${o.name}`, channel: 'ads', action: 'spend', body: r.text, meta: { budget, platform }, source: r.source }];
  },
};

function trim(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;
}
function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
