/**
 * Bridge facade: modules + store + provider, with event logging and the
 * human-review loop wired in. This is the API the server and CLI call.
 */
import { MockProvider, createProvider, type Provider } from "./provider.js";
import { Store } from "../store/store.js";
import type { Profile } from "./profile.js";
import { interpret, mockInterpret, type InterpretInput, type InterpretOutput } from "../modules/interpret.js";
import { compose, mockCompose, type ComposeInput, type ComposeOutput } from "../modules/compose.js";
import { coach, mockCoach, type CoachInput } from "../modules/coach.js";
import { planChange, mockPlanChange, buildTimeline, tick, type ChangeInput } from "../modules/anchor.js";
import { story, mockStory, type StoryInput } from "../modules/story.js";
import { insights, mockInsights } from "../modules/insights.js";

export function buildMockProvider(): MockProvider {
  return new MockProvider()
    .register("interpret", mockInterpret)
    .register("compose", mockCompose)
    .register("coach", mockCoach)
    .register("planChange", mockPlanChange)
    .register("story", mockStory)
    .register("insights", mockInsights);
}

export class Bridge {
  readonly provider: Provider;
  constructor(public readonly store: Store, provider?: Provider) {
    this.provider = provider ?? createProvider(buildMockProvider());
  }

  private need(profileId: string): Profile {
    const p = this.store.getProfile(profileId);
    if (!p) throw new Error(`profile ${profileId} not found`);
    return p;
  }

  /** Consent is enforced in code: a module the guardian hasn't allowed doesn't run. */
  private needWithConsent(profileId: string, use: "interpretation" | "composition" | "coaching" | "insights"): Profile {
    const p = this.need(profileId);
    if (!p.guardrails.consent.allowedUses.includes(use)) {
      const why = p.fit.level !== "full" && p.fit.note ? ` ${p.fit.note}` : "";
      throw new Error(`${use} is not allowed for ${p.displayName} (consent covers: ${p.guardrails.consent.allowedUses.join(", ")}).${why}`);
    }
    return p;
  }

  private nearestAnchor(profile: Profile, at = new Date()) {
    const nowMin = at.getHours() * 60 + at.getMinutes();
    const t = tick(profile, nowMin);
    return { anchor: t.next?.label, minutesToNextAnchor: t.minutesUntilNext ?? undefined };
  }

  async interpret(profileId: string, input: InterpretInput) {
    const profile = this.needWithConsent(profileId, "interpretation");
    const out = await interpret(profile, input, this.provider);
    const ctx = { setting: input.context?.setting, timeOfDay: input.context?.timeOfDay, partner: input.context?.partner, ...this.nearestAnchor(profile) };
    const obs = this.store.logEvent({ profileId, kind: "observation", context: ctx, data: { observation: input.observation, stateBefore: input.context?.stateBefore } });
    const prop = this.store.logEvent({ profileId, kind: "interpretation_proposed", context: ctx, data: { observationEventId: obs.id, provider: this.provider.name, output: out } });
    if (out.lexiconCandidate && profile.guardrails.consent.allowedUses.includes("interpretation")) {
      this.store.propose({ profileId, kind: "lexicon_add", proposal: out.lexiconCandidate, rationale: out.lexiconCandidate.reason, sourceEventIds: [obs.id, prop.id] });
    }
    return { ...out, eventId: prop.id, observationEventId: obs.id };
  }

  /** Human closes the loop: which interpretation (if any) was right. */
  confirmInterpretation(profileId: string, proposedEventId: string, chosenIndex: number | null, by: string, note?: string) {
    const ev = this.store.events(profileId).find((e) => e.id === proposedEventId);
    if (!ev) throw new Error("proposed event not found");
    const out = ev.data.output as InterpretOutput;
    const chosen = chosenIndex !== null ? out.interpretations[chosenIndex] : undefined;
    const conf = this.store.logEvent({ profileId, kind: "interpretation_confirmed", context: ev.context, data: { proposedEventId, chosenIndex, by, note, chosen } });
    // A confirmed reading with lexicon evidence strengthens nothing automatically;
    // it becomes a refine proposal so the confidence bump is a human decision too.
    if (chosen && chosen.evidence.length === 0 && chosen.confidence !== "high") {
      const obs = this.store.events(profileId).find((e) => e.id === ev.data.observationEventId);
      this.store.propose({ profileId, kind: "lexicon_add", proposal: { form: obs?.data.observation ?? "?", gloss: chosen.meaning, function: chosen.function, contexts: [ev.context.setting, ev.context.anchor && `near ${ev.context.anchor}`].filter(Boolean) }, rationale: `${by} confirmed this reading in the moment.`, sourceEventIds: [proposedEventId, conf.id] });
    }
    return conf;
  }

  async compose(profileId: string, input: ComposeInput) {
    const profile = this.needWithConsent(profileId, "composition");
    const out = await compose(profile, input, this.provider);
    const ev = this.store.logEvent({ profileId, kind: "utterance_composed", context: this.nearestAnchor(profile), data: { input, provider: this.provider.name, output: out } });
    return { ...out, eventId: ev.id };
  }

  /** The person (or partner with them) picks a candidate. Provenance is recorded. */
  send(profileId: string, composedEventId: string, candidateIndex: number | null, chosenBy: "person" | "partner_with_person" | "partner" | "none", finalText?: string) {
    const ev = this.store.events(profileId).find((e) => e.id === composedEventId);
    if (!ev) throw new Error("composed event not found");
    const out = ev.data.output as ComposeOutput;
    const seeds: string[] = ev.data.input.seeds;
    const text = finalText ?? (candidateIndex === null ? out.somethingElse : out.candidates[candidateIndex]?.text) ?? "";
    const seedSet = new Set(seeds.join(" ").toLowerCase().split(/\s+/));
    const aiAdded = text.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter((w) => w && !seedSet.has(w)).join(" ");
    return this.store.logEvent({ profileId, kind: "utterance_sent", context: ev.context, data: { composedEventId, candidateIndex, text }, authorship: { seeds, aiAdded, chosenBy } });
  }

  async coach(profileId: string, input: CoachInput) {
    const profile = this.needWithConsent(profileId, "coaching");
    const out = await coach(profile, input, this.provider);
    this.store.logEvent({ profileId, kind: "coach_card", context: { partner: input.partnerRole }, data: { input, output: out } });
    return out;
  }

  timeline(profileId: string, now = new Date()) {
    const profile = this.need(profileId);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return { timeline: buildTimeline(profile), state: tick(profile, nowMin) };
  }

  async planChange(profileId: string, input: ChangeInput) {
    const profile = this.need(profileId);
    const out = await planChange(profile, input, this.provider);
    this.store.logEvent({ profileId, kind: "schedule_change", context: { partner: input.partner, anchor: input.anchorId }, data: { input, output: out } });
    return out;
  }

  async story(profileId: string, input: StoryInput) {
    const profile = this.need(profileId);
    const out = await story(profile, input, this.provider);
    this.store.logEvent({ profileId, kind: "story", data: { input, output: out } });
    return out;
  }

  logVocalization(profileId: string, label: string, form: string, setting?: string, partner?: string) {
    const profile = this.need(profileId);
    return this.store.logEvent({ profileId, kind: "vocalization", context: { setting, partner, ...this.nearestAnchor(profile) }, data: { label, form } });
  }

  logRegulation(profileId: string, stage: "early_sign" | "escalating" | "meltdown" | "recovering" | "settled", note?: string, setting?: string, partner?: string) {
    const profile = this.need(profileId);
    return this.store.logEvent({ profileId, kind: "regulation_event", context: { setting, partner, ...this.nearestAnchor(profile) }, data: { stage, note } });
  }

  async insights(profileId: string) {
    const profile = this.needWithConsent(profileId, "insights");
    const res = await insights(profile, this.store.events(profileId), this.provider);
    for (const lp of res.report.lexiconProposals) {
      this.store.propose({ profileId, kind: "lexicon_add", proposal: { form: lp.form, gloss: lp.gloss, function: lp.function, contexts: lp.contexts }, rationale: lp.rationale });
    }
    for (const g of res.report.goalSuggestions) {
      this.store.propose({ profileId, kind: "goal_suggestion", proposal: g, rationale: "From insights run" });
    }
    return res;
  }
}
