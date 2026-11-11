/**
 * Eval harness. Runs evals/cases.json against the current provider and checks
 * the properties that matter for safety and fidelity: regulation-first on
 * known triggers, lexicon grounding, banned phrases, authorship (seeds kept,
 * no pleasantries added), honesty of 'why', brevity for the person's
 * receptive load. Works in mock mode (sanity) and with a real model
 * (ANTHROPIC_API_KEY set) — that's the run that matters.
 *
 *   npm run eval            # mock
 *   ANTHROPIC_API_KEY=... npm run eval
 */
import "../src/core/env.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseProfile } from "../src/core/profile.js";
import { createProvider } from "../src/core/provider.js";
import { buildMockProvider } from "../src/core/bridge.js";
import { interpret } from "../src/modules/interpret.js";
import { compose } from "../src/modules/compose.js";
import { planChange } from "../src/modules/anchor.js";
import { coach } from "../src/modules/coach.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const cases = JSON.parse(fs.readFileSync(path.join(here, "cases.json"), "utf8")) as any[];
const provider = createProvider(buildMockProvider());
const profiles = new Map<string, ReturnType<typeof parseProfile>>();
const prof = (id: string) => profiles.get(id) ?? profiles.set(id, parseProfile(JSON.parse(fs.readFileSync(path.join(root, "profiles", `${id}.json`), "utf8")))).get(id)!;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const lower = (o: unknown) => JSON.stringify(o).toLowerCase();

type Check = { name: string; pass: boolean; detail?: string };

async function runCase(c: any): Promise<{ id: string; checks: Check[]; output: unknown }> {
  const p = prof(c.profile);
  const e = c.expect ?? {};
  const checks: Check[] = [];
  const push = (name: string, pass: boolean, detail?: string) => checks.push({ name, pass, detail });
  let out: any;
  if (c.module === "interpret") {
    out = await interpret(p, c.input, provider);
    if ("regulationFirst" in e) push("regulationFirst", Boolean(out.regulationFirst) === e.regulationFirst, String(out.regulationFirst));
    if (e.evidenceIncludesAny) push("evidence grounded", out.interpretations.some((i: any) => i.evidence.some((ev: string) => e.evidenceIncludesAny.some((k: string) => ev.includes(k)))), JSON.stringify(out.interpretations.map((i: any) => i.evidence)));
    if (e.topFunctionIn) push("top function", e.topFunctionIn.includes(out.interpretations[0].function), out.interpretations[0].function);
    if (e.topConfidence) push("top confidence", out.interpretations[0].confidence === e.topConfidence, out.interpretations[0].confidence);
    if (e.maxInterpretations) push("count cap", out.interpretations.length <= e.maxInterpretations, String(out.interpretations.length));
    if (e.clarifyingCheckMatches) push("clarifying check shape", new RegExp(e.clarifyingCheckMatches, "i").test(out.bestClarifyingCheck), out.bestClarifyingCheck);
    if (e.clarifyingCheckNotMatches) push("clarifying check not a closed question", !new RegExp(e.clarifyingCheckNotMatches, "i").test(out.bestClarifyingCheck), out.bestClarifyingCheck);
    if (e.noHighConfidenceOnlyFrom) push("no high confidence from a verbal yes alone", out.interpretations.every((i: any) => i.confidence !== "high" || i.evidence.some((ev: string) => !e.noHighConfidenceOnlyFrom.includes(ev)) || i.function === "social_bid"), JSON.stringify(out.interpretations.map((i: any) => [i.function, i.confidence, i.evidence])));
    if (e.noHighConfidenceExcept) push("confidence capped", out.interpretations.every((i: any) => i.confidence !== "high" || e.noHighConfidenceExcept.includes(i.function)), JSON.stringify(out.interpretations.map((i: any) => [i.function, i.confidence])));
    if (e.lexiconCandidateOrNull) push("candidate shape", out.lexiconCandidate === null || typeof out.lexiconCandidate?.form === "string");
  } else if (c.module === "compose") {
    out = await compose(p, c.input, provider);
    if (e.allKeepSeeds) push("keeps seeds", out.candidates.every((x: any) => x.keepsSeeds));
    if (e.hasSomethingElse) push("opt-out present", typeof out.somethingElse === "string" && out.somethingElse.length > 0);
    if (e.maxWordsPerCandidate) push("brevity", out.candidates.every((x: any) => words(x.text) <= e.maxWordsPerCandidate), out.candidates.map((x: any) => x.text).join(" | "));
    if (e.mentionsAll) push("all seeds present", out.candidates.some((x: any) => e.mentionsAll.every((s: string) => x.text.toLowerCase().includes(s.toLowerCase()))), out.candidates.map((x: any) => x.text).join(" | "));
  } else if (c.module === "planChange") {
    out = await planChange(p, c.input, provider);
    if (e.riskLevel) push("risk level", out.riskLevel === e.riskLevel, out.riskLevel);
    if (e.riskLevelIn) push("risk level", e.riskLevelIn.includes(out.riskLevel), out.riskLevel);
    if (e.spokenMaxWords) push("spoken brevity", words(out.announce.spoken) <= e.spokenMaxWords, out.announce.spoken);
    if (e.whyIsHonest) push("why is honest", e.whyIsHonest.every((k: string) => out.why.toLowerCase().includes(k)), out.why);
    if (e.cuesIncludeAny) push("uses profile cues", lower(out.announce.cues).includes(e.cuesIncludeAny[0].toLowerCase()), JSON.stringify(out.announce.cues));
  } else if (c.module === "coach") {
    out = await coach(p, c.input, provider);
    if (e.dontMentionsAny) push("don't covers trigger", e.dontMentionsAny.some((k: string) => lower(out.dont).includes(k)), JSON.stringify(out.dont));
    if (e.doMentionsAny) push("do covers it", e.doMentionsAny.some((k: string) => lower(out.do).includes(k)), JSON.stringify(out.do));
    if (e.dontNotMentions) push("don't is clean", !e.dontNotMentions.some((k: string) => lower(out.dont).includes(k)), JSON.stringify(out.dont));
  }
  if (e.mustNotContain) {
    const l = c.module === "coach" ? lower({ ...out, dont: undefined }) : lower(out);
    const hits = e.mustNotContain.filter((k: string) => l.includes(k.toLowerCase()));
    push("no banned/wrong phrases", hits.length === 0, hits.join(", "));
  }
  // universal: banned phrases from the profile's guardrails. A coach card may quote a banned phrase inside
  // its own "don't say X" list, so that field is excluded from the scan.
  const scanned = c.module === "coach" ? lower({ ...out, dont: undefined }) : lower(out);
  const banned = p.guardrails.bannedPhrases.filter((b) => scanned.includes(`"${b.toLowerCase()}`) || scanned.includes(` ${b.toLowerCase()}`));
  push("profile guardrail phrases", banned.length === 0, banned.join(", "));
  return { id: c.id, checks, output: out };
}

(async () => {
  console.log(`Eval: ${cases.length} cases, provider=${provider.name}`);
  let pass = 0, total = 0;
  const results = [];
  for (const c of cases) {
    try {
      const r = await runCase(c);
      results.push(r);
      for (const ch of r.checks) {
        total++;
        if (ch.pass) pass++;
        console.log(`${ch.pass ? "PASS" : "FAIL"}  ${c.id} :: ${ch.name}${ch.pass ? "" : `  — ${ch.detail ?? ""}`}`);
      }
    } catch (err: any) {
      total++;
      console.log(`ERROR ${c.id} :: ${err.message}`);
      results.push({ id: c.id, error: err.message });
    }
  }
  const outPath = path.join(here, `last-run.${provider.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ at: new Date().toISOString(), provider: provider.name, pass, total, results }, null, 2));
  console.log(`\n${pass}/${total} checks passed. Full outputs: ${outPath}`);
  process.exit(pass === total ? 0 : 1);
})();
