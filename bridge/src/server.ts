/**
 * HTTP API + static UI. Run: npm start  →  http://localhost:8787
 *
 * Data lives in ./data (gitignored). On first run, sample profiles from
 * ./profiles are copied in. BRIDGE_PROVIDER=mock|claude overrides detection.
 */
import "./core/env.js";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "./store/store.js";
import { Bridge } from "./core/bridge.js";
import { hasClaudeCredentials } from "./core/provider.js";
import { parseProfile } from "./core/profile.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dataDir = process.env.BRIDGE_DATA ?? path.join(root, "data");

export function seed(store: Store) {
  const src = path.join(root, "profiles");
  for (const f of fs.readdirSync(src).filter((x) => x.endsWith(".json"))) {
    const p = parseProfile(JSON.parse(fs.readFileSync(path.join(src, f), "utf8")));
    if (!store.getProfile(p.id)) store.saveProfile(p, "seed", `seeded from profiles/${f}`);
  }
}

export function createApp(bridge: Bridge) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(root, "public")));

  const wrap = (fn: (req: express.Request, res: express.Response) => Promise<unknown> | unknown) =>
    async (req: express.Request, res: express.Response) => {
      try {
        res.json(await fn(req, res));
      } catch (e: any) {
        res.status(400).json({ error: e?.message ?? String(e) });
      }
    };

  app.get("/api/health", wrap(() => ({ ok: true, provider: bridge.provider.name, claudeCredentials: hasClaudeCredentials() })));
  app.get("/api/profiles", wrap(() => bridge.store.listProfiles().map((p) => ({ id: p.id, displayName: p.displayName, age: p.age, summary: p.summary }))));
  app.get("/api/profiles/:id", wrap((req) => bridge.store.getProfile(req.params.id) ?? (() => { throw new Error("not found"); })()));
  app.put("/api/profiles/:id", wrap((req) => bridge.store.saveProfile(parseProfile({ ...req.body, id: req.params.id }), req.body._actor ?? "editor", "manual edit")));

  app.post("/api/profiles/:id/interpret", wrap((req) => bridge.interpret(req.params.id, req.body)));
  app.post("/api/profiles/:id/interpret/confirm", wrap((req) => bridge.confirmInterpretation(req.params.id, req.body.eventId, req.body.chosenIndex ?? null, req.body.by ?? "partner", req.body.note)));
  app.post("/api/profiles/:id/compose", wrap((req) => bridge.compose(req.params.id, req.body)));
  app.post("/api/profiles/:id/send", wrap((req) => bridge.send(req.params.id, req.body.eventId, req.body.candidateIndex ?? null, req.body.chosenBy ?? "partner_with_person", req.body.finalText)));
  app.post("/api/profiles/:id/coach", wrap((req) => bridge.coach(req.params.id, req.body)));
  app.get("/api/profiles/:id/timeline", wrap((req) => bridge.timeline(req.params.id, req.query.now ? new Date(`1970-01-01T${req.query.now}:00`) : new Date())));
  app.post("/api/profiles/:id/change", wrap((req) => bridge.planChange(req.params.id, req.body)));
  app.post("/api/profiles/:id/story", wrap((req) => bridge.story(req.params.id, req.body)));
  app.post("/api/profiles/:id/vocalization", wrap((req) => bridge.logVocalization(req.params.id, req.body.label, req.body.form, req.body.setting, req.body.partner)));
  app.post("/api/profiles/:id/regulation", wrap((req) => bridge.logRegulation(req.params.id, req.body.stage, req.body.note, req.body.setting, req.body.partner)));
  app.get("/api/profiles/:id/insights", wrap((req) => bridge.insights(req.params.id)));
  app.get("/api/profiles/:id/events", wrap((req) => bridge.store.events(req.params.id).slice(-200).reverse()));
  app.get("/api/profiles/:id/review", wrap((req) => bridge.store.reviewQueue(req.params.id)));
  app.post("/api/profiles/:id/review/:itemId", wrap((req) => bridge.store.decide(req.params.id, req.params.itemId, req.body.decision, req.body.by ?? "reviewer", req.body.note)));
  app.get("/api/profiles/:id/audit", wrap((req) => bridge.store.auditLog(req.params.id).slice(-200).reverse()));
  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const store = new Store(dataDir);
  seed(store);
  const bridge = new Bridge(store);
  const port = Number(process.env.PORT ?? 8787);
  createApp(bridge).listen(port, () => {
    console.log(`Bridge running at http://localhost:${port}  (provider: ${bridge.provider.name}, data: ${dataDir})`);
    if (bridge.provider.name === "mock") console.log("No ANTHROPIC_API_KEY found — running in deterministic mock mode. Set the key to use Claude.");
  });
}
