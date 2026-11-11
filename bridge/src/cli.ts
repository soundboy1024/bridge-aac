/**
 * CLI demo: walks one profile through every module. Useful for seeing what
 * the system does without the UI, and for trying real Claude output:
 *
 *   npm run cli                 # mock provider, profile "felix"
 *   npm run cli -- gus          # another profile (felix|ivy|gus|theo|walt|miles|rowan)
 *   ANTHROPIC_API_KEY=... npm run cli -- felix   # real model
 */
import "./core/env.js";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Store } from "./store/store.js";
import { Bridge } from "./core/bridge.js";
import { seed } from "./server.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const profileId = process.argv[2] ?? "felix";
const dataDir = process.env.BRIDGE_DATA ?? fs.mkdtempSync(path.join(os.tmpdir(), "bridge-cli-"));
const store = new Store(dataDir);
seed(store);
const bridge = new Bridge(store);
const show = (title: string, obj: unknown) => console.log(`\n=== ${title} ===\n${JSON.stringify(obj, null, 2)}`);

console.log(`Bridge CLI — profile "${profileId}", provider ${bridge.provider.name}, data ${dataDir}`);
void (async () => {
  const scenarios: Record<string, () => Promise<void>> = {
    felix: async () => {
      const i = await bridge.interpret("felix", { observation: "says 'bell bell' and keeps looking at the dining hall door, pacing", context: { setting: "outside dining hall", timeOfDay: "11:58", recentEvents: ["lunch bell rang 4 minutes ago", "kitchen is running late"], partner: "Casey" } });
      show("interpret", i);
      bridge.confirmInterpretation("felix", i.eventId, 0, "Casey", "yes — he was counting down from the bell");
      const c = await bridge.compose("felix", { seeds: ["lunch", "board"], audience: "Casey", intent: "request" });
      show("compose", c);
      show("send (provenance)", bridge.send("felix", c.eventId, 0, "person"));
      show("timeline @ 11:50", bridge.timeline("felix", new Date("1970-01-01T11:50:00")).state);
      show("planChange: lunch delayed", await bridge.planChange("felix", { anchorId: "lunch", change: "delayed", newTime: "12:20", reason: "The kitchen oven broke. Lunch is 20 minutes late.", nowTime: "11:58", partner: "Casey" }));
      show("coach", await bridge.coach("felix", { situation: "I'm the new counselor and I need to get him out of the pool at the end of swim", partnerRole: "new counselor" }));
      show("story", await bridge.story("felix", { event: "a fire drill", when: "Tomorrow after breakfast", concerns: ["the alarm is loud", "everyone leaves the cabin fast"] }));
    },
    ivy: async () => {
      show("interpret", await bridge.interpret("ivy", { observation: "turned her back on the new lifeguard and hummed one flat note after he started singing along", context: { setting: "pool deck", partner: "Casey" } }));
      show("compose", await bridge.compose("ivy", { seeds: ["Holiday", "Casey", "piano"], intent: "request", register: "own_voice" }));
      show("coach", await bridge.coach("ivy", { situation: "first time meeting her; I love to sing", partnerRole: "new volunteer" }));
    },
    gus: async () => {
      show("interpret", await bridge.interpret("gus", { observation: "said 'heavy traffic, backed up to exit 12' twice and started rocking", context: { setting: "dining hall", timeOfDay: "17:40", partner: "Casey" } }));
      show("interpret", await bridge.interpret("gus", { observation: "said 'bridge out' quietly after the phone call home didn't happen", context: { setting: "cabin", timeOfDay: "19:20", recentEvents: ["phone line down, call home missed"] } }));
      show("planChange: call moved", await bridge.planChange("gus", { anchorId: "call", change: "delayed", newTime: "20:00", reason: "The phone line is down. The office says it will be fixed by 8.", nowTime: "19:05", partner: "Casey" }));
      show("compose", await bridge.compose("gus", { seeds: ["Route 84 west", "phone"], audience: "Casey", intent: "question" }));
    },
    theo: async () => {
      show("coach: scan ahead", await bridge.coach("theo", { situation: "taking him to the county fair this afternoon", partnerRole: "counselor" }));
      show("interpret", await bridge.interpret("theo", { observation: "says 'all gone?' looking at me, hand near his mouth", context: { setting: "parking lot", recentEvents: ["a dog walked past, now behind a car"] } }));
    },
    walt: async () => {
      show("interpret: a 'yes' is not a yes", await bridge.interpret("walt", { observation: "says 'yes'", context: { setting: "bunk bathroom", recentEvents: ["asked 'did you brush your teeth?'", "holding the toothpaste pump"] } }));
      show("interpret: the grip", await bridge.interpret("walt", { observation: "grips the toothpaste pump, knuckles white, jaw set, silent", context: { setting: "bunk bathroom", timeOfDay: "07:30" } }));
      show("coach", await bridge.coach("walt", { situation: "I need to find out if he took his meds this morning", partnerRole: "sub counselor" }));
    },
    miles: async () => {
      show("interpret: the bit", await bridge.interpret("miles", { observation: "appears silently at bunk check, strokes my leg hair, 'nice soft hair… nice soft hair', watching my face", context: { setting: "bunk check", partner: "new counselor" } }));
      show("interpret: I got hurt", await bridge.interpret("miles", { observation: "calmly says 'I got hurt' and shows a bleeding knee, watching me", context: { setting: "after skateboard" } }));
      show("coach", await bridge.coach("miles", { situation: "first day as his substitute one-to-one", partnerRole: "sub 1:1" }));
    },
    rowan: async () => {
      show("coach: don't talk over him", await bridge.coach("rowan", { situation: "planning the afternoon with the group, he's sitting with us", partnerRole: "new counselor" }));
      show("interpret", await bridge.interpret("rowan", { observation: "turns his whole body away when offered the craft table", context: { setting: "rec hall" } }));
    },
  };
  await (scenarios[profileId] ?? scenarios.felix)();
  // simulate a week of regulation events clustered before meals, then insights
  for (let d = 0; d < 5; d++) {
    for (const [h, m] of [[11, 52], [11, 56], [17, 25], [14, 10]]) {
      const at = new Date(2026, 7, 10 + d, h, m).toISOString();
      const minutesToNextAnchor = h === 11 ? 60 - m : h === 17 ? 30 - m : 110;
      store.logEvent({ profileId, kind: "regulation_event", at, context: { setting: h === 14 ? "boats" : "outside dining hall", anchor: h === 11 ? "lunch" : h === 17 ? "dinner" : "free play", minutesToNextAnchor }, data: { stage: "early_sign" } });
    }
    store.logEvent({ profileId, kind: "observation", at: new Date(2026, 7, 10 + d, 15, 0).toISOString(), context: { setting: "boats", anchor: "free play" }, data: { observation: "flaps both hands at the water" } });
  }
  const ins = await bridge.insights(profileId);
  show("insights.stats", ins.stats);
  show("insights.report", ins.report);
  show("review queue", store.reviewQueue(profileId).map((r) => ({ id: r.id, kind: r.kind, status: r.status, proposal: r.proposal, rationale: r.rationale })));
  const pending = store.reviewQueue(profileId).find((r) => r.status === "pending");
  if (pending) {
    store.decide(profileId, pending.id, "approved", "camp SLP", "confirmed over 3 days");
    show("after approval: lexicon tail", store.getProfile(profileId)!.lexicon.slice(-1));
  }
  show("audit tail", store.auditLog(profileId).slice(-5));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
