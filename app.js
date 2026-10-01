const ZONE_NAMES = [
  "North Flats", "Cedar Bend", "East Channel", "Deep Pocket", "South Shoal", "Outer Reach",
  "Harbor Edge", "Long Ledge", "West Basin", "Gull Point", "Inner Bar", "Far Channel"
];

const ISSUE_PROFILES = {
  mortality: {
    label: "Possible mortality increase",
    shortLabel: "Mortality signal",
    detail: "The sample shows more gaping and motionless shells than the surrounding rows.",
    recommendation: "Count live and dead oysters in three sample cages",
    actionDetail: "Photograph each sample, record the cage number, and compare mortality with the last inspection before moving or grading stock.",
    photo: "assets/scan-mortality.jpg",
    basePriority: 94,
    duration: 75
  },
  fouling: {
    label: "Heavy biofouling visible",
    shortLabel: "Flow restriction",
    detail: "Marine growth appears to be reducing open mesh and water flow through the gear.",
    recommendation: "Check flow and clean the heaviest cage row",
    actionDetail: "Lift two outside cages first. Flip or clean the row if mesh blockage matches the sample image.",
    photo: "assets/scan-fouling.jpg",
    basePriority: 72,
    duration: 55
  },
  equipment: {
    label: "Possible gear displacement",
    shortLabel: "Gear alignment",
    detail: "One cage and its support line appear slack and out of alignment with the adjacent row.",
    recommendation: "Inspect the line and bring the repair kit",
    actionDetail: "Check knots, clips, and anchor tension before the next high-energy tide. Secure loose gear before servicing stock.",
    photo: "assets/scan-equipment.jpg",
    basePriority: 88,
    duration: 60
  },
  healthy: {
    label: "No visible issue",
    shortLabel: "Normal conditions",
    detail: "Cages appear aligned with open mesh, closed shells, and no unusual accumulation.",
    recommendation: "Keep this zone on its normal inspection rotation",
    actionDetail: "No extra crew time is recommended today. Recheck during the next scheduled rotation.",
    photo: "assets/scan-healthy.jpg",
    basePriority: 24,
    duration: 30
  }
};

const state = { config: null, zones: [], conditions: null, generation: 0, commitment: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed) {
  return function random() {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random, min, max, decimals = 0) {
  const value = min + random() * (max - min);
  return Number(value.toFixed(decimals));
}

function shuffle(array, random) {
  const output = [...array];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

function issueMix(count, random) {
  const base = count === 2
    ? ["mortality", "healthy"]
    : count === 3
      ? ["mortality", "fouling", "healthy"]
      : ["mortality", "equipment", "fouling", "healthy"];
  while (base.length < count) {
    const draw = random();
    base.push(draw < .48 ? "healthy" : draw < .72 ? "fouling" : draw < .9 ? "equipment" : "mortality");
  }
  return shuffle(base, random);
}

function buildZones(config) {
  const seed = hashString(`${config.farmName}|${config.location}|${config.zoneCount}|${state.generation}`);
  const random = randomFromSeed(seed);
  const issues = issueMix(config.zoneCount, random);
  const rawAreas = Array.from({ length: config.zoneCount }, () => between(random, .65, 1.35, 3));
  const areaTotal = rawAreas.reduce((sum, value) => sum + value, 0);

  return issues.map((issue, index) => {
    const profile = ISSUE_PROFILES[issue];
    const acres = Number((config.acres * rawAreas[index] / areaTotal).toFixed(1));
    const mortality = issue === "mortality" ? between(random, 13, 24, 1) : issue === "fouling" ? between(random, 5, 10, 1) : issue === "equipment" ? between(random, 3, 8, 1) : between(random, 1.2, 3.8, 1);
    const survival = Number((100 - mortality).toFixed(1));
    const fouling = issue === "fouling" ? between(random, 68, 92) : issue === "healthy" ? between(random, 5, 19) : between(random, 18, 48);
    const oysters = Math.max(3500, Math.round(acres * between(random, 28000, 46000) / 100) * 100);
    const averageSize = between(random, 44, 84);
    const priorityScore = Math.min(99, Math.round(profile.basePriority + between(random, -6, 5)));
    let status = "green";
    if (issue === "mortality" || (issue === "equipment" && priorityScore > 87)) status = "red";
    else if (issue !== "healthy") status = "yellow";
    const confidence = issue === "healthy" ? between(random, 83, 95) : between(random, 74, 94);
    const trend = issue === "mortality" ? between(random, -14, -7) : issue === "fouling" ? between(random, -7, -2) : issue === "healthy" ? between(random, 1, 6) : between(random, -4, 1);
    return {
      id: String.fromCharCode(65 + index),
      name: ZONE_NAMES[index],
      issue,
      acres,
      oysters,
      mortality,
      survival,
      fouling,
      averageSize,
      priorityScore,
      status,
      confidence,
      trend,
      gearCondition: issue === "equipment" ? "Needs inspection" : issue === "healthy" ? "Secure" : "No visible shift",
      scanMinute: 7 + index * 11 + Math.floor(random() * 5),
      imagePosition: `${between(random, 38, 62)}% ${between(random, 38, 62)}%`,
      ...profile
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

function buildConditions(config) {
  const random = randomFromSeed(hashString(`${config.location}|weather|${state.generation}`));
  const waterTemp = between(random, 49, 66);
  const tideHour = between(random, 7, 11);
  const tideMinute = [5, 18, 27, 42, 51][Math.floor(random() * 5)];
  return {
    tide: `Low ${tideHour}:${String(tideMinute).padStart(2, "0")} AM`,
    water: `${waterTemp}°F · ${random() > .45 ? "Murky" : "Fair"} visibility`,
    weather: `${random() > .5 ? "Cloudy" : "Partly cloudy"} · ${between(random, 5, 13)} kt`,
    coverage: `${between(random, 91, 98)}% of gear sampled`
  };
}

function showView(id) {
  $$(".view").forEach(view => view.classList.toggle("is-visible", view.id === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function readConfig() {
  const data = new FormData($("#farm-form"));
  return {
    farmName: data.get("farmName").trim(),
    location: data.get("location").trim(),
    acres: Number(data.get("acres")),
    zoneCount: Number(data.get("zoneCount")),
    gear: data.get("gear"),
    crewHours: Number(data.get("crewHours"))
  };
}

function saveConfig(config) {
  localStorage.setItem("farmSignalSetup", JSON.stringify(config));
}

function loadSavedConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem("farmSignalSetup"));
    if (!saved) return;
    $("#farm-name").value = saved.farmName || "";
    $("#farm-location").value = saved.location || "";
    $("#farm-acres").value = saved.acres || 12;
    $("#zone-count").value = saved.zoneCount || 6;
    $("#gear-type").value = saved.gear || "Floating cages";
    $("#crew-hours").value = saved.crewHours || 4;
  } catch (_) {
    localStorage.removeItem("farmSignalSetup");
  }
}

function runLoadingSequence(callback) {
  const steps = [
    [18, "Mapping your growing zones…", "Dividing the lease into inspection areas."],
    [46, "Estimating visible stock…", "Creating sample oyster counts and survival indicators."],
    [73, "Checking for visible changes…", "Comparing mortality, fouling, and gear cues."],
    [100, "Building your crew plan…", "Ranking zones by urgency and practical next step."]
  ];
  showView("loading-view");
  let index = 0;
  const advance = () => {
    const [progress, title, copy] = steps[index];
    $("#loading-progress").style.width = `${progress}%`;
    $("#loading-title").textContent = title;
    $("#loading-copy").textContent = copy;
    index += 1;
    if (index < steps.length) setTimeout(advance, 430);
    else setTimeout(callback, 500);
  };
  advance();
}

function statusLabel(status) {
  return status === "red" ? "Inspect first" : status === "yellow" ? "Check soon" : "Routine";
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function conditionMarkup(icon, label, value) {
  return `<div class="condition"><span aria-hidden="true">${icon}</span><div><small>${label}</small><b>${value}</b></div></div>`;
}

function renderConditions() {
  const conditions = state.conditions;
  $("#conditions-bar").innerHTML = [
    conditionMarkup("↕", "Tide window", conditions.tide),
    conditionMarkup("≈", "Water", conditions.water),
    conditionMarkup("◒", "Surface", conditions.weather),
    conditionMarkup("◎", "Sample coverage", conditions.coverage)
  ].join("");
}

function renderMetrics() {
  const totalOysters = state.zones.reduce((sum, zone) => sum + zone.oysters, 0);
  const liveEstimate = state.zones.reduce((sum, zone) => sum + zone.oysters * zone.survival / 100, 0);
  const overallSurvival = liveEstimate / totalOysters * 100;
  const urgent = state.zones.filter(zone => zone.status === "red").length;
  const attention = state.zones.filter(zone => zone.status !== "green").length;
  const harvestReady = state.zones.reduce((sum, zone) => sum + (zone.averageSize >= 70 ? zone.oysters * zone.survival / 100 : 0), 0);
  const cards = [
    ["Estimated live stock", formatCount(Math.round(liveEstimate / 100) * 100), `Across ${state.config.zoneCount} sample zones`, ""],
    ["Estimated survival", `${overallSurvival.toFixed(1)}%`, "Based on visible sample cues", ""],
    ["Zones needing attention", `${attention} of ${state.config.zoneCount}`, urgent ? `${urgent} marked inspect first` : "No urgent zone in this sample", attention ? "attention" : ""],
    ["Near harvest size", formatCount(Math.round(harvestReady / 100) * 100), "Oysters in zones averaging 70mm+", ""]
  ];
  $("#metric-grid").innerHTML = cards.map(([label, value, note, className]) => `<article class="metric-card ${className}"><small>${label}</small><strong>${value}</strong><p>${note}</p><i aria-hidden="true"></i></article>`).join("");
}

function renderCrewPlan() {
  const priority = [...state.zones].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, Math.min(2, state.zones.length));
  $("#crew-plan").innerHTML = priority.map((zone, index) => `
    <article class="crew-task">
      <span class="task-order">${index + 1}</span>
      <div><small>Zone ${zone.id} · ${zone.name}</small><h3>${zone.recommendation}</h3><p>${zone.detail}</p></div>
      <span class="task-time">≈ ${zone.duration} min</span>
    </article>`).join("");
}

function renderMap() {
  $("#map-location").textContent = state.config.location;
  $("#map-acres").textContent = `${state.config.acres} acres`;
  $("#map-zones").textContent = state.config.zoneCount;
  $("#map-gear").textContent = state.config.gear;
  $("#zone-map-grid").innerHTML = state.zones.map(zone => `
    <button class="map-zone" type="button" data-zone-id="${zone.id}" data-status="${zone.status}" aria-label="Open report for Zone ${zone.id}, ${zone.name}">
      <span class="zone-letter">${zone.id}</span><i class="zone-status ${zone.status}"></i><b>${zone.name}</b><small>${zone.acres} acres · ${formatCount(zone.oysters)} oysters</small><div class="mini-bars" aria-hidden="true"></div><em>${statusLabel(zone.status)}</em>
    </button>`).join("");
}

function reportMarkup(zone) {
  return `
    <article class="zone-report" data-attention="${zone.status !== "green"}">
      <div class="report-photo">
        <img src="${zone.photo}" style="object-position:${zone.imagePosition}" alt="Simulated scan showing ${zone.label.toLowerCase()} in Zone ${zone.id}" />
        <div class="image-overlay"></div><span class="scan-label">Simulated scan · Zone ${zone.id}</span>
        <div class="photo-finding"><small>Visible finding</small><b>${zone.label}</b></div><span class="photo-time">Frame ${String(zone.scanMinute).padStart(2,"0")}:24</span>
      </div>
      <div class="report-body">
        <div class="report-heading"><div><h3>Zone ${zone.id} · ${zone.name}</h3><p>${zone.acres} acres · ${state.config.gear}</p></div><span class="status-pill ${zone.status}">${statusLabel(zone.status)}</span></div>
        <div class="zone-metrics"><div><small>Live stock est.</small><b>${formatCount(Math.round(zone.oysters * zone.survival / 100 / 100) * 100)}</b></div><div><small>Survival est.</small><b>${zone.survival}%</b></div><div><small>Avg. size</small><b>${zone.averageSize} mm</b></div></div>
        <div class="recommendation"><span>→</span><div><small>Recommended next step</small><p>${zone.recommendation}</p></div></div>
        <button class="open-report" type="button" data-zone-id="${zone.id}">View evidence and full action</button>
      </div>
    </article>`;
}

function renderReports(filter = "all") {
  const zones = filter === "attention" ? state.zones.filter(zone => zone.status !== "green") : state.zones;
  $("#zone-report-grid").innerHTML = zones.map(reportMarkup).join("");
}

function renderDashboard() {
  const config = state.config;
  $("#dashboard-farm-name").textContent = config.farmName;
  $("#dashboard-location").textContent = config.location;
  $("#dashboard-acres").textContent = `${config.acres} acres`;
  $("#dashboard-gear").textContent = config.gear;
  $("#crew-window-label").textContent = config.crewHours === 8 ? "full-day" : `${config.crewHours}-hour`;
  $("#scan-time").textContent = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());
  renderConditions();
  renderMetrics();
  renderCrewPlan();
  renderMap();
  renderReports();
  $("#edit-setup").hidden = false;
  showView("dashboard-view");
}

function generateReport(showLoader = true) {
  state.zones = buildZones(state.config);
  state.conditions = buildConditions(state.config);
  state.commitment = null;
  $("#commitment-box").hidden = false;
  $("#pilot-form").hidden = true;
  $("#commitment-result").hidden = true;
  if (showLoader) runLoadingSequence(renderDashboard);
  else renderDashboard();
}

function openZone(id) {
  const zone = state.zones.find(item => item.id === id);
  if (!zone) return;
  $("#modal-content").innerHTML = `
    <div class="modal-photo"><img src="${zone.photo}" style="object-position:${zone.imagePosition}" alt="Simulated underwater evidence for Zone ${zone.id}" /></div>
    <div class="modal-body">
      <div class="modal-title-row"><div><p class="eyebrow">Zone ${zone.id} evidence</p><h2 id="modal-title">${zone.name}</h2></div><span class="status-pill ${zone.status}">${statusLabel(zone.status)}</span></div>
      <p>${zone.detail} This fictional finding is shown at ${zone.confidence}% sample confidence and should always be confirmed in person.</p>
      <div class="modal-data"><div><small>Estimated oysters</small><b>${formatCount(zone.oysters)}</b></div><div><small>Mortality signal</small><b>${zone.mortality}%</b></div><div><small>Mesh fouling</small><b>${zone.fouling}%</b></div><div><small>Gear condition</small><b>${zone.gearCondition}</b></div></div>
      <div class="modal-action"><small>Recommended crew action</small><b>${zone.recommendation}</b><p>${zone.actionDetail}</p></div>
    </div>`;
  $("#zone-modal").hidden = false;
  document.body.style.overflow = "hidden";
  $(".modal-close").focus();
}

function closeModal() {
  $("#zone-modal").hidden = true;
  document.body.style.overflow = "";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2300);
}

$("#farm-form").addEventListener("submit", event => {
  event.preventDefault();
  state.config = readConfig();
  state.generation = 0;
  saveConfig(state.config);
  generateReport(true);
});

$("#edit-setup").addEventListener("click", () => {
  $("#edit-setup").hidden = true;
  showView("setup-view");
});

$("#regenerate-button").addEventListener("click", () => {
  state.generation += 1;
  generateReport(true);
});

$("#zone-map-grid").addEventListener("click", event => {
  const button = event.target.closest("[data-zone-id]");
  if (button) openZone(button.dataset.zoneId);
});

$("#zone-report-grid").addEventListener("click", event => {
  const button = event.target.closest("[data-zone-id]");
  if (button) openZone(button.dataset.zoneId);
});

$(".report-filter").addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  $$("[data-filter]", event.currentTarget).forEach(item => item.classList.toggle("is-active", item === button));
  renderReports(button.dataset.filter);
});

$("#zone-modal").addEventListener("click", event => {
  if (event.target.closest("[data-close-modal]")) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#zone-modal").hidden) closeModal();
});

$("#commitment-box").addEventListener("click", event => {
  const button = event.target.closest("[data-commitment]");
  if (!button) return;
  state.commitment = button.dataset.commitment;
  if (state.commitment === "no") {
    $("#commitment-box").hidden = true;
    const result = $("#commitment-result");
    result.hidden = false;
    result.innerHTML = "<b>Thank you for the honest answer.</b><p>Knowing that this would not change your workflow is exactly the kind of signal this prototype is meant to collect.</p>";
    localStorage.setItem("farmSignalCommitment", JSON.stringify({ type: "no", farm: state.config, submittedAt: new Date().toISOString() }));
  } else {
    $("#commitment-box").hidden = true;
    $("#pilot-form").hidden = false;
    $("#pilot-form input").focus();
  }
});

$("#pilot-form").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const shared = data.getAll("share");
  if (state.commitment === "pilot" && shared.length === 0) {
    showToast("Choose at least one item you could share for a pilot.");
    return;
  }
  const response = { type: state.commitment, name: data.get("name").trim(), contact: data.get("contact").trim(), shared, farm: state.config, submittedAt: new Date().toISOString() };
  localStorage.setItem("farmSignalCommitment", JSON.stringify(response));
  event.currentTarget.hidden = true;
  const result = $("#commitment-result");
  result.hidden = false;
  result.innerHTML = state.commitment === "pilot"
    ? `<b>Pilot interest recorded.</b><p>You offered to share ${shared.join(", ").toLowerCase()}. Please tell the interviewer so they can follow up.</p>`
    : "<b>Follow-up interest recorded.</b><p>Please tell the interviewer you would be open to a 20-minute conversation.</p>";
});

loadSavedConfig();

if (new URLSearchParams(window.location.search).get("demo") === "1") {
  state.config = readConfig();
  state.zones = buildZones(state.config);
  state.conditions = buildConditions(state.config);
  renderDashboard();
}
