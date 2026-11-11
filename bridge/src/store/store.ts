/**
 * File-backed store. Deliberately boring: JSON per profile, JSONL event logs,
 * a review queue of proposed profile changes, and an append-only audit trail.
 *
 * The event log is the raw material for the ASLT loop (pattern recognition →
 * contextual analysis → human-validated lexicon) and for provenance: every
 * AI proposal and every human decision is recorded, so "who authored this
 * message" is always answerable. Swap for SQLite/Postgres later; keep the
 * interface.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { Profile, parseProfile } from "../core/profile.js";

export const Event = z.object({
  id: z.string(),
  profileId: z.string(),
  at: z.string(), // ISO
  kind: z.enum([
    "observation", // partner logged what the person did/said
    "vocalization", // tagged sound event (caregiver label in the moment)
    "interpretation_proposed", // AI output
    "interpretation_confirmed", // human picked one (or none)
    "utterance_composed", // AI candidates offered
    "utterance_sent", // the person chose one — provenance recorded
    "schedule_change",
    "regulation_event", // escalation/meltdown/recovery markers
    "coach_card",
    "story",
    "note",
  ]),
  context: z.object({
    setting: z.string().optional(),
    timeOfDay: z.string().optional(),
    partner: z.string().optional(),
    anchor: z.string().optional(), // nearest schedule anchor label
    minutesToNextAnchor: z.number().optional(),
  }).prefault({}),
  data: z.record(z.string(), z.any()).prefault({}),
  /** Provenance for anything the person "said" through the system. */
  authorship: z.object({
    seeds: z.array(z.string()).optional(), // what the person actually selected
    aiAdded: z.string().optional(), // words the AI added beyond the seeds
    chosenBy: z.enum(["person", "partner_with_person", "partner", "none"]).optional(),
  }).optional(),
});
export type Event = z.infer<typeof Event>;
export type EventInput = z.input<typeof Event>;

export const ReviewItem = z.object({
  id: z.string(),
  profileId: z.string(),
  createdAt: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  kind: z.enum(["lexicon_add", "lexicon_refine", "trigger_add", "motif_add", "goal_suggestion", "other"]),
  proposal: z.record(z.string(), z.any()),
  rationale: z.string(),
  sourceEventIds: z.array(z.string()).default([]),
  decidedBy: z.string().optional(),
  decidedAt: z.string().optional(),
  decisionNote: z.string().optional(),
});
export type ReviewItem = z.infer<typeof ReviewItem>;
export type ReviewItemInput = z.input<typeof ReviewItem>;

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export class Store {
  constructor(public readonly root: string) {
    for (const d of ["profiles", "events", "review"]) fs.mkdirSync(path.join(root, d), { recursive: true });
  }

  // ---- profiles ----
  listProfiles(): Profile[] {
    return fs.readdirSync(path.join(this.root, "profiles"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => parseProfile(JSON.parse(fs.readFileSync(path.join(this.root, "profiles", f), "utf8"))));
  }
  getProfile(id: string): Profile | undefined {
    const p = path.join(this.root, "profiles", `${id}.json`);
    return fs.existsSync(p) ? parseProfile(JSON.parse(fs.readFileSync(p, "utf8"))) : undefined;
  }
  saveProfile(profile: Profile, actor = "system", note = "save") {
    const p = Profile.parse({ ...profile, updatedAt: new Date().toISOString() });
    fs.writeFileSync(path.join(this.root, "profiles", `${p.id}.json`), JSON.stringify(p, null, 2));
    this.audit({ actor, action: "profile.save", profileId: p.id, note });
    return p;
  }

  // ---- events ----
  logEvent(e: Omit<EventInput, "id" | "at"> & Partial<Pick<EventInput, "id" | "at">>): Event {
    const ev = Event.parse({ id: e.id ?? newId(), at: e.at ?? new Date().toISOString(), ...e });
    fs.appendFileSync(path.join(this.root, "events", `${ev.profileId}.jsonl`), JSON.stringify(ev) + "\n");
    return ev;
  }
  events(profileId: string): Event[] {
    const p = path.join(this.root, "events", `${profileId}.jsonl`);
    if (!fs.existsSync(p)) return [];
    return fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => Event.parse(JSON.parse(l)));
  }

  // ---- review queue ----
  private reviewPath(profileId: string) {
    return path.join(this.root, "review", `${profileId}.json`);
  }
  reviewQueue(profileId: string): ReviewItem[] {
    const p = this.reviewPath(profileId);
    return fs.existsSync(p) ? z.array(ReviewItem).parse(JSON.parse(fs.readFileSync(p, "utf8"))) : [];
  }
  propose(item: Omit<ReviewItemInput, "id" | "createdAt" | "status">): ReviewItem {
    const q = this.reviewQueue(item.profileId);
    // de-dupe identical pending proposals
    const dup = q.find((x) => x.status === "pending" && x.kind === item.kind && JSON.stringify(x.proposal) === JSON.stringify(item.proposal));
    if (dup) return dup;
    const ri = ReviewItem.parse({ id: newId(), createdAt: new Date().toISOString(), status: "pending", ...item });
    q.push(ri);
    fs.writeFileSync(this.reviewPath(item.profileId), JSON.stringify(q, null, 2));
    this.audit({ actor: "ai", action: "review.propose", profileId: item.profileId, note: `${item.kind}: ${item.rationale}` });
    return ri;
  }
  decide(profileId: string, itemId: string, decision: "approved" | "rejected", decidedBy: string, note?: string): ReviewItem {
    const q = this.reviewQueue(profileId);
    const item = q.find((x) => x.id === itemId);
    if (!item) throw new Error(`review item ${itemId} not found`);
    if (item.status !== "pending") throw new Error(`review item ${itemId} already ${item.status}`);
    item.status = decision;
    item.decidedBy = decidedBy;
    item.decidedAt = new Date().toISOString();
    item.decisionNote = note;
    fs.writeFileSync(this.reviewPath(profileId), JSON.stringify(q, null, 2));
    this.audit({ actor: decidedBy, action: `review.${decision}`, profileId, note: `${item.kind} ${itemId}${note ? `: ${note}` : ""}` });
    if (decision === "approved") this.applyProposal(item, decidedBy);
    return item;
  }

  /** The ONLY path by which AI-originated content enters a profile. */
  private applyProposal(item: ReviewItem, by: string) {
    const profile = this.getProfile(item.profileId);
    if (!profile) throw new Error("profile missing");
    const now = new Date().toISOString().slice(0, 10);
    const prov = { source: "ai_hypothesis" as const, confirmedBy: by, firstSeen: now, lastSeen: now, timesObserved: 1 };
    switch (item.kind) {
      case "lexicon_add": {
        const p = item.proposal as { form: string; modality?: string; gloss: string; function?: string; contexts?: string[]; source?: "partner_interpretation" };
        profile.lexicon.push({
          id: `lex-${newId()}`,
          form: p.form,
          modality: (p.modality as any) ?? "other",
          meanings: [{ gloss: p.gloss, contexts: p.contexts ?? [], function: (p.function as any) ?? "unknown", confidence: "observed_once", provenance: (p.source ? { ...prov, source: p.source } : prov) }],
          doNotInterpretAs: [],
        });
        break;
      }
      case "lexicon_refine": {
        const p = item.proposal as { lexiconId: string; gloss: string; function?: string; contexts?: string[] };
        const e = profile.lexicon.find((l) => l.id === p.lexiconId);
        if (e) e.meanings.push({ gloss: p.gloss, contexts: p.contexts ?? [], function: (p.function as any) ?? "unknown", confidence: "observed_once", provenance: prov });
        break;
      }
      case "trigger_add": {
        const p = item.proposal as { trigger: string; earlySigns?: string[]; whatHelps?: string[] };
        profile.sensory.triggers.push({ trigger: p.trigger, category: "other", scanAhead: false, earlySigns: p.earlySigns ?? [], whatHelps: p.whatHelps ?? [], whatMakesItWorse: [], provenance: prov });
        break;
      }
      case "motif_add": {
        const p = item.proposal as { meaning: string; channel: string; cue: string };
        profile.cues.motifs.push({ meaning: p.meaning, channel: p.channel, cue: p.cue, established: false });
        break;
      }
      case "goal_suggestion": {
        const p = item.proposal as { text: string; measure?: string };
        profile.goals.push({ id: `goal-${newId()}`, text: p.text, measure: p.measure, owner: by });
        break;
      }
      default:
        break;
    }
    this.saveProfile(profile, by, `applied review ${item.id} (${item.kind})`);
  }

  // ---- audit ----
  audit(entry: { actor: string; action: string; profileId?: string; note?: string }) {
    fs.appendFileSync(path.join(this.root, "audit.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
  }
  auditLog(profileId?: string) {
    const p = path.join(this.root, "audit.jsonl");
    if (!fs.existsSync(p)) return [];
    const all = fs.readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    return profileId ? all.filter((a) => a.profileId === profileId) : all;
  }
}
