# Bridge — individualized AI communication assistants

> **Status: pre-beta / research prototype.** No real profiles, no real users, never used with a real person. Every sample profile is a fictional composite. The code runs and the evals pass, but the thing this project actually needs — real communication data from real practitioners — does not exist yet. Read everything below in that light.

## What this is

Some kids communicate in ways most people can't read: a bell rung twice, a wrist bite, a "yes" that means *hello* rather than *yes*, a song lyric that means *I'm overwhelmed*. The people who can read that code — a parent, a one-to-one aide, a counselor after a full summer — carry it in their heads, and it leaves when they do.

Bridge is a way to write that code down and put it to work. It has two parts:

1. **The Individual Communication Profile (ICP)** — a structured, human-curated JSON document that captures one person's communication system: what their forms mean (with provenance — who confirmed it, how many times observed), what *not* to read into them, triggers and early signs, schedule anchors, trusted people, safety alerts, and hard guardrails (banned phrases, response biases, whether each tool even fits this person). This is orientation day as a file. It is useful even if you never run the code.

2. **Narrow AI tools that read the profile and help the adult next to the kid** — never the kid's voice, never the decision-maker:
   - **Interpreter** — observation in, ranked hypotheses out, each citing profile evidence, with a concrete clarifying check the partner can do
   - **Coach** — a one-card briefing for a new staffer or volunteer meeting this person for the first time
   - **Anchor engine** — schedule timeline and change-warning cues; deliberately **not** AI, because for these kids reliability is the feature
   - **Composer** — drafts messages only from words the person actually chose, and verifies in code that no words were added or dropped
   - **Story / Insights** — social-story drafts and pattern analysis over the event log

The one rule everywhere: **AI proposes, people decide.** The AI can never modify a profile (human review queue only), never speaks as the person, and its confidence is capped in code when it has no evidence. The facilitated-communication disaster is the load-bearing lesson of this design; see `docs/03`.

## What's been done so far

- **Research** (Aug 2026): market/regulatory sweep and academic/clinical sweep — no AAC vendor ships child-safe LLM generation; partner coaching is the highest-evidence lever; FC/RPM authorship risk shapes the guardrails. `docs/02`, `docs/03`.
- **Architecture** (`docs/04`): the thesis, the profile schema, three deployment shapes, an evidence plan.
- **Working prototype** (`bridge/`): TypeScript/Node, ~2,500 lines. Web UI, CLI, REST API, review queue, audit log. Runs fully offline in a deterministic mock mode.
- **Seven fictional composite profiles** exercising specific schema features: phobic triggers with scan-ahead, acquiescence bias ("says yes to anything"), deliberate behavior that isn't a need, unknown comprehension with partial tool fit, restricted communication registers.
- **Eval harness, run against real models** (Aug 22): 24 scenarios, 83–85 automated checks. Groq `gpt-oss-120b` passes everything after fixes; the first real-model pass caught genuine safety bugs (the model dropped a word from a kid's message while claiming it hadn't — that check is now computed in code, not trusted from the model). Full results table in `bridge/README.md`.

## What it needs to be useful

This is the honest gap list, in order:

1. **Practitioner eyes on the profile schema.** If you're an SLP, BCBA, special-ed teacher, AAC specialist, or the parent of a kid like this: does the ICP capture what orientation day actually needs to say? What's missing? What's wrong? Open an issue — a paragraph of "for a kid I know, it would need X" is the single most valuable contribution possible right now.
2. **Real profiles, kept local.** The format is designed so a family or classroom can write one and run everything on their own machine. Nothing here phones home; nothing trains on the data.
3. **Clinical review.** The author is not a clinician. Nothing here is an intervention until credentialed people say it is.
4. Symbol-strip support (ARASAAC), audio/vocalization labeling (ReCANVo-style), cue hardware — designed, not built.

## Run it

```bash
cd bridge
npm install
npm start            # http://localhost:8787 — mock mode, no API key needed
npm run cli -- felix  # walk one profile through every module in the terminal
npm test
npm run eval         # add a key (see bridge/.env.example) to judge a real model
```

## Repository map

| Path | What |
|---|---|
| `bridge/` | The prototype — see `bridge/README.md` for modules, profiles, and eval results |
| `docs/01-chat-distillation.md` | The original ideas, anecdotes, and values this grew from |
| `docs/02-research-market-regulatory.md` | Who ships what; COPPA/FERPA/FDA/EU AI Act; funding paths |
| `docs/03-research-academic-clinical.md` | LLM-AAC research, FC/RPM lesson, GLP/echolalia, design do's and don'ts |
| `docs/04-architecture.md` | The thesis, the ICP schema, reference architecture, evidence plan |
| `session_summary.md` | Running log of what was built, when, and what was learned |

## License and disclaimers

MIT — take anything useful. **Not a medical device. Not a product. Not clinical advice.** The sample profiles are fictional composites inspired by kids the author worked with at a summer camp in the 1990s; no real person's data is in this repository.
