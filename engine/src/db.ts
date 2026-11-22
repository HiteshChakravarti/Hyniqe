import { DatabaseSync } from 'node:sqlite';

export type DB = DatabaseSync;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mission TEXT NOT NULL,
  template TEXT NOT NULL,
  created_at TEXT NOT NULL,
  report TEXT
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  reports_to TEXT,
  budget INTEGER NOT NULL,
  spent INTEGER NOT NULL DEFAULT 0,
  heartbeat_every INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'idle',
  current_task TEXT,
  tasks_done INTEGER NOT NULL DEFAULT 0,
  last_heartbeat TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  kind TEXT NOT NULL,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'todo',
  priority INTEGER NOT NULL DEFAULT 0,
  assignee TEXT,
  parent_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  result TEXT,
  error TEXT
);
CREATE INDEX IF NOT EXISTS tasks_queue ON tasks(company_id, role, status, priority);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  kind TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by TEXT NOT NULL,
  task_id TEXT,
  created_at TEXT NOT NULL,
  decided_by TEXT,
  decided_at TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  source_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner TEXT,
  source TEXT NOT NULL,
  iban TEXT,
  bic TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  format_before TEXT,
  format_after TEXT,
  address TEXT,
  confidence REAL,
  method TEXT,
  evidence TEXT,
  issues TEXT,
  resolved_by TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  definition TEXT NOT NULL,
  evidence_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed',
  proposed_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outreach (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  owner TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  record_ids TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  company_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL
);
`;

export function openDb(path = ':memory:'): DB {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

export function j<T = unknown>(s: unknown, fallback: T): T {
  if (typeof s !== 'string' || !s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
