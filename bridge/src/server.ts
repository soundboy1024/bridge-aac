/**
 * HTTP API + static UI. Run: npm start  →  http://localhost:8787
 *
 * Data lives in ./data (gitignored). On first run, sample profiles from
 * ./profiles are copied in. BRIDGE_PROVIDER=mock|claude|groq overrides detection.
 *
 * DEMO_MODE=1 (public hosting): real AI calls are capped and fall back to mock
 * answers (see core/demo.ts), and raw profile editing is turned off.
 */
import "./core/env.js";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store } from "./store/store.js";
import { Bridge, buildMockProvider } from "./core/bridge.js";
import { createProvider, hasClaudeCredentials } from "./core/provider.js";
import { DemoGuardProvider, requestCtx } from "./core/demo.js";
import { parseProfile } from "./core/profile.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const dataDir = process.env.BRIDGE_DATA ?? path.join(root, "data");
const demoMode = process.env.DEMO_MODE === "1";

export function seed(store: Store) {
  const src = path.join(root, "profiles");
  for (const f of fs.readdirSync(src).filter((x) => x.endsWith(".json"))) {
    const p = parseProfile(JSON.parse(fs.readFileSync(path.join(src, f), "utf8")));
    if (!store.getProfile(p.id)) store.saveProfile(p, "seed", `seeded from profiles/${f}`);
  }
}

export function createApp(bridge: Bridge) {
  const app = express();
  app.set("trust proxy", 1); // behind the host's proxy, req.ip is the visitor
  app.use(express.json({ limit: "100kb" }));
  app.use((req, _res, next) => requestCtx.run({ ip: req.ip ?? "unknown" }, next));
  app.use(express.static(path.join(root, "public")));

  const wrap = (fn: (req: express.Request, res: express.Response) => Promise<unknown> | unknown) =>
    async (req: express.Request, res: express.Response) => {
      try {
        const out = await fn(req, res);
        const ctx = requestCtx.getStore();
        // Tell the page when an answer came from the mock instead of the AI.
        if (ctx?.servedBy && out && typeof out === "object" && !Array.isArray(out)) res.json({ ...out, _servedBy: ctx.servedBy, _fallbackReason: ctx.fallbackReason });
        else res.json(out);
      } catch (e: any) {
        res.status(400).json({ error: e?.message ?? String(e) });
      }
    };

  app.get("/api/health", wrap(() => ({ ok: true, provider: bridge.provider.name, model: (bridge.provider as { model?: string }).model ?? null, claudeCredentials: hasClaudeCredentials(), demo: demoMode, aiRemainingToday: bridge.provider instanceof DemoGuardProvider ? bridge.provider.remainingToday() : null })));
  app.get("/api/profiles", wrap(() => bridge.store.listProfiles().map((p) => ({ id: p.id, displayName: p.displayName, age: p.age, summary: p.summary }))));
  app.get("/api/profiles/:id", wrap((req) => bridge.store.getProfile(req.params.id) ?? (() => { throw new Error("not found"); })()));
  app.put("/api/profiles/:id", wrap((req) => demoMode ? (() => { throw new Error("Profile editing is turned off in the public demo. Run it locally to edit profiles."); })() : bridge.store.saveProfile(parseProfile({ ...req.body, id: req.params.id }), req.body._actor ?? "editor", "manual edit")));

  app.post("/api/profiles/:id/interpret", wrap((req) => bridge.interpret(req.params.id, req.body)));
  app.post("/api/profiles/:id/interpret/confirm", wrap((req) => bridge.confirmInterpretation(req.params.id, req.body.eventId, req.body.chosenIndex ?? null, req.body.by ?? "partner", req.body.note, req.body.partnerReading)));
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
  const mock = buildMockProvider();
  const real = createProvider(mock);
  const bridge = new Bridge(store, demoMode && real !== mock ? new DemoGuardProvider(real, mock) : real);
  const port = Number(process.env.PORT ?? 8787);
  createApp(bridge).listen(port, () => {
    console.log(`Bridge running at http://localhost:${port}  (provider: ${bridge.provider.name}, data: ${dataDir})`);
    if (demoMode) console.log("Demo mode: AI calls capped (fall back to mock), profile editing off.");
    if (bridge.provider.name === "mock") console.log("Mock mode: rule-based answers, no AI. Put a GROQ_API_KEY or ANTHROPIC_API_KEY in .env to use a real model.");
  });
}
