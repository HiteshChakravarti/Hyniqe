// Shared helpers for the synthetic benchmarks: seeded RNG + precision/recall scoring.

export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function choice<T>(r: () => number, xs: readonly T[]): T {
  return xs[Math.floor(r() * xs.length)];
}

export interface Score { label: string; tp: number; fp: number; fn: number }

export function score(label: string, expected: Set<string>, predicted: Set<string>): Score {
  let tp = 0, fp = 0, fn = 0;
  for (const p of predicted) (expected.has(p) ? tp++ : fp++);
  for (const e of expected) if (!predicted.has(e)) fn++;
  return { label, tp, fp, fn };
}

export function printScores(title: string, scores: Score[]): { precision: number; recall: number } {
  const pct = (x: number) => (Number.isFinite(x) ? (x * 100).toFixed(1) + "%" : "n/a");
  const lines = [`\n${title}`, "label".padEnd(30) + "precision".padStart(10) + "recall".padStart(10) + "   tp/fp/fn"];
  let TP = 0, FP = 0, FN = 0;
  for (const s of scores) {
    TP += s.tp; FP += s.fp; FN += s.fn;
    lines.push(
      s.label.padEnd(30) +
        pct(s.tp / (s.tp + s.fp)).padStart(10) +
        pct(s.tp / (s.tp + s.fn)).padStart(10) +
        `   ${s.tp}/${s.fp}/${s.fn}`,
    );
  }
  const precision = TP / (TP + FP);
  const recall = TP / (TP + FN);
  lines.push("OVERALL".padEnd(30) + pct(precision).padStart(10) + pct(recall).padStart(10) + `   ${TP}/${FP}/${FN}`);
  console.log(lines.join("\n"));
  return { precision, recall };
}
