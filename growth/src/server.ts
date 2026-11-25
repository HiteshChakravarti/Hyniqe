// Hyniqe Growth local server: the dashboard plus a JSON API.
//
//   npm start            → http://127.0.0.1:4400
//
// Listens on localhost only by default. Set GROWTH_HOST to expose it, and
// GROWTH_TOKEN to require "Authorization: Bearer <token>" on every API call
// except lead capture (which forms and webhooks post to).

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Store } from './core/store.ts';
import type { AgentId, Company } from './core/types.ts';
import { verifyAudit } from './core/audit.ts';
import { listTemplates, patchBrand } from './core/brand-brain.ts';
import { MODES, TRUST } from './core/modes.ts';
import { llmEnabled } from './core/llm.ts';
import { addTeammate, removeTeammate, setOwnership } from './core/team.ts';
import {
  addComment,
  closeWeek,
  createCompany,
  decide,
  editTask,
  reassign,
  receiveLead,
  recordHealth,
  replyToLead,
  reviseTask,
  setMode,
  setTrust,
  simulateLeads,
  startWeek,
} from './core/orchestrator.ts';
import { fetchSite, runHealthCheck } from './checks/health-check.ts';
import { agentSummary } from './agents/index.ts';
import { connectorStatus } from './connectors/index.ts';
import { demoSite, seedDemo } from './demo.ts';
import { audit } from './core/audit.ts';

const PORT = Number(process.env.PORT || 4400);
const HOST = process.env.GROWTH_HOST || '127.0.0.1';
const TOKEN = process.env.GROWTH_TOKEN || '';
const store = new Store(process.env.GROWTH_DATA || fileURLToPath(new URL('../data/state/', import.meta.url)));
const INDEX = new URL('../public/index.html', import.meta.url);

if (!store.list().length) seedDemo(store);

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json'): void {
  const data = type === 'application/json' ? JSON.stringify(body) : String(body);
  res.writeHead(status, {
    'content-type': `${type}; charset=utf-8`,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...(type === 'text/html' ? { 'content-security-policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:" } : {}),
  });
  res.end(data);
}

async function body(req: IncomingMessage): Promise<Record<string, any>> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const ch of req) {
    size += (ch as Buffer).length;
    if (size > 2_000_000) throw new HttpError(413, 'Request too large.');
    chunks.push(ch as Buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Body must be JSON.');
  }
}

// One change at a time per company, so two clicks can't race each other.
const locks = new Map<string, Promise<unknown>>();
async function withCompany<T>(id: string, fn: (c: Company) => Promise<T> | T): Promise<T> {
  const prev = locks.get(id) ?? Promise.resolve();
  const run = prev.then(async () => {
    const c = store.get(id);
    if (!c) throw new HttpError(404, 'No such company.');
    const out = await fn(c);
    store.save(c);
    return out;
  });
  locks.set(id, run.catch(() => undefined));
  return run;
}

function summary(c: Company) {
  return {
    id: c.id,
    name: c.name,
    website: c.website,
    mode: c.mode,
    week: c.week,
    weekState: c.weekState,
    health: c.health ? { score: c.health.score, verdict: c.health.verdict } : null,
    pending: c.tasks.filter((t) => t.status === 'pending_approval' || t.status === 'changes_requested').length,
    leads: c.leads.length,
  };
}

function actor(c: Company, as: unknown): string {
  const a = typeof as === 'string' && as ? as : 'owner';
  if (a !== 'owner' && !c.team.some((m) => m.id === a)) throw new HttpError(400, 'Unknown person.');
  return a;
}

type Handler = (req: IncomingMessage, m: string[]) => Promise<unknown>;
const routes: [string, RegExp, Handler][] = [
  ['GET', /^\/api\/meta$/, async () => ({ agents: agentSummary(), templates: listTemplates().map((t) => ({ id: t.id, label: t.label })), modes: MODES, trust: TRUST, connectors: connectorStatus(), claude: llmEnabled() })],
  ['GET', /^\/api\/companies$/, async () => store.list().map(summary)],
  [
    'POST',
    /^\/api\/companies$/,
    async (req) => {
      const b = await body(req);
      const c = createCompany({
        name: String(b.name ?? ''),
        website: String(b.website ?? ''),
        template: String(b.template ?? 'saas'),
        mode: b.mode,
        trust: b.trust,
        owner: { name: String(b.ownerName ?? 'Owner'), ...(b.ownerEmail ? { email: String(b.ownerEmail) } : {}) },
        weeklyAdBudget: b.weeklyAdBudget,
        brand: b.oneLiner ? { oneLiner: String(b.oneLiner) } : undefined,
      });
      store.save(c);
      return summary(c);
    },
  ],
  [
    'POST',
    /^\/api\/demo\/reset$/,
    async () => {
      store.clear();
      return seedDemo(store).map(summary);
    },
  ],
  ['GET', /^\/api\/companies\/([\w-]+)$/, async (_r, m) => withCompany(m[1]!, (c) => c)],
  [
    'DELETE',
    /^\/api\/companies\/([\w-]+)$/,
    async (_r, m) => {
      if (!store.get(m[1]!)) throw new HttpError(404, 'No such company.');
      store.remove(m[1]!);
      return { ok: true };
    },
  ],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/settings$/,
    async (req, m) => {
      const b = await body(req);
      return withCompany(m[1]!, (c) => {
        if (b.mode) setMode(c, b.mode);
        if (b.trust) setTrust(c, b.trust);
        if (b.weeklyAdBudget !== undefined) {
          c.weeklyAdBudget = Math.max(0, Number(b.weeklyAdBudget) || 0);
          audit(c, 'owner', 'budget.changed', c.id, { weeklyAdBudget: c.weeklyAdBudget });
        }
        if (Array.isArray(b.goals)) c.goals = b.goals.map(String).filter(Boolean).slice(0, 6);
        return c;
      });
    },
  ],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/brand$/,
    async (req, m) => {
      const b = await body(req);
      return withCompany(m[1]!, (c) => {
        c.brand = patchBrand(c.brand, b);
        audit(c, 'owner', 'brand.updated', c.id, Object.keys(b));
        return c;
      });
    },
  ],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/team$/,
    async (req, m) => {
      const b = await body(req);
      return withCompany(m[1]!, (c) => {
        addTeammate(c, { name: b.name, role: b.role, email: b.email, reviews: (b.reviews ?? []) as AgentId[] });
        return c;
      });
    },
  ],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/team\/([\w-]+)\/ownership$/,
    async (req, m) => {
      const b = await body(req);
      return withCompany(m[1]!, (c) => {
        setOwnership(c, m[2]!, (b.reviews ?? []) as AgentId[]);
        return c;
      });
    },
  ],
  [
    'DELETE',
    /^\/api\/companies\/([\w-]+)\/team\/([\w-]+)$/,
    async (_r, m) =>
      withCompany(m[1]!, (c) => {
        removeTeammate(c, m[2]!);
        return c;
      }),
  ],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/health-check$/,
    async (req, m) => {
      const b = await body(req);
      const c0 = store.get(m[1]!);
      if (!c0) throw new HttpError(404, 'No such company.');
      const url = String(b.url || c0.website || '');
      let snap;
      if (typeof b.html === 'string' && b.html.trim()) snap = { url: url || 'pasted-html', html: b.html };
      else if (demoSite(url)) snap = { url, html: demoSite(url)!, llmsTxt: false };
      else {
        if (!url) throw new HttpError(400, 'Give a website address or paste the page HTML.');
        try {
          snap = await fetchSite(url);
        } catch (e) {
          throw new HttpError(502, `Couldn't load ${url} (${(e as Error).message}). Paste the page's HTML instead.`);
        }
      }
      const h = runHealthCheck(snap);
      return withCompany(m[1]!, (c) => {
        recordHealth(c, h, 'owner');
        return c;
      });
    },
  ],
  ['POST', /^\/api\/companies\/([\w-]+)\/week\/start$/, async (_r, m) => withCompany(m[1]!, async (c) => (await startWeek(c), c))],
  ['POST', /^\/api\/companies\/([\w-]+)\/week\/close$/, async (_r, m) => withCompany(m[1]!, (c) => (closeWeek(c), c))],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/tasks\/([\w-]+)\/(decision|edit|revise|assign|comment)$/,
    async (req, m) => {
      const b = await body(req);
      return withCompany(m[1]!, async (c) => {
        const by = actor(c, b.as);
        const tid = m[2]!;
        if (m[3] === 'decision') await decide(c, tid, by, b.decision, b.comment);
        else if (m[3] === 'edit') await editTask(c, tid, by, String(b.body ?? ''));
        else if (m[3] === 'revise') await reviseTask(c, tid, by);
        else if (m[3] === 'assign') reassign(c, tid, String(b.to ?? ''), by);
        else addComment(c, tid, by, String(b.text ?? ''));
        return c;
      });
    },
  ],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/leads$/,
    async (req, m) => {
      const b = await body(req);
      return withCompany(m[1]!, (c) => {
        const l = receiveLead(c, b);
        return { id: l.id, grade: l.grade, received: true };
      });
    },
  ],
  ['POST', /^\/api\/companies\/([\w-]+)\/leads\/simulate$/, async (_r, m) => withCompany(m[1]!, (c) => (simulateLeads(c), c))],
  [
    'POST',
    /^\/api\/companies\/([\w-]+)\/leads\/([\w-]+)\/reply$/,
    async (req, m) => {
      const b = await body(req);
      return withCompany(m[1]!, (c) => (replyToLead(c, m[2]!, actor(c, b.as)), c));
    },
  ],
  ['GET', /^\/api\/companies\/([\w-]+)\/audit\/verify$/, async (_r, m) => withCompany(m[1]!, (c) => verifyAudit(c.audit))],
];

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return send(res, 200, readFileSync(INDEX, 'utf8'), 'text/html');
    }
    const isLeadPost = req.method === 'POST' && /^\/api\/companies\/[\w-]+\/leads$/.test(url.pathname);
    if (TOKEN && url.pathname.startsWith('/api/') && !isLeadPost && req.headers.authorization !== `Bearer ${TOKEN}`) {
      throw new HttpError(401, 'Missing or wrong token.');
    }
    for (const [method, re, h] of routes) {
      const m = url.pathname.match(re);
      if (m && req.method === method) return send(res, 200, await h(req, m));
    }
    throw new HttpError(404, 'Not found.');
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 400;
    send(res, status, { error: (e as Error).message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Hyniqe Growth is running: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(llmEnabled() ? 'Agents write with Claude (ANTHROPIC_API_KEY is set).' : 'Demo writers active. Set ANTHROPIC_API_KEY for real copy.');
});
