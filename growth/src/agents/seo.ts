import type { Agent } from './base.ts';
import { compose, keyword } from './base.ts';

export const seo: Agent = {
  id: 'seo',
  name: 'Sol',
  title: 'SEO & AI Search Specialist',
  replaces: 'SEO specialist',
  does: 'Picks the keywords to win, fixes on-page problems, and makes the site easy for ChatGPT, Perplexity and Google AI answers to cite.',
  async produce(ctx) {
    const c = ctx.company;
    const kws = [keyword(ctx), keyword(ctx, 1), keyword(ctx, 2)];
    const seoFixes = (ctx.health?.findings ?? []).filter((f) => !f.passed && f.agent === 'seo');
    const brief = [
      `## Keywords for week ${ctx.week}`,
      ...kws.map((k, i) => `- ${k}${i === 0 ? ' (this week\'s blog post)' : ''}`),
      '',
      '## On-page fixes from the health check',
      ...(seoFixes.length ? seoFixes.map((f) => `- ${f.title}: ${f.fix}`) : ['- No open SEO problems from the last health check.']),
      '',
      '## Internal links',
      `- Link the new blog post from the home page and from the ${c.brand.offers[0]?.name ?? 'main offer'} page.`,
    ].join('\n');

    const faqAsk = `Write a short FAQ block (4 questions) for the website that answers what people ask AI assistants about "${kws[0]}". Plain, factual answers of 2-3 sentences each, mentioning ${c.name} only where it genuinely fits.`;
    const faq = await compose(ctx, 'SEO and AI-search specialist', faqAsk, () =>
      [
        `## Frequently asked questions about ${kws[0]}`,
        '',
        `**What is ${kws[0]}?**`,
        `${c.brand.oneLiner}`,
        '',
        `**Who is it for?**`,
        `It suits ${c.brand.audience}.`,
        '',
        `**How long does it take to see results?**`,
        'Most people notice a difference within a few weeks once the basics are in place. It depends on where you start.',
        '',
        `**How much does it cost?**`,
        c.brand.offers.map((o) => `${o.name}${o.price ? `: ${o.price}` : ''}`).join('. ') + '.',
        '',
        '(Add FAQPage structured data so AI assistants and Google can read this block.)',
      ].join('\n'),
    );

    return [
      { day: 'Mon', title: 'SEO brief: keywords and on-page fixes', channel: 'internal', action: 'internal', body: brief, source: 'demo' },
      { day: 'Thu', title: `AI-search FAQ block: ${kws[0]}`, channel: 'website', action: 'publish', body: faq.text, meta: { keyword: kws[0]! }, source: faq.source },
    ];
  },
};
