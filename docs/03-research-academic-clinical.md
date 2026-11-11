# AI Communication Assistants for Special-Needs Children: Academic and Clinical Landscape (as of Aug 2026)

Scope note: web search and arXiv/ACM/Nature sources carried most of the weight. Citations are author/venue/year with URLs; a few details (e.g., exact page numbers) were not verified.

---

## 1. LLMs for AAC

### Foundational systems

**KWickChat** — Shen, Yang, Scholz, Kristensson et al., *IUI 2022* (Cambridge). GPT-2-based multi-turn dialogue system: user enters a bag of keywords, the system generates full candidate sentences using dialogue history plus "persona tags" about the user. Simulation showed large keystroke savings; the central tradeoff identified was *keystroke savings vs. semantic fidelity to the user's intent*. https://dl.acm.org/doi/10.1145/3490099.3511145 (code: https://github.com/CambridgeIIS/KWickChat)

**"The less I type, the better"** — Valencia, Cave, Kallarackal, Seaver, Terry, Kane, *CHI 2023* (Google). 12 AAC users tested live LLM suggestions in three scenarios (extending short replies, biographical questions, requesting help). Key findings: users valued speed and reduced effort, but repeatedly flagged that suggestions did not "sound like me," that expanded text could over-commit them to meanings they did not intend, and that reviewing/editing suggestions is itself costly. They wanted control over *when* AI intervened and *how much* it added; the paper frames LLMs as able to both enhance and impede communication. https://dl.acm.org/doi/10.1145/3544548.3581560

**SpeakFaster** — Cai, Venugopalan, Seaver, Tomanek, Kane, Morris et al., *Nature Communications* 2024 ("Using large language models to accelerate communication for eye gaze typing users with ALS"). Fine-tuned LLM expands abbreviations (word initials) into full phrases using conversation context; 57% motor-action savings in simulation; 29–60% faster text entry in lab/field tests with two eye-gaze users with ALS. A companion paper shows parameter-efficient tuning makes per-user personalization scalable (Cai et al., arXiv 2312.14327). https://www.nature.com/articles/s41467-024-53873-3 ; https://arxiv.org/abs/2312.01532

Related: "Adapting Large Language Models for Character-based AAC" (arXiv 2501.10582, 2025) — character-level LLMs for scanning/letter-based interfaces. https://arxiv.org/html/2501.10582v1

### 2024–2026 follow-ups and the agency/authorship turn

**"I, Robot? Exploring Ultra-Personalized AI-Powered AAC; an Autoethnographic Account"** — *CHI 2026* (arXiv 2509.13671). An AAC user logged 7 months of his own communication, fine-tuned a model on it, then used it daily for 3 months. Of 6,564 messages, only 153 suggestions were accepted. Logging reshaped his sense of agency; training "selectively amplified or muted aspects of his identity"; suggestions "resurfaced private details outside their original context." Core claim: personalization continually renegotiates agency, identity and privacy. https://arxiv.org/abs/2509.13671 ; https://dl.acm.org/doi/10.1145/3772318.3790310

**"It's Complicated: On the Design and Evaluation of AI-Powered AAC Interfaces"** — Frisch et al. (Michigan Tech, Smartbox, OHSU, MIT), *Speech AI for All workshop, CHI 2026* (arXiv 2606.24854). Proposes six evaluation domains (speed/accuracy, effort, voice/identity, code- and context-switching, turn-taking fluency, adaptation to changing needs) and warns "an AI system may be successful by the developer's metrics while failing the user's sense of self." Recommends semantic-similarity metrics plus correction tracking, diary/longitudinal studies, participatory design. https://arxiv.org/html/2606.24854v1

**"Aging Up AAC"** — arXiv 2404.17730 (2024–25): autistic adults' AAC apps are designed for children; LLM word prediction is one of several needs. https://arxiv.org/html/2404.17730

**"Evaluating Human-LLM Representation Alignment: Affective Sentence Generation for AAC"** — arXiv 2503.11881 (2025): LLM-generated emotional sentences for autistic adult AAC users diverge from how users themselves would represent affect. https://arxiv.org/pdf/2503.11881

**"Design Probes for AI-Driven AAC: Complex Communication Needs in Aphasia"** — arXiv 2504.09435 (2025). https://arxiv.org/html/2504.09435v1

**"Me, Myself, and My Voice"** (arXiv 2605.24337, 2026) — cultural/linguistic identity in AI-generated AAC voices; "One Does Not Simply 'Mm-hmm'" (arXiv 2506.17890, 2025) — backchanneling in AAC micro-culture. https://arxiv.org/pdf/2605.24337 ; https://arxiv.org/pdf/2506.17890

**"Authorship Drift"** — *CHI 2026* (KIXLAB), N=302 general-population writers: self-efficacy falls and trust in AI rises across turns, and authorship drifts from human to AI; passive editors lose the most. Not AAC-specific, but directly relevant to children who may never have had un-assisted authorship. https://dl.acm.org/doi/10.1145/3772318.3790276

**Autism-specific LLM comms work**: Jang, Moharana, Carrington, Begel, "It's the only thing I can trust," *CHI 2024* — 11 autistic adults preferred a GPT-4 bot over a (disguised) human for workplace-communication advice, but a job coach judged some advice questionable and the authors warn off-the-shelf LLMs may "encourage masking" and overlook neurodivergent styles. https://dl.acm.org/doi/10.1145/3613904.3642894 . TwIPS (arXiv 2407.17760, 2024) — LLM texting app that previews how a message may be read and explains tone of incoming messages. https://arxiv.org/pdf/2407.17760

**AACessTalk** — Choi, Park, Lee, Hong, Kim, *CHI 2025*. Tablet for minimally verbal autistic children and parents: turn-passing button; during parent turns it shows evidence-based (Hanen, PCIT-derived) conversational guides; during child turns it recommends AI-generated AAC cards (Topic/Action/Emotion/Core). 11 dyads, 2-week home deployment, 232 sessions; parents used guidance in 78% of turns, shifted from instruction to empathy-based exchange, and reported lower pressure on speech production. Design lessons: balance agency across the dyad, delay corrective feedback, keep a "refresh" so the child can reject AI options. https://arxiv.org/html/2409.09641v4

Also: Fontana et al. (UbiComp Companion 2024) — ChatGPT-3.5 vocabulary generation for SLP-built AAC boards improved topic-relevant vocabulary; "Just-in-Time Programming for Visual Scene Displays" with generative AI (arXiv 2408.11137). https://dl.acm.org/doi/10.1145/3675094.3677573 ; https://arxiv.org/pdf/2408.11137

---

## 2. ML on nonverbal / atypical vocalizations and atypical-speech ASR

**ReCANVo** — Johnson, Narain, Quatieri, Maes, Picard, *Scientific Data* 2023. >7,000 real-world vocalizations from 8 minimally speaking individuals (autism, CP, genetic syndromes), labeled *in the moment by a family member* into communicative/affective categories (e.g., frustrated, delighted, request, self-talk, dysregulated) plus per-participant communication profiles. Largest dataset of its kind; still the reference dataset in 2026. https://www.nature.com/articles/s41597-023-02405-7 ; data: https://zenodo.org/records/5786860

**Commalla project (MIT Media Lab)** — the umbrella for ReCANVo. Key methods papers: Narain et al., "Personalized Modeling of Real-World Vocalizations from Nonverbal Individuals," *ICMI 2020* (first end-to-end collect/label/classify pipeline; personalized per-individual models clearly outperform pooled ones); "Transfer Learning with Real-World Nonverbal Vocalizations from Minimally Speaking Individuals," *ICML IMLH workshop 2021*; and "Zero-Shot Transfer Learning ... using Naturalistic Data." https://dl.acm.org/doi/10.1145/3382507.3418854 ; https://www.media.mit.edu/projects/commalla/publications . Design takeaways from this line: (a) the informative categories are *per person* and defined by the caregiver; (b) in-the-moment caregiver labeling is the only workable ground truth; (c) small per-person datasets plus transfer learning are the realistic regime; (d) the output is a *probabilistic hint to a partner*, not a translation.

**INSENSION** — Slapničar et al., *Advanced Intelligent Systems* 2025: multimodal (face, gesture, vocalization, physiology) system for people with profound intellectual and multiple disabilities, built on individualized behaviour profiles because "standard assistive technologies [are] infeasible due to lack of personalization." https://onlinelibrary.wiley.com/doi/10.1002/aisy.202400925

**Vocal-marker generalization warning** — Rybner et al., *Autism Research* 2022: published ML "vocal markers of autism" generalize poorly across tasks and languages. Any claim that a model "detects" autistic affect/state should be treated as fragile out of distribution. https://onlinelibrary.wiley.com/doi/10.1002/aur.2721

**Related developmental evidence**: Suswaram & Muller, *Autism Research* 2025 — motor and communication skills are linked in minimally speaking autistic children (US and India), supporting the idea that motor load of an interface matters. https://onlinelibrary.wiley.com/doi/10.1002/aur.70033

### Atypical-speech ASR

**Project Euphonia** — Martin, MacDonald, Jiang et al. (Google), *Frontiers in Language Sciences* 2025: ~1.5M utterances from ~3,000 speakers; personalized ASR can beat human transcribers for disordered speech; expansion to Spanish/French/Japanese/Hindi; Gemini-Nano-based "meaning preservation" rater at ~0.89 AUC. The paper does not cover children or autism. https://www.frontiersin.org/journals/language-sciences/articles/10.3389/flang.2025.1569448/full

**Speech Accessibility Project (UIUC + Amazon/Apple/Google/Meta/Microsoft)** — *Interspeech 2025 Challenge* (arXiv 2507.22047): 400+ hours, 500+ speakers (Parkinson's, ALS, CP, Down syndrome, stroke); best WER 8.11%, best semantic score 88.4%; 12 of 22 teams beat Whisper-large-v2. Notably the challenge scores a *semantic* metric, not just WER. https://arxiv.org/pdf/2507.22047

**On-the-fly personalization** — "State-of-the-Art Dysarthric Speech Recognition with MetaICL" (arXiv 2509.15516, 2025): in-context adaptation from a few user examples without fine-tuning. https://arxiv.org/html/2509.15516v1

**Voiceitt** — commercial personalized ASR for nonstandard speech (needs ~200 recordings per user; Amazon-backed; US patent on speaker embeddings). Mostly grey literature rather than peer-reviewed papers. https://www.voiceitt.com/ ; https://www.amazon.science/latest-news/voiceitt-extends-the-voice-revolution-to-people-with-nonstandard-speech

**Child-speech gap** — "Multimodal LLMs are not all you need for Pediatric Speech Language Pathology" (arXiv 2604.26568, 2026) and a Stanford *EMNLP 2025* study found 15 frontier models (GPT-4 variants, Whisper, Gemini, Qwen) perform poorly out of the box on pediatric speech-evaluation tasks; fine-tuned open models improved. ChildVox (arXiv 2605.29257, 2026) benchmarks audio-LLMs on childhood sound. https://arxiv.org/pdf/2604.26568 ; https://ed.stanford.edu/news/how-ai-could-transform-speech-therapy-children

---

## 3. Autism communication science relevant to design

**Gestalt language processing / Natural Language Acquisition (Blanc).** Highly popular among SLPs and parents on social media; evidence base is weak. Hutchins, Knox & Fletcher, *Autism & Developmental Language Impairments* 2024: "gestalt language processor" is definitionally troubled, the stage model is implausible, and recommended supports lack evidence. https://journals.sagepub.com/doi/full/10.1177/23969415241249944 . A linguist's critique (2024) calls the theory "essentially atheoretical"; ASHA *Perspectives* 2025 published Blanc's rebuttal and a response ("Concerns and Common Ground"). https://pubs.asha.org/doi/10.1044/2025_PERSP-25-00055 . Westby, *Word of Mouth* 2025, "Reflections on GLP." **Design implication:** do not hard-code NLA "stages" into an assistant; do support what *is* supported — treating echolalia as meaningful.

**Echolalia and scripting.** Functional-echolalia work (Frontiers in Psychology 2023, "Functional echolalia in autism speech") found essentially all echolalic use in their autistic sample was functional and understood by familiar partners; reviews report ~85% of echolalic utterances serve a communicative function (requesting, protesting, turn-taking, self-regulation). https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1010615/full . Practical upshot: a child's scripts (movie lines, stock phrases) are a personal lexicon whose *meaning is idiosyncratic and context-bound*; a personalized model can learn the mapping from the caregiver, a generic LLM cannot.

**PECS, core vocabulary, aided language stimulation.** PECS retains moderate evidence for initiating requests; a 2023 systematic review found *no* empirical evidence that a core-vocabulary approach per se improves outcomes (ASHA Evidence Map summary), while aided language modeling paired with systematic instruction "may lead to gains" for some minimally speaking preschoolers. A 2025 meta-analysis (PubMed 38848009) found NDBIs plus aided AAC improve language but few studies integrate them. Commenting is under-targeted relative to requesting (AAC journal 2025 systematic review). https://apps.asha.org/EvidenceMaps/Articles/ArticleSummary/cbca97c0-a248-f011-8159-005056834e2b ; https://pubmed.ncbi.nlm.nih.gov/38848009/ ; https://www.tandfonline.com/doi/full/10.1080/07434618.2025.2477694

**Presuming competence vs. verifying authorship: the FC/RPM/S2C/Spellers line.**
- Schlosser, Hemsley, Shane et al., *Review Journal of Autism and Developmental Disorders* 2019: systematic review of RPM found zero eligible studies ("empty review"). https://link.springer.com/article/10.1007/s40489-019-00175-w
- Jaswal et al., *Scientific Reports* 2020 (eye-tracking of letterboard users) is the main pro-authorship study; critiqued by Beals and Vyse for board movement confounds and lack of message-passing controls. https://www.nature.com/articles/s41598-020-64553-9 ; https://skepticalinquirer.org/exclusive/of-eye-movements-and-autism-the-latest-chapter-in-a-continuing-controversy/
- Schlosser, Shane, Bryant, Beals et al., *RJADD* 2026: "Systematic Review of Authorship in RPM, S2C and Variants" — no controlled authorship studies exist. https://link.springer.com/article/10.1007/s40489-026-00569-7
- ASHA maintains its position against RPM/S2C; the 2025 ASHA convention review presentation drew an open letter from 13 pro-S2C researchers (the "whole-body apraxia" argument). https://www.facilitatedcommunication.org/blog/asha-2025-the-empty-review-of-fcrpms2cspellers-method-and-its-aftermath ; https://www.wbur.org/cognoscenti/2026/06/23/upward-bound-spellers-method-asha-rpm-nonverbal-autism-micha-boyett
- Also, "The Telepathy Tapes" (2024–25 podcast) popularized S2C with paranormal claims; Science-Based Medicine and ASAT responses. https://sciencebasedmedicine.org/decision-against-spelling-to-communicate-a-small-victory-for-science/

**Why this matters for AI:** an LLM that expands two taps into a fluent paragraph is structurally a facilitator. The literature's test is *message passing*: can the child convey information the facilitator (here, the model and the prompting adult) did not have? An assistant should be built so that claim is checkable.

**Double empathy problem (Milton 2012; "Ten years on," *Autism* 2022)** and **Crompton et al., *Nature Human Behaviour* 2025** (N=311 diffusion chains): autistic and non-autistic people transfer information equally well; mixed-neurotype pairs have lower rapport; disclosure improves rapport. Marocchini & Baldin, *IJLCD* 2024 — autistic focus groups describe cross-neurotype pragmatics as bidirectional. Wanigasekera et al., *Autism Research* 2025 meta-analysis — non-autistic observers form less favourable first impressions of autistic people. https://www.nature.com/articles/s41562-025-02163-z ; https://journals.sagepub.com/doi/10.1177/13623613221129123 ; https://onlinelibrary.wiley.com/doi/10.1111/1460-6984.13095 ; https://onlinelibrary.wiley.com/doi/10.1002/aur.70019 . Implication: the partner, not only the child, is a target for support (AACessTalk's design is a direct application).

**Monotropism** (Murray, Lesser, Lawson, *Autism* 2005; revived 2020s): attention concentrates on few channels at a time; interruptions and multi-channel demands are costly; deep interests are an engagement route. https://journals.sagepub.com/doi/10.1177/1362361305051398 ; https://monotropism.org/murray-lesser-lawson/

---

## 4. AI for social-communication coaching

**Social-story generation.** SS-GEN (arXiv 2406.15695, 2024/25): framework plus constraint-based evaluation to generate Social Stories with LLMs under Carol Gray's structural rules; AutiHero (arXiv 2509.17608, 2025): parents co-create personalized multi-path social narratives with an LLM; an ERIC case study (2025) of one autistic teen using ChatGPT for story creation over 15 months. Evidence is feasibility/acceptability level, not outcome trials. https://arxiv.org/abs/2406.15695 ; https://arxiv.org/pdf/2509.17608 ; https://files.eric.ed.gov/fulltext/EJ1475895.pdf

**Conversational agents / LLM coaching.** Jang et al. CHI 2024 (above); "Reimagining Support: autistic individuals' visions for AI in coping with negative self-talk" (arXiv 2503.17504, 2025); "LLM-simulated immersive spaces for traffic social affordances" (arXiv 2502.03447, 2025); "Strategy-Aware Agent Framework for Autism Intervention based on Real Clinical Dataset" (arXiv 2605.02916, 2026); "Human–AI Alignment of Multimodal LLMs with SLPs in Parent–Child Interactions" (arXiv 2506.05879, 2025) — MLLMs only partially agree with SLP judgments of interaction quality. https://arxiv.org/html/2503.17504v1 ; https://arxiv.org/pdf/2502.03447 ; https://arxiv.org/pdf/2605.02916 ; https://arxiv.org/html/2506.05879v2

**Bias in LLMs about autism.** "'As an Autistic Person Myself': The Bias Paradox Around Autism in LLMs," *CHI 2025* — ChatGPT alternates between diversity rhetoric and deficit framing. Multi-agent simulations (arXiv 2601.15437, 2026) find implicit deficit perspectives; SIGDIAL 2025 paper on LLM responses to autism self-disclosure. https://dl.acm.org/doi/full/10.1145/3706598.3713420 ; https://arxiv.org/html/2601.15437v1 ; https://aclanthology.org/2025.sigdial-1.40.pdf

**Emotion recognition — evidence and critique.** Technical work continues (MDPI *Applied Sciences* 2025 transformers > CNNs), but *Molecular Autism* 2025 found three commercial facial-analysis algorithms gave divergent outputs on autistic children in naturalistic settings; the 2022 systematic review (PMC8875834) notes tiny, non-representative datasets. Katirai, *Autism* 2025: emotion-recognition technologies carry heightened harms for autistic people because atypical expression is misread and pressure to "pass" increases. https://link.springer.com/article/10.1186/s13229-025-00685-x ; https://journals.sagepub.com/doi/10.1177/13623613241279704

**Robots/VR.** RoboCA3T (*J. Computer Assisted Learning* 2024) — adaptive robot-inspired therapy for joint attention; soft-skills intervention meta-analysis for transition-age autistic people (Choi, Ju, Sung, *Autism Research* 2025) shows moderate pooled effects for structured programs, with little VR/AI-specific data. https://onlinelibrary.wiley.com/doi/10.1111/jcal.12990 ; https://onlinelibrary.wiley.com/doi/10.1002/aur.70085

**Risk reviews.** "LLM Safety for Children" (arXiv 2502.12552) and SproutBench (arXiv 2508.11009) document that child-specific harms are under-evaluated; "AI Safety Training Can be Clinically Harmful" (arXiv 2604.23445, 2026) shows refusal-tuned safety behaviours can misfire in clinical contexts; therapeutic-dialogue hallucination (invented protocols, false reassurance) has no dedicated benchmark. A 2025 piece (PMC12380814) argues generative AI could reduce exclusion of nonverbal autistic people in mental healthcare but is a position paper. https://arxiv.org/pdf/2502.12552 ; https://arxiv.org/pdf/2604.23445 ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12380814/

**Bottom line on efficacy:** as of mid-2026 there are no RCTs of LLM-based communication coaching for autistic children. The evidence is feasibility studies (N≈10–20), short deployments (≤2 weeks), and qualitative preference data. Reported benefits are engagement, reduced parent stress, and perceived usefulness; reported risks are questionable advice, masking pressure, deficit framing, and over-trust.

---

## 5. Savant syndrome

Treffert's synthesis (*Phil Trans R Soc B* 2009, "The savant syndrome: an extraordinary condition") and the Savant Syndrome Registry (*WMJ* 2015) remain the core references: roughly 1 in 10 autistic people show some savant skill; about half of savants are autistic; skills cluster in music, art, calendar calculation, math, mechanical/spatial domains, almost always with prodigious memory. Critically, "most persons with savant syndrome have impoverished language skills as part of their basic disability," with rare polyglot/hyperlexic exceptions. https://www.researchgate.net/publication/26293542 ; https://wmjonline.org/wp-content/uploads/2015/114/4/158.pdf ; https://www.ssmhealth.com/treffert-center/conditions-treatments/savant-syndrome

Hughes et al., *Molecular Autism* 2018 ("Savant syndrome has a distinct psychological profile in autism"): savants show heightened sensory sensitivity, obsessional behaviours, technical/spatial ability and systemising beyond autism alone, and a different task-learning approach. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6186137/ . Older work (Bölte & Poustka 2004) compared IQ profiles. Treffert also emphasised "training the talent" — using the skill domain as the channel to build language and social connection.

**AI work specific to savant syndrome: none found** in peer-reviewed or preprint literature through 2026. The only adjacent material is popular-science framing of AI as "artificial savant." This is a genuine gap. The practical design reading is: a child with a savant domain (music, numbers, calendars, drawing) has a *high-bandwidth, high-motivation channel* that an assistant can use as scaffolding (e.g., symbol sets, conversation topics, reinforcement, even modality — a musical savant may express affect more reliably through pitch/rhythm than words), but language itself is usually the impaired domain, so AAC fundamentals still apply.

---

## 6. Therapist workflow and AI entering it

**What SLPs/BCBAs do.** SLPs: evaluate (standardized tests, language samples), write measurable IEP goals (condition/behaviour/criterion/measurement), deliver sessions, take trial/probe data, write SOAP-style session notes and quarterly progress reports, program AAC devices, train partners. BCBAs/RBTs: functional behaviour assessment, skill-acquisition and behaviour-reduction programs, per-trial/frequency/duration/interval data every session, graphing, session notes required for insurance (payer-compliant narrative), parent training. AAC device programming and partner training are widely reported as the most time-starved tasks.

**SLP attitudes and needs.** Suh et al., "Opportunities and Challenges for AI-Based Support for SLPs," *CHIWORK 2024* (Illinois/Penn State): survey + asynchronous remote community; SLPs want help with documentation, assessment materials, AAC programming, personalized intervention design; barriers are black-box models, poor coverage of non-English/dialects, no EHR integration, low AI literacy. https://dl.acm.org/doi/10.1145/3663384.3663387 . Austin et al., *AJSLP* 2024/25 (107 clinicians and students): sees workload benefits but hesitancy driven by ethics, lack of training, unclear institutional policy. https://pubs.asha.org/doi/10.1044/2024_AJSLP-24-00218 . ASHA's generative-AI guidance page directs clinicians to validate AI output against Evidence Maps. https://www.asha.org/practice/generative-artificial-intelligence-for-clinicians/additional-ai-resources-and-guidance/

**IEP goal writing.** *Frontiers in Education* 2026 mixed-methods replication: novice special educators using ChatGPT wrote higher-quality goals faster, but quality depended on prompt specificity and on professional review. https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2026.1916444/full

**Documentation.** "AI-Enhanced Speech-Language Intervention Documentation: Opportunities and Design Goals" (Springer LNCS 2025); RAG generation of pediatric SLP vignettes (arXiv 2511.08600). https://link.springer.com/chapter/10.1007/978-3-031-98465-5_17 ; https://arxiv.org/pdf/2511.08600 . ABA: per CentralReach's 2025 market report about 75% of ABA organizations bought AI tools in the past year; commercial session-note generators (Rethink Session Note AI, Artemis, Praxis Notes, Mentalyc) claim up to ~80% documentation-time reductions, generating narratives from already-logged trial data. https://www.rethinkbehavioralhealth.com/our-solutions/session-note-ai/ ; https://breakingnewsaba.com/technology/ai-session-notes

**Home-extension therapy.** *Life* 2025 pilot of a generative-AI interactive platform for children with language delay (feasibility only). https://doi.org/10.3390/life15101628

---

## Design implications

**Authorship and agency (the FC lesson)**
- Do keep the child's own selections as the canonical message; show AI expansions as clearly marked, optional, and reversible. Log raw input vs. AI-added content so authorship is auditable (Valencia 2023; I, Robot 2026).
- Do build "message-passing" checks into the product: the assistant must never produce content that only a partner or the model could know; never infer intent from ambiguous input and voice it as the child's statement (Schlosser 2019/2026; ASHA).
- Don't expand a single symbol into a fluent multi-clause utterance by default; offer graded expansion (word → short phrase) the child approves. Default to *less* than the user could say, not more.
- Don't let adults prompt the AI "on behalf of" the child in a way that shapes the child's message; partner-facing suggestions (AACessTalk) should be visibly for the partner.
- Do design against authorship drift: avoid passive-accept flows; require an active choice; track acceptance rates and flag when the child's own contributions shrink over time.

**Personalization over generic models**
- Do personalize vocalization and speech models per child with caregiver in-the-moment labels; treat outputs as probabilistic hints to the partner ("sounds like frustrated, 70%"), never as translations (ReCANVo; Narain 2020; Rybner 2022).
- Do support on-device/few-shot adaptation and keep a per-child lexicon of scripts, echolalic phrases, special-interest terms and their idiosyncratic meanings (echolalia evidence; monotropism).
- Don't rely on facial emotion recognition for autistic children; if used at all, keep it advisory, caregiver-confirmed, and disabled by default (Molecular Autism 2025; Katirai 2025).
- Don't import NLA/GLP "stages" as product logic; do give SLPs configurable, evidence-based frameworks (aided language modeling, NDBI-style responsive strategies, commenting as well as requesting).

**Partner-side support and double empathy**
- Do build the partner interface as a first-class feature: contextual, just-in-time prompts for parents/teachers, delayed (not interruptive) reflective feedback, and explicit framing that communication success is mutual (AACessTalk; Crompton 2025).
- Don't optimize the child toward neurotypical phrasing; offer register/tone options the child controls and allow atypical but effective forms (Jang 2024; It's Complicated 2026).

**Safety, honesty, and trust**
- Do ground any coaching or "what to say" content in clinician-approved templates; avoid open-ended advice generation to children; show sources; add child-specific safety evals (LLM Safety for Children; SproutBench).
- Do audit model outputs for deficit-framing language about autism (Bias Paradox, CHI 2025).
- Don't let refusal/safety tuning silently block clinically legitimate content (e.g., bodily, medical, emotional vocabulary) — these are core AAC needs (arXiv 2604.23445).
- Do treat private data as sensitive: personalization trained on family conversations can resurface private details; implement scoping, forgetting, and child/family review of what the model "knows" (I, Robot 2026).

**Interaction and cognitive load**
- Do minimize motor and attentional load: few options per screen, stable layouts, predictable timing, no surprise reflows; monotropic attention makes interruptions costly (Murray et al.; Suswaram 2025).
- Do use the child's high-interest or savant domain as the engagement channel and, where appropriate, as an expressive modality; don't assume verbal/textual language is the strongest channel (Treffert; Hughes 2018).
- Don't measure success by WER or keystroke savings alone; add semantic fidelity, correction rate, perceived ownership, and longitudinal diary outcomes (SAP Challenge semantic score; It's Complicated 2026).

**Clinical workflow fit**
- Do generate session notes, progress data, and IEP goal drafts from *structured data already logged* (trial data, AAC usage logs), with the clinician as editor; provide goal templates that meet measurable-goal criteria and link to ASHA Evidence Maps (Frontiers in Education 2026; ASHA guidance).
- Do export interoperable data (usage, vocabulary growth, communicative functions) so SLPs/BCBAs can use it as evidence rather than re-collecting it.
- Don't position the assistant as a therapy replacement; the strongest evidence for home-based tools is as an extension of clinician-designed intervention (Life 2025 pilot; NDBI+AAC meta-analysis).
- Do plan for multilingual and dialect coverage from the start; it is the top gap clinicians report (Suh 2024; Euphonia 2025).

**Evidence posture**
- Do state plainly that no RCT evidence exists for LLM-based communication assistants in autistic children; design the product to generate that evidence (logging, consent, clinician-partnered studies) rather than claim efficacy.
