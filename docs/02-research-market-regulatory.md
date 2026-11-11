# AI in AAC for Special-Needs Children: Commercial, Product, Regulatory & Funding Landscape (August 2026)

Scope note: research was conducted via live web search on 2026-08-21, prioritizing 2023–2026 sources. Where a vendor has not publicly shipped a feature, that is stated rather than inferred. Pricing is list price as published by the vendor or reseller and may vary by region or promotion.

---

## 1. Incumbent AAC platforms and how they are adding AI

### Tobii Dynavox (TD Snap, TD Talk, TD Phone, TD I-Series)
- **What it does:** Market-leading SGD maker. TD Snap is the symbol-based app for children (Core First, Motor Plan, PODD, Gateway page sets; touch/eye-gaze/switch access). TD Talk is a text-based app for literate adults (ALS/MS/CP). TD I-Series is the dedicated eye-tracking device.
- **AI in use:** Microsoft Azure AI Speech Neural Voices in 50+ languages inside TD Talk/TD Phone; "AI phrase prediction" in TD Talk; a See-Through Mode that makes the screen transparent for face-to-face use. Demonstrated at the Microsoft Ability Summit, March 2025 ([PR Newswire](https://www.prnewswire.com/news-releases/tobii-dynavox-shows-how-ai-empowers-people-with-disabilities-at-microsoft-ability-summit-302404573.html)). Public materials show **no generative/LLM feature shipped in TD Snap** as of the v1.39.1 release notes (May 2026) ([release notes PDF](https://download.mytobiidynavox.com/Snap/documents/ReleaseNotes/TD_Snap_Release_Notes.pdf)); TD Snap's "generative" framing refers to generative *language* (building novel utterances from core words), not generative AI ([TD Snap](https://us.tobiidynavox.com/products/td-snap)).
- **Pricing:** TD Snap app is free to download with in-app page-set purchases; dedicated devices are funded devices (see §4).

### AssistiveWare (Proloquo, Proloquo2Go, Proloquo4Text, Proloquo Coach)
- **What it does:** Proloquo (2022 "next-gen" app) uses Thinking Space, Focus Mode and a subscription model; Proloquo2Go is the legacy symbol app; Proloquo4Text is text-based with learned word/sentence prediction.
- **AI in use:** Acapela Neural Voices (60–150 free voices), on-device learned prediction in Proloquo4Text, support for Apple Personal Voice. AssistiveWare is notably **AI-cautious**: it has long argued for "generative rather than predictive" vocabularies so children are not bypassed on syntax/grammar ([AssistiveWare](https://www.assistiveware.com/blog/proloquo-4-grows-with-users)), and its privacy position asserts AAC users' "absolute right to privacy of conversation," rejecting Language Activity Monitoring-style logging ([AAC data collection and privacy](https://www.assistiveware.com/blog/aac-data-collection-and-privacy)). No LLM feature is announced ([products](https://www.assistiveware.com/products)).
- **Pricing:** Proloquo2Go ~$249.99 one-time (frequent 50% AAC Awareness Month sales, see [Undivided](https://undivided.io/resources/aac-software-discounts-2862)); Proloquo is subscription.

### PRC-Saltillo (LAMP Words for Life, TouchChat, Unity AAC, Dialogue AAC)
- **What it does:** Motor-planning (LAMP/Unity) and WordPower symbol systems; dominant in US schools and Medicaid SGDs.
- **AI in use:** **First AI release shipped with the 2026.1 update** across all four iOS apps: AI Message Edit (grammar/spelling plus "creative" rewrites), AI Translate (Speech Display Bar into any Apple-voice language), AI Image Generation for button symbols (guardrails block people/copyrighted material). Built on **Apple Intelligence, fully on-device, off by default, per-feature consent, requires iOS 26 + Apple-Intelligence hardware** ([PRC-Saltillo blog](https://prc-saltillo.com/blog/2026-ai-apps); [AbleNet guide](https://support.ablenetinc.com/guides/touchchat/ai-features-in-prc-apps/)). This is the clearest "privacy-by-architecture" move among incumbents.
- **Pricing:** Apps ~$299.99 each (one-time); dedicated Accent devices via funding.

### Smartbox (Grid 3, Grid for iPad, Voco Chat)
- **What it does:** UK-based full-featured platform (symbol + text + environmental control), Voco Chat low-cell-count symbol vocabulary in 18+ languages for children and adults ([Voco Chat](https://thinksmartbox.com/voco-chat/)).
- **AI in use:** The most aggressive incumbent. **Fix** (AI correction of spelling/grammar, abbreviation expansion, missing letters) inside Text Talker/Fast Talker; **Smart Prompt** lets users/supporters generate grid content from a natural-language prompt, results appear directly in the grid; **ElevenLabs AI voices and voice cloning** free for users 18+ via the ElevenLabs Impact Program. Smartbox publishes AI Principles emphasizing optionality, transparency and user choice ([AI tools in Grid](https://thinksmartbox.com/ai-tools-in-grid/); [Smart Prompt](https://thinksmartbox.com/news/create-ai-powered-tools-with-smart-prompt/); [Fix + ElevenLabs](https://thinksmartbox.com/news/new-fix-tool-and-elevenlabs-voice-integration/)). Note: AI voices are gated to 18+, so children get no cloned/AI voice path here.
- **Pricing:** Grid 3 licence ~£470/US$700+; 60-day free trial; Grid for iPad subscription.

### Avaz (Avaz Inc., India/US)
- **What it does:** Symbol AAC for children with autism, strong gestalt-language-processing (GLP) support.
- **AI in use:** v8.0.1 (March 2025) added **Expressive Tones**, AI-driven emotional prosody (excited, sarcastic, sad, curious) on TTS; YouTube integration for GLP "gestalts," GIF expression. Avaz has published pro-AI myth-busting posts citing word prediction, language generation and contextual phrase suggestions as directions ([App Store](https://apps.apple.com/us/app/avaz-aac/id909574843); [AI in AAC myths](https://www.avazapp.com/blog/ai-in-aac-lets-bust-some-myths/)).
- **Pricing:** Lifetime edition ~$249.99; subscription version; 50% off each October.

### CoughDrop (Forbes AAC)
- **What it does:** Cloud-first, cross-platform (web/iOS/Android/Windows/Chromebook) AAC with team management, modeling mode, and usage analytics.
- **AI in use:** No customer-facing LLM features; 2025 releases focus on reliability and "Organizations" team tooling ([CoughDrop release notes](https://www.coughdrop.com/release-notes); [blog](https://blog.mycoughdrop.com/fueling-aac-implementation-with-coughdrop-organizations/)). Its open data model and cloud logging make it a natural AI integration target, but also a FERPA/COPPA exposure point.
- **Pricing:** ~$200 one-time or ~$6–10/month.

### Cboard (open source)
- **What it does:** Free OSS web/mobile AAC in 40 languages; used by school districts (e.g., Philadelphia).
- **AI in use:** **Cboard AI Engine** (GitHub) generates board content suggestions and new pictograms from a prompt; received a Microsoft AI for Accessibility grant; ElevenLabs Impact partner. A related community project, *AAC Board AI*, won Google's Chrome Built-in AI Challenge 2025 using on-device Gemini Nano for proofreading/rewriting/translation offline ([cboard-ai-engine](https://github.com/cboard-org/cboard-ai-engine); [AT Today](https://attoday.co.uk/free-open-source-aac-app-receives-ai-for-accessibility-grant-from-microsoft/); [aac-board-ai](https://github.com/shayc/aac-board-ai)).
- **Pricing:** Free.

### Spoken (Spoken AAC)
- **What it does:** Text/word-tile AAC with AI next-word/phrase prediction and location-aware suggestions; targets autism, aphasia, ALS.
- **AI in use:** Proprietary "AI-powered" predictive language model that adapts to the user's style; natural TTS. Closest thing to an "LLM-native" consumer AAC among widely used apps.
- **Pricing:** Free core; Premium $12.99/mo, $99.99/yr, $249.99 lifetime ([Spoken pricing](https://spokenaac.com/help/does-spoken-cost-anything/)).

### Speak for Yourself, Predictable (Therapy Box), Jabberwocky
- **Speak for Yourself:** SLP-built motor-planning app, $149.99, no AI ([SfY](https://speakforyourself.org/features/)).
- **Predictable (Therapy Box):** text-based app with self-learning prediction, phrase banks, Apple Personal Voice support; no public LLM ([Therapy Box](https://www.therapybox.co.uk/)).
- **Jabberwocky:** camera-based head-tracking text AAC using on-device AI face tracking; head tracking now free, prediction is on-device ([App Store](https://apps.apple.com/us/app/jabberwocky-aac/id1438561966); [open-source head-tracking kit](https://github.com/swiftablellc/jabberwocky-head-tracking-kit-ios)).

### ChirpBot (LLM-era entrant)
- Low-cost multilingual AAC with free core (cards, sentence building, TTS) and paid "smart phrasing" AI tiers at $4.99 and $9.99/month; underlying model undisclosed ([ChirpBot](https://chirpbot.ai/blog/choosing-aac-app-2026.html)). Representative of a wave of small indie apps bolting LLM phrasing onto grid AAC, mostly without clinical validation or published privacy architecture.

---

## 2. Platform vendors (Apple, Google, Microsoft) and speech-tech specialists

### Apple
- **Personal Voice:** synthetic voice clone created on-device; since iOS 18 needs ~10 phrases/under 60 seconds (was 15 minutes), exposed to third-party AAC apps by API. **Live Speech:** system-wide type-to-speak in calls/FaceTime/in-person. **Assistive Access:** simplified UI for cognitive disability, now with a developer API in iOS 26. System-level Eye Tracking also available ([Apple Support – Personal Voice](https://support.apple.com/en-us/104993); [Live Speech](https://support.apple.com/en-us/105018); [AppleVis iOS 26 overview](https://www.applevis.com/podcasts/what-s-new-ios-26-accessibility)).
- **Strategic relevance:** Apple Intelligence's on-device Foundation Models framework is what PRC-Saltillo used to ship privacy-safe AI; it is the cheapest compliant path for a child-focused product (no data leaves device; COPPA/FERPA surface shrinks dramatically).
- **Pricing:** Free with hardware.

### Google
- **Project Euphonia / Project Relate:** personalized ASR for dysarthric/atypical speech; Relate is a free Android app; Euphonia dataset >2,000 speakers and now multilingual; 2026 research applies Gemini 2.5 Flash audio understanding to disordered speech; Euphonia repo open-sourced for developers ([Frontiers 2025](https://www.frontiersin.org/journals/language-sciences/articles/10.3389/flang.2025.1569448/full); [Google GAAD 2025](https://blog.google/outreach-initiatives/accessibility/android-gemini-ai-gaad-2025/)).
- **Look to Speak:** free Android eye-gaze phrase selector; added a text-free emoji/symbol/photo mode (2024) for cognitive/literacy differences; fully on-device ([Google Play](https://play.google.com/store/apps/details?id=com.androidexperiments.looktospeak); [Android Police](https://www.androidpolice.com/googles-incredible-look-to-speak-app-now-works-with-more-languages/)).
- **Gemini in accessibility:** Gemini descriptions in TalkBack, Expressive Captions (tone/emotion), Voice Access launch by voice—none are AAC-specific.

### Microsoft
- Azure Neural Voice and Custom/Personal Neural Voice supply voices to Tobii Dynavox; Seeing AI added GPT-style rich descriptions and chat; Microsoft funds the **Speech Accessibility Project** (UIUC), which reported 18–60% ASR accuracy gains on non-standard speech now flowing into Azure Speech ([Microsoft Ability Summit 2025](https://blogs.microsoft.com/blog/2025/03/18/microsoft-ability-summit-2025-accessibility-in-the-ai-era/); [Azure AI accessibility](https://azure.microsoft.com/en-us/blog/6-ways-to-improve-accessibility-with-azure-ai/)).

### Voiceitt
- **What it does:** ASR trained on proprietary atypical-speech corpus; user records phrases to personalize; outputs text/TTS, integrates with Teams/Zoom and ChatGPT. Voiceitt2 web app sold to schools and health systems.
- **Pricing:** $49.99/month or $499.99/year, 30-day trial; 1- and 5-year institutional licences by PO ([Babel Group](https://www.thebabelgroup.com/product/voiceitt-yearly-subscription/); [Voiceitt FAQ](https://www.voiceitt.com/faq)). ~$20–21M raised; last priced round Series A Dec 2022 ([MobiHealthNews](https://www.mobihealthnews.com/news/voiceitt-raises-47m-scale-speech-recognition-people-disabilities)).

### ElevenLabs Impact Program
- Free personalized/cloned voices for people with permanent speech impairment, integrated into Grid, Jabbla, Cboard, REHAVISTA and (via Bridging Voice) Tobii Communicator 5; Bridging Voice gives US ALS patients a free Pro clone licence worth $1,200/yr ([ElevenLabs Impact](https://elevenlabs.io/impact-program); [Bridging Voice](https://bridgingvoice.org/elevenlabs/)). Adults only in practice; no child-voice program.

---

## 3. Emerging AI feature map (who does what)

| Feature | Shipping commercially | Research state |
|---|---|---|
| Sentence expansion from keywords / abbreviations | Smartbox Fix (abbrev. expansion); Spoken (phrase prediction); ChirpBot "smart phrasing" | KWickChat bag-of-keywords (Cambridge, [ACM IUI](https://dl.acm.org/doi/10.1145/3490099.3511145)); Google SpeakFaster, 57% fewer motor actions for eye-gaze ALS typists ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11530652/)) |
| Context/partner-aware prediction | Spoken location-aware suggestions; TD Talk phrase prediction | SocializeChat (GPT-4, relationship-styled replies via gaze) ([ACM](https://dl.acm.org/doi/10.1145/3594739.3610705)); ultra-personalized fine-tuned model on 7 months of one user's AAC data ([arXiv 2509.13671](https://arxiv.org/abs/2509.13671)) |
| Photo-to-phrase / just-in-time visual scene displays | Smartbox Smart Prompt; Cboard AI Engine; PRC AI Image Gen (images only, not phrases) | GPT-4V VSD programming rated near human quality ([ASSETS '24](https://arxiv.org/abs/2408.11137)); QuickPic AAC for minimally speaking users ([MDPI](https://www.mdpi.com/1660-4601/21/9/1150)); "Helping or Homogenizing?" ASSETS '25 warns of vocabulary homogenization ([arXiv 2507.21811](https://arxiv.org/pdf/2507.21811)) |
| Partner-side coaching for minimally verbal autistic children | none commercial | **AACessTalk** (KAIST/NAVER, CHI 2025): LLM recommends cards to child and conversation prompts to parent; 11 dyads, 2-week deployment ([ACM CHI](https://dl.acm.org/doi/10.1145/3706598.3713792)); ASHA-journal prototype automating augmented input from partner speech ([AJSLP](https://pubs.asha.org/doi/10.1044/2023_AJSLP-23-00224)) |
| Personal voice / voice cloning | Apple Personal Voice (on-device); ElevenLabs via Grid/Bridging Voice (18+); Azure Neural Voice (Tobii) | Child voice banking remains largely unaddressed |
| Emotional prosody | Avaz Expressive Tones | — |
| Atypical/dysarthric ASR | Voiceitt; Google Relate; Azure via Speech Accessibility Project | Gemini 2.5 Flash dysarthric ASR; few-shot meta-learning "Universal Personalizer" ([arXiv 2509.15516](https://arxiv.org/html/2509.15516v2)) |
| Eye/head tracking | Tobii I-Series; Apple Eye Tracking; Jabberwocky head tracking; Look to Speak | — |
| On-device LLM | PRC-Saltillo (Apple Intelligence); AAC Board AI (Gemini Nano in Chrome) | — |

---

## 4. Regulatory and ethics landscape

### COPPA (US, children under 13)
The FTC's amended rule published April 22, 2025 (effective June 23, 2025; full compliance by April 22, 2026) expands "personal information" to include **voiceprints, facial templates and other biometrics**, requires **separate verifiable parental consent for disclosure to third parties and for use of children's data to train AI**, mandates written data-retention policies, and tightens security obligations. The FTC **dropped the proposed school-authorization exception** pending ED's FERPA rulemaking, leaving edtech/AAC vendors in a gray zone when schools consent on parents' behalf ([IAPP](https://iapp.org/news/a/ftc-finalizes-coppa-rule-amendments); [Data Protection Report](https://www.dataprotectionreport.com/2025/06/ftcs-coppa-rule-changes-include-ai-training-consent-requirement/); [Public Interest Privacy Center](https://publicinterestprivacy.org/coppa-rule-training-algorithms/)). Practical implication: any cloud LLM call containing a child's utterances, photos or audio is a COPPA-covered disclosure; recorded speech for personal voice is biometric data.

### FERPA / state student-privacy laws
When an AAC app is provisioned by a school under an IEP, utterance logs and usage analytics are education records; vendors operate as "school officials" and must not repurpose data (including for model training). Over 40 states layer additional student-data laws (e.g., California SOPIPA) ([Promise Legal overview](https://blog.promise.legal/edtech-ai-compliance-ferpa-coppa/)).

### HIPAA
Applies when the AAC provider or SLP practice is a covered entity or business associate (e.g., Medicaid-funded SGD vendors, clinics). Sending utterances to OpenAI/Anthropic/Google requires a BAA; most consumer API tiers do not offer one, while Azure OpenAI, Google Cloud Vertex and AWS Bedrock do ([Aptible](https://www.aptible.com/hipaa/hipaa-compliant-ai)).

### FDA
SGDs are regulated but historically low-touch; most AAC apps are positioned as general wellness/communication aids, not diagnostic SaMD. FDA's Jan 6, 2025 draft guidance on **AI-Enabled Device Software Functions** (TPLC, bias analysis, PCCPs) would only bite if a product makes clinical claims (e.g., "improves expressive language outcomes") ([FDA](https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-software-medical-device); [ICON summary](https://www.iconplc.com/insights/blog/2025/06/24/fda-regulations-ai-medical-devices)). No AAC-specific AI guidance exists.

### EU AI Act
Annex III treats AI in **education** (admission, assessment, monitoring) as high-risk; AI AAC used for school assessment could be swept in, and Article 7 lets the Commission add systems affecting vulnerable groups (age, disability). Article 5 prohibits exploiting vulnerabilities due to age or disability. Transparency duties under Article 50 exempt "assistive" standard editing (grammar fixes) that does not substantially alter meaning—relevant to Fix-style tools but arguably not to full sentence generation. The **Digital Omnibus (agreed May 7, 2026; in force July 27, 2026) postponed Annex III high-risk obligations to December 2, 2027** ([Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/); [Annex III](https://artificialintelligenceact.eu/annex/3/); [Article 50 guidance](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act); [LCFI on children](https://www.lcfi.ac.uk/news-events/blog/post/eu-ai-act-how-well-does-it-protect-children-and-young-people)).

### ASHA guidance
ASHA's generative-AI page ties AI use to Code of Ethics Principle II (clinician must evaluate any technology), states AI cannot replace the SLP, requires efficacy claims to be evidence-based, and flags "limited legislative or regulatory oversight" ([ASHA](https://www.asha.org/practice/generative-artificial-intelligence-for-clinicians/); [additional resources](https://www.asha.org/practice/generative-artificial-intelligence-for-clinicians/additional-ai-resources-and-guidance/)). ASHA journals in 2024–2025 ran an AI forum and a SWOT with proposed ethical guidelines for GenAI in aphasia ([AJSLP](https://pubs.asha.org/doi/abs/10.1044/2025_AJSLP-25-00262)), and the ASHA Leader's March 2025 feature "Predictive Text: Who Controls the Conversation?" captures the field's split ([ASHA Leader](https://leader.pubs.asha.org/do/10.1044/leader.FTR1.30032025.FAAC-predictive-text.36/full/)).

### AAC community critique
- A UK community consultation (Griffiths, Slaughter, Waller, *Journal of Enabling Technologies* 2024) found broad support for AI rate enhancement but two dominant fears: **bias in language models** and **ensuring outputs are authentically authored by the user**; participants backed a Code of Practice but could not agree on its form ([Emerald](https://www.emerald.com/insight/content/doi/10.1108/jet-01-2024-0007/full/html)).
- The 2025 autoethnography of an ultra-personalized AAC model reports that training "selectively emphasized certain aspects of his communication style," that logging changed his sense of agency, and that suggestions **resurfaced private details out of context** ([arXiv](https://arxiv.org/abs/2509.13671)).
- "Helping or Homogenizing?" (ASSETS '25) shows GenAI-assisted SLPs converge on similar, generic vocabularies—a direct risk for children whose idiolects, echolalia/gestalts and special interests are their identity.
- Recurring themes across advocacy writing: "AI speaking *for* the user" vs. *with* the user; prompting/hallucination risk for pre-literate children who cannot verify generated sentences; conflict with the gestalt-language-processing community, which wants verbatim scripts, not paraphrase; LAM-style logging as surveillance (AssistiveWare's stance above); and vendor vagueness in privacy policies ([ChirpBot guidance](https://chirpbot.ai/blog/choosing-aac-app-2026.html); [FAS on children's voice privacy](https://fas.org/publication/childrens-online-voice-privacy/)).

---

## 5. Funding and distribution

### Medicare (sets the template for payers)
- Covered as DME under **NCD 50.1** and LCD **L33739** (last revised Oct 1, 2024) with HCPCS **E2500–E2510** for dedicated devices and **E2511** for SGD *software* on a tablet/phone; the general-purpose tablet itself is not covered. Requires SLP evaluation, physician face-to-face visit, and a PDAC coding verification ([CMS LCD L33739](https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=33739); [Policy Article A52469](https://www.cms.gov/medicare-coverage-database/view/article.aspx?articleId=52469); [ASHA SGD policy](https://www.asha.org/practice/reimbursement/medicare/sgd_policy/)). Since the 2015 NCD revision, devices may be "unlocked" for non-speech functions after purchase, which is what makes AI companion features fundable without jeopardizing coverage.
- Implication for an AI product: to be reimbursed you either (a) get PDAC-verified as E2511 software, or (b) ride on a PDAC-listed device. Typical E2510 allowables run several thousand dollars; E2511 software allowables are a few hundred.

### Medicaid and private insurance
State Medicaid programs cover SGDs for children under EPSDT but with state-specific criteria, prior authorization, and fee schedules; commercial plans (Cigna 0049, Providence MP519, etc.) mirror the Medicare LCD ([Cigna policy](https://static.cigna.com/assets/chcp/pdf/coveragePolicies/medical/mm_0049_coveragepositioncriteria_speech_generating_devices.pdf)). Vendors like PRC-Saltillo and Tobii Dynavox run in-house funding departments; this "funding concierge" is a major moat.

### Schools / IDEA Part B
Under 34 CFR 300.105 the IEP team must consider AT at every meeting; if needed for FAPE, the LEA must provide the device, training, and home use at no cost. ED's January 2024 Dear Colleague letter and "Myths and Facts" document reinforced that training for the child, parents and educators is the LEA's obligation ([IDEA §300.105](https://sites.ed.gov/idea/regs/b/b/300.105); [ED AT guidance](https://sites.ed.gov/idea/idea-files/at-guidance/); [ASHA Leader](https://leader.pubs.asha.org/do/10.1044/2024-0205-schools-assistive-tech/full/)). Procurement happens via district AT departments, state AT Act programs and loan libraries (e.g., OCALI's 2025 resource guide), and state contracts; app purchases often go through Apple School Manager volume purchasing.

---

## 6. Gaps and opportunities

1. **Nobody ships child-safe LLM generation.** Smartbox gates AI voices to 18+; PRC-Saltillo's AI is editing/translation/images, not sentence generation; AssistiveWare and Tobii have shipped no LLM features. A product that generates or expands language for a minor, with an auditable on-device/BAA-covered architecture and COPPA-grade consent, has no incumbent competitor.

2. **Partner-side AI is unoccupied commercially.** AACessTalk shows the biggest lever for minimally verbal children is coaching the *parent/teacher* (what to model, when to wait, which cards to offer), not making the child's device "smarter." No vendor sells this.

3. **Authorship-preserving design is unsolved.** Research demands a visible distinction between user-selected and AI-proposed words, rejection/undo at zero cost, logging the provenance of each utterance, and user-controlled style memory. Implementing a "provenance bar" and exportable authorship log would be differentiating and would pre-empt Code-of-Practice demands.

4. **Idiolect and gestalt fidelity.** LLM phrasing homogenizes; GLP families want exact scripts, echolalic chunks, and special-interest vocabulary. A per-child model that treats the child's own corpus as canon, never paraphrases without permission, and surfaces the child's actual gestalts beats generic rewriting.

5. **Savant/uneven-profile learners are invisible** in every product surveyed: no system adapts to spiky profiles (e.g., hyperlexia plus minimal speech, calendar/music/number domains as communication bridges). Using a child's strength domain as the interface for expression is open ground.

6. **Child voice identity.** Personal Voice needs the child to read phrases; cloning services are adult-only. A consented, age-progressing synthetic voice for a child who cannot record is missing.

7. **Atypical-speech ASR for children.** Euphonia, Voiceitt and the Speech Accessibility Project are adult-centric corpora; pediatric dysarthric/apraxic speech recognition is a data gap and a regulatory landmine (biometric data under COPPA)—but on-device personalization sidesteps most of it.

8. **Funding-ready packaging.** Few AI entrants understand E2511/PDAC, Medicaid EPSDT, or district AT procurement. Shipping as an E2511-eligible software SKU plus a free school trial tier, with a SOC 2/FERPA data sheet and signed DPA templates, converts compliance into distribution.

9. **Evidence.** No commercial AI AAC feature has a published pediatric outcome study. ASHA's "substantiate claims with evidence" line means a single well-designed single-case-design or small RCT, registered and published, would be a category-defining asset.

10. **Regulatory runway.** EU Annex III is deferred to Dec 2027, US COPPA is settled as of April 2026, and FDA has no AAC-specific AI rule. The next ~16 months are a window to build standards-setting practice (on-device first, provenance logging, no training on child data) before rules harden.
