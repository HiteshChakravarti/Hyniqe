import type { Agent } from './base.ts';
import { compose, cta, keyword } from './base.ts';

export const email: Agent = {
  id: 'email',
  name: 'Elle',
  title: 'Email & CRM Marketer',
  replaces: 'Email / marketing automation specialist',
  does: 'Writes the newsletter and the follow-up sequence for new leads, with an unsubscribe line every time.',
  async produce(ctx) {
    const c = ctx.company;
    const kw = keyword(ctx);
    const subject = `This week: ${kw}, made simple`;
    const footer = `\n\n—\nYou are getting this because you signed up at ${c.website}. Unsubscribe any time: {{unsubscribe_link}}`;
    const news = await compose(
      ctx,
      'email marketer',
      `Write this week's newsletter. Subject line "${subject}". 150-200 words, one idea (this week's blog post on "${kw}"), one link, friendly sign-off from the ${c.name} team. End with an unsubscribe line.`,
      () =>
        [
          `Subject: ${subject}`,
          '',
          'Hi {{first_name}},',
          '',
          `This week we wrote up the three fixes we recommend most for ${kw}. They take minutes, not days.`,
          '',
          `Read the guide: ${c.website}/blog`,
          '',
          `If you would rather talk it through, just reply to this email. A real person reads every reply.`,
          '',
          `The ${c.name} team`,
        ].join('\n') + footer,
    );
    const nurture = [
      '## New-lead follow-up sequence (runs automatically after approval)',
      '',
      '**Email 1, sent within 5 minutes of sign-up**',
      `Subject: Thanks, here's what happens next\nHi {{first_name}}, thanks for getting in touch with ${c.name}. ${c.brand.oneLiner} Reply with your biggest question and we'll answer it personally.`,
      '',
      '**Email 2, day 2**',
      `Subject: The guide most people start with\nOur most-read guide on ${kw}: ${c.website}/blog`,
      '',
      '**Email 3, day 5**',
      `Subject: Ready when you are\n${cta(c)}. If now is not the right time, no problem: reply "later" and we'll check back next month.`,
      footer,
    ].join('\n');
    return [
      { day: 'Thu', title: `Newsletter: ${subject}`, channel: 'email', action: 'send', body: news.text.includes('nsubscribe') ? news.text : news.text + footer, meta: { subject }, source: news.source },
      { day: 'Wed', title: 'New-lead follow-up sequence (3 emails)', channel: 'email', action: 'send', body: nurture, meta: { subject: 'Nurture sequence' }, source: 'demo' },
    ];
  },
};
