// Synthetic alert log with known false-positive drivers. All names are invented; none are real sanctioned parties.
import { rng, choice } from "../../shared/bench.ts";

export function generate(seed = 7, n = 3000): { csv: string; truth: { repeatPairs: string[]; trueTokens: string[] } } {
  const r = rng(seed);
  const entries = ["Viktor Drazhenko", "Oceanic Star Shipping Co", "Al Noor General Trading", "Kim Song Ryong", "Ali Reza Tavakkol", "Northern Lights Petroleum", "Cuban Avenue Holdings", "Baltic Arrow Marine", "Red Sea Commodities", "Zarafshan Exports"];
  const customers = ["Viktor Drazen", "Oceanic Star Logistics", "Al Noor Bakery", "Kim Seong", "Ali Rezaee", "Northern Lights Florists", "Baltic Arrow Yacht Club", "Red Sea Diving Centre", "Zara Fashion Exports", "Ali Khan Textiles", "Kim Lee Noodle Bar", "Maria Kim"];
  const repeatPairs = [["Viktor Drazen", "Viktor Drazhenko"], ["Oceanic Star Logistics", "Oceanic Star Shipping Co"], ["Northern Lights Florists", "Northern Lights Petroleum"], ["Baltic Arrow Yacht Club", "Baltic Arrow Marine"]];
  const lists = ["OFAC SDN", "EU Consolidated", "UK HMT", "UN"];
  let csv = "alert_id,created_at,screened_name,matched_name,list,match_score,matched_field,message_type,disposition,handling_minutes,customer_id\n";
  const day = (i: number) => new Date(Date.UTC(2026, 0, 1) + (i % 300) * 86400000).toISOString().slice(0, 10);
  for (let i = 0; i < n; i++) {
    const k = r();
    let screened = "", matched = "", field = "name", msg = choice(r, ["pacs.008", "MT103", "customer onboarding", "periodic review"]), disp = "false positive", score = 80 + Math.floor(r() * 20), cust = `C${Math.floor(r() * 2000)}`;
    if (k < 0.30) { const [s, m] = choice(r, repeatPairs); screened = s; matched = m; cust = `C-${s.length}`; }
    else if (k < 0.45) { screened = choice(r, ["14 Cuban Avenue, Miami", "Cuban Avenue Bakery", "7 Cuban Avenue"]); matched = "Cuban Avenue Holdings"; field = "address"; }
    else if (k < 0.62) { screened = choice(r, ["Ali Khan Textiles", "Ali Rezaee", "Kim Lee Noodle Bar", "Maria Kim", "Kim Seong"]); matched = screened.includes("Ali") ? "Ali Reza Tavakkol" : "Kim Song Ryong"; score = 80 + Math.floor(r() * 8); }
    else if (k < 0.72) { screened = choice(r, customers); matched = choice(r, entries); msg = choice(r, ["MT950", "camt.053"]); score = 80 + Math.floor(r() * 12); }
    else if (k < 0.97) { screened = choice(r, customers) + " " + i; matched = choice(r, entries); score = 80 + Math.floor(r() * 6); }
    else { // true matches: high scores, plus some on common tokens so that the token driver is NOT safe
      screened = choice(r, ["Viktor Drazhenko", "Kim Song Ryong", "K. Song Ryong", "Zarafshan Exports LLC"]); matched = screened.includes("Song") ? "Kim Song Ryong" : screened.startsWith("Viktor") ? "Viktor Drazhenko" : "Zarafshan Exports"; score = 92 + Math.floor(r() * 8); disp = "true match"; cust = `T${i}`; }
    csv += `A${i},${day(i)},"${screened}","${matched}",${choice(r, lists)},${score},${field},${msg},${disp},${15 + Math.floor(r() * 40)},${cust}\n`;
  }
  return { csv, truth: { repeatPairs: repeatPairs.map(([s]) => s), trueTokens: ["kim"] } };
}
