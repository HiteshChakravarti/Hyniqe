import type { Agent, Draft } from './base.ts';
import { compose, mainOffer, pain } from './base.ts';

export const sdr: Agent = {
  id: 'sdr',
  name: 'Ash',
  title: 'Lead Generation / SDR',
  replaces: 'Sales development rep / lead-gen specialist',
  does: 'Finds companies that match your ideal customer and drafts short, personal first messages. Nothing is sent without a yes.',
  async produce(ctx) {
    const c = ctx.company;
    if (c.template === 'local-business') return [];
    const targets = TARGETS[c.template] ?? TARGETS.saas!;
    const o = mainOffer(c);
    const out: Draft[] = [];
    for (const t of targets.slice(0, 2)) {
      const r = await compose(
        ctx,
        'sales development rep',
        `Write a first LinkedIn or email message (under 90 words) to the ${t.role} at a ${t.kind}. Reference the trigger "${t.trigger}". Mention the pain "${pain(ctx)}" and ${o.name} in one line. Ask one low-pressure question. End with: Reply "stop" and I won't follow up.`,
        () =>
          [
            `Hi {{first_name}},`,
            '',
            `Saw that ${t.trigger}. Teams at that stage often tell us ${pain(ctx).toLowerCase()} is what slows them down.`,
            '',
            `${o.pitch}`,
            '',
            `Is that on your radar this quarter, or not a priority right now?`,
            '',
            `Reply "stop" and I won't follow up.`,
          ].join('\n'),
      );
      out.push({
        day: 'Wed',
        title: `Outreach: ${t.role} at a ${t.kind}`,
        channel: 'linkedin-dm',
        action: 'outreach',
        body: r.text,
        meta: { target: `${t.role}, ${t.kind}`, trigger: t.trigger },
        source: r.source,
      });
    }
    return out;
  },
};

// Target profiles, not real people. A prospect-data connector (Apollo, Clay,
// a CSV) fills in real names once connected; the agent never scrapes LinkedIn.
const TARGETS: Record<string, { role: string; kind: string; trigger: string }[]> = {
  saas: [
    { role: 'Head of Finance', kind: '50-200 person SaaS company', trigger: 'your team is hiring its second finance person' },
    { role: 'COO', kind: 'growing services firm', trigger: 'you opened a new office this year' },
  ],
  fintech: [
    { role: 'Head of Operations', kind: 'regional lender', trigger: 'you launched a new lending product' },
    { role: 'Compliance Lead', kind: 'payments startup', trigger: 'you announced expansion into a new market' },
  ],
  agency: [
    { role: 'Marketing Director', kind: 'mid-size retailer', trigger: 'you are hiring for a growth role' },
    { role: 'Founder', kind: 'D2C brand', trigger: 'you just launched a new product line' },
  ],
};
