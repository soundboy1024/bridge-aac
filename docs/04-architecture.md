# Bridge — architectures for individualized AI communication assistants

*Working document, Aug 2026. Built from the original ASLT theory, the chat log, and the two research reports in this folder.*

## 0. The one-paragraph thesis

The thing that worked for A. at camp wasn't the calendar board. It was **a person who knew his language standing next to the board, every time**. That person was not sustainable. Every product in the market is trying to make the *kid's device* smarter; almost none are trying to make the *person standing next to the kid* as good as the best counselor on their best day. Bridge is that: a per-person, human-curated communication model (the profile) plus a set of narrow AI tools that read from it, propose, and never decide. It also contains the one piece that must never be AI at all — the temporal anchor — because for a kid like A., reliability is the whole feature.

## 1. What the research changed about the original idea

| Original ASLT idea | What the evidence says | How Bridge adapts |
|---|---|---|
| AI learns the savant's "language" and *translates* it | ReCANVo/Commalla: per-person models work, but only with caregiver in-the-moment labels, and the honest output is a probabilistic hint to a partner, not a translation | Interpreter outputs ranked **hypotheses with confidence and evidence**; lexicon entries carry provenance; humans confirm |
| Therapist validates at each phase (HITL) | Right call. FC/RPM history shows what happens when the "facilitator" shapes the message. Authorship research (Valencia 2023; "I, Robot" 2026) shows users reject outputs that don't sound like them | Review queue is **the only path** AI content takes into a profile; composer never adds words the person didn't choose without marking it; every sent message logs seeds vs. AI-added words |
| Feed the AI a large dataset of the person's communication | Per-person datasets are small; homogenization risk ("Helping or Homogenizing?" 2025); COPPA 2025 makes child voice/biometrics + cloud AI a disclosure | Profile is a compact, human-readable corpus; prompts cache it; nothing trains on child data; on-device path planned |
| Multi-sensory cues, temporal anchor, gating | No direct AI literature; strongly consistent with predictive-coding/insistence-on-sameness and monotropism; AACessTalk shows partner-side scaffolding is the highest-evidence lever | **Anchor engine is deterministic code**; LLM only drafts the *explanation* of a change; cue grammar lives in the profile |
| Savant-specific | Treffert: language is usually the impaired domain even in savants; the skill domain is a high-bandwidth channel. No AI work on savants exists | Interests/strength domains are first-class "bridges" (Gus's route numbers, Ivy's songs); AAC fundamentals still apply |
| Cheap, open, no new screen addiction | Partner-facing tools don't put a screen in front of the kid | Bridge's primary user is the **partner**; the kid's surface is the physical board, cues, and (optionally) symbol strips |

## 2. Core object: the Individual Communication Profile (ICP)

A JSON document (`bridge/src/core/profile.ts`) — the machine-readable version of "orientation day". Sections:

- **summary / strengths / interests** — interests are bridges, not distractions.
- **expressive** — modes, typical utterance length, gestalt/script processor flag, *voice style* (so drafts sound like them), and **registers with authorized partners** (Ivy's call-and-response is a language only the people she has chosen may use; an unchosen person using it is a violation, and the Coach says so).
- **receptive** — what works, what to avoid, processing time, **response bias** (acquiescence / echo-last-option / refusal — Walt says "yes" to the Fire Marshal; a verbal confirmation from him is not evidence and the Interpreter must not check with yes/no), and **comprehensionKnown** (false for Rowan: nobody knows how much he understands, so the system must presume competence and say it is guessing).
- **lexicon** — the idiolect. Each entry: form (verbatim), modality, one or more *meanings* each with function, contexts, confidence, provenance, and `doNotInterpretAs` (known wrong readings — the "not defiance" list).
- **sensory** — seeking/avoiding, triggers with *early signs* (the gate point), what helps, what makes it worse; regulators. Triggers carry a **category** (sensory / phobic / schedule / social) and a **scanAhead** flag: for Theo's dogs and balloons the job is to check the setting before he arrives, and the Coach leads with that.
- **cues** — reading level, preferred channels, *motifs* (meaning → channel → cue, established or still-teaching), lead times. This is the multi-sensory language for non-readers.
- **schedule** — anchors (fixed or relative), importance, change tolerance, known hard transitions.
- **people / goals**.
- **safetyAlerts** — the first-minute facts (Miles cannot feel pain; Walt strikes once when questioned about a failed task). Rendered before everything else in every prompt and at the top of every Coach card.
- **fit** — `full | partial | not_needed`. The honest answer is sometimes that this tool is not for this person (one camper: deaf, no other disability, needed an interpreter and a different camp — he gets no profile at all), or only part of it is (Rowan: Coach and Insights yes, Composer no until a choice channel exists, because drafting "his" words before he can pick one is the facilitated-communication trap).
- **guardrails** — consent, allowed uses, max interpretations, banned phrases, "AI never speaks for person" (a literal `true` in the schema).

Lexicon meanings can carry the function **`play_or_testing`**: deliberate humor, provocation, or checking what you will do. Miles's leg-hair routine is not sensory seeking; it is a bit, aimed at people who flinch. A system that reads all behavior as need teaches the wrong lesson and is its own kind of disrespect (principle 11 in the prompt).

Every learned fact has `provenance: {source, confirmedBy, timesObserved}`. AI can only contribute `source: "ai_hypothesis"`, and only after a human approves.

## 3. Reference architecture (what's built)

```
                 ┌────────────────────────────────────────────────────┐
                 │  Partner surface (tablet/phone web UI)             │
                 │  board · interpret · compose · change · coach ·    │
                 │  story · log · review queue · patterns · profile   │
                 └───────────────┬────────────────────────────────────┘
                                 │ HTTP/JSON
┌────────────────────────────────▼────────────────────────────────────┐
│  Bridge facade (src/core/bridge.ts)                                 │
│  wires modules ↔ store; logs every proposal + decision; provenance  │
├──────────────┬──────────────┬─────────────┬────────────┬────────────┤
│ Interpreter  │ Composer     │ Anchor      │ Coach      │ Story      │
│ (in)         │ (out)        │ engine      │            │            │
│ LLM          │ LLM          │ CODE + LLM  │ LLM        │ LLM        │
│              │              │ (explain)   │            │            │
├──────────────┴──────────────┴─────────────┴────────────┴────────────┤
│ Insights: CODE (stats over event log) + LLM (hypotheses w/ tests)   │
├─────────────────────────────────────────────────────────────────────┤
│ Provider: Claude (structured outputs, cached profile prefix)        │
│           | Mock (deterministic, rule-based, no key)                 │
├─────────────────────────────────────────────────────────────────────┤
│ Store: profiles/*.json · events/*.jsonl · review/*.json · audit     │
└─────────────────────────────────────────────────────────────────────┘
```

Design rules enforced in code:
1. **Modules never call a model directly**; they describe a task + zod schema. Outputs are validated.
2. **Stable system prompt = principles + module instructions + rendered profile** → one cache prefix per person per module.
3. **The Anchor engine's timeline/cue logic has no LLM dependency** and can run on a $30 device.
4. **AI → profile only via the review queue** (`Store.applyProposal` is private and only called by `decide(approved)`).
5. **Every sent utterance logs `seeds`, `aiAdded`, `chosenBy`.** Insights flags when AI-added words outgrow the person's own.

## 4. Three deployment architectures (pick by setting)

### A. Camp / classroom kit (what the prototype is)
- One laptop/tablet per cabin or classroom running Bridge locally; profiles for each kid; staff phones hit the local server over Wi-Fi.
- Cues fire through cheap hardware: a smart bulb (light motifs), a Bluetooth speaker (sound motifs), a vibrating cushion (tactile) — driven by the anchor engine's `tick()` output. (Not built yet; the `DueCue` object is the integration point.)
- LLM calls go to Claude with the profile as a cached prefix; or, if a school forbids cloud, run mock mode for the deterministic parts and skip generation.
- Data stays on the device; export for the SLP.

### B. Clinic / school-district service
- Multi-tenant server (Postgres instead of JSON files; same Store interface). SLP owns profiles; caregivers and teachers get role-scoped partner access.
- LLM behind a BAA-covered endpoint (Claude via Bedrock/Vertex/Foundry) to satisfy HIPAA/FERPA; COPPA consent object in the profile becomes enforceable (allowedUses).
- Insights run nightly; review queue becomes the SLP's Monday-morning task; IEP goal drafts and session notes generated from logged events.
- Medicaid path: package the partner app as E2511-adjacent software riding on an existing SGD (see research doc §5).

### C. On-device family app (the cheap/free/open version)
- Phone app; profile local; small on-device model (Apple Foundation Models / Gemini Nano class) for interpret/compose with the same prompts; deterministic anchor engine; cloud model optional and off by default.
- The kid's own surface: the schedule strip on a kitchen tablet + cues on smart-home devices; composer as a symbol strip.
- This is the architecture that matches "as inexpensive as collaboratively possible and preferably free", and PRC-Saltillo's 2026 on-device move shows it's shippable now.

## 5. The sensing layer (designed, not built)

From the chat: "read externalized neural output with consumer sensors." The realistic, evidence-backed pipeline (Commalla):

1. **Capture**: phone/wearable mic records short vocalization clips on a VAD trigger; optional accelerometer for rocking/pacing.
2. **Label in the moment**: the caregiver gets a one-tap prompt ("that sounded: request / frustrated / delighted / self-talk / unsure") — this is already the *Log a moment → sound* form. In-the-moment labels are the only ground truth that works.
3. **Personalize**: per-person classifier on clip features (transfer-learned from ReCANVo-style pooled model, fine-tuned on this kid's ~100–300 labeled clips).
4. **Use**: classifier output becomes an *observation* with a probabilistic label fed to the Interpreter as context ("sound classifier: frustrated 0.7") and to Insights for time/anchor correlation. Never spoken aloud as fact.
5. **Pattern replacement / gating** (the audio-compressor idea): once early-sign signatures are learned, the anchor engine can fire a regulator cue at the *early_sign* stage. This is the highest-risk feature (could help or destabilize — Casey's own caution) and needs the therapist loop and a single-case experimental design before it's on by default.

Privacy: audio clips are biometric data under COPPA-2025; keep them on device, store only features + labels, give the family a "forget" button.

## 6. Guardrails summary (why the FC lesson is the load-bearing one)

- The message-passing test: the system must never produce content only the partner or the model could know and present it as the person's. Composer keeps seeds canonical; `keepsSeeds=false` is surfaced with a warning; authorship is logged.
- Interpretations are hypotheses with a clarifying *check* (two real choices), not conclusions. If the profile lists a response bias, the check may not be verbal yes/no: real objects in reach, or the question asked twice with the order reversed, and nothing "confirmed" by a yes gets high confidence (principle 12; enforced in the mock and tested).
- Agency is a live hypothesis. `play_or_testing` exists so the system can say "this is a joke" instead of pathologizing it.
- The tool can decline to fit. `fit.not_needed` / `fit.partial` is rendered into every prompt; principle 13 tells the model to say so rather than produce output that implies otherwise.
- No facial emotion recognition. Sound classification advisory-only, caregiver-labeled.
- No NLA "stages" hard-coded; scripts treated as meaningful units (the supported part of the GLP story).
- Banned phrases are per-profile data (A.'s "be patient"), checked in evals.
- Deficit-framing audit in evals; no diagnosis, no outcome prediction, no restrictive practice suggestions (in the principles block of every prompt).
- Consent object gates allowed uses; retention days in profile.

## 7. Evidence plan (how this becomes more than a demo)

1. **Synthetic + practitioner phase (now)**: fictional composite profiles (done), mock mode, share with practitioners; collect *their* lexicons for kids they know (anonymized) — that's the real dataset.
2. **Partner-outcome pilot**: the measurable thing is not the kid's language — it's partner behavior (AACessTalk measured guidance uptake, shift from instruction to responsiveness) and regulation events per transition. Single-case design (ABAB) per kid with a credentialed SLP/BCBA collaborator; IRB via a university partner.
3. **Metrics built in**: prompts per transition, regulation events by minutes-to-anchor, interpretation confirmation rate (top/other/none), authorship ratio, lexicon growth with provenance.
4. **Publish**: the first pediatric outcome study of a partner-side AI tool would be category-defining (research doc §6).

## 8. What's built vs. next

Built (runs today, tests + evals pass): profile schema, six modules with Claude + mock providers, store with review queue and audit, web UI, CLI, three composite profiles, 10 tests, 12-case eval harness.

Next, in order of value:
1. Run the eval harness with a real key and tune prompts (`npm run eval` with `ANTHROPIC_API_KEY`).
2. Hardware cue output from `tick()` (Home Assistant / Hue / BLE speaker).
3. Symbol-strip mode for the composer (ARASAAC symbols, free license) so the kid's surface is real.
4. Vocalization capture + labeling on a phone; per-person classifier.
5. Postgres store + roles; BAA endpoint; consent enforcement.
6. SLP exports: session note + IEP goal draft from events.
