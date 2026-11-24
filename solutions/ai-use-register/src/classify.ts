// AI Use Register Generator
// Turns a rough list of "where we use AI" into a regulator-ready register: an indicative EU AI Act tier,
// overlapping obligations (automated decisions, model risk, third-party/outsourcing, personal data),
// the evidence each use case needs, and what is missing.
//
// The tier is an INDICATIVE first pass from keywords and answers. Final classification needs legal review.

import { type Row, pick, parseBool, parseTimestamp } from "../../shared/table.ts";

export type Tier = "PROHIBITED?" | "HIGH-RISK" | "REVIEW" | "TRANSPARENCY" | "MINIMAL";

export interface UseCase {
  id: string;
  name: string;
  description: string;
  business_unit: string;
  owner: string;
  vendor: string;
  model: string;
  users: string;            // who interacts / is affected: customers, employees, internal, public
  decision: string;         // assist | automated | content
  personal_data: boolean | null;
  special_data: boolean | null;
  human_in_loop: boolean | null;
  status: string;           // idea | pilot | production | retired
  jurisdictions: string;
  // evidence answers
  risk_assessment: boolean | null;
  dpia: boolean | null;
  last_validated: Date | null;
  monitoring: boolean | null;
  bias_tested: boolean | null;
  transparency_notice: boolean | null;
  vendor_due_diligence: boolean | null;
  documentation: string;
  incident_process: boolean | null;
  logging: boolean | null;
}

export interface Obligation { id: string; title: string; why: string }
export interface Evidence { id: string; label: string; status: "present" | "missing" | "stale" }

export interface RegisterEntry {
  uc: UseCase;
  tier: Tier;
  tier_reason: string;
  matched_area: string;
  overlays: Obligation[];
  evidence: Evidence[];
  readiness: number;  // 0..1 share of required evidence present
  priority: "P1" | "P2" | "P3";
  questions: string[]; // what to ask the owner to firm up the classification
}

export function readUseCases(rows: Row[]): UseCase[] {
  return rows.map((r, i) => ({
    id: pick(r, "use_case_id", "id", "ref") || `AI-${String(i + 1).padStart(3, "0")}`,
    name: pick(r, "name", "use_case", "system", "title"),
    description: pick(r, "description", "purpose", "what_it_does", "details"),
    business_unit: pick(r, "business_unit", "department", "team", "function"),
    owner: pick(r, "owner", "business_owner", "accountable"),
    vendor: pick(r, "vendor", "provider", "supplier"),
    model: pick(r, "model", "technology", "ai_model", "tool"),
    users: pick(r, "users", "affected", "audience", "who_is_affected").toLowerCase(),
    decision: pick(r, "decision", "decision_type", "autonomy", "role_of_ai").toLowerCase(),
    personal_data: parseBool(pick(r, "personal_data", "uses_personal_data", "pii")),
    special_data: parseBool(pick(r, "special_data", "special_category_data", "sensitive_data", "biometric_or_health")),
    human_in_loop: parseBool(pick(r, "human_in_loop", "human_review", "human_oversight")),
    status: pick(r, "status", "stage", "lifecycle").toLowerCase(),
    jurisdictions: pick(r, "jurisdictions", "regions", "countries", "markets"),
    risk_assessment: parseBool(pick(r, "risk_assessment", "risk_assessed", "ai_risk_assessment")),
    dpia: parseBool(pick(r, "dpia", "dpia_done", "privacy_assessment")),
    last_validated: parseTimestamp(pick(r, "last_validated", "validated_on", "last_validation", "model_validation_date")),
    monitoring: parseBool(pick(r, "monitoring", "performance_monitoring", "monitored")),
    bias_tested: parseBool(pick(r, "bias_tested", "fairness_tested", "bias_testing")),
    transparency_notice: parseBool(pick(r, "transparency_notice", "ai_disclosure", "users_told")),
    vendor_due_diligence: parseBool(pick(r, "vendor_due_diligence", "third_party_assessment", "vendor_dd")),
    documentation: pick(r, "documentation", "documentation_link", "model_card", "tech_docs"),
    incident_process: parseBool(pick(r, "incident_process", "incident_response", "escalation_process")),
    logging: parseBool(pick(r, "logging", "audit_logs", "record_keeping")),
  }));
}

interface Area { id: string; tier: Tier; label: string; re: RegExp; unless?: RegExp; needs?: (uc: UseCase, text: string) => boolean }

const PEOPLE = /\b(customer|client|applicant|borrower|individual|consumer|person|people|retail|employee|staff|candidate|student|citizen|patient|policyholder|member)s?\b/i;

// Order matters: first match wins within a tier; tiers are evaluated most-severe first.
export const AREAS: Area[] = [
  // ---- possibly prohibited practices ----
  { id: "SOCIAL_SCORING", tier: "PROHIBITED?", label: "Social scoring of people based on behaviour or personality", re: /\bsocial (score|scoring|credit)\b|\b(trustworthiness|behaviou?ral) score\b.*\b(social media|personal life|lifestyle)\b/i },
  { id: "WORKPLACE_EMOTION", tier: "PROHIBITED?", label: "Emotion recognition of employees or students", re: /\b(emotion|sentiment|mood|stress|facial expressions?|affect|wellbeing)\b.{0,40}\b(recogni[sz]|detect|analys|track|monitor|infer|read|gauge|measur|assess|scor)|\b(recogni[sz]|detect|analys|track|monitor|infer|read|gauge|measur|assess|scor)\w*\b.{0,40}\b(emotion|mood|stress|facial expressions?)/i, needs: (uc, t) => /\b(employee|staff|agent|worker|student|call centre agent|call center agent|teller)s?\b/i.test(t + " " + uc.users) && !/\b(medical|safety)\b/i.test(t) },
  { id: "MANIPULATION", tier: "PROHIBITED?", label: "Manipulative techniques or exploiting vulnerabilities", re: /\bsubliminal\b|\bexploit\w*\b.{0,30}\b(vulnerab\w*|addiction|distress|elderly|age|disabilit\w*|gambling)|\bdark[- ]pattern|\bmanipulat\w+ (customers|users|people|behaviou?r)|\b(target\w*|push\w*)\b.{0,30}\bvulnerable\b|\b(distress|vulnerab\w*|addiction|gambling)\b.{0,40}\b(steer|nudg|push|upsell|sell|target)\w*|\b(steer|nudg|push|upsell|target)\w*\b.{0,40}\b(distress|vulnerab\w*|addiction)/i },
  { id: "SENSITIVE_BIOMETRIC_CATEGORISATION", tier: "PROHIBITED?", label: "Biometric categorisation inferring sensitive traits", re: /\b(infer|predict|categori[sz]e|classify)\w*\b.{0,40}\b(race|ethnicity|religio|sexual orientation|political|trade union)/i, needs: (_uc, t) => /\b(face|facial|biometric|voice|image|photo)/i.test(t) },
  { id: "FACE_SCRAPING", tier: "PROHIBITED?", label: "Untargeted scraping of facial images", re: /\bscrap\w*\b.{0,40}\b(face|facial|images|photos)\b/i },

  // ---- high-risk areas (EU AI Act Annex III style) ----
  { id: "CREDITWORTHINESS", tier: "HIGH-RISK", label: "Creditworthiness / credit scoring of individuals", re: /\b(credit ?(worthiness|score|scoring|decision|limit|risk (rating|grading|model))|creditworth|loan (approval|decision|underwriting|eligibility)|underwrit\w+|affordability|lending decision|probability of default|pd model|bnpl approval|mortgage (approval|decision))\b|\b(loans?|finance|credit) applications?\b|\bloans?\b.{0,40}\b(decid|grant|approv|declin|eligib|repay|rate|interest)|\b(decid|grant|approv|assess)\w*\b.{0,60}\bloans?\b|\b(payment plan|credit (line|offer))\b.{0,40}\b(afford|eligib|approv|offer)/i, unless: /\b(fraud\w*|aml|money laundering|mule)\b/i, needs: (uc, t) => PEOPLE.test(t + " " + uc.users) && !/\b(corporate|sme|wholesale|counterparty|commercial)\b(?!.*\b(retail|individual|consumer|sole trader))/i.test(t) },
  { id: "INSURANCE_PRICING", tier: "HIGH-RISK", label: "Risk assessment / pricing for life or health insurance", re: /\b(life|health|medical)\b.{0,30}\binsurance\b.{0,40}\b(pric|premium|underwrit|risk)|\b(pric|premium|underwrit)\w*\b.{0,40}\b(life|health) (insurance|cover|policy)/i },
  { id: "EMPLOYMENT", tier: "HIGH-RISK", label: "Recruitment, promotion, termination, task allocation or performance monitoring of workers", re: /\b(cv|resume|r[ée]sum[ée]|candidate|applicant|recruit\w*|hiring|interview)\b.{0,40}\b(screen|rank|score|shortlist|filter|assess|select)|\b(screen|rank|score|shortlist|filter|assess|select)\w*\b.{0,40}\b(cv|resume|candidates|applicants)|\b(promotion|termination|dismissal|performance (review|rating|monitoring)|productivity monitoring|employee monitoring|workforce (scoring|allocation)|task allocation|shift allocation)\b|\b(let go|lay ?offs?|redundanc\w*|restructuring|attrition|resign\w*|internal mobility|succession|talent (matching|management))\b|\bmatch\w*\b.{0,30}\b(staff|employees|people)\b.{0,20}\broles?\b/i, needs: (uc, t) => /\b(employee|staff|worker|candidate|applicant|people|workforce|talent|role)s?\b/i.test(t + " " + uc.users) },
  { id: "BIOMETRIC_ID", tier: "HIGH-RISK", label: "Remote biometric identification", re: /\b(facial recognition|face recognition|face match\w*|biometric identification|voice ?print identification|identify (people|customers|individuals) (from|by|using) (face|voice|cctv))\b/i, unless: /\b(verification|verify|1:1|one-to-one|liveness|unlock|login|authenticat)\w*\b/i },
  { id: "ESSENTIAL_SERVICES", tier: "HIGH-RISK", label: "Eligibility for essential public services or benefits", re: /\b(benefit eligibility|social (benefit|welfare|assistance)|public (assistance|benefit)s?|housing allocation|emergency (call|dispatch) (triage|priorit))/i },
  { id: "EDUCATION", tier: "HIGH-RISK", label: "Education admission, grading or proctoring", re: /\b(admission|exams?|grad(e|es|ing)|proctoring|assess students|student (assessment|grading)|learning outcome|pass or fail|certification (test|exam)|training (assessment|test))\b/i },
  { id: "CRITICAL_INFRA", tier: "HIGH-RISK", label: "Safety component of critical infrastructure", re: /\b(safety component|grid (control|stability)|water supply|gas supply|electricity (supply|network)|traffic control)\b/i },

  // ---- transparency obligations ----
  { id: "CHATBOT", tier: "TRANSPARENCY", label: "AI that talks directly with people (chatbot / voice assistant)", re: /\b(chat ?bot|virtual (assistant|agent)|conversational|voice ?bot|voice assistant|ai assistant|digital assistant|customer (chat|support bot)|ivr)\b|\b(answers?|responds? to|replies to)\b.{0,40}\bquestions\b|\b(chats?|talks?) (with|to) (customers|clients|users|investors|employees|staff|the public|members)\b/i },
  { id: "SYNTHETIC_CONTENT", tier: "TRANSPARENCY", label: "Generates synthetic images, audio, video or published text", re: /\b(deepfake|synthetic (voice|video|image|media)|generat\w+ (images?|videos?|audio|voice|avatars?|marketing (copy|content|images)|social media (posts|content))|ai[- ]generated (video|images?|content|avatars?)|text[- ]to[- ](speech|video|image)|voice clon)\w*|\bgenerat\w*\b.{0,30}\b(articles?|newsletters?|posts?|blogs?|press releases?)\b.{0,40}\b(publish\w*|customers|public|website)/i },
  { id: "EMOTION_OTHER", tier: "TRANSPARENCY", label: "Emotion recognition / biometric categorisation (outside work or education)", re: /\b(emotion|sentiment from (voice|face)|facial expression|mood detection)\b/i, needs: (_uc, t) => /\b(face|facial|voice|biometric|camera|video)\b/i.test(t) },
];

const MODEL_RISK = /\b(pric\w*|credit|loan|lending|aml|anti[- ]money|transaction monitoring|sanction\w*|fraud|kyc|capital|liquidity|valuation|trading|hedg\w*|ifrs ?9|expected credit loss|ecl|stress test\w*|provision\w*|forecast\w*|risk (model|rating|score)|collections|limit setting|market risk|alm|treasury)\b/i;
const AUTOMATED = /\b(automat\w+ (decision|approval|decline|reject\w*)|auto[- ](approve|decline|reject)|without human (review|intervention)|fully automat\w+|straight[- ]through decision)\b/i;

export function classify(uc: UseCase, today = new Date()): RegisterEntry {
  const text = `${uc.name}. ${uc.description}. ${uc.business_unit}`;
  let tier: Tier = "MINIMAL";
  let reason = "No high-risk, prohibited or transparency pattern found: likely minimal risk (still record it).";
  let area = "-";
  for (const a of AREAS) {
    if (!a.re.test(text)) continue;
    if (a.unless && a.unless.test(text)) continue;
    if (a.needs && !a.needs(uc, text)) continue;
    tier = a.tier;
    area = a.label;
    const m = text.match(a.re)?.[0] ?? "";
    reason = `Matches "${area}" (from: "${m.trim()}").`;
    break;
  }

  // Safety net: decisions about people that matched no known area are never silently "minimal".
  const DECIDES = /\b(accept\w*|refus\w*|decid\w*|determin\w*|grant\w*|approv\w*|declin\w*|reject\w*|eligib\w*|select\w*|shortlist\w*|let go|dismiss\w*|grad(e|es|ing)|pass or fail|rank\w*|set\w* (premiums?|prices?|limits?)|who (gets|should|can))\b/i;
  if ((tier === "MINIMAL") && DECIDES.test(text) && PEOPLE.test(text + " " + uc.users) && !/\b(fraud\w*|aml|money laundering|sanction\w*|mule|surveillance|market abuse)\b/i.test(text)) {
    tier = "REVIEW";
    area = "Decision about individuals (unmatched)";
    reason = `Makes or supports decisions about individuals ("${text.match(DECIDES)?.[0]}") but matches no listed area: needs human review before you treat it as minimal.`;
  }

  // ---- overlapping obligations ----
  const overlays: Obligation[] = [];
  const affectsPeople = PEOPLE.test(text + " " + uc.users);
  const automated = uc.decision.includes("automat") || AUTOMATED.test(text) || (uc.human_in_loop === false && uc.decision !== "content");
  if (automated && affectsPeople && (tier === "HIGH-RISK" || /\b(declin|reject|approv|eligib|limit|block|freez|terminat|price|pricing)\w*/i.test(text))) {
    overlays.push({ id: "AUTOMATED_DECISION", title: "Automated decisions about individuals", why: "Decisions with significant effects on people made without meaningful human review usually need a legal basis, an explanation and a way to contest (e.g. GDPR Art. 22)." });
  }
  if (MODEL_RISK.test(text)) {
    overlays.push({ id: "MODEL_RISK", title: "Model risk management", why: "Used in financial decisions or risk measurement: belongs in the model inventory with independent validation and monitoring (e.g. US SR 11-7, UK PRA SS1/23)." });
  }
  if (uc.vendor && !/^(in[- ]?house|internal|none|n\/a|-)$/i.test(uc.vendor)) {
    overlays.push({ id: "THIRD_PARTY", title: "Third-party / outsourcing", why: `Supplied by ${uc.vendor}: record it in your third-party / ICT register and keep due diligence and exit plans (e.g. EU DORA, outsourcing rules).` });
  }
  if (uc.personal_data || uc.special_data) {
    overlays.push({ id: "PERSONAL_DATA", title: uc.special_data ? "Special-category personal data" : "Personal data", why: uc.special_data ? "Biometric, health or other sensitive data: needs a DPIA and a specific legal basis." : "Processes personal data: check lawful basis, retention and whether a DPIA is needed." });
  }
  if (/\b(llm|gpt|claude|gemini|llama|mistral|copilot|generative|genai|gen ai|foundation model)\b/i.test(uc.model + " " + text)) {
    overlays.push({ id: "GENAI", title: "Generative AI controls", why: "LLM-based: control prompt-injection, data leakage, hallucination and output review; log prompts/outputs where lawful." });
  }

  // ---- evidence ----
  const needs = evidenceNeeded(tier, overlays, uc);
  const evidence: Evidence[] = needs.map(([id, label]) => ({ id, label, status: evidenceStatus(id, uc, today) }));
  const present = evidence.filter((e) => e.status === "present").length;
  const readiness = evidence.length ? present / evidence.length : 1;

  // pilots on real people count as live
  const live = /prod|live|use|pilot|trial|poc/.test(uc.status) || uc.status === "";
  const staleValidation = evidence.some((e) => e.id === "validation" && e.status !== "present");
  const priority: RegisterEntry["priority"] =
    tier === "PROHIBITED?" || (tier === "HIGH-RISK" && live && readiness < 0.8) ? "P1"
      : tier === "HIGH-RISK" || tier === "REVIEW" || (overlays.some((o) => o.id === "AUTOMATED_DECISION" || o.id === "MODEL_RISK") && (readiness < 0.6 || staleValidation)) || (tier === "TRANSPARENCY" && uc.transparency_notice !== true) ? "P2"
        : "P3";

  return { uc, tier, tier_reason: reason, matched_area: area, overlays, evidence, readiness, priority, questions: followUps(uc, tier, text) };
}

function evidenceNeeded(tier: Tier, overlays: Obligation[], uc: UseCase): [string, string][] {
  const list: [string, string][] = [["owner", "Named accountable owner"], ["purpose", "Clear description of purpose"], ["risk_assessment", "AI risk assessment"]];
  const has = (id: string) => overlays.some((o) => o.id === id);
  if (tier === "HIGH-RISK" || tier === "PROHIBITED?" || tier === "REVIEW") {
    list.push(["human_oversight", "Human oversight defined"], ["documentation", "Technical documentation / model card"], ["logging", "Automatic logs kept"], ["monitoring", "Accuracy & performance monitoring"], ["bias_tested", "Bias / fairness testing"], ["incident_process", "Serious-incident process"]);
  }
  if (tier === "TRANSPARENCY") list.push(["transparency_notice", "People told they are dealing with AI / content labelled"]);
  if (has("MODEL_RISK")) {
    if (!list.some(([id]) => id === "monitoring")) list.push(["monitoring", "Performance monitoring"]);
    list.push(["validation", "Independent validation in last 12 months"]);
    if (!list.some(([id]) => id === "documentation")) list.push(["documentation", "Model documentation"]);
  }
  if (has("AUTOMATED_DECISION") && !list.some(([id]) => id === "human_oversight")) list.push(["human_oversight", "Human review / right to contest"]);
  if (has("PERSONAL_DATA") && (uc.special_data || tier !== "MINIMAL" || has("AUTOMATED_DECISION"))) list.push(["dpia", "DPIA completed"]);
  if (has("THIRD_PARTY")) list.push(["vendor_due_diligence", "Vendor due diligence"]);
  if (has("GENAI") && !list.some(([id]) => id === "logging")) list.push(["logging", "Prompt/output logging"]);
  return list;
}

function evidenceStatus(id: string, uc: UseCase, today: Date): Evidence["status"] {
  const b = (v: boolean | null) => (v ? "present" : "missing");
  switch (id) {
    case "owner": return uc.owner ? "present" : "missing";
    case "purpose": return uc.description.length >= 15 ? "present" : "missing";
    case "risk_assessment": return b(uc.risk_assessment);
    case "human_oversight": return b(uc.human_in_loop);
    case "documentation": return uc.documentation && !/^(no|none|n\/a|-)$/i.test(uc.documentation) ? "present" : "missing";
    case "logging": return b(uc.logging);
    case "monitoring": return b(uc.monitoring);
    case "bias_tested": return b(uc.bias_tested);
    case "incident_process": return b(uc.incident_process);
    case "transparency_notice": return b(uc.transparency_notice);
    case "dpia": return b(uc.dpia);
    case "vendor_due_diligence": return b(uc.vendor_due_diligence);
    case "validation": {
      if (!uc.last_validated) return "missing";
      const months = (today.getTime() - uc.last_validated.getTime()) / (30.44 * 86400000);
      return months <= 12 ? "present" : "stale";
    }
    default: return "missing";
  }
}

function followUps(uc: UseCase, tier: Tier, text: string): string[] {
  const q: string[] = [];
  if (!uc.users) q.push("Who uses it, and who is affected by its output: customers, employees, or only internal teams?");
  if (!uc.decision) q.push("Does the AI make or recommend the decision? Can a person overrule it before it takes effect?");
  if (uc.personal_data === null) q.push("Does it process personal data? Any biometric, health or other sensitive data?");
  if (tier === "MINIMAL" && /\b(score|rank|decide|eligib|approve|declin)\w*/i.test(text)) q.push("It scores or decides something: about individuals? If yes, re-check whether it is high-risk.");
  if (tier === "HIGH-RISK" && /\b(fraud)\b/i.test(text)) q.push("Is it used only to detect fraud (usually not high-risk), or also to decide credit?");
  if (!uc.jurisdictions) q.push("Which countries is it used in, or do its outputs affect people in? (EU rules can apply even if you are outside the EU.)");
  return q;
}
