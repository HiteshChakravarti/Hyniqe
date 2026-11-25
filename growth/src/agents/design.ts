import type { Agent } from './base.ts';
import { keyword, shortAudience } from './base.ts';

export const design: Agent = {
  id: 'design',
  name: 'Ivy',
  title: 'Designer & Video Editor',
  replaces: 'Graphic designer / video editor',
  does: 'Turns the week\'s posts and ads into a creative pack: image and short-video prompts, sizes and on-brand rules.',
  async produce(ctx) {
    const c = ctx.company;
    const kw = keyword(ctx);
    const body = [
      `## Creative pack, week ${ctx.week}`,
      `Style: ${c.brand.voice}. Keep the logo bottom-right, one message per visual, readable on a phone.`,
      '',
      '### Social visuals',
      `- Monday post: a close-up, real-life photo style image of someone dealing with "${c.brand.painPoints[0] ?? 'the problem'}". 1080x1350.`,
      `- Wednesday tip: a 3-step carousel, one tip per slide, large type. 1080x1350, 4 slides.`,
      `- Friday offer: product or service hero shot with the offer name "${c.brand.offers[0]?.name ?? c.name}". 1080x1080.`,
      '',
      '### Short video (Reel / Short, 20 seconds)',
      `- Hook (0-3s): the question "Still losing time to ${(c.brand.painPoints[0] ?? 'this').toLowerCase()}?"`,
      `- Middle (3-15s): the three tips from the blog post on "${kw}", one per beat.`,
      `- End (15-20s): logo and ${c.website}.`,
      '',
      '### Image generation prompts',
      `- "Editorial photo, natural light, ${shortAudience(c)} at work, calm and confident, brand colours, no text"`,
      `- "Flat illustration, three numbered steps about ${kw}, generous white space"`,
      '',
      'Plug in your image or video tool (Canva, Higgsfield, Midjourney) to render these.',
    ].join('\n');
    return [{ day: 'Mon', title: 'Creative pack for the week', channel: 'internal', action: 'internal', body, source: 'demo' }];
  },
};
