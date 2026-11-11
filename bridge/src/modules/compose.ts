/**
 * Composer — "translation out".
 *
 * The person selects seeds (symbols, words, a song line, a route number) and
 * Bridge drafts a few candidate messages in THEIR voice. The person (or, with
 * them, the partner) picks one, or "something else". Nothing is spoken
 * automatically. This is the authorship-preserving way to do LLM-powered AAC:
 * the model expands, the person authors.
 */
import { z } from "zod";
import type { Profile } from "../core/profile.js";
import { systemFor } from "../core/prompts.js";
import type { Provider } from "../core/provider.js";

export const ComposeInput = z.object({
  seeds: z.array(z.string()).min(1).describe("Selected symbols/words/scripts, in order chosen"),
  audience: z.string().optional().describe("Who the message is for, e.g. 'Mom', 'new counselor', 'kid at the pool'"),
  situation: z.string().optional(),
  intent: z.enum(["request", "protest", "comment", "greeting", "question", "share_interest", "unknown"]).default("unknown"),
  register: z.enum(["own_voice", "slightly_expanded", "full_sentence"]).default("own_voice"),
});
export type ComposeInput = z.input<typeof ComposeInput>;
export type ComposeInputParsed = z.infer<typeof ComposeInput>;

export const ComposeOutput = z.object({
  candidates: z.array(z.object({
    text: z.string().describe("Exactly what would be spoken/shown"),
    keepsSeeds: z.boolean().describe("Every seed's meaning is preserved (no additions the person did not choose)"),
    note: z.string().describe("One short line for the partner: why this reading of the seeds"),
  })).min(1).max(4),
  somethingElse: z.string().describe("Text of the mandatory opt-out option, in the person's style"),
  confirmWith: z.string().describe("How to confirm the choice with the person (e.g. show two symbols, thumbs up/down)"),
});
export type ComposeOutput = z.infer<typeof ComposeOutput>;

const MODULE_INSTRUCTIONS = `Task: COMPOSE. Turn the selected seeds into 2–3 candidate messages the person could choose to send. Rules: every candidate must contain every seed, verbatim or as the person's own lexicon form of it — a candidate that drops a seed is not a shorter version, it is a different message the person did not choose; add nothing the person did not choose (no pleasantries, no 'please' unless it's in their lexicon); match the person's own voice and typical utterance length; if register is own_voice, keep it as short as they would; offer genuinely different readings if the seeds are ambiguous rather than rewordings of one reading. Always produce a somethingElse option. Never include a candidate that asserts a feeling or fact the seeds do not contain.`;

export async function compose(profile: Profile, input: ComposeInput, provider: Provider): Promise<ComposeOutput> {
  const inp = ComposeInput.parse(input);
  const prompt = [
    `Seeds (in order): ${inp.seeds.map((s) => `[${s}]`).join(" ")}`,
    inp.audience ? `Audience: ${inp.audience}` : null,
    inp.situation ? `Situation: ${inp.situation}` : null,
    `Intent hint: ${inp.intent}`,
    `Register: ${inp.register}`,
  ].filter(Boolean).join("\n");
  const out = await provider.run({
    task: "compose",
    system: systemFor(profile, MODULE_INSTRUCTIONS),
    prompt,
    schema: ComposeOutput,
    effort: "low",
    mockInput: { profile, input: inp },
  });
  // Authorship guardrail is computed here, not trusted from the model: a candidate keeps the seeds
  // only if every seed appears in it. (The FC lesson — the system may never quietly rewrite the person.)
  const norm = (s: string) => s.toLowerCase();
  for (const c of out.candidates) c.keepsSeeds = inp.seeds.every((s) => norm(c.text).includes(norm(s)));
  return out;
}

// ---------- mock ----------
export function mockCompose({ profile, input }: { profile: Profile; input: ComposeInput }): ComposeOutput {
  const seeds = input.seeds.map((s) => s.trim()).filter(Boolean);
  const joined = seeds.join(" ");
  const len = profile.expressive.typicalUtteranceLength;
  const short = len === "single_word" || len === "two_three_words" || input.register === "own_voice";
  const cands: ComposeOutput["candidates"] = [];
  cands.push({ text: short ? joined : `I want ${joined}.`, keepsSeeds: true, note: short ? "Seeds as-is, in order chosen" : "Request reading" });
  if (input.intent === "request" || input.intent === "unknown") {
    cands.push({ text: short ? `${joined} now` : `Can I have ${joined} now?`, keepsSeeds: true, note: "Request, with urgency" });
  }
  if (input.intent === "comment" || input.intent === "share_interest" || input.intent === "unknown") {
    cands.push({ text: short ? `look ${joined}` : `Look — ${joined}.`, keepsSeeds: true, note: "Comment / sharing, not a request" });
  }
  if (input.intent === "protest") {
    cands.push({ text: short ? `no ${joined}` : `I don't want ${joined}.`, keepsSeeds: true, note: "Protest reading" });
  }
  return {
    candidates: cands.slice(0, 3),
    somethingElse: short ? "something else" : "I mean something else.",
    confirmWith: profile.cues.preferredChannels.includes("symbol") ? "Show the candidates as symbol strips; wait for a point or a look." : "Say each option slowly with a pause; watch for a yes signal.",
  };
}
