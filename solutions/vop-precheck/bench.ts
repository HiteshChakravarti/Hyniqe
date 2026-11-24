// Benchmark: 1,200 payee-name variants built from 60 realistic European company names, labelled by how they were
// changed (exact/case/accents → MATCH; legal form, word order, 1–2 letter typo, trading name → CLOSE MATCH;
// different company → NO MATCH). Labels reflect common VoP practice; each bank's real algorithm differs. Run: node bench.ts
import { rng, choice } from "../shared/bench.ts";
import { compareNames } from "./src/precheck.ts";

const r = rng(97);
const bases = ["Müller Logistik", "Société Générale de Fournitures", "Van der Berg Consulting", "García y Asociados", "Rossi Forniture", "Office Supplies Europe", "Nordic Timber", "Østergaard Byg", "Kowalski Transport", "Dubois Électricité",
  "Schneider Bau", "Fischer Software", "Bianchi Costruzioni", "Martínez Servicios", "Lindqvist Design", "Papadopoulos Shipping", "Novak Engineering", "Horváth Kft Partners", "Janssen Catering", "De Smet Logistics",
  "O'Connor Accountants", "Murphy Plant Hire", "Silva Têxteis", "Costa Metalurgica", "Weber Elektrotechnik", "Hoffmann Druckerei", "Moreau Immobilier", "Lefebvre Transports", "Romano Alimentari", "Ferrari Ricambi",
  "Kuznetsov Trading", "Andersen Marine", "Nieminen Consulting", "Virtanen Rakennus", "Popescu Construct", "Ionescu Medical", "Dimitrov Tech", "Petrov Logistics", "Horvat Gradnja", "Kovač Software",
  "Berger Möbel", "Wagner Reisen", "Becker Getränke", "Schulz Immobilien", "Zimmermann Holzbau", "Lambert Conseil", "Fontaine Peinture", "Rousseau Jardins", "Mercier Optique", "Garnier Boulangerie",
  "Bakker Bloemen", "Visser Vis", "Smit Bouw", "Meijer Mode", "Mulder Media", "Peeters Brouwerij", "Maes Textiel", "Jacobs Ijzerwaren", "Claes Verzekeringen", "Willems Architecten"];
const forms = ["GmbH", "SA", "BV", "SL", "Srl", "NV", "AB", "Oy", "Ltd", "AG", "SAS", "Kft", "sp. z o.o."];
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ø/g, "o").replace(/Ø/g, "O");
function typo(s: string): string { const i = 2 + Math.floor(r() * (s.length - 4)); return r() < 0.5 ? s.slice(0, i) + s.slice(i + 1) : s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); }
const cases: [string, string, string, string][] = [];
for (let i = 0; i < 1200; i++) {
  const base = choice(r, bases); const form = choice(r, forms); const legal = `${base} ${form}`;
  const kind = choice(r, ["exact", "case", "accents", "legal-form", "order", "typo", "trading", "different"]);
  let given = legal, exp = "MATCH";
  if (kind === "case") given = legal.toUpperCase();
  else if (kind === "accents") given = strip(legal);
  else if (kind === "legal-form") { given = base; exp = "LIKELY CLOSE MATCH"; }
  else if (kind === "order") { const w = base.split(" "); given = [...w.slice(1), w[0], form].join(" "); exp = w.length > 1 ? "LIKELY CLOSE MATCH" : "MATCH"; }
  else if (kind === "typo") { given = typo(legal); exp = "LIKELY CLOSE MATCH"; }
  else if (kind === "trading") { given = base.split(" ")[0] + " Group"; exp = "LIKELY NO MATCH"; }
  else if (kind === "different") { let o = choice(r, bases); while (o === base) o = choice(r, bases); given = `${o} ${form}`; exp = "LIKELY NO MATCH"; }
  cases.push([kind, given, legal, exp]);
}
const byKind: Record<string, [number, number]> = {};
let right = 0, dangerous = 0;
for (const [kind, given, legal, exp] of cases) {
  const got = compareNames(given, legal).outcome;
  const ok = got === exp;
  byKind[kind] = [(byKind[kind]?.[0] ?? 0) + (ok ? 1 : 0), (byKind[kind]?.[1] ?? 0) + 1];
  if (ok) right++;
  if (exp === "LIKELY NO MATCH" && got === "MATCH") dangerous++;
}
console.log("\nVoP Pre-Checker — name-variant benchmark (1,200 cases)\nchange type      correct");
for (const [k, [a, b]] of Object.entries(byKind)) console.log(k.padEnd(16) + `${((a / b) * 100).toFixed(1)}%  (${a}/${b})`);
console.log(`OVERALL          ${((right / cases.length) * 100).toFixed(1)}%\nDifferent payee predicted as MATCH (the dangerous error): ${dangerous}`);
if (dangerous > 0) process.exitCode = 1;
