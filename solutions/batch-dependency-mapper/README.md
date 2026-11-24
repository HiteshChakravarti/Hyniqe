# Batch Dependency Mapper

**Which overnight job feeds which, and what breaks if one fails? Draw the batch from the files that run it.**

Bank operations still depend on overnight batch: mainframe JCL, Control-M schedules, cron jobs and shell scripts,
often written decades ago. The people who knew how it all connects are retiring, and the documentation (if any) is out
of date. Before any change, migration or DR test, someone has to work out the dependencies by hand.

Give the tool the batch files (any mix of **JCL, Control-M XML exports, crontabs and shell scripts**). It works out:

- **Jobs:** what each runs (programs, SQL, scripts) and when;
- **Dependencies:** through datasets/files (job A writes what job B reads, including GDG generations and Unix copies
  of mainframe datasets), through Control-M conditions, and through scripts calling scripts;
- **Run order:** stages from first to last;
- **Risks:**
  - 🔴 jobs waiting for a **condition no job sets** (they never start, or someone sets it by hand: tribal knowledge);
  - 🔴 circular dependencies;
  - 🟠 **single points of failure:** jobs with many jobs downstream;
  - 🟡 conditions nobody waits for, and jobs connected to nothing;
- **External inputs** (feeds from outside) and **final outputs** (what leaves the batch);
- a **diagram** (SVG, plus Mermaid text you can paste into documentation tools) and a dependencies CSV.

Runs locally. Nothing is uploaded.

## Run it

**In your browser:** open [`web/index.html`](web/index.html) → choose files or a folder → *Map* (or *Load sample*).

**Command line** (Node 22+):

```bash
node cli.ts samples/batch --out out/      # writes batch-map.md, batch-map.svg, dependencies.csv
```

Tests: `node --test test/*.test.ts` · Benchmark: `node bench.ts`

## Benchmark

10 randomly generated batch networks (40 JCL jobs each, with dataset dependencies, external feeds, GDGs,
continuation lines, and a Control-M export with conditions, some of which no job sets):

| Check | Result |
| --- | --- |
| Dependency edges (precision / recall) | **100% / 100%** (744 edges) on the first run |
| Conditions nobody sets | **35 / 35** found, 0 false alarms |

Generated networks are regular; real batch has more exotic syntax (PROCs, symbolic parameters, Control-M variables),
which is partly or not resolved (see Limits).

## Limits

- Dependencies are inferred from the files you give; anything outside them shows as an external input/output.
- JCL PROCs and symbolic parameters (`&HLQ..DATA`) aren't expanded; `DISP=OLD` is treated as a read unless the DD name
  suggests output. Shell parsing covers common commands (cp, mv, redirects, sftp put/get, script calls).
- Control-M: job names, CMDLINE/MEMNAME, schedule hints, INCOND/OUTCOND. Other schedulers (Autosys, TWS) aren't parsed yet.
- Not a substitute for confirming with operations before changing anything.

Part of [Hyniqe Hub](../../README.md).
