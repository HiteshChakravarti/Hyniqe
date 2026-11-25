import type { AgentId } from '../core/types.ts';
import type { Agent } from './base.ts';
import { ads } from './ads.ts';
import { analytics } from './analytics.ts';
import { content } from './content.ts';
import { design } from './design.ts';
import { email } from './email.ts';
import { marketingLead } from './marketing-lead.ts';
import { reputation } from './reputation.ts';
import { sdr } from './sdr.ts';
import { seo } from './seo.ts';
import { social } from './social.ts';
import { webCro } from './web-cro.ts';

export const AGENTS: Record<AgentId, Agent> = {
  'marketing-lead': marketingLead,
  content,
  seo,
  social,
  design,
  ads,
  email,
  sdr,
  'web-cro': webCro,
  analytics,
  reputation,
};

export function agentSummary() {
  return Object.values(AGENTS).map((a) => ({ id: a.id, name: a.name, title: a.title, replaces: a.replaces, does: a.does }));
}
