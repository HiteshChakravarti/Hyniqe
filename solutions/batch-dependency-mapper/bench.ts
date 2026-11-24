// Synthetic benchmark: 10 random batch networks (40 JCL jobs each, plus a Control-M export) with known dataset
// dependencies, scheduler conditions and some conditions nobody sets. Scores edges and dangling-condition detection.
// Run: node bench.ts
import { rng, choice, score, printScores, type Score } from "../shared/bench.ts";
import { buildGraph, parseAll } from "./src/map.ts";

const total: Score[] = [];
let missFound = 0, missTotal = 0, missFalse = 0;
for (let seed = 1; seed <= 10; seed++) {
  const r = rng(seed * 31);
  const files: { name: string; text: string }[] = [];
  const truth = new Set<string>();
  const produced: { ds: string; job: string }[] = [];
  let xml = "<DEFTABLE><FOLDER FOLDER_NAME=\"F\">\n";
  const dangling = new Set<string>();
  for (let i = 0; i < 40; i++) {
    const name = `JOB${String(i).padStart(3, "0")}`;
    let jcl = `//${name} JOB (ACCT),'TEST',CLASS=A\n//STEP010  EXEC PGM=PGM${i}\n`;
    const nIn = produced.length ? 1 + Math.floor(r() * 2) : 0;
    const used = new Set<string>();
    for (let k = 0; k < nIn; k++) {
      const p = choice(r, produced);
      if (used.has(p.ds)) continue; used.add(p.ds);
      jcl += `//IN${k}     DD DSN=${p.ds},DISP=SHR\n`;
      truth.add(`${p.job}>${name}`);
    }
    if (r() < 0.3) jcl += `//EXT      DD DSN=PROD.EXTERNAL.FEED${i},DISP=SHR\n`;
    const out = `PROD.APP${seed}.DATA${i}`;
    jcl += `//OUT      DD DSN=${out}(+1),\n//            DISP=(NEW,CATLG,DELETE)\n`;
    produced.push({ ds: out, job: name });
    files.push({ name: `${name}.jcl`, text: jcl });
    // scheduler conditions mirror some data dependencies; some jobs wait for a condition nobody sets
    xml += `<JOB JOBNAME="${name}" MEMNAME="${name}" WEEKDAYS="1,2,3,4,5">`;
    if (i > 0 && r() < 0.5) { const j = Math.floor(r() * i); const c = `JOB${String(j).padStart(3, "0")}-OK`; xml += `<INCOND NAME="${c}"/>`; truth.add(`JOB${String(j).padStart(3, "0")}>${name}`); }
    if (r() < 0.1) { const c = `MANUAL-${i}`; xml += `<INCOND NAME="${c}"/>`; dangling.add(`${name}|${c}`); }
    xml += `<OUTCOND NAME="${name}-OK" SIGN="+"/></JOB>\n`;
  }
  files.push({ name: "controlm.xml", text: xml + "</FOLDER></DEFTABLE>" });
  const g = buildGraph(parseAll(files).jobs);
  total.push(score(`network ${seed}`, truth, new Set(g.edges.map((e) => `${e.from}>${e.to}`))));
  const found = new Set(g.missingConditions.map((m) => `${m.job}|${m.condition}`));
  missTotal += dangling.size; missFound += [...dangling].filter((d) => found.has(d)).length; missFalse += [...found].filter((f) => !dangling.has(f)).length;
}
const o = printScores("Batch Dependency Mapper — dependency edges (10 networks × 40 jobs)", total);
console.log(`Conditions nobody sets: found ${missFound}/${missTotal}, false alarms ${missFalse}`);
if (o.recall < 1 || o.precision < 1 || missFound < missTotal || missFalse) process.exitCode = 1;
