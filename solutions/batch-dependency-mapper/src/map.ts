// Batch Dependency Mapper
// Reads mainframe JCL, crontabs, Control-M job exports and shell scripts, and works out how the batch actually hangs
// together: which job produces which file/dataset, which job needs it, scheduler conditions between jobs, run order,
// external feeds, final outputs, and the dangerous gaps: jobs waiting for a condition nothing ever sets, cycles, and
// single jobs that everything else depends on.

import { findAll, parseXml } from "../../shared/xml-reader.ts";

export interface Job {
  name: string; source: string; kind: "jcl" | "cron" | "controlm" | "shell"; schedule: string; programs: string[];
  reads: Set<string>; writes: Set<string>; inConds: Set<string>; outConds: Set<string>; calls: Set<string>;
}
export interface Edge { from: string; to: string; via: string; type: "data" | "condition" | "call" }

const job = (name: string, source: string, kind: Job["kind"]): Job => ({ name, source, kind, schedule: "", programs: [], reads: new Set(), writes: new Set(), inConds: new Set(), outConds: new Set(), calls: new Set() });
const base = (p: string) => p.split(/[\\/]/).pop() as string;
const gdgBase = (dsn: string) => dsn.replace(/\([+-]?\d+\)$/, "").toUpperCase();

export function describeCron(expr: string): string {
  const [min, hour, dom, mon, dow] = expr.trim().split(/\s+/);
  const days: Record<string, string> = { "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat", "7": "Sun", "1-5": "Mon–Fri", "*": "every day" };
  const time = /^\d+$/.test(hour) && /^\d+$/.test(min) ? `${hour.padStart(2, "0")}:${min.padStart(2, "0")}` : `min ${min} hour ${hour}`;
  return `${dow !== "*" ? days[dow] ?? `weekday ${dow}` : dom !== "*" ? `day ${dom} of month` : "every day"} at ${time}${mon !== "*" ? `, month ${mon}` : ""}`;
}

export function parseJcl(text: string, source: string): Job[] {
  const jobs: Job[] = [];
  let cur: Job | undefined;
  const lines = text.replace(/\r/g, "").split("\n");
  // join continuation lines (a line ending with "," continued on a "//" line with spaces)
  const stmts: string[] = [];
  for (const l of lines) {
    if (/^\/\/\*/.test(l)) continue;
    if (stmts.length && /,\s*$/.test(stmts[stmts.length - 1]) && /^\/\/\s+\S/.test(l)) stmts[stmts.length - 1] += l.replace(/^\/\/\s+/, "");
    else stmts.push(l);
  }
  for (const s of stmts) {
    const jm = s.match(/^\/\/(\S+)\s+JOB\b/);
    if (jm) { cur = job(jm[1], source, "jcl"); jobs.push(cur); continue; }
    if (!cur) continue;
    const ex = s.match(/^\/\/\S*\s+EXEC\s+(?:PGM=)?([A-Z0-9@#$]+)/i);
    if (ex) cur.programs.push(ex[1].toUpperCase());
    const dd = s.match(/^\/\/\S+\s+DD\s+.*DSN=([^,\s]+)/i);
    if (dd) {
      const dsn = dd[1].toUpperCase();
      if (dsn.startsWith("&&")) continue; // temporary dataset inside the job
      const disp = (s.match(/DISP=\(?([A-Z]+)/i)?.[1] ?? "SHR").toUpperCase();
      const isGdgNew = /\(\+\d+\)$/.test(dsn);
      if (disp === "NEW" || disp === "MOD" || isGdgNew) cur.writes.add(gdgBase(dsn));
      else if (disp === "OLD" && /SORTOUT|OUT|REPORT|EXTRACT/i.test(s.split(/\s+/)[0])) cur.writes.add(gdgBase(dsn));
      else cur.reads.add(gdgBase(dsn));
    }
    const sched = s.match(/SCHENV=(\S+)/);
    if (sched) cur.schedule = `scheduling env ${sched[1]}`;
  }
  return jobs;
}

export function parseCron(text: string, source: string): Job[] {
  const jobs: Job[] = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const m = raw.match(/^\s*((?:[\d*\/,-]+\s+){4}[\d*\/,-]+)\s+(.+)$/);
    if (!m) continue;
    const cmd = m[2].replace(/\s*\d?>>?\s*\S+/g, "").replace(/\s*2>&1/g, "").trim();
    const script = cmd.split(/\s+/)[0];
    const j = job(base(script).replace(/\.(sh|ksh|bash|py|pl)$/, ""), source, "cron");
    j.schedule = describeCron(m[1]);
    j.calls.add(base(script));
    jobs.push(j);
  }
  return jobs;
}

export function parseControlM(text: string, source: string): Job[] {
  const doc = parseXml(text);
  return findAll(doc, "JOB").map((x) => {
    const j = job(x.attrs.JOBNAME ?? x.attrs.MEMNAME ?? "UNNAMED", source, "controlm");
    const cmd = x.attrs.CMDLINE ?? x.attrs.MEMNAME ?? "";
    if (cmd) { j.programs.push(cmd); const scr = cmd.match(/([\w.\-\/]+\.(?:sh|ksh|bash|py|pl|jcl))/); if (scr) j.calls.add(base(scr[1])); }
    const days = x.attrs.WEEKDAYS ? `weekdays ${x.attrs.WEEKDAYS}` : x.attrs.DAYS ? `days ${x.attrs.DAYS}` : "";
    j.schedule = [x.attrs.TIMEFROM ? `from ${x.attrs.TIMEFROM.slice(0, 2)}:${x.attrs.TIMEFROM.slice(2)}` : "", days].filter(Boolean).join(", ");
    for (const c of x.children) {
      if (c.name === "INCOND" && c.attrs.NAME) j.inConds.add(c.attrs.NAME);
      if (c.name === "OUTCOND" && c.attrs.NAME && (c.attrs.SIGN ?? "+").startsWith("+") || (c.name === "OUTCOND" && /ADD/i.test(c.attrs.SIGN ?? ""))) j.outConds.add(c.attrs.NAME);
    }
    return j;
  });
}

export function parseShell(text: string, source: string): Job[] {
  const j = job(base(source).replace(/\.(sh|ksh|bash)$/, ""), source, "shell");
  const vars = new Map<string, string>();
  const expand = (s: string) => s.replace(/\$\{?(\w+)\}?/g, (m, v) => vars.get(v) ?? m).replace(/["']/g, "");
  let remoteDir = "";
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    const v = l.match(/^(?:export\s+)?(\w+)=(.+)$/);
    if (v) { vars.set(v[1], expand(v[2])); continue; }
    const e = expand(l);
    let m: RegExpMatchArray | null;
    if ((m = e.match(/^(?:cp|scp|rsync)\s+(?:-\S+\s+)*(\S+)\s+(\S+)/))) { j.reads.add(m[1]); j.writes.add(m[2].endsWith("/") ? m[2] + base(m[1]) : m[2]); }
    if ((m = e.match(/^mv\s+(?:-\S+\s+)*(\S+)\s+(\S+)/))) { j.reads.add(m[1]); j.writes.add(m[2].endsWith("/") ? m[2] + base(m[1]) : m[2]); }
    if ((m = e.match(/^cd\s+(\S+)/)) && /sftp|ftp/.test(text)) remoteDir = m[1];
    if ((m = e.match(/^put\s+(\S+)/))) { j.reads.add(m[1]); j.writes.add(`remote:${remoteDir ? remoteDir + "/" : ""}${base(m[1])}`); }
    if ((m = e.match(/^get\s+(\S+)/))) { j.reads.add(`remote:${m[1]}`); j.writes.add(base(m[1])); }
    for (const r of e.matchAll(/(?:^|\s)\d?>>?\s*(\/\S+)/g)) if (!/\/dev\/null|\.log$/.test(r[1])) j.writes.add(r[1]);
    for (const r of e.matchAll(/(?:^|\s)<\s*(\/\S+)/g)) j.reads.add(r[1]);
    if ((m = e.match(/(?:sqlplus|sqlcmd|psql|db2)\b.*?@?(\S+\.sql)/))) j.programs.push(base(m[1]));
    if ((m = e.match(/(?:^|\s)(?:\.\/|sh\s+|ksh\s+|bash\s+|\.\s+|\/\S+\/)([\w.\-]+\.(?:sh|ksh|bash|py|pl))\b/))) if (base(m[1]) !== base(source)) j.calls.add(base(m[1]));
    if ((m = e.match(/(?:^|\s)(?:java\s+.*-jar\s+(\S+)|python3?\s+(\S+))/))) j.programs.push(base(m[1] ?? m[2]));
  }
  j.reads = new Set([...j.reads].filter((x) => !j.writes.has(x) || x.startsWith("remote:")));
  return [j];
}

export function detect(name: string, text: string): Job["kind"] | "unknown" {
  if (/\.(jcl|jcls|txt)$/i.test(name) && /^\/\/\S+\s+JOB\b/m.test(text)) return "jcl";
  if (/^\/\/\S+\s+JOB\b/m.test(text)) return "jcl";
  if (/<(DEFTABLE|FOLDER|SMART_FOLDER|TABLE)[\s>]/i.test(text) && /<JOB\b/i.test(text)) return "controlm";
  if (/cron/i.test(name) || /^\s*([\d*\/,-]+\s+){4}[\d*\/,-]+\s+\//m.test(text)) return "cron";
  if (/\.(sh|ksh|bash)$/i.test(name) || /^#!.*sh\b/.test(text)) return "shell";
  return "unknown";
}

export function parseAll(files: { name: string; text: string }[]): { jobs: Job[]; skipped: string[] } {
  const jobs: Job[] = [], skipped: string[] = [];
  for (const f of files) {
    const k = detect(f.name, f.text);
    if (k === "jcl") jobs.push(...parseJcl(f.text, f.name));
    else if (k === "cron") jobs.push(...parseCron(f.text, f.name));
    else if (k === "controlm") jobs.push(...parseControlM(f.text, f.name));
    else if (k === "shell") jobs.push(...parseShell(f.text, f.name));
    else skipped.push(f.name);
  }
  // merge a cron/Control-M entry that just runs a script with that script's own job
  const byScript = new Map(jobs.filter((j) => j.kind === "shell").map((j) => [base(j.source), j]));
  for (const j of jobs.filter((x) => x.kind === "cron")) {
    const s = [...j.calls].map((c) => byScript.get(c)).find(Boolean);
    if (s) { s.schedule = [s.schedule, j.schedule].filter(Boolean).join("; "); j.name = ""; }
  }
  // merge jobs with the same name (e.g. a JCL member and the Control-M definition that schedules it)
  const merged = new Map<string, Job>();
  for (const j of jobs.filter((x) => x.name)) {
    const k = j.name.toUpperCase();
    const m = merged.get(k);
    if (!m) { merged.set(k, j); continue; }
    m.source = [m.source, j.source].filter((v, i, arr) => arr.indexOf(v) === i).join(" + ");
    m.schedule = [m.schedule, j.schedule].filter(Boolean).join("; ");
    m.programs = [...new Set([...m.programs, ...j.programs.filter((p) => p.toUpperCase() !== k)])];
    for (const f of ["reads", "writes", "inConds", "outConds", "calls"] as const) for (const v of j[f]) m[f].add(v);
  }
  return { jobs: [...merged.values()], skipped };
}

/** A Unix copy of a mainframe dataset (…/PROD.GL.POSTINGS) is treated as the same data as PROD.GL.POSTINGS. */
export function dataKey(x: string): string {
  const b = (x.split(/[\\/]/).pop() ?? x).toUpperCase();
  return /^[A-Z0-9$#@]{1,8}(\.[A-Z0-9$#@]{1,8}){2,}$/.test(b) ? b : x;
}

export interface Graph {
  jobs: Job[]; edges: Edge[]; levels: Map<string, number>; cycles: string[][]; externalInputs: string[]; finalOutputs: string[];
  missingConditions: { job: string; condition: string }[]; unusedConditions: { job: string; condition: string }[]; hubs: { job: string; dependents: number }[]; isolated: string[];
}

export function buildGraph(jobs: Job[]): Graph {
  const edges: Edge[] = [];
  const writers = new Map<string, string[]>(), readers = new Map<string, string[]>();
  for (const j of jobs) { for (const w of j.writes) writers.set(dataKey(w), [...(writers.get(dataKey(w)) ?? []), j.name]); for (const r of j.reads) readers.set(dataKey(r), [...(readers.get(dataKey(r)) ?? []), j.name]); }
  for (const [d, rs] of readers) for (const r of rs) for (const w of writers.get(d) ?? []) if (w !== r) edges.push({ from: w, to: r, via: d, type: "data" });
  const condSetters = new Map<string, string[]>();
  for (const j of jobs) for (const c of j.outConds) condSetters.set(c, [...(condSetters.get(c) ?? []), j.name]);
  const missingConditions: Graph["missingConditions"] = [];
  for (const j of jobs) for (const c of j.inConds) {
    const setters = condSetters.get(c) ?? [];
    if (!setters.length) missingConditions.push({ job: j.name, condition: c });
    for (const s of setters) edges.push({ from: s, to: j.name, via: c, type: "condition" });
  }
  const unusedConditions = jobs.flatMap((j) => [...j.outConds].filter((c) => !jobs.some((k) => k.inConds.has(c))).map((c) => ({ job: j.name, condition: c })));
  const names = new Set(jobs.map((j) => j.name));
  const byScriptName = new Map(jobs.map((j) => [base(j.source), j.name]));
  for (const j of jobs) for (const c of j.calls) { const t = byScriptName.get(c) ?? (names.has(c.replace(/\.\w+$/, "")) ? c.replace(/\.\w+$/, "") : undefined); if (t && t !== j.name) edges.push({ from: j.name, to: t, via: "runs", type: "call" }); }

  // levels via longest path from sources; detect cycles
  const out = new Map<string, string[]>(), indeg = new Map<string, number>(jobs.map((j) => [j.name, 0]));
  const uniq = new Set<string>();
  for (const e of edges) { const k = `${e.from}>${e.to}`; if (uniq.has(k)) continue; uniq.add(k); out.set(e.from, [...(out.get(e.from) ?? []), e.to]); indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1); }
  const levels = new Map<string, number>();
  const queue = [...indeg].filter(([, d]) => d === 0).map(([n]) => n);
  queue.forEach((n) => levels.set(n, 0));
  const deg = new Map(indeg);
  while (queue.length) {
    const n = queue.shift() as string;
    for (const m of out.get(n) ?? []) {
      levels.set(m, Math.max(levels.get(m) ?? 0, (levels.get(n) ?? 0) + 1));
      deg.set(m, (deg.get(m) as number) - 1);
      if (deg.get(m) === 0) queue.push(m);
    }
  }
  const inCycle = jobs.map((j) => j.name).filter((n) => (deg.get(n) ?? 0) > 0);
  const cycles = inCycle.length ? [inCycle] : [];
  for (const n of inCycle) levels.set(n, -1);
  const descendants = (n: string, seen = new Set<string>()): Set<string> => { for (const m of out.get(n) ?? []) if (!seen.has(m)) { seen.add(m); descendants(m, seen); } return seen; };
  const hubs = jobs.map((j) => ({ job: j.name, dependents: descendants(j.name).size })).filter((h) => h.dependents >= 2).sort((a, b) => b.dependents - a.dependents);
  const connected = new Set(edges.flatMap((e) => [e.from, e.to]));
  return {
    jobs, edges, levels, cycles,
    externalInputs: [...readers.keys()].filter((d) => !writers.has(d)).sort(),
    finalOutputs: [...writers.keys()].filter((d) => !readers.has(d)).sort(),
    missingConditions, unusedConditions, hubs, isolated: jobs.map((j) => j.name).filter((n) => !connected.has(n)),
  };
}
