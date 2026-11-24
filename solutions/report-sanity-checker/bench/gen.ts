// Synthetic derivatives report rows with injected "valid but wrong" errors (labels kept per row).
import { rng, choice } from "../../shared/bench.ts";
import { leiWithCheck } from "../../shared/ids.ts";

export function generate(seed: number, n: number) {
  const r = rng(seed);
  const hex = (k: number) => Array.from({ length: k }, () => "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(r() * 34)]).join("");
  const firm = leiWithCheck("529900HYNIQEDEMO01");
  const cps = Array.from({ length: 30 }, () => leiWithCheck(hex(18)));
  const isins = ["DE0007164600", "FR0000120271", "NL0010273215", "GB0002634946", "US0378331005", "CH0012005267"];
  const header = "uti,reporting_lei,counterparty_lei,isin,notional,notional_currency,execution_date,effective_date,maturity_date,reporting_date,counterparty_country";
  const rows: string[] = []; const labels: string[][] = [];
  const KINDS = ["INVALID_LEI", "INVALID_ISIN", "INVALID_CURRENCY", "INVALID_COUNTRY", "DATE_ORDER", "FUTURE_DATE", "DUPLICATE_ID", "SELF_COUNTERPARTY", "NEGATIVE", "PLACEHOLDER", "OUTLIER", "BAD_DATE"];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(2026, 9, 1) + Math.floor(r() * 50) * 86400000);
    const ex = d.toISOString().slice(0, 10), eff = new Date(d.getTime() + 2 * 86400000).toISOString().slice(0, 10), mat = new Date(d.getTime() + (365 + Math.floor(r() * 3000)) * 86400000).toISOString().slice(0, 10);
    const rep = new Date(d.getTime() + 86400000).toISOString().slice(0, 10);
    let o = { uti: `${firm}${hex(12)}`, rl: firm, cl: choice(r, cps), isin: choice(r, isins), notional: String(Math.round(1e6 + r() * 4e7)), ccy: choice(r, ["EUR", "USD", "GBP"]), ex, eff, mat, rep, ctry: choice(r, ["DE", "FR", "GB", "US", "NL"]) };
    const lab: string[] = [];
    if (r() < 0.4) {
      const k = choice(r, KINDS); lab.push(k);
      const set: Record<string, () => void> = {
        INVALID_LEI: () => (o.cl = o.cl.slice(0, 19) + ((Number(o.cl[19]) + 1) % 10)), INVALID_ISIN: () => (o.isin = o.isin.slice(0, 11) + ((Number(o.isin[11]) + 3) % 10)),
        INVALID_CURRENCY: () => (o.ccy = choice(r, ["EUD", "UKP", "USS"])), INVALID_COUNTRY: () => (o.ctry = choice(r, ["UK", "EN", "YU"])), DATE_ORDER: () => (o.mat = new Date(d.getTime() - 30 * 86400000).toISOString().slice(0, 10)),
        FUTURE_DATE: () => (o.ex = new Date(d.getTime() + 10 * 86400000).toISOString().slice(0, 10), o.eff = new Date(d.getTime() + 12 * 86400000).toISOString().slice(0, 10)),
        DUPLICATE_ID: () => { if (rows.length) o.uti = rows[rows.length - 1].split(",")[0]; else lab.pop(); }, SELF_COUNTERPARTY: () => (o.cl = firm), NEGATIVE: () => (o.notional = "-" + o.notional),
        PLACEHOLDER: () => (o.isin = "XXXXXXXXXXXX"), OUTLIER: () => (o.notional = String(Number(o.notional) * 1000)), BAD_DATE: () => (o.mat = "31/02/2027x"),
      };
      set[k]();
    }
    rows.push([o.uti, o.rl, o.cl, o.isin, o.notional, o.ccy, o.ex, o.eff, o.mat, o.rep, o.ctry].join(","));
    labels.push(lab);
  }
  return { csv: header + "\n" + rows.join("\n") + "\n", labels };
}
