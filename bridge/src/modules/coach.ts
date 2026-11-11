/**
 * Partner Coach — the "orientation day" in your pocket.
 *
 * Half of communication breakdowns are on the partner's side (double-empathy
 * problem). A new counselor, sub teacher, or cousin asks "how do I talk with
 * this person about X" and gets a profile-grounded card: do / don't / opening
 * line / wait time / if it goes sideways.
 */
import { z } from "zod";
import type { Profile } from "../core/profile.js";
import { systemFor } from "../core/prompts.js";
import type { Provider } from "../core/provider.js";

export const CoachInput = z.object({
  situation: z.string().describe("e.g. 'first time meeting them at pickup', 'need them to stop an activity', 'they are humming the same song for 20 minutes'"),
  partnerRole: z.string().default("new staff"),
  partnerName: z.string().optional().describe("Used to check register authorization (e.g. who may sing with Ivy)"),
});
export type CoachInput = z.input<typeof CoachInput>;
export type CoachInputParsed = z.infer<typeof CoachInput>;

export const CoachCard = z.object({
  headline: z.string().describe("One sentence the partner should remember"),
  do: z.array(z.string()).min(2).max(6),
  dont: z.array(z.string()).min(1).max(6),
  openingLine: z.string().describe("Exact words, in the person's receptive style"),
  waitSeconds: z.number(),
  bridges: z.array(z.string()).describe("Interests or lexicon items that open a door in this situation"),
  ifItGoesSideways: z.string(),
});
export type CoachCard = z.infer<typeof CoachCard>;

const MODULE_INSTRUCTIONS = `Task: COACH THE PARTNER. Produce a one-screen card for the partner for this specific situation, grounded in the profile: receptive preferences, lexicon, sensory triggers, regulators, people, and interests. Concrete and literal. 'do' items are actions, not attitudes. Use the person's actual interests as bridges where genuine. Lead with any SAFETY line from the profile. If the profile has registers with authorized partners and this partner is not on the list, the card must say so plainly and give the ifUnauthorized instruction. If any trigger is marked SCAN AHEAD, tell the partner to check the setting first. Never suggest restraint, withholding regulators, or ignoring distress.`;

export async function coach(profile: Profile, input: CoachInput, provider: Provider): Promise<CoachCard> {
  const inp = CoachInput.parse(input);
  return provider.run({
    task: "coach",
    system: systemFor(profile, MODULE_INSTRUCTIONS),
    prompt: `Situation: ${inp.situation}\nPartner: ${inp.partnerRole}${inp.partnerName ? ` (${inp.partnerName})` : ""}`,
    schema: CoachCard,
    effort: "low",
    mockInput: { profile, input: inp },
  });
}

export function mockCoach({ profile, input }: { profile: Profile; input: CoachInput }): CoachCard {
  const r = profile.receptive;
  const stop = /stop|transition|leave|finish|end/i.test(input.situation);
  const firstMeet = /first|meet|new|intro/i.test(input.situation);
  const scan = profile.sensory.triggers.filter((t) => t.scanAhead);
  const unauthorized = profile.expressive.registers.filter((g) => g.authorizedPartners.length && !(input.partnerName && g.authorizedPartners.some((n) => n.toLowerCase() === input.partnerName!.toLowerCase())));
  const doList = [
    ...profile.safetyAlerts.slice(0, 1).map((a) => `SAFETY: ${a}`),
    ...scan.slice(0, 1).map((t) => `Before ${profile.displayName} arrives, check the setting for ${t.trigger}.`),
    ...(r.bestWith.slice(0, 2).map((b) => `Use ${b}.`)),
    `Wait ${r.processingTimeSeconds} seconds after anything you say.`,
    ...(firstMeet && profile.interests[0] ? [`Open with ${profile.interests[0]}, not with questions.`] : []),
    ...(stop ? [`Give a ${profile.cues.leadTimes.transitionWarningMinutes[0] ?? 5}-minute warning using the established cue before asking for a stop.`] : []),
    ...(profile.sensory.regulators[0] ? [`Keep ${profile.sensory.regulators[0]} available.`] : []),
  ].slice(0, 6);
  const dontList = [
    ...unauthorized.slice(0, 2).map((g) => `Don't use ${g.name} — only ${g.authorizedPartners.join(", ")} ${g.authorizedPartners.length === 1 ? "is" : "are"} chosen for it.${g.ifUnauthorized ? ` ${g.ifUnauthorized}` : ""}`),
    ...r.avoid.slice(0, 3).map((a) => `Don't use ${a}.`),
    ...profile.sensory.avoiding.slice(0, 2).map((a) => `Avoid ${a}.`),
    "Don't stack questions or repeat louder.",
  ].slice(0, 6);
  // Don't claim comprehension the profile says nobody can confirm; presume competence instead.
  const understands = profile.receptive.comprehensionKnown ? "understands you" : "may understand more than shows — talk to him as if he does".replace("him", profile.pronouns.split("/")[1] ?? "them");
  return {
    headline: profile.safetyAlerts[0] ? `${profile.safetyAlerts[0]} — and ${profile.displayName} ${understands}; one thing at a time.` : `${profile.displayName} ${understands}; give ${profile.pronouns.split("/")[1] ?? "them"} time and one thing at a time.`,
    do: doList.length >= 2 ? doList : [...doList, "One instruction at a time."],
    dont: dontList,
    openingLine: firstMeet && profile.interests[0] ? `Hi ${profile.displayName}. I'm ${input.partnerRole}. I heard you like ${profile.interests[0]}.` : stop ? `${profile.displayName}, ${profile.cues.leadTimes.transitionWarningMinutes[0] ?? 5} more minutes. Then ${"next thing"}.` : `Hi ${profile.displayName}.`,
    waitSeconds: r.processingTimeSeconds,
    bridges: [...profile.interests.slice(0, 2), ...profile.lexicon.filter((l) => l.meanings.some((m) => m.function === "joy" || m.function === "social_bid")).slice(0, 2).map((l) => l.form)],
    ifItGoesSideways: profile.sensory.regulators.length ? `Stop talking. ${profile.sensory.regulators.slice(0, 2).join("; ")}. Try again later, not louder.` : "Stop talking, reduce input, give space, try again later.",
  };
}
