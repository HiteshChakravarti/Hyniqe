// Connectors: where approved work goes out into the world.
//
// Every connector is dry-run by default: it records exactly what would be
// published, and returns a preview reference. A connector goes live only when
// its credentials are set in the environment AND the task is approved. The
// generic webhook connector is live today: point GROWTH_WEBHOOK_URL at an
// n8n / Make / Zapier flow and every approved item is sent there as JSON, so a
// company can publish through the tools it already uses.

import type { Company, Task } from '../core/types.ts';

export interface PublishResult {
  ok: boolean;
  dryRun: boolean;
  ref: string;
  note: string;
}

export interface Connector {
  id: string;
  name: string;
  channels: string[];
  /** Environment variables that switch it to live. */
  env: string[];
  status(): 'live' | 'dry-run';
  publish(c: Company, t: Task): Promise<PublishResult>;
}

function dry(name: string, t: Task): PublishResult {
  return { ok: true, dryRun: true, ref: `dry-run:${name.toLowerCase().replace(/\W+/g, '-')}:${t.id}`, note: `Dry run: would publish to ${name}.` };
}

function make(id: string, name: string, channels: string[], env: string[]): Connector {
  return {
    id,
    name,
    channels,
    env,
    // Live API calls need each platform's app review; until a connector's
    // live path is implemented it stays dry-run even with keys present.
    status: () => 'dry-run',
    publish: async (_c, t) => dry(name, t),
  };
}

const webhook: Connector = {
  id: 'webhook',
  name: 'Webhook (n8n / Make / Zapier)',
  channels: ['*'],
  env: ['GROWTH_WEBHOOK_URL'],
  status: () => (process.env.GROWTH_WEBHOOK_URL ? 'live' : 'dry-run'),
  async publish(c, t) {
    const url = process.env.GROWTH_WEBHOOK_URL;
    if (!url) return dry('Webhook', t);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ company: c.name, task: { id: t.id, channel: t.channel, action: t.action, title: t.title, body: t.body, meta: t.meta, approvedBy: t.decidedBy } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Webhook answered ${res.status}`);
    return { ok: true, dryRun: false, ref: `webhook:${t.id}`, note: 'Sent to your automation webhook.' };
  },
};

export const CONNECTORS: Connector[] = [
  make('wordpress', 'WordPress', ['blog', 'website'], ['WORDPRESS_URL', 'WORDPRESS_APP_PASSWORD']),
  make('linkedin', 'LinkedIn', ['linkedin', 'linkedin-dm'], ['LINKEDIN_ACCESS_TOKEN']),
  make('meta', 'Meta (Instagram & Facebook)', ['instagram', 'facebook'], ['META_ACCESS_TOKEN']),
  make('x', 'X', ['x'], ['X_BEARER_TOKEN']),
  make('google-ads', 'Google / Meta / LinkedIn Ads', ['ads'], ['GOOGLE_ADS_DEVELOPER_TOKEN']),
  make('email', 'Email provider (Brevo, Mailchimp)', ['email'], ['EMAIL_PROVIDER_API_KEY']),
  make('reviews', 'Google Business Profile', ['reviews'], ['GBP_ACCESS_TOKEN']),
  make('hubspot', 'HubSpot CRM', ['crm'], ['HUBSPOT_TOKEN']),
  make('ga4', 'Google Analytics 4', ['analytics'], ['GA4_PROPERTY_ID']),
  webhook,
];

export function connectorFor(t: Task): Connector {
  if (webhook.status() === 'live') return webhook;
  return CONNECTORS.find((k) => k.channels.includes(t.channel)) ?? webhook;
}

export function connectorStatus() {
  return CONNECTORS.map((k) => ({ id: k.id, name: k.name, channels: k.channels, env: k.env, status: k.status() }));
}
