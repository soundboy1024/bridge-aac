/**
 * Individual Communication Profile (ICP)
 *
 * The single most important object in Bridge. It is a living, human-curated,
 * machine-readable description of how ONE person communicates. Every module
 * (interpreter, composer, partner coach, anchor engine, story generator,
 * clinician insights) reads from it; nothing writes to it without a human
 * approving the change (see store/review.ts).
 *
 * Design rules baked into the schema:
 *  - Every learned fact carries provenance + confidence + who confirmed it.
 *  - The person's own voice/preferences are first-class (presume competence).
 *  - Guardrails are data, not code, so a therapist can edit them.
 */
import { z } from "zod";

export const Confidence = z.enum(["observed_once", "emerging", "established", "core"]);
export type Confidence = z.infer<typeof Confidence>;

export const Provenance = z.object({
  source: z.enum(["caregiver", "therapist", "teacher", "self", "ai_hypothesis", "import"]),
  confirmedBy: z.string().optional(), // name/role of the human who validated
  firstSeen: z.string().optional(), // ISO date
  lastSeen: z.string().optional(),
  timesObserved: z.number().int().nonnegative().default(1),
});
export type Provenance = z.infer<typeof Provenance>;

/** A unit of the person's idiolect: a word, script, gesture, sound, song fragment, object, route number... */
export const LexiconEntry = z.object({
  id: z.string(),
  form: z.string().describe("What is produced, verbatim. e.g. 'Pee-Wee voice: I know you are but what am I', 'hums Like a Prayer', 'taps table 3x', 'Route 9 to Route 84'"),
  modality: z.enum(["speech", "vocalization", "song", "gesture", "sign", "symbol", "object", "text", "drawing", "behavior", "other"]),
  meanings: z.array(
    z.object({
      gloss: z.string().describe("Conventional-language meaning"),
      contexts: z.array(z.string()).default([]).describe("When this meaning applies, e.g. 'before meals', 'when a stranger sings to her'"),
      function: z.enum(["request", "protest", "comment", "greeting", "self_regulation", "social_bid", "question", "distress", "joy", "script_for_comfort", "play_or_testing", "unknown"]).default("unknown").describe("play_or_testing = deliberate: humor, provocation, checking what you will do. Not every behavior is a need."),
      confidence: Confidence.default("observed_once"),
      provenance: Provenance,
    }),
  ),
  notes: z.string().optional(),
  doNotInterpretAs: z.array(z.string()).default([]).describe("Known wrong readings, to stop the AI repeating them"),
});
export type LexiconEntry = z.infer<typeof LexiconEntry>;

export const SensoryProfile = z.object({
  seeking: z.array(z.string()).default([]), // deep pressure, spinning, humming, specific textures
  avoiding: z.array(z.string()).default([]), // fluorescent lights, balloons, being sung at by strangers
  triggers: z.array(z.object({
    trigger: z.string(),
    category: z.enum(["sensory", "phobic", "schedule", "social", "other"]).default("sensory"),
    scanAhead: z.boolean().default(false).describe("Partner should check any new setting for this BEFORE the person arrives (e.g. balloons at a party)"),
    earlySigns: z.array(z.string()).default([]).describe("What it looks like at the *earliest* stage — the 'gate' point"),
    escalation: z.string().optional(),
    whatHelps: z.array(z.string()).default([]),
    whatMakesItWorse: z.array(z.string()).default([]),
    provenance: Provenance,
  })).default([]),
  regulators: z.array(z.string()).default([]).describe("Things that reliably help the person re-regulate"),
});

/** How to signal to this person. Critical for non-readers. */
export const CueGrammar = z.object({
  reads: z.enum(["fluent", "some_words", "symbols_only", "none"]).default("symbols_only"),
  preferredChannels: z.array(z.enum(["spoken", "text", "symbol", "photo", "light", "sound_motif", "music", "vibration", "object", "smell", "gesture"])).default(["spoken", "symbol"]),
  motifs: z.array(z.object({
    meaning: z.string(), // "transition coming in 5 min", "meal soon", "big unexpected change", "all good"
    channel: z.string(),
    cue: z.string(), // "amber light pulse", "3-note descending chime", "the Madonna intro", "warm cushion on"
    established: z.boolean().default(false),
  })).default([]),
  leadTimes: z.object({
    transitionWarningMinutes: z.array(z.number()).default([10, 5, 1]),
    waitTimeSeconds: z.number().default(10).describe("How long to wait for a response before re-prompting"),
  }).prefault({}),
});

export const Schedule = z.object({
  anchors: z.array(z.object({
    id: z.string(),
    label: z.string(), // "breakfast", "swim", "rest", "bus home"
    time: z.string().optional(), // "08:00" — fixed anchors
    afterAnchor: z.string().optional(), // relative anchors: "after swim"
    expectedDurationMin: z.number().optional(),
    importance: z.enum(["critical", "high", "normal"]).default("normal"),
    symbol: z.string().optional(), // symbol id or emoji
  })).default([]),
  changeTolerance: z.enum(["very_low", "low", "moderate", "ok"]).default("low"),
  knownHardTransitions: z.array(z.string()).default([]),
});

export const Guardrails = z.object({
  aiNeverSpeaksForPerson: z.literal(true).default(true), // non-negotiable: AI proposes, person/partner selects
  maxInterpretations: z.number().int().min(1).max(5).default(3),
  bannedTopics: z.array(z.string()).default([]),
  bannedPhrases: z.array(z.string()).default([]),
  alwaysOfferDecline: z.boolean().default(true).describe("Composer always includes a 'none of these / something else' option"),
  requireHumanReviewForNewLexicon: z.literal(true).default(true),
  dataRetentionDays: z.number().int().default(365),
  consent: z.object({
    guardianConsent: z.boolean().default(false),
    personAssent: z.enum(["yes", "no", "unable_to_determine"]).default("unable_to_determine"),
    allowedUses: z.array(z.enum(["interpretation", "composition", "coaching", "insights", "research_anonymized"])).default(["interpretation", "composition", "coaching"]),
  }).prefault({}),
});

export const Profile = z.object({
  id: z.string(),
  schemaVersion: z.literal(1).default(1),
  displayName: z.string(), // first name or nickname — never full legal name in the profile
  age: z.number().optional(),
  pronouns: z.string().default("they/them"),
  summary: z.string().describe("2–4 sentences a new counselor would need on day one"),
  strengths: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]).describe("Deep interests are communication bridges, not distractions"),
  expressive: z.object({
    primaryModes: z.array(z.string()).default([]), // "single words", "echolalia/scripts", "song", "AAC device", "leads by hand"
    typicalUtteranceLength: z.enum(["none", "single_word", "two_three_words", "phrases_scripts", "sentences"]).default("single_word"),
    gestaltProcessor: z.boolean().optional().describe("Acquires language in chunks/scripts (NLA framework); if true, treat scripts as meaningful units"),
    voiceStyle: z.string().optional().describe("How the person sounds when they *do* say things — composer should match this, not a generic voice"),
    registers: z.array(z.object({
      name: z.string(), // "song call-and-response", "atlas talk", "Pee-Wee voice"
      authorizedPartners: z.array(z.string()).default([]).describe("People the person has chosen for this register. Empty = anyone. Unchosen people using it is a violation, not a nice try."),
      ifUnauthorized: z.string().optional().describe("What to do if you are not on the list"),
    })).default([]),
  }).prefault({}),
  receptive: z.object({
    understandsMoreThanShows: z.boolean().default(true),
    bestWith: z.array(z.string()).default([]), // "short sentences", "one instruction at a time", "visual + spoken", "literal language"
    avoid: z.array(z.string()).default([]), // "idioms", "sarcasm", "multi-step directions", "questions stacked"
    processingTimeSeconds: z.number().default(10),
    responseBias: z.object({
      kind: z.enum(["none", "acquiescence", "echo_last_option", "refusal", "unknown"]).default("unknown").describe("acquiescence = says yes to anything; echo_last_option = repeats whichever choice came last; refusal = says no first, regardless"),
      notes: z.string().optional(),
    }).prefault({}),
    comprehensionKnown: z.boolean().default(true).describe("false = nobody can currently tell how much is understood. Presume competence; never infer absence of meaning from absence of response."),
  }).prefault({}),
  lexicon: z.array(LexiconEntry).default([]),
  sensory: SensoryProfile.prefault({}),
  cues: CueGrammar.prefault({}),
  schedule: Schedule.prefault({}),
  people: z.array(z.object({ name: z.string(), role: z.string(), notes: z.string().optional(), trusted: z.boolean().default(true) })).default([]),
  goals: z.array(z.object({ id: z.string(), text: z.string(), owner: z.string().optional(), measure: z.string().optional() })).default([]),
  safetyAlerts: z.array(z.string()).default([]).describe("Things a partner must know in the first minute: no pain response, seizures, elopement, pica. Rendered first in every prompt."),
  fit: z.object({
    level: z.enum(["full", "partial", "not_needed"]).default("full"),
    note: z.string().optional(),
  }).prefault({}).describe("not_needed = this person does not need a communication assistant (a deaf kid with no other disability needs an interpreter and a different camp, not a profile). The honest answer is sometimes 'this tool is not for them'."),
  guardrails: Guardrails.prefault({}),
  updatedAt: z.string().optional(),
});
export type Profile = z.infer<typeof Profile>;

export function parseProfile(json: unknown): Profile {
  return Profile.parse(json);
}

/** Compact, stable rendering of the profile for prompts. Stable ordering = cacheable prefix. */
export function renderProfileForPrompt(p: Profile): string {
  const lines: string[] = [];
  lines.push(`# Communication profile: ${p.displayName} (${p.pronouns}${p.age ? `, age ${p.age}` : ""})`);
  lines.push(p.summary);
  if (p.fit.level !== "full") lines.push(`FIT: ${p.fit.level}${p.fit.note ? ` — ${p.fit.note}` : ""}`);
  if (p.safetyAlerts.length) lines.push(`!! SAFETY: ${p.safetyAlerts.join(" | ")}`);
  if (p.strengths.length) lines.push(`Strengths: ${p.strengths.join("; ")}`);
  if (p.interests.length) lines.push(`Deep interests (use as bridges): ${p.interests.join("; ")}`);
  lines.push(`Expressive: modes=${p.expressive.primaryModes.join(", ") || "unknown"}; typical length=${p.expressive.typicalUtteranceLength}${p.expressive.gestaltProcessor ? "; gestalt/script processor — scripts are meaningful units" : ""}${p.expressive.voiceStyle ? `; voice style: ${p.expressive.voiceStyle}` : ""}`);
  for (const r of p.expressive.registers) lines.push(`Register "${r.name}": ${r.authorizedPartners.length ? `ONLY ${r.authorizedPartners.join(", ")} may use it` : "anyone may use it"}${r.ifUnauthorized ? ` — if not you: ${r.ifUnauthorized}` : ""}`);
  lines.push(`Receptive: understands more than shows=${p.receptive.understandsMoreThanShows}${p.receptive.comprehensionKnown ? "" : " (comprehension level unknown — presume competence)"}; best with: ${p.receptive.bestWith.join(", ") || "-"}; avoid: ${p.receptive.avoid.join(", ") || "-"}; allow ${p.receptive.processingTimeSeconds}s processing time`);
  const rb = p.receptive.responseBias;
  if (rb.kind !== "none" && rb.kind !== "unknown") lines.push(`RESPONSE BIAS: ${rb.kind}${rb.notes ? ` — ${rb.notes}` : ""}. Yes/no and "which one?" questions do NOT confirm anything for this person. Check by offering real objects/actions and watching what they do, or by re-asking with choices reversed.`);
  if (p.lexicon.length) {
    lines.push(`## Personal lexicon (${p.lexicon.length} entries; cite the bracketed ids as evidence)`);
    for (const e of p.lexicon) {
      const meanings = e.meanings
        .map((m) => `"${m.gloss}" [${m.function}, ${m.confidence}${m.contexts.length ? `, when: ${m.contexts.join("/")}` : ""}]`)
        .join(" | ");
      lines.push(`- [${e.id}] (${e.modality}) ${e.form} → ${meanings}${e.doNotInterpretAs.length ? ` — NOT: ${e.doNotInterpretAs.join(", ")}` : ""}${e.notes ? ` — ${e.notes}` : ""}`);
    }
  }
  const s = p.sensory;
  if (s.seeking.length || s.avoiding.length || s.triggers.length || s.regulators.length) {
    lines.push(`## Sensory & regulation`);
    if (s.seeking.length) lines.push(`Seeks: ${s.seeking.join("; ")}`);
    if (s.avoiding.length) lines.push(`Avoids: ${s.avoiding.join("; ")}`);
    if (s.regulators.length) lines.push(`Regulators: ${s.regulators.join("; ")}`);
    const scan = s.triggers.filter((t) => t.scanAhead);
    if (scan.length) lines.push(`Scan every new setting before arrival for: ${scan.map((t) => t.trigger).join("; ")}`);
    for (const t of s.triggers) {
      lines.push(`- [trigger:${t.trigger}] (${t.category}${t.scanAhead ? ", SCAN AHEAD" : ""}): ${t.trigger}. Early signs: ${t.earlySigns.join(", ") || "?"}. Helps: ${t.whatHelps.join(", ") || "?"}. Worse: ${t.whatMakesItWorse.join(", ") || "?"}`);
    }
  }
  lines.push(`## Cues: reads=${p.cues.reads}; channels=${p.cues.preferredChannels.join(", ")}`);
  for (const m of p.cues.motifs) lines.push(`- "${m.meaning}" = ${m.cue} (${m.channel}${m.established ? ", established" : ", still being taught"})`);
  if (p.schedule.anchors.length) {
    lines.push(`## Schedule (change tolerance: ${p.schedule.changeTolerance})`);
    for (const a of p.schedule.anchors) lines.push(`- ${a.time ?? `after ${a.afterAnchor}`}: ${a.label}${a.importance !== "normal" ? ` [${a.importance}]` : ""}`);
    if (p.schedule.knownHardTransitions.length) lines.push(`Hard transitions: ${p.schedule.knownHardTransitions.join("; ")}`);
  }
  if (p.people.length) lines.push(`## People: ${p.people.map((x) => `${x.name} (${x.role}${x.notes ? `: ${x.notes}` : ""})`).join("; ")}`);
  if (p.goals.length) lines.push(`## Current goals: ${p.goals.map((g) => g.text).join(" | ")}`);
  const g = p.guardrails;
  lines.push(`## Guardrails: max ${g.maxInterpretations} interpretations; always offer decline=${g.alwaysOfferDecline}${g.bannedTopics.length ? `; banned topics: ${g.bannedTopics.join(", ")}` : ""}${g.bannedPhrases.length ? `; never use phrases: ${g.bannedPhrases.join(", ")}` : ""}`);
  return lines.join("\n");
}
