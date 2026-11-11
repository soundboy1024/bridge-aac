/**
 * Interpreter — "translation in".
 *
 * A partner (counselor, parent, peer) describes what the person said or did
 * and the context. Bridge returns ranked *hypotheses* grounded in the personal
 * lexicon, a regulation-first note if warranted, what the partner could do
 * next, and (optionally) a candidate lexicon entry for the human review queue.
 *
 * This is the ASLT "Phase 3" in miniature, with Phases 1–2 (pattern
 * recognition + contextual analysis) living in the profile and the review loop.
 */
import { z } from "zod";
import type { Profile, LexiconEntry } from "../core/profile.js";
import { systemFor } from "../core/prompts.js";
import type { Provider } from "../core/provider.js";

export const InterpretInput = z.object({
  observation: z.string().min(1).describe("What the person said/did, verbatim and concrete"),
  context: z.object({
    setting: z.string().optional(),
    timeOfDay: z.string().optional(),
    recentEvents: z.array(z.string()).default([]),
    partner: z.string().optional(),
    stateBefore: z.string().optional().describe("How the person seemed just before"),
  }).prefault({}),
});
export type InterpretInput = z.input<typeof InterpretInput>;
export type InterpretInputParsed = z.infer<typeof InterpretInput>;

export const Interpretation = z.object({
  meaning: z.string(),
  function: z.enum(["request", "protest", "comment", "greeting", "self_regulation", "social_bid", "question", "distress", "joy", "script_for_comfort", "play_or_testing", "unknown"]),
  confidence: z.enum(["low", "medium", "high"]),
  evidence: z.array(z.string()).describe("Lexicon entry ids or profile facts this rests on; empty if generic"),
  tryThis: z.string().describe("One concrete thing the partner can do/say to test this reading"),
});

export const InterpretOutput = z.object({
  regulationFirst: z.string().nullable().describe("If distress/overload is likely, what to do BEFORE interpreting; else null"),
  interpretations: z.array(Interpretation).min(1).max(5),
  bestClarifyingCheck: z.string().describe("The single best way to disambiguate, e.g. offer two concrete choices"),
  partnerTip: z.string().describe("One sentence on how to respond in this person's preferred style"),
  lexiconCandidate: z.object({
    form: z.string(),
    modality: z.string(),
    gloss: z.string(),
    reason: z.string(),
  }).nullable().describe("If this looks like a new or refined lexicon entry, propose it for human review; else null"),
});
export type InterpretOutput = z.infer<typeof InterpretOutput>;

const MODULE_INSTRUCTIONS = `Task: INTERPRET. The partner reports an observation. Produce up to the profile's max number of interpretations, best first. Evidence must be the bracketed ids from the profile (e.g. "lex-bell", "trigger:..."), never the form text. An interpretation with empty evidence MUST have confidence "low" — without the lexicon you are guessing from generic knowledge, and the partner needs to know that. Always give one concrete clarifying check (offer two real choices, show two symbols, etc.) rather than an open question. If the observation suggests distress, fill regulationFirst. If the profile lists a RESPONSE BIAS, the clarifying check must not be a yes/no question or a verbal "this or that" — use real objects, actions, or reversed-order re-asks, and lower confidence on anything "confirmed" verbally. If the profile or lexicon marks forms as deliberate (play_or_testing), include that as a live hypothesis: some behavior is humor, provocation, or checking what you will do, and treating it as a need teaches the wrong lesson. Propose a lexiconCandidate only when the observation is a recurring-looking form with a plausible gloss; it will be reviewed by a human, never auto-added.`;

export async function interpret(profile: Profile, input: InterpretInput, provider: Provider): Promise<InterpretOutput> {
  const inp = InterpretInput.parse(input);
  const prompt = [
    `Observation: ${inp.observation}`,
    inp.context.setting ? `Setting: ${inp.context.setting}` : null,
    inp.context.timeOfDay ? `Time: ${inp.context.timeOfDay}` : null,
    inp.context.stateBefore ? `State just before: ${inp.context.stateBefore}` : null,
    inp.context.recentEvents.length ? `Recent events: ${inp.context.recentEvents.join("; ")}` : null,
    inp.context.partner ? `Reported by: ${inp.context.partner}` : null,
  ].filter(Boolean).join("\n");
  const out = await provider.run({
    task: "interpret",
    system: systemFor(profile, MODULE_INSTRUCTIONS),
    prompt,
    schema: InterpretOutput,
    effort: "medium",
    mockInput: { profile, input: inp },
  });
  out.interpretations = out.interpretations.slice(0, profile.guardrails.maxInterpretations);
  // Guardrail in code: without lexicon/profile evidence the reading is generic autism knowledge, which is
  // exactly what Bridge exists to replace. Never let it present as more than a low-confidence guess.
  for (const i of out.interpretations) if (i.evidence.length === 0 && i.confidence !== "low") i.confidence = "low";
  return out;
}

// ---------- mock ----------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function matchLexicon(profile: Profile, observation: string): Array<{ entry: LexiconEntry; score: number }> {
  const obs = norm(observation);
  const obsTokens = new Set(obs.split(" "));
  const hits: Array<{ entry: LexiconEntry; score: number }> = [];
  for (const entry of profile.lexicon) {
    const form = norm(entry.form);
    if (!form) continue;
    let score = 0;
    if (obs.includes(form) || form.includes(obs)) score = 1;
    else {
      const ft = form.split(" ").filter((t) => t.length > 2);
      const overlap = ft.filter((t) => obsTokens.has(t)).length;
      if (ft.length) score = overlap / ft.length;
    }
    if (score >= 0.5) hits.push({ entry, score });
  }
  return hits.sort((a, b) => b.score - a.score);
}

const confFromLexicon = (c: string, score: number): "low" | "medium" | "high" =>
  score >= 1 && (c === "core" || c === "established") ? "high" : c === "observed_once" ? "low" : "medium";

export function mockInterpret({ profile, input }: { profile: Profile; input: InterpretInputParsed }): InterpretOutput {
  const hits = matchLexicon(profile, input.observation);
  const distressWords = /(scream|cry|hit|bite|throw|growl|shriek|rock|cover(s|ing)? ears|melt|run|bolt|slap)/i;
  const distressTrigger = profile.sensory.triggers.find((t) => t.earlySigns.some((s) => norm(input.observation).includes(norm(s))));
  const distress = distressWords.test(input.observation) || Boolean(distressTrigger);
  const interpretations: z.infer<typeof Interpretation>[] = [];
  const ctxBoost = new Map<z.infer<typeof Interpretation>, number>();
  for (const { entry, score } of hits) {
    for (const m of entry.meanings) {
      const ctxMatch = m.contexts.some((c) => norm(`${input.context.setting ?? ""} ${input.context.timeOfDay ?? ""} ${input.context.recentEvents.join(" ")}`).includes(norm(c)));
      const interp: z.infer<typeof Interpretation> = {
        meaning: m.gloss,
        function: m.function,
        confidence: ctxMatch ? "high" : confFromLexicon(m.confidence, score),
        evidence: [entry.id],
        tryThis: m.function === "request" ? `Offer "${m.gloss}" plainly and watch the reaction.` : `Reflect it back in ${profile.displayName}'s style and wait ${profile.receptive.processingTimeSeconds}s.`,
      };
      ctxBoost.set(interp, ctxMatch ? 1 : 0);
      interpretations.push(interp);
    }
  }
  const rank = { high: 0, medium: 1, low: 2 } as const;
  interpretations.sort((a, b) => (ctxBoost.get(b) ?? 0) - (ctxBoost.get(a) ?? 0) || rank[a.confidence] - rank[b.confidence]);
  if (distress) {
    interpretations.unshift({
      meaning: distressTrigger ? `Early sign of a known trigger: ${distressTrigger.trigger}` : "Distress or overload; content of the words may be secondary",
      function: "distress",
      confidence: distressTrigger ? "high" : "medium",
      evidence: distressTrigger ? [`trigger:${distressTrigger.trigger}`] : [],
      tryThis: distressTrigger?.whatHelps[0] ?? profile.sensory.regulators[0] ?? "Reduce input: fewer words, lower voice, more space.",
    });
  }
  const playful = profile.lexicon.filter((l) => l.meanings.some((m) => m.function === "play_or_testing"));
  if (playful.length && !interpretations.some((i) => i.function === "play_or_testing") && /(grin|smil|laugh|watch(es|ing)? (you|me|your)|sneak|looks? at (you|me))/i.test(input.observation)) {
    interpretations.push({
      meaning: "Deliberate — testing your reaction, humor, or a bid for the game; not a need",
      function: "play_or_testing",
      confidence: "medium",
      evidence: playful.map((l) => l.id),
      tryThis: "React flat and friendly, name it ('you got me'), and offer the real game instead.",
    });
  }
  if (!interpretations.length) {
    interpretations.push({
      meaning: "Not in the personal lexicon yet; could be a comment on something present, or a bid for attention",
      function: "unknown",
      confidence: "low",
      evidence: [],
      tryThis: "Name what you see out loud, then offer two concrete choices.",
    });
  }
  const regulators = profile.sensory.regulators;
  const bias = profile.receptive.responseBias.kind;
  const biased = bias === "acquiescence" || bias === "echo_last_option" || bias === "refusal";
  if (biased) for (const i of interpretations) if (i.function !== "distress" && i.confidence === "high") i.confidence = "medium";
  const topGloss = hits[0]?.entry.meanings[0]?.gloss ?? "this";
  const check = biased
    ? `Do not ask yes/no (${profile.displayName} ${bias === "refusal" ? "says no first" : bias === "echo_last_option" ? "repeats the last option" : "says yes to anything"}). Put two real things in reach — one that fits "${topGloss}", one that doesn't — and watch which is taken. If you must ask, ask twice with the order reversed.`
    : hits.length
      ? `Offer two choices: "${topGloss}" or something else (show both if symbols help).`
      : "Offer two concrete choices you can actually give right now, and wait.";
  return {
    regulationFirst: distress ? `${profile.displayName} may be escalating. ${distressTrigger?.whatHelps.join("; ") || regulators.join("; ") || "Reduce demands and noise."} Interpret after.` : null,
    interpretations: interpretations.slice(0, profile.guardrails.maxInterpretations),
    bestClarifyingCheck: check,
    partnerTip: `Short sentences. ${profile.receptive.bestWith[0] ? `Use ${profile.receptive.bestWith[0]}. ` : ""}Wait ${profile.receptive.processingTimeSeconds} seconds before repeating.`,
    lexiconCandidate: hits.length || distress ? null : {
      form: input.observation,
      modality: "other",
      gloss: "unknown — record context and watch for recurrence",
      reason: "Not matched to any lexicon entry; logging so a human can decide if it recurs.",
    },
  };
}
