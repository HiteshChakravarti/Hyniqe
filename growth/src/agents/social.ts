import type { Agent, Draft } from './base.ts';
import { compose, cta, keyword, pain, shortAudience } from './base.ts';

const SOCIAL = ['linkedin', 'instagram', 'facebook', 'x', 'tiktok'];

export const social: Agent = {
  id: 'social',
  name: 'Kai',
  title: 'Social Media Manager',
  replaces: 'Social media manager',
  does: 'Plans and writes the week\'s posts for each channel you use, in your voice.',
  async produce(ctx) {
    const c = ctx.company;
    const channels = c.brand.channels.filter((ch) => SOCIAL.includes(ch));
    if (!channels.length) channels.push('linkedin');
    const angles: { day: Draft['day']; angle: string; fallback: string }[] = [
      {
        day: 'Mon',
        angle: `a relatable post about the pain "${pain(ctx)}"`,
        fallback: `Be honest: how much of your week goes on ${pain(ctx).toLowerCase()}?\n\nWe hear it from ${shortAudience(c)} every day. The fix is usually smaller than you think.\n\nWhat's the one thing you'd fix first? 👇`,
      },
      {
        day: 'Wed',
        angle: `a useful tip about "${keyword(ctx)}" that links to this week's blog post`,
        fallback: `3 quick wins for ${keyword(ctx)}:\n\n1. Start with the problem, not the tool\n2. Change one thing at a time\n3. Check the result after a week\n\nFull guide on our blog → ${c.website}`,
      },
      {
        day: 'Fri',
        angle: `a post showing the offer "${c.brand.offers[0]?.name ?? c.name}" with a clear call to action`,
        fallback: c.template === 'local-business'
          ? `Weekend plans sorted. ${c.brand.offers[0]?.pitch ?? ''}\n\nOur regulars voted us the best in town, come and see why. ${cta(c)}`
          : `${c.brand.offers[0]?.pitch ?? c.brand.oneLiner}\n\nIf that's on your list for next week: ${cta(c)}`,
      },
    ];
    const out: Draft[] = [];
    for (const [i, a] of angles.entries()) {
      const ch = channels[i % channels.length]!;
      const r = await compose(ctx, 'social media manager', `Write one ${ch} post: ${a.angle}. Keep it native to ${ch}: short lines, at most 2 hashtags, no more than 1 emoji.`, () => a.fallback);
      out.push({ day: a.day, title: `${label(ch)} post (${a.day})`, channel: ch, action: 'publish', body: r.text, meta: { angle: a.angle }, source: r.source });
    }
    return out;
  },
};

function label(ch: string): string {
  return ch === 'x' ? 'X' : ch === 'linkedin' ? 'LinkedIn' : ch === 'tiktok' ? 'TikTok' : ch.charAt(0).toUpperCase() + ch.slice(1);
}
