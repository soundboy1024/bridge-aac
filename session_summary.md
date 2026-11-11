# Session log — Bridge

## Session 3 — Aug 22–24, 2026: publish prep

Goal shifted from building to making the repo safe and legible to post publicly as a pre-beta research prototype.

- **Clean confirmation run on Groq `gpt-oss-120b` after the daily quota reset: 81/83, zero real model failures.** The one miss was the harness banning the substring "ignore" and catching the model saying a kid "feels ignored" — a legitimate reading straight from his profile. The ban is now the literal phrases ("ignore it/him/her"). With that, the prompts are considered validated on a real open-weight model; the only genuine model failure ever observed remains `gpt-oss-20b` adding "please" to an own-voice draft (120b doesn't).
- **Root `README.md` rewritten as the public front door**: pre-beta status banner up top (no real profiles, no real users, never used with a real person), what the ICP and the modules are, what's been done, an honest gap list with "practitioner eyes on the profile schema" as the #1 ask, and disclaimers (MIT; not a medical device, not a product, not clinical advice).
- **Composite profiles renamed to fully fictional names** — the originals carried the real first names of kids from camp. All seven were renamed (Theo, Walt, Miles, Rowan, Felix, Gus, Ivy) across 21 files with the profile JSONs renamed in git. Two sweep casualties caught by typecheck and review: zod `.max()` briefly became `.gus()`, and the ERIC database URL briefly became `files.theo.ed.gov`. All tests (15/15) and mock evals (85/85) pass post-rename; a full-repo grep confirms no old names remain in tracked files.
- Still open before posting: staff names in the profiles (Dev, Lena, Jo, Dana) are unverified as fictional; no GitHub remote exists yet; consider whether one or two identifying details (pain insensitivity + the fire-marshal story) should be blurred further.

## Session 2 — Aug 21–22, 2026: camp composites and the first real-model evals

*Starting point: Casey added `Camp.txt` — memories of the kids from summer camp, 1989–1998 (kept local, gitignored).* 

**Schema grew to cover what the camp stories demanded.** New in the ICP: `responseBias` (a "yes" that is social glue, not agreement — the fire-marshal lesson), `play_or_testing` as a lexicon function (not every behavior is a need; some of it is humor or provocation, and treating agency as distress is its own disrespect), `scanAhead` triggers (see the dog before he does), restricted `registers` (only chosen partners may sing with her), top-level `safetyAlerts`, `comprehensionKnown`, and `fit` (the tool must be able to say "I don't fit this person"). Prompt principles 11–13 encode these.

**Four new composite profiles** built from the camp stories, each exercising one of those features: **Theo** (phobic triggers, self-injury, scan-ahead), **Walt** (acquiescence — only actions and object choices count as answers), **Miles** (congenital pain insensitivity + deliberate stunts), **Rowan** (non-speaking, comprehension unknown, `fit: partial` — the Composer is explicitly off until a choice channel is established). Seven profiles total, 15/15 tests, 24 eval cases.

**The evals ran against real models for the first time** (Groq, free tier: `gpt-oss-120b` and `-20b`). First pass 71/85; final clean rerun **81/83 with zero real model failures** (the one miss was a harness false positive). What the real model caught that the mock never could:

- The lexicon ids weren't rendered into the prompt, so the model couldn't cite evidence — 8 of the first 14 failures were this one prompt bug.
- **The Composer dropped a seed word from a kid's message and still reported `keepsSeeds: true`.** That is the facilitated-communication failure mode in miniature. `keepsSeeds` is now computed in code from the seeds; the model's claim is ignored.
- Empty-evidence interpretations kept arriving at medium confidence — now forced to low in code.

Pattern worth keeping: every fix moved a guarantee **from prompt to code**. Also built: Groq provider with rate-limit pacing, `.env` loading, `run-evals.bat` one-click runner, results table in `bridge/README.md`.

**Where it stands after this session:** the prompts are validated on a real open-weight model; the repo is close to publishable (license, gitignores, and disclaimers in place). Open items before posting publicly: rename the composite profiles (they carry the real first names of kids from camp) and add the how-to-help framing. The actual next step is unchanged from session 1: real profiles from real practitioners.

---

## Session 1 — Aug 21, 2026: research and prototype

*One autonomous session, starting from two text files: the original "Recodified Theory" (ASLT) notes and a Gemini chat log from Casey's early AI days. Numbers below (3 profiles, 45/45 mock checks, no real model calls) describe the repo as of end of session 1 — see session 2 above for current state.*

**What this is:** a set of ideas, a research pass, and a working prototype for individualized AI communication assistants for kids with autism, savant syndrome, and other developmental disabilities — the kids Casey worked with at summer camp, 1989–1998.

**What this is not:** a product. The point is to get the ideas, the evidence, and a runnable reference into the world so people who actually serve these kids — SLPs, camp staff, teachers, parents, open-source builders — can take whatever is useful. Everything here should be read in that spirit: open, cheap-or-free, no lock-in, no new screen in front of the kid.

---

## 1. The core idea, in one paragraph

What worked for A. at camp wasn't the picture schedule. It was a person who knew his language standing next to it every time. That person doesn't scale. The whole AAC industry is trying to make the *kid's device* smarter; almost nobody is trying to make *the person next to the kid* as good as the best counselor on their best day. Bridge is that: a per-person, human-curated communication model (the "profile" — the machine-readable version of orientation day) plus narrow AI tools that read it, **propose**, and never decide. Plus one piece that must never be AI: the schedule/anchor engine, because for a kid like A., reliability *is* the feature.

## 2. What the research found

Two parallel research sweeps (market/regulatory and academic/clinical); full reports in `docs/02` and `docs/03`.

- **No vendor ships child-safe LLM generation in AAC.** Tobii Dynavox and AssistiveWare have no LLM features; Smartbox gates AI voices to 18+; PRC-Saltillo's 2026 AI is on-device editing/translation only. The space is open — and it is open *for a reason* (liability, authorship risk), which is why the guardrails below matter more than the models.
- **Coaching the partner is the highest-evidence lever.** AACessTalk (CHI 2025): LLM prompts in front of parents of minimally-verbal kids shifted parents from instructing to responding. No vendor sells this. It's also exactly what Casey's "everyone learns each kid's trigger words on day one" memory describes.
- **Facilitated communication / RPM is the load-bearing warning.** An LLM that expands two taps into a paragraph is structurally a facilitator. Authorship research (Valencia 2023; "I, Robot" 2026) shows AAC users reject output that "doesn't sound like me." So *provenance* and *AI never speaks for the person* have to be in the architecture, not in a policy doc.
- **Per-person vocalization models work, as hints.** MIT's ReCANVo/Commalla line: caregiver-labeled, in-the-moment labels, per-person classifiers; honest output is a probabilistic hint to a partner, never a translation.
- **The "personal predictive model" idea has theory behind it** — predictive coding / insistence on sameness, monotropism. The camp observation (meltdowns cluster around *waiting for* the anchor, not the activity) matches.
- **Savant syndrome specifically: zero AI literature.** Treffert's work says language is usually the impaired domain even in savants; the skill domain is a high-bandwidth channel. So interests (route numbers, songs) are *bridges*, not distractions — and AAC fundamentals still apply.
- **Gestalt language processing / NLA**: the "stages" aren't evidence-based, but echolalia *is* functional. Treat scripts as meaningful units; don't hard-code stages.
- **Regulatory**: COPPA 2025 counts child voice as biometric and requires separate consent for AI use; EU AI Act Annex III high-risk rules deferred to Dec 2027; Medicaid code E2511 is the reimbursement path if anyone ever wants one. Roughly a 16-month window in which good practice gets set by whoever shows up.

## 3. What got built — `bridge/`

TypeScript / Node 22, ~2,000 lines. Runs fully offline in a deterministic **mock mode** (no API key); switches to Claude when `ANTHROPIC_API_KEY` is set. Typecheck clean, 10/10 tests, 45/45 eval checks in mock mode.

**The Individual Communication Profile** (`src/core/profile.ts`) — the central object. Lexicon entries with provenance and `doNotInterpretAs` (the "not defiance" list); sensory triggers with *early signs*; cue grammar for non-readers (wood-block taps, chime, napkin stack); schedule anchors (fixed and relative); banned phrases ("be patient"); consent and allowed uses. Three fictional composites: **Felix** (non-reader, meal-timing trigger, Pee-Wee scripts), **Ivy** (communicates through song, "unchosen singer" trigger), **Gus** (route-number idiolect, DETOUR card).

**Six modules:**

| Module | What it does | AI? |
|---|---|---|
| Interpreter | Observation → ranked hypotheses with confidence, evidence, and a two-choice clarifying check. Regulation first if a trigger is active. | LLM |
| Composer | Kid picks seed words → ≤3 drafts in *their* voice + a mandatory "something else." Logs seed words vs. AI-added words. | LLM |
| Anchor engine | Timeline, lead-time cue firing, plan changes. The "new map / new why / new next" message is drafted by the LLM; the timeline never is. | Code + LLM |
| Coach | Partner card: headline, do/don't, opening line, wait time, bridges, if-it-goes-sideways. | LLM |
| Story | Carol Gray-style social story with sentence-type ratio checks. | LLM |
| Insights | Stats over the event log (regulation by minutes-to-anchor, by hour, authorship ratio) + hypotheses *with a way to test each one*. | Code + LLM |

**Guardrails enforced in code, not prose:**
- The only path AI content takes into a profile is a human approving it in the review queue (`Store.applyProposal` is private).
- Every sent utterance logs `seeds`, `aiAdded`, `chosenBy`. Insights flags when AI-added words outgrow the kid's own.
- Stable system prompt = principles + module instructions + rendered profile (one cache prefix per kid per module). Nothing trains on child data.
- Append-only audit log.

**Surfaces:** tablet web UI (picture-board strip with a "now" marker is the centerpiece; tabs for each module, review queue, patterns, profile), CLI that walks a kid through a day, REST API, eval harness.

**Architecture doc** (`docs/04-architecture.md`): thesis, profile design, reference diagram, three deployment shapes — camp/classroom kit (the prototype), clinic/district service, on-device family app (the free one) — the sensing-layer design, and an evidence plan.

## 4. Running it

```
cd bridge
npm install
npm start          # http://localhost:8787 — set the clock to 11:50, watch the lunch cue fire
npm run cli -- felix
npm test
npm run eval       # with ANTHROPIC_API_KEY set, this is the run that actually matters
```

`BRIDGE_PROVIDER=mock|claude`, `BRIDGE_MODEL` override. `git init` was run in `bridge/`; nothing committed yet.

## 5. Honest caveats

- **No real model calls were made this session.** Every pass is against the rule-based mock. The prompts are untested against Claude; the eval harness exists for exactly that.
- The three profiles are fiction assembled from camp memories. Real lexicons from real practitioners are the actual dataset, and there are none yet.
- Hardware cues, symbol strips (ARASAAC), and audio capture are designed, not built.
- Casey is not a clinician. Nothing here is an intervention until an SLP/BCBA says it is.

## 6. If the goal is getting ideas out, not shipping

Ordered by leverage for that goal specifically:

1. **Write the thesis up as a short, readable piece** — the "person next to the kid" framing, the FC lesson, the anchor-not-AI rule — and put it where AAC people read (AssistiveWare community, r/slp, ISAAC, the AAC Language Lab crowd). The architecture doc is the long version; it needs a 900-word version.
2. **Open-source the repo** with a permissive license and a clear "not a medical device, not a product" README. Commit what's here.
3. **Put the profile schema forward on its own.** An open, human-readable "Individual Communication Profile" format — orientation day as a JSON file — is useful to people even if they never run the code. That's the most portable idea in the project.
4. **Run the evals with a real key** and publish the results, good and bad. Untuned prompts shared honestly are more useful to the field than tuned ones kept private.
5. **Show it to practitioners.** Ask one question: "for a kid you know, what would the profile need to say?" Their answers are the next version.
6. Then, if anyone wants to carry it further: symbol-strip composer, cue hardware from `tick()`, vocalization labeling, a single-case pilot with a credentialed collaborator.

## 7. Files

```
README.md                          index
session_summary.md                 this file
docs/01-chat-distillation.md       the original ideas, anecdotes, values, open questions
docs/02-research-market-regulatory.md
docs/03-research-academic-clinical.md
docs/04-architecture.md
bridge/                            prototype (see bridge/README.md)
```
