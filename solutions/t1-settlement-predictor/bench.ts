// Synthetic benchmark: 1,500 trades, ~45% with one injected T+1 problem. Run: node bench.ts
import { rng, choice, printScores, type Score } from "../shared/bench.ts";
import { addBusinessDays, assessTrades, readSsis, readTrades } from "./src/predict.ts";
import { parseCsv } from "../shared/table.ts";

const r = rng(1011);
const cps = ["Alpha Securities", "Bravo Markets", "Charlie Brokers", "Delta Bank", "Echo Partners", "Foxtrot Capital"];
const isins = ["DE0007164600", "FR0000120271", "NL0010273215", "GB0002634946"];
let ssi = "counterparty,place,currency,agent_bic,account,valid_from,valid_to,last_verified\n";
for (const c of cps) ssi += `${c},CBF,EUR,DEUTDEFF,ACC-${c.length},2025-01-01,,2028-03-01\n`;
ssi += "Expired Co,CBF,EUR,DEUTDEFF,E1,2024-01-01,2027-01-01,2026-12-01\nDouble Co,CBF,EUR,DEUTDEFF,D1,2025-01-01,,2028-03-01\nDouble Co,CBF,EUR,DEUTDEFF,D2,2025-01-01,,2028-03-01\nBadBic Co,CBF,EUR,DEUT1EFF,B1,2025-01-01,,2028-03-01\nStale Co,CBF,EUR,DEUTDEFF,S1,2025-01-01,,2025-01-01\n";
const KINDS = ["WRONG_CYCLE", "NO_SSI", "SSI_EXPIRED", "SSI_AMBIGUOUS", "SSI_INVALID", "SSI_STALE", "LATE_ALLOCATION", "LATE_AFFIRMATION", "LATE_INSTRUCTION", "LATE_TRADE", "FX_FUNDING", "INVALID_ISIN"];
let csv = "trade_id,trade_date,trade_time,settlement_date,isin,counterparty,place,currency,account_currency,allocation_time,affirmation_time,instruction_time\n";
const expected: Set<string>[] = [];
const days: string[] = [];
for (let d = new Date(Date.UTC(2027, 9, 11)); days.length < 300; d = new Date(d.getTime() + 86400000)) if (d.getUTCDay() % 6) days.push(d.toISOString().slice(0, 10));
for (let i = 0; i < 1500; i++) {
  const td = days[i % 300];
  let o = { sd: addBusinessDays(td, 1, new Set()), isin: choice(r, isins), cp: choice(r, cps), acc: "EUR", tt: "10:00", alloc: `${td} 11:00`, aff: `${td} 12:00`, ins: `${td} 13:00` };
  const exp = new Set<string>();
  if (r() < 0.45) {
    const k = choice(r, KINDS); exp.add(k);
    const next = addBusinessDays(td, 1, new Set());
    ({ WRONG_CYCLE: () => (o.sd = addBusinessDays(td, 2, new Set())), NO_SSI: () => (o.cp = "Unknown Broker " + i), SSI_EXPIRED: () => (o.cp = "Expired Co"), SSI_AMBIGUOUS: () => (o.cp = "Double Co"),
      SSI_INVALID: () => (o.cp = "BadBic Co"), SSI_STALE: () => (o.cp = "Stale Co"), LATE_ALLOCATION: () => (o.alloc = `${next} 08:00`), LATE_AFFIRMATION: () => (o.aff = `${next} 09:00`),
      LATE_INSTRUCTION: () => (o.ins = `${next} 07:30`), LATE_TRADE: () => (o.tt = "19:45"), FX_FUNDING: () => (o.acc = "USD"), INVALID_ISIN: () => (o.isin = o.isin.slice(0, 11) + ((Number(o.isin[11]) + 1) % 10)) } as Record<string, () => void>)[k]();
  }
  csv += `T${i},${td},${o.tt},${o.sd},${o.isin},${o.cp},CBF,EUR,${o.acc},${o.alloc},${o.aff},${o.ins}\n`;
  expected.push(exp);
}
const res = assessTrades(readTrades(parseCsv(csv)), readSsis(parseCsv(ssi)));
const per = new Map<string, Score>();
res.forEach((a, i) => {
  const got = new Set(a.issues.map((x) => x.rule));
  for (const k of new Set([...got, ...expected[i]])) { const s = per.get(k) ?? { label: k, tp: 0, fp: 0, fn: 0 }; if (got.has(k) && expected[i].has(k)) s.tp++; else if (got.has(k)) s.fp++; else s.fn++; per.set(k, s); }
});
const o = printScores("T+1 Settlement Fail Predictor — synthetic benchmark (1,500 trades)", [...per.values()].sort((a, b) => a.label.localeCompare(b.label)));
if (o.recall < 0.98 || o.precision < 0.98) process.exitCode = 1;
