/**
 * Insights — the clinician's pattern-mining loop (ASLT Phases 1–2).
 *
 * Pure code does the counting: when do vocalizations/regulation events
 * cluster (hour of day, distance to next schedule anchor, setting, partner),
 * which forms recur without a lexicon entry, and how authorship is trending
 * (are the person's own seeds shrinking relative to AI-added words?).
 *
 * The LLM then turns those statistics into *hypotheses with a test*, never
 * conclusions. Everything it proposes goes to the review queue.
 */
import { z } from "zod";
import type { Profile } from "../core/profile.js";
import type { Event } from "../store/store.js";
import { systemFor } from "../core/prompts.js";
import type { Provider } from "../core/provider.js";
import { matchLexicon } from "./interpret.js";

export interface Stats {
  totalEvents: number;
  byKind: Record<string, number>;
  regulationByHour: Record<string, number>;
  regulationByMinutesToAnchor: { within5: number; within15: number; within30: number; later: number; unknown: number };
  regulationBySetting: Record<string, number>;
  vocalizationLabels: Record<string, number>;
  unmatchedForms: Array<{ form: string; count: number; contexts: string[] }>;
  authorship: { utterances: number; personChosen: number; partnerChosen: number; avgSeedWords: number; avgAiAddedWords: number };
  confirmedInterpretations: { total: number; acceptedTop: number; acceptedOther: number; rejectedAll: number };
}

const bump = (r: Record<string, number>, k: string) => { r[k] = (r[k] ?? 0) + 1; };
const words = (s?: string) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);

export function computeStats(profile: Profile, events: Event[]): Stats {
  const s: Stats = {
    totalEvents: events.length,
    byKind: {},
    regulationByHour: {},
    regulationByMinutesToAnchor: { within5: 0, within15: 0, within30: 0, later: 0, unknown: 0 },
    regulationBySetting: {},
    vocalizationLabels: {},
    unmatchedForms: [],
    authorship: { utterances: 0, personChosen: 0, partnerChosen: 0, avgSeedWords: 0, avgAiAddedWords: 0 },
    confirmedInterpretations: { total: 0, acceptedTop: 0, acceptedOther: 0, rejectedAll: 0 },
  };
  const unmatched = new Map<string, { count: number; contexts: Set<string> }>();
  let seedW = 0, aiW = 0;
  for (const e of events) {
    bump(s.byKind, e.kind);
    const hour = new Date(e.at).getHours().toString().padStart(2, "0");
    if (e.kind === "regulation_event" || (e.kind === "vocalization" && /distress|frustrat|dysreg|upset/i.test(String(e.data.label ?? "")))) {
      bump(s.regulationByHour, hour);
      const m = e.context.minutesToNextAnchor;
      if (m === undefined) s.regulationByMinutesToAnchor.unknown++;
      else if (m <= 5) s.regulationByMinutesToAnchor.within5++;
      else if (m <= 15) s.regulationByMinutesToAnchor.within15++;
      else if (m <= 30) s.regulationByMinutesToAnchor.within30++;
      else s.regulationByMinutesToAnchor.later++;
      if (e.context.setting) bump(s.regulationBySetting, e.context.setting);
    }
    if (e.kind === "vocalization") bump(s.vocalizationLabels, String(e.data.label ?? "unlabeled"));
    if (e.kind === "observation" || e.kind === "vocalization") {
      const form = String(e.data.observation ?? e.data.form ?? "");
      if (form && matchLexicon(profile, form).length === 0) {
        const u = unmatched.get(form.toLowerCase()) ?? { count: 0, contexts: new Set<string>() };
        u.count++;
        if (e.context.setting) u.contexts.add(e.context.setting);
        if (e.context.anchor) u.contexts.add(`near ${e.context.anchor}`);
        unmatched.set(form.toLowerCase(), u);
      }
    }
    if (e.kind === "utterance_sent") {
      s.authorship.utterances++;
      if (e.authorship?.chosenBy === "person") s.authorship.personChosen++;
      if (e.authorship?.chosenBy === "partner") s.authorship.partnerChosen++;
      seedW += (e.authorship?.seeds ?? []).join(" ").split(/\s+/).filter(Boolean).length;
      aiW += words(e.authorship?.aiAdded);
    }
    if (e.kind === "interpretation_confirmed") {
      s.confirmedInterpretations.total++;
      const idx = e.data.chosenIndex;
      if (idx === 0) s.confirmedInterpretations.acceptedTop++;
      else if (typeof idx === "number" && idx > 0) s.confirmedInterpretations.acceptedOther++;
      else s.confirmedInterpretations.rejectedAll++;
    }
  }
  if (s.authorship.utterances) {
    s.authorship.avgSeedWords = +(seedW / s.authorship.utterances).toFixed(2);
    s.authorship.avgAiAddedWords = +(aiW / s.authorship.utterances).toFixed(2);
  }
  s.unmatchedForms = [...unmatched.entries()]
    .map(([form, u]) => ({ form, count: u.count, contexts: [...u.contexts] }))
    .filter((u) => u.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return s;
}

export const InsightsOutput = z.object({
  headline: z.string(),
  hypotheses: z.array(z.object({
    statement: z.string(),
    evidence: z.string().describe("The numbers this rests on"),
    confidence: z.enum(["weak", "moderate", "strong"]),
    howToTest: z.string().describe("A cheap, ethical, concrete test the team can run this week"),
    caution: z.string().optional(),
  })).max(6),
  lexiconProposals: z.array(z.object({ form: z.string(), gloss: z.string(), function: z.string(), contexts: z.array(z.string()), rationale: z.string() })).max(5),
  goalSuggestions: z.array(z.object({ text: z.string(), measure: z.string() })).max(3).describe("Measurable, condition/behavior/criterion format; suggestions for the clinician to edit"),
  authorshipNote: z.string().describe("Plain statement on whether the person's own contribution is growing, stable, or shrinking relative to AI-added words"),
});
export type InsightsOutput = z.infer<typeof InsightsOutput>;

const MODULE_INSTRUCTIONS = `Task: INSIGHTS FOR THE TEAM. You are given computed statistics over this person's event log. Turn them into at most 6 hypotheses, each with the evidence numbers, a confidence level, and a concrete low-risk test. Correlation is not cause; say so where relevant. Propose lexicon entries only for forms that recur with a consistent context. Goal suggestions must be measurable and framed as skills to build, not behaviors to suppress. Comment honestly on authorship: if AI-added words are growing faster than the person's own seeds, flag it as a problem to fix, not a success.`;

export async function insights(profile: Profile, events: Event[], provider: Provider): Promise<{ stats: Stats; report: InsightsOutput }> {
  const stats = computeStats(profile, events);
  const report = await provider.run({
    task: "insights",
    system: systemFor(profile, MODULE_INSTRUCTIONS),
    prompt: `Statistics (JSON):\n${JSON.stringify(stats, null, 2)}`,
    schema: InsightsOutput,
    effort: "high",
    mockInput: { profile, stats },
  });
  return { stats, report };
}

export function mockInsights({ profile, stats }: { profile: Profile; stats: Stats }): InsightsOutput {
  const hyps: InsightsOutput["hypotheses"] = [];
  const reg = stats.regulationByMinutesToAnchor;
  const regTotal = reg.within5 + reg.within15 + reg.within30 + reg.later;
  if (regTotal >= 3 && (reg.within5 + reg.within15) / regTotal >= 0.6) {
    hyps.push({
      statement: `Most regulation events happen in the 15 minutes before a scheduled anchor — the wait, not the activity, may be the problem.`,
      evidence: `${reg.within5 + reg.within15} of ${regTotal} regulation events were within 15 min of the next anchor.`,
      confidence: regTotal >= 8 ? "strong" : "moderate",
      howToTest: `For one week, fire the transition cue at ${profile.cues.leadTimes.transitionWarningMinutes.join("/")} min and log whether events shift or shrink.`,
      caution: "Time-of-day (hunger, fatigue) is confounded with anchors like meals.",
    });
  }
  const hours = Object.entries(stats.regulationByHour).sort((a, b) => b[1] - a[1]);
  if (hours.length && hours[0][1] >= 3) {
    hyps.push({
      statement: `Regulation events cluster around ${hours[0][0]}:00.`,
      evidence: `${hours[0][1]} events at hour ${hours[0][0]} vs. ${hours.slice(1).map((h) => h[1]).join(", ") || 0} elsewhere.`,
      confidence: "moderate",
      howToTest: "Check what precedes that hour on the schedule; try moving a regulator (movement break, snack) 20 minutes earlier for 3 days.",
    });
  }
  const settings = Object.entries(stats.regulationBySetting).sort((a, b) => b[1] - a[1]);
  if (settings.length >= 2 && settings[0][1] >= 2 * (settings[1][1] || 1)) {
    hyps.push({
      statement: `"${settings[0][0]}" is over-represented in regulation events.`,
      evidence: `${settings[0][1]} in ${settings[0][0]} vs. ${settings[1][1]} in ${settings[1][0]}.`,
      confidence: "moderate",
      howToTest: "Log sensory features of that setting (noise, light, crowding) for a week; compare with a quiet version of the same activity.",
    });
  }
  for (const u of stats.unmatchedForms.slice(0, 2)) {
    hyps.push({
      statement: `"${u.form}" recurs (${u.count}×) and is not in the lexicon.`,
      evidence: `Contexts: ${u.contexts.join(", ") || "unrecorded"}.`,
      confidence: u.count >= 4 ? "moderate" : "weak",
      howToTest: "Next time it happens, offer two concrete choices and log which (if any) ends it.",
    });
  }
  const a = stats.authorship;
  const authorshipNote = a.utterances === 0
    ? "No composed utterances logged yet."
    : a.avgAiAddedWords > a.avgSeedWords
      ? `Concern: AI adds ${a.avgAiAddedWords} words per message on average vs. ${a.avgSeedWords} chosen by ${profile.displayName}. Reduce expansion; default to own_voice register.`
      : `Healthy: ${profile.displayName} chooses ${a.avgSeedWords} words/message on average, AI adds ${a.avgAiAddedWords}. ${a.personChosen}/${a.utterances} selections made by ${profile.displayName} directly.`;
  return {
    headline: hyps[0]?.statement ?? "Not enough data yet — keep logging, especially context and time-to-next-anchor.",
    hypotheses: hyps,
    lexiconProposals: stats.unmatchedForms.filter((u) => u.count >= 3 && u.contexts.length).slice(0, 3).map((u) => ({
      form: u.form,
      gloss: "unknown — recurring; team to gloss",
      function: "unknown",
      contexts: u.contexts,
      rationale: `Seen ${u.count}× in consistent contexts.`,
    })),
    goalSuggestions: hyps.length
      ? [{ text: `Given a transition cue ${profile.cues.leadTimes.transitionWarningMinutes[0] ?? 5} min before a schedule anchor, ${profile.displayName} will move to the next activity with no more than one verbal prompt in 4 of 5 opportunities over 2 weeks.`, measure: "Frequency of prompts per transition, logged by staff." }]
      : [],
    authorshipNote,
  };
}
