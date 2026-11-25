// Shared types for Hyniqe Growth: an AI digital marketing department.

export type Mode = 'autopilot' | 'copilot';

/** How much the agents may do without asking (Autopilot only). */
export type TrustLevel = 'cautious' | 'balanced' | 'hands-off';

export type Risk = 'low' | 'medium' | 'high';

export type AgentId =
  | 'marketing-lead'
  | 'content'
  | 'seo'
  | 'social'
  | 'design'
  | 'ads'
  | 'email'
  | 'sdr'
  | 'web-cro'
  | 'analytics'
  | 'reputation';

/** What a task does in the outside world. Drives risk and approvals. */
export type ActionKind =
  | 'internal' // plans, briefs, audits, reports: nothing leaves the building
  | 'publish' // blog post, social post, page change goes live
  | 'send' // email or message to an audience
  | 'spend' // anything that spends ad money
  | 'outreach' // one-to-one message to a prospect
  | 'reply'; // public reply (reviews, comments)

export type TaskStatus =
  | 'pending_approval'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'done';

export interface BrandBrain {
  oneLiner: string;
  voice: string;
  voiceDo: string[];
  voiceDont: string[];
  audience: string;
  painPoints: string[];
  offers: { name: string; price?: string; pitch: string }[];
  competitors: string[];
  channels: string[];
  keywords: string[];
  /** Claims the company must never make (legal, regulatory, brand). */
  bannedClaims: string[];
  location?: string;
  /** Learnings fed back by the Friday report. */
  learnings: { week: number; note: string }[];
}

export interface Teammate {
  id: string;
  name: string;
  role: string;
  /** Agents whose work this person reviews in Copilot mode. */
  reviews: AgentId[];
  email?: string;
}

export interface Comment {
  by: string;
  text: string;
  at: string;
}

export interface Task {
  id: string;
  week: number;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  agent: AgentId;
  title: string;
  channel: string;
  action: ActionKind;
  body: string;
  /** Extra structured data, e.g. ad budget, email subject, keyword. */
  meta: Record<string, string | number>;
  risk: Risk;
  flags: string[];
  status: TaskStatus;
  /** Who must approve: 'auto', 'owner' or a teammate id. */
  approver: string;
  approvalReason: string;
  comments: Comment[];
  source: 'claude' | 'demo';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  publishedAt?: string;
  publishRef?: string;
  publishDryRun?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  source: string;
  message: string;
  score: number;
  grade: 'A' | 'B' | 'C';
  reasons: string[];
  routeTo: string;
  status: 'new' | 'replied' | 'qualified' | 'disqualified';
  replyDraft: string;
  receivedAt: string;
  firstResponseMinutes?: number;
  /** 'auto' for the approved auto-reply, otherwise who replied. */
  repliedBy?: string;
}

export interface Finding {
  id: string;
  title: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  passed: boolean;
  evidence: string;
  fix: string;
  agent: AgentId;
}

export interface HealthCheck {
  at: string;
  url: string;
  score: number;
  verdict: 'Leaking leads' | 'Needs work' | 'Healthy';
  summary: string;
  findings: Finding[];
}

export interface WeekReport {
  week: number;
  at: string;
  metrics: Record<string, number>;
  wins: string[];
  problems: string[];
  nextWeek: string[];
  body: string;
}

export interface Plan {
  week: number;
  at: string;
  goal: string;
  focus: string[];
  assignments: { agent: AgentId; brief: string }[];
}

export interface AuditEntry {
  seq: number;
  ts: string;
  actor: string;
  action: string;
  ref: string;
  details: string;
  prevHash: string;
  hash: string;
}

export interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  template: string;
  mode: Mode;
  trust: TrustLevel;
  /** Weekly ad budget the agents may plan within. Spend above it always needs a human. */
  weeklyAdBudget: number;
  /** In Autopilot, the person who approves. */
  owner: { name: string; email?: string };
  goals: string[];
  brand: BrandBrain;
  team: Teammate[];
  week: number;
  weekState: 'not_started' | 'running' | 'closed';
  plan?: Plan;
  tasks: Task[];
  leads: Lead[];
  health?: HealthCheck;
  reports: WeekReport[];
  audit: AuditEntry[];
  createdAt: string;
}
