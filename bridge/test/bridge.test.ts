import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Store } from "../src/store/store.js";
import { Bridge, buildMockProvider } from "../src/core/bridge.js";
import { parseProfile, renderProfileForPrompt } from "../src/core/profile.js";
import { buildTimeline, tick } from "../src/modules/anchor.js";
import { computeStats } from "../src/modules/insights.js";

const ALL = ["felix", "ivy", "gus", "theo", "walt", "miles", "rowan"];
const load = (id: string) => parseProfile(JSON.parse(fs.readFileSync(path.join("profiles", `${id}.json`), "utf8")));
const fresh = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-test-"));
  const store = new Store(dir);
  for (const id of ALL) store.saveProfile(load(id), "test");
  return new Bridge(store, buildMockProvider());
};

test("profiles validate and render deterministically (cacheable prefix)", () => {
  for (const id of ALL) {
    const p = load(id);
    assert.equal(renderProfileForPrompt(p), renderProfileForPrompt(p));
    assert.ok(renderProfileForPrompt(p).includes("Personal lexicon"));
  }
});

test("timeline resolves relative anchors and fires lead-time cues", () => {
  const p = load("felix");
  const tl = buildTimeline(p);
  const cabin = tl.find((t) => t.id === "cabin")!;
  assert.equal(cabin.startMin, 8 * 60); // after breakfast 07:30 + 30
  const t = tick(p, 11 * 60 + 50);
  assert.equal(t.next?.id, "lunch");
  assert.equal(t.due.length, 1);
  assert.equal(t.due[0].cue, "two soft wood-block taps");
  assert.equal(tick(p, 11 * 60 + 49).due.length, 0);
});

test("interpreter: known trigger → regulation first, lexicon cited, capped at maxInterpretations", async () => {
  const b = fresh();
  const r = await b.interpret("felix", { observation: "says 'bell bell' and paces by the door", context: { setting: "outside dining hall", recentEvents: ["lunch bell rang"] } });
  assert.ok(r.regulationFirst, "should lead with regulation");
  assert.ok(r.interpretations.length <= 3);
  assert.ok(r.interpretations.some((i) => i.evidence.includes("lex-bell")));
  assert.equal(r.lexiconCandidate, null, "known forms should not be re-proposed");
});

test("interpreter: unknown form → low confidence + review-queue proposal, never auto-added", async () => {
  const b = fresh();
  const before = b.store.getProfile("gus")!.lexicon.length;
  const r = await b.interpret("gus", { observation: "taps the window frame three times and hums" });
  assert.equal(r.interpretations[0].confidence, "low");
  assert.ok(r.lexiconCandidate);
  assert.equal(b.store.getProfile("gus")!.lexicon.length, before, "profile untouched");
  const q = b.store.reviewQueue("gus");
  assert.equal(q.filter((x) => x.status === "pending").length, 1);
  b.store.decide("gus", q[0].id, "approved", "SLP", "seen 4x this week");
  assert.equal(b.store.getProfile("gus")!.lexicon.length, before + 1);
  const added = b.store.getProfile("gus")!.lexicon.at(-1)!;
  assert.equal(added.meanings[0].provenance.source, "ai_hypothesis");
  assert.equal(added.meanings[0].provenance.confirmedBy, "SLP");
  assert.throws(() => b.store.decide("gus", q[0].id, "rejected", "x"), /already/);
});

test("composer: always offers opt-out; provenance records zero AI words when seeds chosen as-is", async () => {
  const b = fresh();
  const c = await b.compose("felix", { seeds: ["lunch", "board"], intent: "request" });
  assert.ok(c.somethingElse.length > 0);
  assert.ok(c.candidates.every((x) => x.keepsSeeds));
  const sent = b.send("felix", c.eventId, 0, "person");
  assert.equal(sent.authorship?.aiAdded, "");
  assert.equal(sent.authorship?.chosenBy, "person");
  const sent2 = b.send("felix", c.eventId, 1, "partner_with_person");
  assert.equal(sent2.authorship?.aiAdded, "now");
});

test("schedule change: critical anchor + very_low tolerance → high risk, cue before words, honest why", async () => {
  const b = fresh();
  const r = await b.planChange("felix", { anchorId: "lunch", change: "delayed", newTime: "12:20", reason: "The oven broke.", nowTime: "11:58" });
  assert.equal(r.riskLevel, "high");
  assert.equal(r.why, "The oven broke.");
  assert.equal(r.announce.cues[0].when, "first, before any words");
  assert.ok(r.newMap[0].startsWith("12:20"));
  assert.ok(!r.announce.spoken.includes("Next: lunch at 12:20"), "should not repeat the delayed anchor as 'next'");
});

test("schedule change: cancelled anchor disappears from the new map", async () => {
  const b = fresh();
  const r = await b.planChange("felix", { anchorId: "swim", change: "cancelled", reason: "Thunderstorm. Pool is closed.", nowTime: "08:50" });
  assert.ok(!r.newMap.some((m) => m.includes("swim")));
  assert.ok(r.newMap.some((m) => m.includes("arts and crafts")));
});

test("guardrails: banned phrases never appear in coach/change output for felix (mock)", async () => {
  const b = fresh();
  const p = b.store.getProfile("felix")!;
  const outs = [
    JSON.stringify(await b.coach("felix", { situation: "need him out of the pool", partnerRole: "new" })),
    JSON.stringify(await b.planChange("felix", { anchorId: "swim", change: "delayed", newTime: "09:30", reason: "Lifeguard is late.", nowTime: "08:55" })),
  ];
  for (const o of outs) for (const bp of p.guardrails.bannedPhrases) assert.ok(!o.toLowerCase().includes(`"${bp}`), `output contains banned phrase ${bp}`);
});

test("insights: finds pre-anchor clustering and authorship health", () => {
  const p = load("felix");
  const events = [];
  for (let i = 0; i < 10; i++) events.push({ id: `r${i}`, profileId: "felix", at: new Date(2026, 7, 1, 11, 55).toISOString(), kind: "regulation_event" as const, context: { minutesToNextAnchor: 5, setting: "hall" }, data: {} });
  events.push({ id: "u1", profileId: "felix", at: new Date().toISOString(), kind: "utterance_sent" as const, context: {}, data: {}, authorship: { seeds: ["lunch"], aiAdded: "can I please have my", chosenBy: "partner" as const } });
  const s = computeStats(p, events);
  assert.equal(s.regulationByMinutesToAnchor.within5, 10);
  assert.ok(s.authorship.avgAiAddedWords > s.authorship.avgSeedWords);
});

test("audit trail records every AI proposal and human decision", async () => {
  const b = fresh();
  await b.interpret("ivy", { observation: "stacked all the cups in a tower and stared at me" });
  const q = b.store.reviewQueue("ivy");
  b.store.decide("ivy", q[0].id, "rejected", "Jo", "one-off");
  const actions = b.store.auditLog("ivy").map((a) => a.action);
  assert.ok(actions.includes("review.propose"));
  assert.ok(actions.includes("review.rejected"));
});

test("response bias: acquiescent person never gets a yes/no clarifying check, verbal 'confirmation' is downgraded", async () => {
  const b = fresh();
  const r = await b.interpret("walt", { observation: "says yes", context: { setting: "bunk", recentEvents: ["asked if he brushed his teeth"] } });
  assert.match(r.bestClarifyingCheck, /Do not ask yes\/no/);
  assert.ok(!r.interpretations.some((i) => i.function !== "distress" && i.confidence === "high"), "no high-confidence reading from a yes");
  assert.ok(renderProfileForPrompt(load("walt")).includes("RESPONSE BIAS: acquiescence"));
});

test("deliberate behavior: play_or_testing is a live hypothesis, not a need", async () => {
  const b = fresh();
  const r = await b.interpret("miles", { observation: "sneaks up at bunk check and strokes your leg hair saying nice soft hair, grinning" });
  assert.equal(r.interpretations[0].function, "play_or_testing");
  assert.equal(r.regulationFirst, null, "a stunt is not distress");
  assert.ok(r.interpretations.some((i) => i.evidence.includes("lex-soft-hair")));
});

test("registers: coach warns an unchosen partner off Ivy's song register; chosen partner is not warned", async () => {
  const b = fresh();
  const stranger = await b.coach("ivy", { situation: "first time meeting her, I play guitar", partnerRole: "new counselor", partnerName: "Sam" });
  assert.ok(stranger.dont.some((d) => /only Casey, Jo/.test(d)), JSON.stringify(stranger.dont));
  const chosen = await b.coach("ivy", { situation: "first time in the music room today", partnerRole: "counselor", partnerName: "casey" });
  assert.ok(!chosen.dont.some((d) => /only Casey, Jo/.test(d)));
});

test("scan-ahead triggers and safety alerts lead the coach card and the prompt", async () => {
  const b = fresh();
  const card = await b.coach("theo", { situation: "taking him to the town fair tomorrow", partnerRole: "new counselor" });
  assert.match(card.do[0], /^SAFETY:/);
  assert.ok(card.do.some((d) => /check the setting for a dog/.test(d)));
  const rendered = renderProfileForPrompt(load("theo"));
  assert.ok(rendered.indexOf("!! SAFETY") < rendered.indexOf("Strengths"));
  assert.ok(rendered.includes("Scan every new setting before arrival for: a dog"));
});

test("fit + unknown comprehension render honestly for Rowan", () => {
  const r = renderProfileForPrompt(load("rowan"));
  assert.ok(r.includes("FIT: partial"));
  assert.ok(r.includes("comprehension level unknown — presume competence"));
  assert.ok(!r.includes("RESPONSE BIAS"), "unknown bias should not assert a bias");
});

test("consent is enforced in code: no Composer for Rowan; coach doesn't claim he understands", async () => {
  const b = fresh();
  await assert.rejects(b.compose("rowan", { seeds: ["lake"], intent: "request" }), /composition is not allowed for Rowan/);
  await assert.doesNotReject(b.compose("felix", { seeds: ["lunch"], intent: "request" }));
  const card = await b.coach("rowan", { situation: "first meeting", partnerRole: "counselor" });
  assert.ok(!/understands you/.test(card.headline), card.headline);
  assert.match(card.headline, /talk to him as if he does/);
});

test("partner's own reading is saved as their unverified interpretation and only joins the profile through review", async () => {
  const b = fresh();
  const i = await b.interpret("felix", { observation: "taps the window twice and points at the bus", context: { setting: "cabin" } });
  const ev = b.confirmInterpretation("felix", i.eventId, null, "Casey", undefined, "he thought the bus was leaving without him");
  assert.equal(ev.data.partnerReading, "he thought the bus was leaving without him");
  assert.equal(ev.data.readingIsUnverified, true);
  const item = b.store.reviewQueue("felix").find((x) => x.status === "pending" && (x.proposal as any).gloss === "he thought the bus was leaving without him");
  assert.ok(item, "queued for review");
  assert.match(item!.rationale, /not a confirmed reason/);
  assert.ok(!b.store.getProfile("felix")!.lexicon.some((l) => l.meanings.some((m) => m.gloss.startsWith("he thought the bus"))), "not in profile before review");
  b.store.decide("felix", item!.id, "approved", "Casey");
  const m = b.store.getProfile("felix")!.lexicon.flatMap((l) => l.meanings).find((m) => m.gloss.startsWith("he thought the bus"))!;
  assert.equal(m.provenance.source, "partner_interpretation");
});
