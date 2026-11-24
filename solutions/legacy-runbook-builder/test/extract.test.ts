import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { buildRunbook, describeCron, detectKind, explainCommand, maskSecret } from "../src/extract.ts";
import { aiPrompt, gapsCsv, ownerQuestions, toMarkdown } from "../src/report.ts";

const dir = new URL("../samples/", import.meta.url);
const samples = readdirSync(dir).map((name) => ({ name, text: readFileSync(new URL(name, dir), "utf8") }));

test("detects source kinds", () => {
  assert.equal(detectKind("x.sh", "#!/bin/ksh\n"), "shell");
  assert.equal(detectKind("PAYEXTR.jcl", "//PAYEXTR JOB"), "jcl");
  assert.equal(detectKind("crontab.txt", "15 6 * * 1-5 /opt/x.sh"), "cron");
  assert.equal(detectKind("notes.txt", "Hi team, here is how we do it."), "notes");
});

test("explains shell, JCL and cron lines in plain English", () => {
  assert.equal(explainCommand("cp a.csv /archive/", "shell"), "Copy a.csv to /archive/.");
  assert.match(explainCommand("rm -f /data/*.fin", "shell") ?? "", /^Delete/);
  assert.match(explainCommand('mailx -s "Done" ops@bank.example', "shell") ?? "", /Email "Done" to ops@bank.example/);
  assert.match(explainCommand("//STEP010  EXEC PGM=PAYX0100", "jcl") ?? "", /run program PAYX0100/);
  assert.match(explainCommand("//IN DD DSN=PROD.X.Y,DISP=SHR", "jcl") ?? "", /PROD\.X\.Y \(read, shared\)/);
  assert.equal(describeCron("15 6 * * 1-5"), "Mon–Fri at 06:15");
  assert.match(explainCommand("DELETE FROM t", "sql") ?? "", /whole table/);
});

test("masks secrets", () => {
  assert.equal(maskSecret("user=a password=Secret1"), "user=a password=****");
  assert.equal(maskSecret("sshpass -p abc sftp x@y"), "sshpass -p **** sftp x@y");
  assert.equal(maskSecret("sqlplus scott/tiger@PROD"), "sqlplus scott/****@PROD");
});

test("sample handover produces steps, schedule, systems, people and gaps", () => {
  const rb = buildRunbook(samples, "Payments ops");
  assert.ok(rb.steps.length >= 20);
  assert.ok(rb.schedule.some((s) => /10:30/.test(s.text)));
  assert.ok(rb.schedule.some((s) => /Mon–Fri at 06:15/.test(s.text)));
  for (const sys of ["TLM", "SWIFT", "Citrix"]) assert.ok(rb.systems.includes(sys), sys);
  assert.ok(rb.hosts.includes("10.20.4.15"));
  assert.deepEqual(rb.contacts.map((c) => c.who).sort(), ["Dave", "Maria", "Raj"]);
  const types = new Set(rb.gaps.map((g) => g.type));
  for (const t of ["HARDCODED_SECRET", "KEY_PERSON", "VAGUE_CHECK", "MANUAL_SPREADSHEET", "DESTRUCTIVE_COMMAND", "NO_OWNER", "TODO_WORKAROUND"]) assert.ok(types.has(t as never), t);
  assert.ok(rb.gaps.filter((g) => g.type === "HARDCODED_SECRET").every((g) => !/Summer2019|Gw4yPass99/.test(g.text)), "secrets masked in gaps");
  assert.ok(rb.completeness.score > 0 && rb.completeness.score < 1);
});

test("a well-written procedure scores higher than a messy one", () => {
  const good = buildRunbook([{ name: "good.txt", text: "Purpose: send the daily GL feed to the ledger team before the 18:00 cut-off.\nOwner: Payments Ops team (backup: Treasury Ops).\n1. Run the GL extract in GPP.\n2. Check the record count equals the trailer count.\n3. Upload the file to the ledger SFTP.\nIf the upload fails, retry once and escalate to the on-call manager." }]);
  const bad = buildRunbook([{ name: "bad.txt", text: "do the usual and ask Bob if it looks odd" }]);
  assert.ok(good.completeness.score > bad.completeness.score);
  assert.ok(!good.gaps.some((g) => g.type === "NO_FAILURE_PATH" || g.type === "NO_OWNER"));
});

test("reports, questions and AI prompt (secrets masked)", () => {
  const rb = buildRunbook(samples);
  const md = toMarkdown(rb);
  assert.match(md, /Knowledge gaps to close/);
  assert.ok(!/Summer2019|Gw4yPass99/.test(md), "no secrets anywhere in the report");
  assert.ok(!/Summer2019|Gw4yPass99/.test(JSON.stringify(rb)), "no secrets in JSON output");
  assert.ok(ownerQuestions(rb).some((q) => q.includes("Maria")));
  const p = aiPrompt(rb, samples);
  assert.ok(!p.includes("Summer2019") && !p.includes("Gw4yPass99"));
  assert.match(gapsCsv(rb), /^type,title,source/);
});
