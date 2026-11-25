// Lead capture and speed-to-lead. Any form, booking tool or ad platform can POST
// a lead here (directly or via n8n / Make / Zapier). Every lead is scored,
// routed to the right person and gets a reply draft at once.

import type { Company, Lead } from '../core/types.ts';
import { audit } from '../core/audit.ts';
import { id, now } from '../core/util.ts';
import { scoreLead } from './scoring.ts';

export interface LeadInput {
  name?: string;
  email?: string;
  company?: string;
  title?: string;
  source?: string;
  message?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLead(input: LeadInput): string | null {
  if (!input.email || !EMAIL.test(input.email)) return 'A valid email is required.';
  if ((input.message ?? '').length > 5000) return 'Message is too long.';
  return null;
}

function routeLead(c: Company, grade: Lead['grade']): string {
  if (c.mode === 'autopilot') return 'owner';
  const sales = c.team.find((m) => m.reviews.includes('sdr')) ?? c.team.find((m) => /sales|growth/i.test(m.role)) ?? c.team[0];
  if (grade === 'C') return c.team.find((m) => m.reviews.includes('email'))?.id ?? sales?.id ?? 'owner';
  return sales?.id ?? 'owner';
}

function replyDraft(c: Company, l: Pick<Lead, 'name' | 'grade' | 'message'>): string {
  const first = (l.name || 'there').split(' ')[0];
  const offer = c.brand.offers[0];
  if (l.grade === 'A') {
    return `Hi ${first},\n\nThanks for reaching out to ${c.name}. ${offer ? `${offer.pitch} ` : ''}I'd love to understand what you need: could we do a quick 15-minute call? Here are a few times: {{booking_link}}\n\nBest,\n${c.owner.name}`;
  }
  if (l.grade === 'B') {
    return `Hi ${first},\n\nThanks for getting in touch with ${c.name}. ${c.brand.oneLiner} What would be most useful for you right now? Just reply and we'll take it from there.\n\nBest,\n${c.owner.name}`;
  }
  return `Hi ${first},\n\nThanks for your message. Here's a guide that answers the questions we get most: ${c.website}/blog\n\nThe ${c.name} team`;
}

export function captureLead(c: Company, input: LeadInput): Lead {
  const err = validateLead(input);
  if (err) throw new Error(err);
  const base = {
    name: (input.name ?? '').trim().slice(0, 120),
    email: input.email!.trim().toLowerCase(),
    company: (input.company ?? '').trim().slice(0, 120),
    title: (input.title ?? '').trim().slice(0, 120),
    source: (input.source ?? 'contact-form').trim().slice(0, 40),
    message: (input.message ?? '').trim(),
  };
  const s = scoreLead(base);
  const lead: Lead = {
    id: id('lead'),
    ...base,
    ...s,
    routeTo: routeLead(c, s.grade),
    status: 'new',
    replyDraft: '',
    receivedAt: now(),
  };
  lead.replyDraft = replyDraft(c, lead);
  c.leads.unshift(lead);
  audit(c, 'lead-capture', 'lead.received', lead.id, { grade: lead.grade, score: lead.score, routeTo: lead.routeTo });
  return lead;
}

/** Mark the first reply as sent (by a person, or automatically for B/C leads in Autopilot). */
export function markReplied(c: Company, lead: Lead, by: string, minutes: number): void {
  lead.status = 'replied';
  lead.firstResponseMinutes = minutes;
  audit(c, by, 'lead.replied', lead.id, { minutes });
}
