import type { Agent } from './base.ts';
import { compose, cta, keyword, pain, shortAudience } from './base.ts';

export const content: Agent = {
  id: 'content',
  name: 'Mira',
  title: 'Content Writer',
  replaces: 'Content writer / copywriter',
  does: 'Writes the weekly blog post or article that answers what your customers search for.',
  async produce(ctx) {
    const c = ctx.company;
    const kw = keyword(ctx);
    const p = pain(ctx);
    const title = `${capitalise(kw)}: a practical guide for ${shortAudience(c)}`;
    const r = await compose(
      ctx,
      'content writer',
      `Write a 600-800 word blog post titled "${title}" targeting the search phrase "${kw}". Open with the pain "${p}". Use short sections with H2 headings, one concrete example, and end with a soft call to action for ${cta(c)}.`,
      () =>
        [
          `# ${title}`,
          '',
          `If ${p.toLowerCase()} sounds familiar, you are not alone. Most ${shortAudience(c)} we speak to say the same thing.`,
          '',
          `## Why ${kw} matters now`,
          `${c.brand.oneLiner} We see the same three mistakes again and again, and each one is easy to fix once you can see it.`,
          '',
          '## The three fixes',
          `1. **Start with the problem, not the tool.** Write down where ${p.toLowerCase()} costs you most each week.`,
          `2. **Make one change at a time.** Small, measurable changes beat a big overhaul.`,
          `3. **Check the result after a week.** Keep what worked and drop what did not.`,
          '',
          '## A quick example',
          `One customer started with step 1 and found that most of the problem came from a single step in their week. Fixing that one step gave them back an afternoon.`,
          '',
          '## Where to start',
          `If you would like a hand, ${cta(c)}.`,
        ].join('\n'),
    );
    return [{ day: 'Tue', title: `Blog: ${title}`, channel: 'blog', action: 'publish', body: r.text, meta: { keyword: kw }, source: r.source }];
  },
};

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
