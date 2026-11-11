/**
 * Story — personalized social narrative for an upcoming event.
 *
 * Follows Carol Gray's structural rules (mostly descriptive/perspective
 * sentences, few directive ones, first person, literal, positive) and is
 * grounded in the profile: the person's interests, known triggers, cue
 * motifs and reading level. Output is a page list a partner can print or
 * read aloud, plus comprehension checks. Evidence is feasibility-level only
 * (SS-GEN 2024, AutiHero 2025) — so this is a drafting aid for a human.
 */
import { z } from "zod";
import type { Profile } from "../core/profile.js";
import { systemFor } from "../core/prompts.js";
import type { Provider } from "../core/provider.js";

export const StoryInput = z.object({
  event: z.string().describe("e.g. 'fire drill tomorrow at 10', 'new bus driver', 'dentist'"),
  when: z.string().optional(),
  concerns: z.array(z.string()).default([]),
  maxPages: z.number().int().min(3).max(12).default(6),
});
export type StoryInput = z.input<typeof StoryInput>;
export type StoryInputParsed = z.infer<typeof StoryInput>;

export const StoryOutput = z.object({
  title: z.string(),
  pages: z.array(z.object({
    text: z.string().describe("1–2 short sentences, first person or third person per profile, literal"),
    sentenceType: z.enum(["descriptive", "perspective", "directive", "affirmative", "cooperative"]),
    visual: z.string().describe("What picture/symbol/photo to put on this page"),
  })),
  ratio: z.object({ descriptive: z.number(), directive: z.number() }).describe("Counts; descriptive+perspective should outnumber directive at least 2:1"),
  checks: z.array(z.string()).describe("2–3 concrete comprehension checks (show/point, not open questions)"),
  partnerNotes: z.array(z.string()),
});
export type StoryOutput = z.infer<typeof StoryOutput>;

const MODULE_INSTRUCTIONS = `Task: SOCIAL STORY. Draft a short personalized story for the upcoming event. Rules: at least two descriptive/perspective sentences for every directive sentence; directive sentences say what the person CAN do, never "must"; literal language; no promises you cannot keep ("it will be fun") — say what usually happens and what the person can do if it is hard; weave in one genuine interest only if it fits; include the profile's established cue motif for 'unexpected change' if the event involves one; keep each page to 1–2 short sentences at the person's receptive level; if reads=none, the text is for the partner to read aloud and visuals carry the meaning.`;

export async function story(profile: Profile, input: StoryInput, provider: Provider): Promise<StoryOutput> {
  const inp = StoryInput.parse(input);
  return provider.run({
    task: "story",
    system: systemFor(profile, MODULE_INSTRUCTIONS),
    prompt: `Event: ${inp.event}${inp.when ? `\nWhen: ${inp.when}` : ""}${inp.concerns.length ? `\nConcerns: ${inp.concerns.join("; ")}` : ""}\nMax pages: ${inp.maxPages}`,
    schema: StoryOutput,
    effort: "medium",
    mockInput: { profile, input: inp },
  });
}

export function mockStory({ profile, input }: { profile: Profile; input: StoryInput }): StoryOutput {
  const name = profile.displayName;
  const reg = profile.sensory.regulators[0] ?? "take a break";
  const changeCue = profile.cues.motifs.find((m) => /change|unexpected/i.test(m.meaning));
  const pages: StoryOutput["pages"] = ([
    { text: `${input.when ? `${input.when}, ` : ""}there is ${input.event}.`, sentenceType: "descriptive", visual: `Photo or symbol of: ${input.event}` },
    { text: `Many people will be there. It may be loud for a little while.`, sentenceType: "descriptive", visual: "Group of people; ear symbol" },
    { text: `${name}'s helper will be close by.`, sentenceType: "descriptive", visual: `Photo of ${profile.people[0]?.name ?? "helper"}` },
    ...(changeCue ? [{ text: `When ${changeCue.cue} happens, it means something is different today. That is okay.`, sentenceType: "perspective" as const, visual: `Picture of the cue: ${changeCue.cue}` }] : []),
    { text: `If it feels like too much, ${name} can ${reg}.`, sentenceType: "directive", visual: `Symbol for: ${reg}` },
    ...(profile.interests[0] ? [{ text: `After, ${name} can have ${profile.interests[0]} time.`, sentenceType: "descriptive" as const, visual: `Symbol for ${profile.interests[0]}` }] : []),
    { text: `Then the day goes back to the schedule.`, sentenceType: "affirmative", visual: "Schedule board" },
  ] as StoryOutput["pages"]).slice(0, input.maxPages);
  const descriptive = pages.filter((p) => p.sentenceType !== "directive").length;
  const directive = pages.length - descriptive;
  return {
    title: `${name} and ${input.event}`,
    pages,
    ratio: { descriptive, directive },
    checks: [
      `Show two symbols: "${input.event}" and something unrelated — ask ${name} to point to what is happening ${input.when ?? "soon"}.`,
      `Show the "${reg}" symbol and ask: "If it's too much, what can ${name} do?" — accept a point.`,
    ],
    partnerNotes: [
      "Read once a day for 2–3 days before; same words each time.",
      `Read at a calm time, not right before the event.`,
      ...(profile.cues.reads === "none" ? ["Non-reader: the visuals carry the meaning; keep them on the schedule board too."] : []),
      "This is a draft — edit anything that isn't true for this person.",
    ],
  };
}
