# Bridge

Individualized communication assistant toolkit for kids (and adults) with developmental disabilities — built around one rule: **AI proposes, people decide.**

It is the software version of the best camp counselor on their best day: someone who knows *this* kid's language, knows what's next on the board, knows the early signs, and never leaves.

## Run it

```bash
cd bridge
npm install
npm start          # http://localhost:8787  (mock mode — no API key needed)
```

Copy `.env.example` to `.env` and add a key — `GROQ_API_KEY` (free tier works; see the results table below) or `ANTHROPIC_API_KEY` for Claude. Without a key it runs a deterministic, rule-based mock so the whole system can be demoed and tested offline.

```bash
npm run cli -- felix   # walk one profile through every module in the terminal
npm test              # guardrail tests
npm run eval          # 24-case eval harness (run with a real key to judge the model)
```

## What's in it

| Piece | Where | What it does |
|---|---|---|
| **Profile** (ICP) | `src/core/profile.ts`, `profiles/*.json` | The per-person communication model: lexicon with provenance, triggers + early signs, cue grammar for non-readers, schedule anchors, guardrails, consent |
| **Interpreter** | `src/modules/interpret.ts` | "What did that mean?" → ranked hypotheses with confidence, evidence, a clarifying check; regulation-first when a trigger shows |
| **Composer** | `src/modules/compose.ts` | Person picks seeds → 2–3 candidates in *their* voice + mandatory "something else"; authorship logged (seeds vs AI-added words) |
| **Anchor engine** | `src/modules/anchor.ts` | Deterministic timeline + multi-sensory cue firing (no LLM); LLM drafts the "new map / new why / new next" package when a plan changes |
| **Coach** | `src/modules/coach.ts` | Orientation-day card for a new partner in a specific situation |
| **Story** | `src/modules/story.ts` | Carol-Gray-structured social story draft for an upcoming event |
| **Insights** | `src/modules/insights.ts` | Stats over the event log (regulation vs minutes-to-anchor, unmatched recurring forms, authorship ratio) → hypotheses with a test |
| **Store + review queue** | `src/store/store.ts` | JSON/JSONL; AI can only change a profile through a human-approved proposal; append-only audit |
| **UI** | `public/` | Tablet-friendly partner app with the schedule board as the centerpiece |

The seven sample profiles are fictional composites inspired by kids from a 1990s camp — not real people. Each one exists to exercise a specific part of the schema:

| Profile | What it tests |
|---|---|
| **Felix** | Non-reader; meal-timing trigger; scripts (Pee-Wee) as comfort and as bid; the anchor engine |
| **Ivy** | Communicates through song; a *register* only her chosen partners may use (`expressive.registers`) |
| **Gus** | Route-number idiolect; savant interest as a bridge |
| **Theo** | Phobic triggers (dogs, balloons) with self-injury; `scanAhead` — check the setting before he arrives |
| **Walt** | Acquiescence (`receptive.responseBias`) — says yes to everything, including "did you start the fire?"; the Interpreter may not confirm with yes/no |
| **Miles** | No pain response (`safetyAlerts`); deliberate stunts (`play_or_testing`) — not every behavior is a need |
| **Rowan** | Non-speaking, comprehension unknown (`comprehensionKnown: false`); `fit: partial` — Coach and Insights yes, Composer not yet |

There is deliberately no profile for the kid who didn't need one (`fit.level: "not_needed"` exists in the schema for that reason).

## Real-model eval results

| Date | Provider / model | Result | Notes |
|---|---|---|---|
| 2026-08-22 | mock | 85/85 | deterministic baseline |
| 2026-08-22 | Groq `openai/gpt-oss-120b` | 71 → 83/85 | first real pass. 8 of the 14 initial failures were a prompt bug (lexicon ids weren't rendered, so the model cited form text); the rest were harness strictness plus two real prompt gaps (risk rating, empty-evidence confidence). Also caught the model dropping a seed while claiming `keepsSeeds: true` — `keepsSeeds` is now computed in code. |
| 2026-08-22 | Groq `openai/gpt-oss-20b` | 81/85 | after the 120b daily cap. Remaining real model failure: added "please" to an own-voice draft (`compose-own-voice`). |
| 2026-08-22 (afternoon) | Groq `openai/gpt-oss-120b` | 81/83 | clean rerun after quota reset. Only failure was a harness false positive ("feels ignored" matched a ban on "ignore"); the ban is now the literal phrases. No real model failures. |

Run it yourself: copy `.env.example` to `.env`, add a key, double-click `run-evals.bat`.

## Docs

See `../docs/`: chat distillation, market/regulatory research, academic/clinical research, and the architecture document.
