const ZONES = [
  {
    id: "A",
    name: "North Flats",
    size: "2.1 acres",
    note: "Checked 6 days ago",
    history: "Usually stable",
    level: "green",
    finding: "No visible issue",
    detail: "Cages appear aligned; no unusual shell exposure.",
    action: "Keep on regular rotation",
    actionDetail: "No extra inspection needed today.",
    confidence: 91,
    image: "clear"
  },
  {
    id: "B",
    name: "Cedar Bend",
    size: "1.8 acres",
    note: "Checked 12 days ago",
    history: "Fouling last August",
    level: "yellow",
    finding: "Moderate biofouling",
    detail: "Growth is reducing visible mesh openings.",
    action: "Check flow through cages",
    actionDetail: "Flip or clean the heaviest cage row this week.",
    confidence: 78,
    image: "fouling"
  },
  {
    id: "C",
    name: "East Channel",
    size: "2.4 acres",
    note: "Checked 4 days ago",
    history: "Strong current",
    level: "green",
    finding: "No visible issue",
    detail: "Even cage spacing and normal shell pattern.",
    action: "Keep on regular rotation",
    actionDetail: "No extra inspection needed today.",
    confidence: 88,
    image: "clear"
  },
  {
    id: "D",
    name: "Deep Pocket",
    size: "1.9 acres",
    note: "Checked 9 days ago",
    history: "Warm-water mortality",
    level: "red",
    finding: "Possible mortality increase",
    detail: "More open and motionless shells than last scan.",
    action: "Inspect first · sample 3 cages",
    actionDetail: "Count live/dead oysters and photograph the sample.",
    confidence: 86,
    image: "mortality"
  },
  {
    id: "E",
    name: "South Shoal",
    size: "2.0 acres",
    note: "Checked 15 days ago",
    history: "Oldest gear",
    level: "yellow",
    finding: "Light fouling visible",
    detail: "Patchy growth on two outer cage rows.",
    action: "Add to this week’s route",
    actionDetail: "Spot-check outer rows before the weekend.",
    confidence: 72,
    image: "fouling"
  },
  {
    id: "F",
    name: "Outer Reach",
    size: "1.8 acres",
    note: "Checked 7 days ago",
    history: "Gear shifted in storms",
    level: "red",
    finding: "Possible gear damage",
    detail: "One cage line appears slack and out of alignment.",
    action: "Inspect first · bring repair kit",
    actionDetail: "Secure the line before the afternoon tide.",
    confidence: 93,
    image: "damage"
  }
];

const state = {
  sessionStartedAt: new Date().toISOString(),
  initialChoices: [],
  finalChoices: [],
  initialDecisionSeconds: null,
  reportReviewSeconds: null,
  stageStartedAt: Date.now(),
  response: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function scanArt(type) {
  const base = `<rect width="180" height="120" fill="#315b5c"/><path d="M-10 26 Q40 5 90 27 T190 25 M-10 55 Q45 31 90 56 T190 54 M-10 88 Q42 68 95 89 T190 87" fill="none" stroke="#8fb6ae" stroke-width="1" opacity=".32"/>`;
  const cages = `<path d="M20 73 L78 56 L155 72 L93 95 Z M78 56 L78 82 M155 72 L154 94 M20 73 L22 96 M22 96 L93 111 L154 94" fill="#27484a" stroke="#9bc0b4" stroke-width="1.2" opacity=".9"/><path d="M37 69 L106 91 M55 64 L123 87 M76 59 L142 80 M41 100 L103 78 M65 105 L126 83 M90 110 L148 89" stroke="#82a99f" stroke-width=".8" opacity=".65"/>`;
  let marks = "";
  if (type === "mortality") marks = `<g fill="none" stroke="#e8bf9f" stroke-width="2"><ellipse cx="60" cy="79" rx="8" ry="4" transform="rotate(14 60 79)"/><ellipse cx="91" cy="86" rx="8" ry="4" transform="rotate(-8 91 86)"/><ellipse cx="117" cy="78" rx="7" ry="3.5" transform="rotate(11 117 78)"/></g><circle cx="60" cy="79" r="13" fill="none" stroke="#e66c5b" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  if (type === "fouling") marks = `<g fill="#7aa47c" opacity=".8"><circle cx="61" cy="70" r="8"/><circle cx="69" cy="76" r="9"/><circle cx="82" cy="80" r="7"/><circle cx="117" cy="82" r="9"/><circle cx="127" cy="87" r="7"/></g>`;
  if (type === "damage") marks = `<path d="M22 96 L93 111 L154 83" fill="none" stroke="#ef8e70" stroke-width="2.2"/><path d="M147 77 l14 12 M161 77 l-14 12" stroke="#ef8e70" stroke-width="2"/>`;
  if (type === "clear") marks = `<g fill="#c9ded4" opacity=".55"><circle cx="57" cy="78" r="2"/><circle cx="87" cy="86" r="2"/><circle cx="116" cy="79" r="2"/></g>`;
  return `<svg viewBox="0 0 180 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${base}${cages}${marks}<path d="M8 13h19M8 13v10M172 13h-19M172 13v10" stroke="#b7d2ca" opacity=".7"/></svg>`;
}

function zoneCard(zone) {
  return `
    <button class="zone-card" type="button" data-zone="${zone.id}" aria-pressed="false">
      <div class="zone-title"><b>${zone.id}</b><span>${zone.name}</span></div>
      <div class="rack-lines" aria-hidden="true"></div>
      <p>${zone.note}</p>
      <small>${zone.history}</small>
    </button>`;
}

function reportRow(zone) {
  const priority = zone.level === "red" ? "Inspect first" : zone.level === "yellow" ? "Check soon" : "Routine";
  return `
    <article class="report-row" data-level="${zone.level}">
      <div class="report-zone"><b>${zone.id}</b><small>${zone.name}</small></div>
      <div class="scan-thumb">${scanArt(zone.image)}<span>Example scan</span></div>
      <div class="finding"><small>Visible finding</small><strong>${zone.finding}</strong><p>${zone.detail}</p></div>
      <div class="action"><small>Recommended next step</small><strong>${zone.action}</strong><p>${zone.actionDetail}</p></div>
      <div class="confidence"><small>${priority} · Confidence</small><div class="confidence-bar"><i style="width:${zone.confidence}%"></i></div><b>${zone.confidence}%</b></div>
    </article>`;
}

function finalChoiceCard(zone) {
  const label = zone.level === "red" ? "Inspect first" : zone.level === "yellow" ? "Check soon" : "Routine";
  return `
    <button class="choice-card" type="button" data-zone="${zone.id}" aria-pressed="false">
      <i class="mini-status ${zone.level}"></i>
      <b>Zone ${zone.id}</b>
      <small>${zone.name}</small>
      <em>${label}</em>
    </button>`;
}

function render() {
  $("#initial-zone-grid").innerHTML = ZONES.map(zoneCard).join("");
  const sorted = [...ZONES].sort((a, b) => ({ red: 0, yellow: 1, green: 2 })[a.level] - ({ red: 0, yellow: 1, green: 2 })[b.level]);
  $("#report-list").innerHTML = sorted.map(reportRow).join("");
  $("#final-choice-grid").innerHTML = ZONES.map(finalChoiceCard).join("");
}

function toggleChoice(stage, id) {
  const key = stage === "initial" ? "initialChoices" : "finalChoices";
  const choices = state[key];
  const index = choices.indexOf(id);
  if (index >= 0) {
    choices.splice(index, 1);
  } else if (choices.length < 2) {
    choices.push(id);
  } else {
    showToast("You can inspect only two zones today.");
    return;
  }
  updateChoices(stage);
}

function updateChoices(stage) {
  const key = stage === "initial" ? "initialChoices" : "finalChoices";
  const choices = state[key];
  const root = stage === "initial" ? $("#initial-zone-grid") : $("#final-choice-grid");
  const counter = stage === "initial" ? $("#initial-counter") : $("#final-counter");
  const button = stage === "initial" ? $("#show-report") : $("#compare-button");
  const helper = stage === "initial" ? $("#initial-helper") : $("#final-helper");
  $$('[data-zone]', root).forEach(card => {
    const selected = choices.includes(card.dataset.zone);
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });
  $("strong", counter).textContent = choices.length;
  counter.classList.toggle("is-ready", choices.length === 2);
  button.disabled = choices.length !== 2;
  helper.textContent = choices.length === 2 ? `Zones ${choices.join(" and ")} selected.` : `Select ${2 - choices.length} more zone${choices.length === 1 ? "" : "s"} to continue.`;
}

function showStage(number) {
  $$(".stage").forEach(stage => stage.classList.remove("is-visible"));
  $(`#stage-${["one", "two", "three"][number - 1]}`).classList.add("is-visible");
  $$("[data-step-indicator]").forEach(step => {
    const stepNumber = Number(step.dataset.stepIndicator);
    step.classList.toggle("is-active", stepNumber === number);
    step.classList.toggle("is-complete", stepNumber < number);
    if (stepNumber < number) $("span", step).textContent = "✓";
  });
  state.stageStartedAt = Date.now();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showComparison() {
  const initial = state.initialChoices.map(id => ZONES.find(zone => zone.id === id));
  const final = state.finalChoices.map(id => ZONES.find(zone => zone.id === id));
  const summary = (title, zones) => `
    <div class="choice-summary">
      <small>${title}</small>
      <div class="summary-zones">
        ${zones.map(zone => `<div class="summary-zone"><b>${zone.id}</b><span>${zone.name}</span></div>`).join("")}
      </div>
    </div>`;
  $("#comparison").innerHTML = `${summary("Before the report", initial)}<span class="comparison-arrow" aria-hidden="true">→</span>${summary("After the report", final)}`;
  const changed = [...state.initialChoices].sort().join() !== [...state.finalChoices].sort().join();
  const priorityChosen = state.finalChoices.filter(id => ["D", "F"].includes(id)).length;
  $("#change-callout").innerHTML = changed
    ? `<i></i><span>You changed your plan after seeing the report${priorityChosen === 2 ? " and selected both high-priority zones" : ""}.</span>`
    : `<i></i><span>You kept your original plan after seeing the report.</span>`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function resetSession() {
  if (!window.confirm("Start over and clear the current interview response?")) return;
  localStorage.removeItem("farmSignalCurrentResponse");
  window.location.reload();
}

function formValues(form) {
  const data = new FormData(form);
  return {
    influence: data.get("influence"),
    usefulness: Number(data.get("usefulness")),
    commitment: data.get("commitment"),
    willingToShare: data.getAll("share"),
    name: (data.get("name") || "").trim(),
    contact: (data.get("contact") || "").trim()
  };
}

function validateCommitment(response) {
  if (response.commitment === "no") return true;
  if (!response.name || !response.contact) {
    showToast("Add your name and contact information for a follow-up.");
    $("input[name='name']").focus();
    return false;
  }
  if (response.commitment === "pilot" && response.willingToShare.length === 0) {
    showToast("Choose at least one item you could share for a pilot.");
    return false;
  }
  return true;
}

function saveResponse(response) {
  const changedPlan = [...state.initialChoices].sort().join() !== [...state.finalChoices].sort().join();
  state.response = {
    ...response,
    submittedAt: new Date().toISOString(),
    changedPlan,
    strongPilotSignal: response.commitment === "pilot" && response.willingToShare.length > 0 && Boolean(response.contact)
  };
  const result = {
    prototype: "FarmSignal oyster inspection decision test",
    sessionStartedAt: state.sessionStartedAt,
    scenario: "Pemaquid Reach · October 14 · two-zone crew limit",
    initialChoices: state.initialChoices,
    finalChoices: state.finalChoices,
    initialDecisionSeconds: state.initialDecisionSeconds,
    reportReviewSeconds: state.reportReviewSeconds,
    ...state.response
  };
  localStorage.setItem("farmSignalCurrentResponse", JSON.stringify(result));
  const history = JSON.parse(localStorage.getItem("farmSignalStudyHistory") || "[]");
  history.push(result);
  localStorage.setItem("farmSignalStudyHistory", JSON.stringify(history));
  return result;
}

function showThankYou(result) {
  $$(".stage").forEach(stage => stage.classList.remove("is-visible"));
  $("#thank-you").classList.add("is-visible");
  $$("[data-step-indicator]").forEach(step => {
    step.classList.remove("is-active");
    step.classList.add("is-complete");
    $("span", step).textContent = "✓";
  });
  const isStrong = result.strongPilotSignal;
  const isFollowUp = result.commitment === "follow-up";
  $("#thank-you-copy").textContent = isStrong
    ? "You recorded a concrete interest in testing the service. The researcher can follow up using the details you provided."
    : isFollowUp
      ? "You requested a follow-up conversation. The researcher can use it to understand what you would need before a pilot."
      : "Your honest response is useful—even a no helps determine whether this problem is worth pursuing.";
  $("#signal-card").innerHTML = `
    <strong>${isStrong ? "Strong pilot signal" : isFollowUp ? "Follow-up signal" : "No pilot signal yet"}</strong>
    <span>${isStrong ? `Willing to share: ${result.willingToShare.join(", ")}.` : isFollowUp ? "Interested enough to invest time in another conversation." : "The service did not earn a next step in this interview."}</span>`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function downloadResult() {
  const result = localStorage.getItem("farmSignalCurrentResponse");
  if (!result) return;
  const blob = new Blob([result], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `farmsignal-session-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

render();

$("#initial-zone-grid").addEventListener("click", event => {
  const card = event.target.closest("[data-zone]");
  if (card) toggleChoice("initial", card.dataset.zone);
});

$("#final-choice-grid").addEventListener("click", event => {
  const card = event.target.closest("[data-zone]");
  if (card) toggleChoice("final", card.dataset.zone);
});

$("#show-report").addEventListener("click", () => {
  state.initialDecisionSeconds = Math.round((Date.now() - state.stageStartedAt) / 1000);
  showStage(2);
});

$("#compare-button").addEventListener("click", () => {
  state.reportReviewSeconds = Math.round((Date.now() - state.stageStartedAt) / 1000);
  showComparison();
  showStage(3);
});

$$('input[name="commitment"]').forEach(input => input.addEventListener("change", event => {
  const needsDetails = event.target.value !== "no";
  $("#pilot-details").hidden = !needsDetails;
  $("input[name='name']").required = needsDetails;
  $("input[name='contact']").required = needsDetails;
}));

$("#response-form").addEventListener("submit", event => {
  event.preventDefault();
  const response = formValues(event.currentTarget);
  if (!validateCommitment(response)) return;
  const result = saveResponse(response);
  showThankYou(result);
});

$("#download-button").addEventListener("click", downloadResult);
$("#new-session-button").addEventListener("click", resetSession);
$("#reset-button").addEventListener("click", resetSession);

