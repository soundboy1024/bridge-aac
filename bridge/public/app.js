/* Bridge UI — vanilla JS, no build step. */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { profileId: null, profile: null, clock: null };
const who = () => $("#partnerName").value.trim() || "partner";

async function api(path, body, method) {
  const r = await fetch(`/api${path}`, { method: method ?? (body ? "POST" : "GET"), headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? r.statusText);
  return j;
}
const errCard = (e) => `<div class="err">${esc(e.message || e)}</div>`;
const busy = (form, on) => { const b = $("button.primary", form); if (b) { b.disabled = on; b.classList.toggle("spin", on); } };
const lines = (s) => s.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
const conf = (c) => `<span class="conf ${esc(c)}">${esc(c)}</span>`;

// ---------- boot ----------
async function boot() {
  const h = await api("/health");
  const badge = $("#providerBadge");
  const names = { claude: "Claude", groq: "Groq" };
  badge.textContent = h.provider === "mock" ? "mock mode (rule-based, no AI)" : `AI: ${names[h.provider] ?? h.provider}${h.model ? ` · ${h.model}` : ""}`;
  badge.classList.toggle("claude", h.provider !== "mock");
  const profiles = await api("/profiles");
  const sel = $("#profileSelect");
  sel.innerHTML = profiles.map((p) => `<option value="${esc(p.id)}">${esc(p.displayName)}${p.age ? `, ${p.age}` : ""}</option>`).join("");
  sel.onchange = () => loadProfile(sel.value);
  await loadProfile(profiles[0]?.id);
  $$(".tabs button").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
  const now = new Date();
  $("#clock").value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  $("#clock").onchange = renderBoard;
  $("#clockNow").onclick = () => { const n = new Date(); $("#clock").value = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`; renderBoard(); };
  setInterval(() => { if (document.activeElement !== $("#clock")) renderBoard(); }, 30000);
}
function showTab(name) {
  $$(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  $$(".panel").forEach((p) => p.classList.toggle("on", p.dataset.panel === name));
  if (name === "review") renderReview();
  if (name === "profile") renderProfile();
}
async function loadProfile(id) {
  if (!id) return;
  state.profileId = id;
  state.profile = await api(`/profiles/${id}`);
  $("#boardTitle").textContent = `${state.profile.displayName}'s day`;
  $("#anchorSelect").innerHTML = state.profile.schedule.anchors.map((a) => `<option value="${esc(a.id)}">${esc(a.symbol ?? "")} ${esc(a.label)}</option>`).join("");
  $$(".out").forEach((o) => (o.innerHTML = ""));
  await renderBoard();
  await refreshReviewCount();
  // Re-draw the open tab for the new person (the clear above would otherwise leave it blank).
  const open = $(".tabs button.on")?.dataset.tab;
  if (open === "profile") renderProfile();
  if (open === "review") renderReview();
}

// ---------- board ----------
async function renderBoard() {
  if (!state.profileId) return;
  const t = $("#clock").value;
  const { timeline, state: s } = await api(`/profiles/${state.profileId}/timeline?now=${encodeURIComponent(t)}`);
  $("#strip").innerHTML = timeline.map((a) => {
    const cls = a.id === s.current?.id ? "current" : a.startMin > (s.current?.startMin ?? -1) ? "future" : "past";
    return `<div class="anchor ${cls} ${a.importance}"><div class="sym">${esc(a.symbol ?? "•")}</div><div class="lbl">${esc(a.label)}</div><div class="tm">${fmt(a.startMin)}</div></div>`;
  }).join("");
  const cur = $("#strip .current"); if (cur) cur.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  const dueHtml = s.due.map((d) => `<span class="cue">${esc(d.cue)}</span> ${esc(d.spoken)}`).join("<br>");
  $("#due").innerHTML = dueHtml || (s.next ? `Next: <b>${esc(s.next.label)}</b> in ${s.minutesUntilNext} min${s.current ? ` · now: ${esc(s.current.label)}` : ""}` : "Nothing else scheduled today.");
}
const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// ---------- interpret ----------
$("#fInterpret").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  busy(f, true);
  try {
    const r = await api(`/profiles/${state.profileId}/interpret`, { observation: d.observation, context: { setting: d.setting || undefined, timeOfDay: d.timeOfDay || undefined, stateBefore: d.stateBefore || undefined, recentEvents: lines(d.recentEvents), partner: who() } });
    $("#outInterpret").innerHTML = `
      ${r.regulationFirst ? `<div class="card reg"><h3>First: regulation</h3>${esc(r.regulationFirst)}</div>` : ""}
      <div class="card"><h3>What it might mean</h3>
        ${r.interpretations.map((i, idx) => `<div class="opt"><div><span class="big">${esc(i.meaning)}</span>${conf(i.confidence)}<small>${esc(i.function)} · try: ${esc(i.tryThis)}${i.evidence.length ? ` · from: ${esc(i.evidence.join(", "))}` : " · not from the lexicon"}</small></div><button class="pick" data-i="${idx}">this was it</button></div>`).join("")}
        <div class="opt"><div><small>None of these fit</small></div><button class="pick" data-i="none">none</button></div>
        <div class="reading">
          <label>Figured it out? What do <b>you</b> think it meant?<textarea id="partnerReading" placeholder="e.g. he wanted to know if lunch was still happening"></textarea></label>
          <p class="meta">Saved as your interpretation, not a confirmed reason. It may not be what it actually meant. It goes to the review queue before it can join the profile.</p>
          <button class="ghost" id="saveReading">Save my interpretation</button>
        </div>
        <p><b>To check:</b> ${esc(r.bestClarifyingCheck)}</p><p class="meta">${esc(r.partnerTip)}</p>
        ${r.lexiconCandidate ? `<p class="meta">Queued for review: possible new lexicon entry “${esc(r.lexiconCandidate.form)}”.</p>` : ""}
        <div class="prov">hypotheses · event ${esc(r.eventId)} · nothing saved to the profile until reviewed</div>
      </div>`;
    $$("#outInterpret .pick").forEach((b) => (b.onclick = async () => {
      const idx = b.dataset.i === "none" ? null : Number(b.dataset.i);
      await api(`/profiles/${state.profileId}/interpret/confirm`, { eventId: r.eventId, chosenIndex: idx, by: who() });
      b.textContent = "recorded"; b.disabled = true; refreshReviewCount();
    }));
    $("#saveReading").onclick = async () => {
      const text = $("#partnerReading").value.trim();
      if (!text) { $("#partnerReading").focus(); return; }
      const btn = $("#saveReading");
      try {
        await api(`/profiles/${state.profileId}/interpret/confirm`, { eventId: r.eventId, chosenIndex: null, by: who(), partnerReading: text });
        btn.textContent = `saved as ${who()}'s interpretation (unverified) · in review queue`; btn.disabled = true; $("#partnerReading").disabled = true;
        refreshReviewCount();
      } catch (err) { btn.insertAdjacentHTML("afterend", errCard(err)); }
    };
  } catch (err) { $("#outInterpret").innerHTML = errCard(err); } finally { busy(f, false); }
};

// ---------- compose ----------
$("#fCompose").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  busy(f, true);
  try {
    const r = await api(`/profiles/${state.profileId}/compose`, { seeds: lines(d.seeds), audience: d.audience || undefined, intent: d.intent, register: d.register });
    const name = state.profile.displayName;
    $("#outCompose").innerHTML = `<div class="card"><h3>${esc(name)} chooses</h3>
      ${r.candidates.map((c, i) => `<div class="opt"><div><span class="big">${esc(c.text)}</span><small>${esc(c.note)}${c.keepsSeeds ? "" : " · ⚠ adds meaning not in the seeds"}</small></div><span class="pair"><button class="pick" data-i="${i}" data-by="person">${esc(name)} chose</button><button class="pick" data-i="${i}" data-by="partner_with_person">chose together</button></span></div>`).join("")}
      <div class="opt"><div><span class="big">${esc(r.somethingElse)}</span><small>always offered</small></div><button class="pick" data-i="none" data-by="none">something else</button></div>
      <p class="meta">Confirm: ${esc(r.confirmWith)}</p>
      <div class="prov">seeds: ${esc(lines(d.seeds).join(" · "))} · drafts only — nothing is spoken until chosen</div></div>`;
    $$("#outCompose .pick").forEach((b) => (b.onclick = async () => {
      const idx = b.dataset.i === "none" ? null : Number(b.dataset.i);
      const chosenBy = b.dataset.by;
      const ev = await api(`/profiles/${state.profileId}/send`, { eventId: r.eventId, candidateIndex: idx, chosenBy });
      $("#outCompose").insertAdjacentHTML("afterbegin", `<div class="card"><div class="spoken">${esc(ev.data.text)}</div><div class="prov">authorship: chosen by ${esc(ev.authorship.chosenBy)} · seeds “${esc(ev.authorship.seeds.join(" "))}” · AI added: ${ev.authorship.aiAdded ? `“${esc(ev.authorship.aiAdded)}”` : "nothing"}</div></div>`);
      if ("speechSynthesis" in window && idx !== null) { const u = new SpeechSynthesisUtterance(ev.data.text); speechSynthesis.speak(u); }
    }));
  } catch (err) { $("#outCompose").innerHTML = errCard(err); } finally { busy(f, false); }
};

// ---------- change ----------
$("#fChange").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  busy(f, true);
  try {
    const r = await api(`/profiles/${state.profileId}/change`, { anchorId: d.anchorId, change: d.change, newTime: d.newTime || undefined, replacedBy: d.replacedBy || undefined, reason: d.reason, nowTime: $("#clock").value, partner: who() });
    $("#outChange").innerHTML = `<div class="card risk-${esc(r.riskLevel)}"><h3>Risk: ${esc(r.riskLevel)}</h3><p class="meta">${esc(r.riskNote)}</p>
      <h3>Say</h3><div class="spoken">${esc(r.announce.spoken)}</div>
      <h3>Show</h3><div class="symbols">${esc(r.announce.symbolSequence.join("  →  "))}</div>
      ${r.announce.cues.length ? `<h3>Cues</h3><ul class="plain">${r.announce.cues.map((c) => `<li><b>${esc(c.cue)}</b> (${esc(c.channel)}) — ${esc(c.when)}</li>`).join("")}</ul>` : ""}
      <h3>New map</h3><ul class="plain">${r.newMap.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
      <p><b>Why:</b> <span class="why">${esc(r.why)}</span><br><b>Next:</b> ${esc(r.next)}</p>
      <h3>Your script</h3><ol class="steps">${r.partnerScript.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <p><b>If it escalates:</b> ${esc(r.ifEscalates)}</p></div>`;
  } catch (err) { $("#outChange").innerHTML = errCard(err); } finally { busy(f, false); }
};

// ---------- coach ----------
$("#fCoach").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  busy(f, true);
  try {
    const r = await api(`/profiles/${state.profileId}/coach`, { situation: d.situation, partnerRole: d.partnerRole || who() });
    $("#outCoach").innerHTML = `<div class="card"><h3>${esc(r.headline)}</h3>
      <div class="two"><div><h3>Do</h3><ul class="plain">${r.do.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h3>Don't</h3><ul class="plain">${r.dont.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <h3>Open with</h3><div class="spoken">${esc(r.openingLine)}</div>
      <p>Then wait <b>${esc(r.waitSeconds)} seconds</b>.${r.bridges.length ? ` Bridges: ${esc(r.bridges.join(" · "))}.` : ""}</p>
      <p><b>If it goes sideways:</b> ${esc(r.ifItGoesSideways)}</p></div>`;
  } catch (err) { $("#outCoach").innerHTML = errCard(err); } finally { busy(f, false); }
};

// ---------- story ----------
$("#fStory").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  busy(f, true);
  try {
    const r = await api(`/profiles/${state.profileId}/story`, { event: d.event, when: d.when || undefined, concerns: lines(d.concerns) });
    $("#outStory").innerHTML = `<div class="card"><h3>${esc(r.title)}</h3>
      ${r.pages.map((p, i) => `<div class="page"><div class="vis">p.${i + 1} · ${esc(p.visual)}</div><div><div class="txt">${esc(p.text)}</div><div class="kind">${esc(p.sentenceType)}</div></div></div>`).join("")}
      <p class="meta">${r.ratio.descriptive} descriptive/perspective : ${r.ratio.directive} directive</p>
      <h3>Check understanding</h3><ul class="plain">${r.checks.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      <h3>Notes</h3><ul class="plain">${r.partnerNotes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      <div class="prov">draft — edit before use</div></div>`;
  } catch (err) { $("#outStory").innerHTML = errCard(err); } finally { busy(f, false); }
};

// ---------- log ----------
$$("#regStages button").forEach((b) => (b.onclick = async () => {
  const d = Object.fromEntries(new FormData($("#fReg")));
  try {
    const ev = await api(`/profiles/${state.profileId}/regulation`, { stage: b.dataset.stage, note: d.note || undefined, setting: d.setting || undefined, partner: who() });
    $("#outLog").insertAdjacentHTML("afterbegin", `<div class="card"><b>${esc(ev.data.stage)}</b> logged at ${new Date(ev.at).toLocaleTimeString()}${ev.context.anchor ? ` · ${ev.context.minutesToNextAnchor} min before ${esc(ev.context.anchor)}` : ""}</div>`);
  } catch (err) { $("#outLog").insertAdjacentHTML("afterbegin", errCard(err)); }
}));
$("#fVoc").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target, d = Object.fromEntries(new FormData(f));
  try {
    const ev = await api(`/profiles/${state.profileId}/vocalization`, { label: d.label, form: d.form, setting: d.setting || undefined, partner: who() });
    $("#outLog").insertAdjacentHTML("afterbegin", `<div class="card">sound “${esc(ev.data.form)}” read as <b>${esc(ev.data.label)}</b>${ev.context.anchor ? ` · ${ev.context.minutesToNextAnchor} min before ${esc(ev.context.anchor)}` : ""}</div>`);
    f.reset();
  } catch (err) { $("#outLog").insertAdjacentHTML("afterbegin", errCard(err)); }
};

// ---------- review ----------
async function refreshReviewCount() {
  const q = await api(`/profiles/${state.profileId}/review`);
  const n = q.filter((x) => x.status === "pending").length;
  $("#reviewCount").textContent = n ? String(n) : "";
}
async function renderReview() {
  const q = await api(`/profiles/${state.profileId}/review`);
  const pending = q.filter((x) => x.status === "pending"), done = q.filter((x) => x.status !== "pending").slice(-10).reverse();
  $("#outReview").innerHTML = (pending.length ? pending.map((it) => `<div class="card"><h3>${esc(it.kind.replace("_", " "))}</h3><pre>${esc(JSON.stringify(it.proposal, null, 2))}</pre><p class="meta">${esc(it.rationale)}</p>
    <div class="row"><button class="primary" data-d="approved" data-id="${esc(it.id)}">Add to profile</button><button class="ghost" data-d="rejected" data-id="${esc(it.id)}">Reject</button></div></div>`).join("") : `<div class="card">Nothing waiting. Proposals appear here when Bridge notices a possible new meaning, trigger, cue or goal.</div>`)
    + (done.length ? `<div class="card"><h3>Recent decisions</h3>${done.map((it) => `<div class="lex"><span>${esc(it.status)} by ${esc(it.decidedBy ?? "?")}</span><span>${esc(it.kind)} — ${esc(it.proposal.form ?? it.proposal.text ?? it.proposal.trigger ?? "")}</span></div>`).join("")}</div>` : "");
  $$("#outReview [data-d]").forEach((b) => (b.onclick = async () => {
    const note = b.dataset.d === "approved" ? prompt("Note (optional): what did you see that confirms this?") ?? "" : prompt("Why reject? (optional)") ?? "";
    await api(`/profiles/${state.profileId}/review/${b.dataset.id}`, { decision: b.dataset.d, by: who(), note: note || undefined });
    await loadProfile(state.profileId); renderReview(); showTab("review");
  }));
}

// ---------- insights ----------
$("#runInsights").onclick = async () => {
  const b = $("#runInsights"); b.disabled = true; b.classList.add("spin");
  try {
    const { stats, report } = await api(`/profiles/${state.profileId}/insights`);
    $("#outInsights").innerHTML = `<div class="card"><h3>${esc(report.headline)}</h3>
      ${report.hypotheses.map((h) => `<div class="opt"><div><span class="big">${esc(h.statement)}</span>${conf(h.confidence)}<small>${esc(h.evidence)}<br><b>Test:</b> ${esc(h.howToTest)}${h.caution ? `<br><b>Caution:</b> ${esc(h.caution)}` : ""}</small></div></div>`).join("")}
      <p><b>Authorship:</b> ${esc(report.authorshipNote)}</p>
      ${report.goalSuggestions.length ? `<h3>Goal drafts (queued for review)</h3><ul class="plain">${report.goalSuggestions.map((g) => `<li>${esc(g.text)} <span class="meta">— ${esc(g.measure)}</span></li>`).join("")}</ul>` : ""}
      <details><summary>Raw statistics</summary><pre>${esc(JSON.stringify(stats, null, 2))}</pre></details>
      <div class="prov">${stats.totalEvents} events · correlations, not causes</div></div>`;
    refreshReviewCount();
  } catch (err) { $("#outInsights").innerHTML = errCard(err); } finally { b.disabled = false; b.classList.remove("spin"); }
};

// ---------- profile ----------
function renderProfile() {
  try { drawProfile(); } catch (err) { $("#outProfile").innerHTML = errCard(err); }
}
function drawProfile() {
  const p = state.profile;
  $("#outProfile").innerHTML = `<div class="card"><h3>${esc(p.displayName)} (${esc(p.pronouns)}${p.age ? `, ${p.age}` : ""})</h3><p>${esc(p.summary)}</p>
    <dl class="kv"><dt>Strengths</dt><dd>${esc(p.strengths.join("; "))}</dd><dt>Interests</dt><dd>${esc(p.interests.join("; "))}</dd><dt>Expresses via</dt><dd>${esc(p.expressive.primaryModes.join("; "))}</dd><dt>Best with</dt><dd>${esc(p.receptive.bestWith.join("; "))}</dd><dt>Avoid</dt><dd>${esc(p.receptive.avoid.join("; "))}</dd><dt>Regulators</dt><dd>${esc(p.sensory.regulators.join("; "))}</dd><dt>Reads</dt><dd>${esc(p.cues.reads)} · channels: ${esc(p.cues.preferredChannels.join(", "))}</dd><dt>Consent</dt><dd>guardian: ${p.guardrails.consent.guardianConsent ? "yes" : "no"} · person: ${esc(p.guardrails.consent.personAssent)}</dd></dl></div>
    <div class="card"><h3>Lexicon (${p.lexicon.length})</h3>${p.lexicon.map((l) => `<div class="lex"><b>${esc(l.form)}</b><span>${l.meanings.map((m) => `“${esc(m.gloss)}” <span class="meta">${esc(m.function)}, ${esc(m.confidence)}${m.contexts.length ? `, when ${esc(m.contexts.join("/"))}` : ""} · ${m.provenance.source === "partner_interpretation" ? "partner's interpretation (unverified)" : esc(m.provenance.source.replace("_", " "))}${m.provenance.confirmedBy ? ` ✓ ${esc(m.provenance.confirmedBy)}` : ""}</span>`).join("<br>")}${l.doNotInterpretAs.length ? `<br><span class="meta">not: ${esc(l.doNotInterpretAs.join(", "))}</span>` : ""}</span></div>`).join("")}</div>
    <div class="card"><h3>Triggers & cues</h3>${p.sensory.triggers.map((t) => `<div class="lex"><b>${esc(t.trigger)}</b><span>early: ${esc(t.earlySigns.join(", "))}<br>helps: ${esc(t.whatHelps.join(", "))}<br><span class="meta">worse: ${esc(t.whatMakesItWorse.join(", "))}</span></span></div>`).join("")}${p.cues.motifs.map((m) => `<div class="lex"><b>cue: ${esc(m.meaning)}</b><span>${esc(m.cue)} (${esc(m.channel)}${m.established ? "" : ", still teaching"})</span></div>`).join("")}</div>`;
  $("#profileJson").value = JSON.stringify(p, null, 2);
}
$("#saveProfile").onclick = async () => {
  try {
    const j = JSON.parse($("#profileJson").value);
    await api(`/profiles/${state.profileId}`, { ...j, _actor: who() }, "PUT");
    $("#saveMsg").innerHTML = `<span class="ok-msg">Saved</span>`;
    await loadProfile(state.profileId); renderProfile();
  } catch (err) { $("#saveMsg").innerHTML = errCard(err); }
};

boot().catch((e) => (document.body.insertAdjacentHTML("afterbegin", errCard(e))));
