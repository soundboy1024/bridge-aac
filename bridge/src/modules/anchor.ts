/**
 * Anchor engine — the "temporal anchor" from the original notes.
 *
 * Two halves:
 *  1. Pure code: a deterministic timeline over the profile's schedule anchors
 *     that knows what is next, what warnings are due (10/5/1 min by default),
 *     and which multi-sensory cues to fire. This part must never depend on an
 *     LLM: reliability IS the feature. It can run offline on a cheap device.
 *  2. LLM: when a human *changes* the plan, produce the "new map / new why /
 *     new next" package in the person's cue grammar, plus a partner script.
 */
import { z } from "zod";
import type { Profile } from "../core/profile.js";
import { systemFor } from "../core/prompts.js";
import type { Provider } from "../core/provider.js";

// ---------- deterministic timeline ----------

export interface TimelineItem {
  id: string;
  label: string;
  startMin: number; // minutes since midnight
  endMin?: number;
  importance: "critical" | "high" | "normal";
  symbol?: string;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};
export const fmt = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Resolve fixed + relative anchors into an ordered timeline. */
export function buildTimeline(profile: Profile, overrides: Record<string, { time?: string; cancelled?: boolean; label?: string }> = {}): TimelineItem[] {
  const byId = new Map(profile.schedule.anchors.map((a) => [a.id, a]));
  const resolved = new Map<string, TimelineItem>();
  /** Where an anchor would start, ignoring its own cancellation (a cancelled anchor still opens its slot). */
  const slotStart = (id: string, depth: number): number | undefined => {
    const a = byId.get(id);
    if (!a || depth > 20) return undefined;
    const o = overrides[id];
    if (o?.time) return toMin(o.time);
    if (a.time) return toMin(a.time);
    if (a.afterAnchor) {
      const prev = resolve(a.afterAnchor, depth + 1);
      if (prev) return prev.endMin ?? prev.startMin + 30;
      return slotStart(a.afterAnchor, depth + 1); // predecessor cancelled: take its slot
    }
    return undefined;
  };
  const resolve = (id: string, depth = 0): TimelineItem | undefined => {
    if (resolved.has(id)) return resolved.get(id);
    const a = byId.get(id);
    if (!a || depth > 20) return undefined;
    const o = overrides[id];
    if (o?.cancelled) return undefined;
    const startMin = slotStart(id, depth);
    if (startMin === undefined) return undefined;
    const item: TimelineItem = {
      id,
      label: o?.label ?? a.label,
      startMin,
      endMin: a.expectedDurationMin ? startMin + a.expectedDurationMin : undefined,
      importance: a.importance,
      symbol: a.symbol,
    };
    resolved.set(id, item);
    return item;
  };
  for (const a of profile.schedule.anchors) resolve(a.id);
  return [...resolved.values()].sort((x, y) => x.startMin - y.startMin);
}

export interface DueCue {
  anchor: TimelineItem;
  minutesBefore: number;
  channel: string;
  cue: string;
  spoken: string;
}

/** What should happen right now, given the time. The "base track". */
export function tick(profile: Profile, nowMin: number, timeline = buildTimeline(profile)) {
  const current = timeline.filter((t) => t.startMin <= nowMin && (t.endMin ?? t.startMin + 30) > nowMin).at(-1);
  const next = timeline.find((t) => t.startMin > nowMin);
  const due: DueCue[] = [];
  if (next) {
    const minutesUntil = next.startMin - nowMin;
    for (const lead of profile.cues.leadTimes.transitionWarningMinutes) {
      if (minutesUntil === lead) {
        const motif = profile.cues.motifs.find((m) => /transition|coming|soon|next/i.test(m.meaning) && m.established)
          ?? profile.cues.motifs.find((m) => /transition|coming|soon|next/i.test(m.meaning));
        due.push({
          anchor: next,
          minutesBefore: lead,
          channel: motif?.channel ?? "spoken",
          cue: motif?.cue ?? `say: "${next.label} in ${lead}"`,
          spoken: lead === 1 ? `${next.label} now.` : `${next.label} in ${lead} minutes. ${current ? `${current.label} is almost done.` : ""}`.trim(),
        });
      }
    }
  }
  return { now: fmt(nowMin), current, next, minutesUntilNext: next ? next.startMin - nowMin : null, due };
}

// ---------- LLM: explain a change ----------

export const ChangeInput = z.object({
  anchorId: z.string(),
  change: z.enum(["delayed", "earlier", "cancelled", "replaced", "new"]),
  newTime: z.string().optional(),
  replacedBy: z.string().optional(),
  reason: z.string().describe("The real reason, plainly. Will be simplified, not hidden."),
  nowTime: z.string().describe("HH:MM"),
  partner: z.string().optional(),
});
export type ChangeInput = z.input<typeof ChangeInput>;
export type ChangeInputParsed = z.infer<typeof ChangeInput>;

export const ChangePlan = z.object({
  riskLevel: z.enum(["low", "medium", "high"]),
  riskNote: z.string().describe("Why this change is/isn't risky for this person, one or two sentences"),
  announce: z.object({
    spoken: z.string().describe("Exact words to say, in this person's receptive style, ≤ 2 short sentences"),
    symbolSequence: z.array(z.string()).describe("Symbols/emoji/objects to show in order, e.g. ['🏊 ✗','⏰','🍽️']"),
    cues: z.array(z.object({
      channel: z.string(),
      cue: z.string().describe("The literal cue from the profile's motifs — what is actually shown/played/handed over (e.g. 'DETOUR card', 'two soft wood-block taps') — NOT the motif's meaning"),
      when: z.string(),
    })).describe("Multi-sensory cues from the profile's motifs to fire, and when"),
  }),
  newMap: z.array(z.string()).describe("The rest of the day as a short list the person can be walked through, starting from now"),
  why: z.string().describe("One literal sentence of why, no euphemism"),
  next: z.string().describe("The very next concrete thing, with a time"),
  partnerScript: z.array(z.string()).describe("Step-by-step for the partner: what to do, in what order, what to watch for"),
  ifEscalates: z.string(),
});
export type ChangePlan = z.infer<typeof ChangePlan>;

const MODULE_INSTRUCTIONS = `Task: SCHEDULE CHANGE. A human is changing this person's plan. Produce the package that replaces "the plan changed" with a new map, a new why, and a new next, delivered in the person's cue grammar (respect reads= and preferredChannels). Keep spoken text at or below the person's typical receptive load. Use the profile's established motifs for cues; do not invent new motifs (you may suggest teaching one in partnerScript). Be honest in 'why' — simplified is fine, false is not. Rate risk with this rule: "high" if change tolerance is very_low and the anchor is critical or a known hard transition, or if the anchor is both critical and a hard transition; "medium" if any one of those (very_low/low tolerance, critical anchor, hard transition) applies; "low" otherwise. The size of the time shift does not lower the risk — for these people the break in the expected sequence is the risk, not the minutes.`;

export async function planChange(profile: Profile, input: ChangeInput, provider: Provider): Promise<ChangePlan> {
  const inp = ChangeInput.parse(input);
  const timeline = buildTimeline(profile);
  const target = timeline.find((t) => t.id === inp.anchorId);
  const prompt = [
    `Current timeline: ${timeline.map((t) => `${fmt(t.startMin)} ${t.label}${t.importance !== "normal" ? ` [${t.importance}]` : ""}`).join(" → ")}`,
    `Now: ${inp.nowTime}`,
    `Change: "${target?.label ?? inp.anchorId}" is ${inp.change}${inp.newTime ? ` to ${inp.newTime}` : ""}${inp.replacedBy ? `, replaced by ${inp.replacedBy}` : ""}`,
    `Reason: ${inp.reason}`,
    inp.partner ? `Partner delivering this: ${inp.partner}` : null,
  ].filter(Boolean).join("\n");
  return provider.run({
    task: "planChange",
    system: systemFor(profile, MODULE_INSTRUCTIONS),
    prompt,
    schema: ChangePlan,
    effort: "medium",
    mockInput: { profile, input: inp, timeline, target },
  });
}

// ---------- mock ----------
export function mockPlanChange({ profile, input, timeline, target }: { profile: Profile; input: ChangeInputParsed; timeline: TimelineItem[]; target?: TimelineItem }): ChangePlan {
  const label = target?.label ?? input.anchorId;
  const tol = profile.schedule.changeTolerance;
  const hard = profile.schedule.knownHardTransitions.some((h) => h.toLowerCase().includes(label.toLowerCase()));
  const critical = target?.importance === "critical";
  const riskLevel = (tol === "very_low" && (critical || hard)) || (critical && hard) ? "high" : tol === "very_low" || tol === "low" || critical || hard ? "medium" : "low";
  const overrides: Record<string, any> = {};
  if (input.change === "cancelled") overrides[input.anchorId] = { cancelled: true };
  if ((input.change === "delayed" || input.change === "earlier") && input.newTime) overrides[input.anchorId] = { time: input.newTime };
  if (input.change === "replaced") overrides[input.anchorId] = { label: input.replacedBy ?? label };
  const newTl = buildTimeline(profile, overrides).filter((t) => t.startMin >= toMin(input.nowTime) - 1);
  const newMap = newTl.map((t) => `${fmt(t.startMin)} ${t.symbol ? t.symbol + " " : ""}${t.label}`);
  const nextItem = newTl[0];
  const changeMotif = profile.cues.motifs.find((m) => /change|unexpected/i.test(m.meaning));
  const transitionMotif = profile.cues.motifs.find((m) => /transition|coming|soon|next/i.test(m.meaning));
  const okMotif = profile.cues.motifs.find((m) => /all good|ok|safe/i.test(m.meaning));
  const spokenChange =
    input.change === "cancelled" ? `No ${label} today.` :
    input.change === "delayed" ? `${label} is later. ${label} at ${input.newTime}.` :
    input.change === "earlier" ? `${label} is sooner. ${label} at ${input.newTime}.` :
    input.change === "replaced" ? `No ${label}. ${input.replacedBy} instead.` : `New: ${label}${input.newTime ? ` at ${input.newTime}` : ""}.`;
  const after = nextItem?.id === input.anchorId ? newTl[1] : nextItem;
  const nextText = nextItem ? `${nextItem.label} at ${fmt(nextItem.startMin)}` : "nothing else scheduled";
  const thenText = after ? `${nextItem?.id === input.anchorId ? "Then" : "Next"}: ${after.label} at ${fmt(after.startMin)}.` : "";
  const symbols = [
    `${target?.symbol ?? "📅"} ${input.change === "cancelled" || input.change === "replaced" ? "✗" : "⏰"}`,
    ...(input.replacedBy ? [`➡️ ${input.replacedBy}`] : []),
    ...(nextItem ? [`${nextItem.symbol ?? "▶️"} ${nextItem.label}`] : []),
  ];
  return {
    riskLevel,
    riskNote: `${label}${critical ? " is a critical anchor" : ""}${hard ? " and a known hard transition" : ""}; change tolerance is ${tol}.${profile.cues.reads === "none" ? " Non-reader: lead with cue + symbols, words second." : ""}`,
    announce: {
      spoken: `${spokenChange} ${thenText}`.trim(),
      symbolSequence: symbols,
      cues: [
        ...(changeMotif ? [{ channel: changeMotif.channel, cue: changeMotif.cue, when: "first, before any words" }] : []),
        ...(transitionMotif ? [{ channel: transitionMotif.channel, cue: transitionMotif.cue, when: `${profile.cues.leadTimes.transitionWarningMinutes[0] ?? 10} min before ${nextItem?.label ?? "next"}` }] : []),
        ...(okMotif ? [{ channel: okMotif.channel, cue: okMotif.cue, when: "after the new map has been walked through" }] : []),
      ],
    },
    newMap,
    why: input.reason,
    next: nextText,
    partnerScript: [
      changeMotif ? `Fire the "${changeMotif.meaning}" cue (${changeMotif.cue}) before speaking.` : `Get to ${profile.displayName}'s level, calm voice, before speaking.`,
      `Show the symbols in order: ${symbols.join(" , ")}.`,
      `Say: "${spokenChange}" then stop. Wait ${profile.receptive.processingTimeSeconds}s.`,
      `Walk through the new map from now: ${newMap.slice(0, 3).join("; ")}${newMap.length > 3 ? "; ..." : ""}.`,
      `Say why, once, literally: "${input.reason}".`,
      `Point to next: "${nextText}".`,
      ...(riskLevel !== "low" ? [`Stay within reach for the next ${riskLevel === "high" ? 15 : 5} minutes; watch for early signs: ${profile.sensory.triggers.flatMap((t) => t.earlySigns).slice(0, 3).join(", ") || "pacing, vocal change"}.`] : []),
    ],
    ifEscalates: profile.sensory.regulators[0] ? `Stop explaining. ${profile.sensory.regulators.slice(0, 2).join("; ")}. Return to the map only when settled.` : "Stop explaining. Reduce input, offer a known regulator, return to the map when settled.",
  };
}
