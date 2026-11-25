import type { Agent } from './base.ts';
import { mainOffer, shortAudience } from './base.ts';

export const webCro: Agent = {
  id: 'web-cro',
  name: 'Theo',
  title: 'Website & Conversion Specialist',
  replaces: 'Web / conversion-rate (CRO) specialist',
  does: 'Fixes the leaks on your website that lose leads: weak calls to action, long forms, missing trust signals, slow pages.',
  async produce(ctx) {
    const c = ctx.company;
    const fixes = (ctx.health?.findings ?? []).filter((f) => !f.passed && f.agent === 'web-cro');
    if (!fixes.length && ctx.health) return [];
    const o = mainOffer(c);
    const body = [
      `## Landing page changes for ${c.website}`,
      '',
      `**New headline:** ${o.pitch}`,
      `**Sub-headline:** For ${shortAudience(c)} who are tired of ${(c.brand.painPoints[0] ?? 'wasted time').toLowerCase()}.`,
      `**Primary button:** "${c.template === 'local-business' ? 'Book a table' : 'Book a 15-minute call'}" above the fold, repeated after the first section.`,
      '',
      '**Fixes from the health check**',
      ...(fixes.length ? fixes.map((f) => `- ${f.title}: ${f.fix}`) : ['- Run a health check to get page-specific fixes.']),
      '',
      '**A/B test:** current headline vs. new headline, 50/50 for two weeks, measured on form submissions.',
    ].join('\n');
    return [{ day: 'Thu', title: 'Landing page: conversion fixes', channel: 'website', action: 'publish', body, meta: { fixes: fixes.length }, source: 'demo' }];
  },
};
