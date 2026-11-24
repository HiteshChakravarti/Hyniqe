import { mdTable, toCsv } from "../../shared/table.ts";
import type { RegisterEntry } from "./classify.ts";

export const TEMPLATE_COLUMNS: [string, string][] = [
  ["use_case_id", "Your reference, e.g. AI-001"],
  ["name", "Short name, e.g. 'Mortgage affordability model'"],
  ["description", "One or two sentences: what it does and what its output is used for"],
  ["business_unit", "Team or function"],
  ["owner", "Named accountable person"],
  ["vendor", "Supplier, or 'in-house'"],
  ["model", "Technology, e.g. gradient boosting, GPT-4o, Claude, rules + ML"],
  ["users", "Who is affected: customers / employees / internal / public"],
  ["decision", "assist (human decides) / automated (AI decides) / content (generates content)"],
  ["personal_data", "yes / no"],
  ["special_data", "yes / no: biometric, health, ethnicity, religion etc."],
  ["human_in_loop", "yes / no: can a person review and overrule before it takes effect?"],
  ["status", "idea / pilot / production / retired"],
  ["jurisdictions", "Countries it is used in or affects"],
  ["risk_assessment", "yes / no"],
  ["dpia", "yes / no"],
  ["last_validated", "Date of last independent validation (YYYY-MM-DD)"],
  ["monitoring", "yes / no"],
  ["bias_tested", "yes / no"],
  ["transparency_notice", "yes / no: are people told it's AI / is content labelled?"],
  ["vendor_due_diligence", "yes / no"],
  ["documentation", "Link to model card / technical documentation"],
  ["incident_process", "yes / no"],
  ["logging", "yes / no"],
];

export function templateCsv(): string {
  return TEMPLATE_COLUMNS.map(([c]) => c).join(",") + "\n" + TEMPLATE_COLUMNS.map(([, h]) => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
}

export function toRegisterCsv(list: RegisterEntry[]): string {
  return toCsv(list.map((e) => ({
    use_case_id: e.uc.id, name: e.uc.name, business_unit: e.uc.business_unit, owner: e.uc.owner, vendor: e.uc.vendor, status: e.uc.status,
    indicative_tier: e.tier, matched_area: e.matched_area, other_obligations: e.overlays.map((o) => o.title).join("; "),
    priority: e.priority, readiness_pct: Math.round(e.readiness * 100),
    missing_evidence: e.evidence.filter((x) => x.status !== "present").map((x) => x.label + (x.status === "stale" ? " (stale)" : "")).join("; "),
    open_questions: e.questions.join(" | "), reason: e.tier_reason,
  })), ["use_case_id", "name", "business_unit", "owner", "vendor", "status", "indicative_tier", "matched_area", "other_obligations", "priority", "readiness_pct", "missing_evidence", "open_questions", "reason"]);
}

export function toMarkdown(list: RegisterEntry[], title = "AI Use Register"): string {
  const tiers = ["PROHIBITED?", "HIGH-RISK", "REVIEW", "TRANSPARENCY", "MINIMAL"] as const;
  const count = (t: string) => list.filter((e) => e.tier === t).length;
  const avg = list.length ? list.reduce((s, e) => s + e.readiness, 0) / list.length : 1;
  const out = [
    `# ${title}`, "",
    `**${list.length} AI use cases.** Indicative tiers: ${tiers.map((t) => `${count(t)} ${t.toLowerCase()}`).join(" · ")}.`,
    `Average evidence readiness: **${Math.round(avg * 100)}%**. Priority actions: ${list.filter((e) => e.priority === "P1").length} P1, ${list.filter((e) => e.priority === "P2").length} P2.`, "",
    mdTable(["ID", "Use case", "Tier", "Also", "Ready", "Priority"],
      [...list].sort((a, b) => a.priority.localeCompare(b.priority) || tiers.indexOf(a.tier) - tiers.indexOf(b.tier))
        .map((e) => [e.uc.id, e.uc.name, e.tier, e.overlays.map((o) => o.id.replace(/_/g, " ").toLowerCase()).join(", ") || "-", `${Math.round(e.readiness * 100)}%`, e.priority])), "",
  ];
  const urgent = list.filter((e) => e.priority !== "P3");
  if (urgent.length) {
    out.push("## What to fix first", "");
    for (const e of [...urgent].sort((a, b) => a.priority.localeCompare(b.priority))) {
      const missing = e.evidence.filter((x) => x.status !== "present");
      out.push(`### ${e.priority} · ${e.uc.id} ${e.uc.name} (${e.tier})`, "", e.tier_reason, "");
      if (e.tier === "PROHIBITED?") out.push("**Stop and get legal review now.** This looks like a practice the EU AI Act bans outright.", "");
      if (missing.length) out.push("Missing evidence: " + missing.map((x) => x.label + (x.status === "stale" ? " (out of date)" : "")).join("; ") + ".", "");
      for (const o of e.overlays) out.push(`- ${o.title}: ${o.why}`);
      if (e.questions.length) out.push("", "Ask the owner:", ...e.questions.map((q) => `- ${q}`));
      out.push("");
    }
  }
  out.push(
    "## How to read this", "",
    "- **REVIEW** means it makes or supports decisions about people but matched no listed area. A person must look at it before it is treated as minimal.",
    "- **Tier** is an indicative first pass based on the EU AI Act's categories (prohibited practices, high-risk areas, transparency duties). It is a starting point for your legal and compliance team, not a legal classification. Check current application dates for each obligation.",
    "- **Also** lists other obligations that commonly apply to banks: automated decision rules, model risk management, third-party/outsourcing registers, data protection, and generative-AI controls.",
    "- **Ready** is the share of the evidence each use case needs that you have recorded.", "",
    "_Generated by Hyniqe Hub · AI Use Register Generator. Runs locally. Not legal advice._",
  );
  return out.join("\n") + "\n";
}
