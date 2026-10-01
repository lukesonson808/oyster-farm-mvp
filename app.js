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
    detectionMethod: "Shell-state classification + repeated-frame comparison",
    limitation: "A camera can flag visible gaping or empty shells, but it cannot diagnose disease or confirm death. A physical sample is required.",
    detectionIcon: "◉",
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
    detectionMethod: "Mesh segmentation + obstruction estimate",
    limitation: "Low visibility and dense oyster clusters can hide parts of the mesh. The obstruction estimate applies only to visible surfaces.",
    detectionIcon: "≋",
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
    detectionMethod: "Cage geometry + line-angle change detection",
    limitation: "The scan can show shape and alignment changes, but it cannot measure line tension or inspect anchors below the sediment.",
    detectionIcon: "⌁",
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
    detectionMethod: "Baseline comparison across shell, mesh, and gear cues",
    limitation: "No visible issue does not mean no issue exists. Hidden mortality, disease, and water-quality problems require hands-on or lab checks.",
    detectionIcon: "✓",
    photo: "assets/scan-healthy.jpg",
    basePriority: 24,
    duration: 30
  }
};

const state = { config: null, zones: [], conditions: null, generation: 0, commitment: null, mapCenter: null, locationMatch: null, locationSource: null };
let leaseMap = null;
let leaseLayers = null;
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
    const zone = {
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
    const podCount = Math.max(3, Math.min(8, Math.round(acres * 3.5)));
    const anomalyIndex = Math.floor(random() * podCount);
    zone.pods = Array.from({ length: podCount }, (_, podIndex) => {
      const isPrimary = podIndex === anomalyIndex;
      const podIssue = isPrimary ? issue : "healthy";
      const podProfile = ISSUE_PROFILES[podIssue];
      const podStatus = isPrimary ? status : (issue !== "healthy" && podIndex === (anomalyIndex + 1) % podCount ? "yellow" : "green");
      const podOysters = Math.max(700, Math.round((oysters / podCount) * between(random, .86, 1.14) / 10) * 10);
      const podMortality = isPrimary ? mortality : between(random, 1.1, Math.min(5.2, mortality), 1);
      return {
        id: `${zone.id}-${String(podIndex + 1).padStart(2, "0")}`,
        index: podIndex,
        issue: podIssue,
        status: podStatus,
        oysters: podOysters,
        mortality: podMortality,
        survival: Number((100 - podMortality).toFixed(1)),
        fouling: isPrimary ? fouling : between(random, 4, 24),
        averageSize: Math.max(35, averageSize + between(random, -5, 5)),
        confidence: isPrimary ? confidence : between(random, 81, 95),
        priorityScore: isPrimary ? priorityScore : between(random, 18, 42),
        ...podProfile
      };
    });
    return zone;
  }).sort((a, b) => a.id.localeCompare(b.id));
}

async function resolveFarmLocation(config) {
  const cacheKey = `farmSignalGeo:${config.location.toLowerCase()}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached?.center) return cached;
  } catch (_) {
    localStorage.removeItem(cacheKey);
  }

  try {
    const query = encodeURIComponent(config.location);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${query}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Location lookup returned ${response.status}`);
    const [match] = await response.json();
    if (!match) throw new Error("No location match");
    const result = {
      center: [Number(match.lat), Number(match.lon)],
      label: match.display_name.split(",").slice(0, 3).join(","),
      source: "Location name match"
    };
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (_) {
    const isMaine = /maine|\bme\b/i.test(config.location);
    return {
      center: isMaine ? [44.03, -69.52] : [41.5, -71.3],
      label: `${config.location} (demonstration center)`,
      source: "Fallback demo location"
    };
  }
}

function rotatePoint(x, y, angle) {
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
}

function metersToCoordinate(center, xMeters, yMeters) {
  const latitude = center[0] + yMeters / 111320;
  const longitude = center[1] + xMeters / (111320 * Math.cos(center[0] * Math.PI / 180));
  return [latitude, longitude];
}

function positionCages() {
  if (!state.mapCenter || !state.config) return;
  const random = randomFromSeed(hashString(`${state.config.farmName}|layout|${state.config.zoneCount}`));
  const areaSqMeters = Math.max(2000, state.config.acres * 4046.86);
  const aspect = 1.65;
  const leaseWidth = Math.sqrt(areaSqMeters * aspect);
  const leaseHeight = areaSqMeters / leaseWidth;
  const columns = Math.ceil(Math.sqrt(state.config.zoneCount * aspect));
  const rows = Math.ceil(state.config.zoneCount / columns);
  const cellWidth = leaseWidth / columns;
  const cellHeight = leaseHeight / rows;
  const angle = ((hashString(state.config.location) % 44) - 22) * Math.PI / 180;

  const leaseCorners = [[-leaseWidth / 2, -leaseHeight / 2], [leaseWidth / 2, -leaseHeight / 2], [leaseWidth / 2, leaseHeight / 2], [-leaseWidth / 2, leaseHeight / 2]];
  state.leaseBoundary = leaseCorners.map(([x, y]) => {
    const [rx, ry] = rotatePoint(x, y, angle);
    return metersToCoordinate(state.mapCenter, rx, ry);
  });

  state.zones.forEach((zone, zoneIndex) => {
    const column = zoneIndex % columns;
    const row = Math.floor(zoneIndex / columns);
    const zoneX = -leaseWidth / 2 + (column + .5) * cellWidth;
    const zoneY = leaseHeight / 2 - (row + .5) * cellHeight;
    const halfWidth = cellWidth * .42;
    const halfHeight = cellHeight * .38;
    const corners = [[-halfWidth, -halfHeight], [halfWidth, -halfHeight], [halfWidth, halfHeight], [-halfWidth, halfHeight]];
    zone.boundary = corners.map(([x, y]) => {
      const [rx, ry] = rotatePoint(zoneX + x, zoneY + y, angle);
      return metersToCoordinate(state.mapCenter, rx, ry);
    });

    const podColumns = Math.ceil(zone.pods.length / 2);
    zone.pods.forEach((pod, podIndex) => {
      const podColumn = podIndex % podColumns;
      const podRow = Math.floor(podIndex / podColumns);
      const x = zoneX - halfWidth * .72 + (podColumns === 1 ? 0 : podColumn * halfWidth * 1.44 / (podColumns - 1));
      const y = zoneY + (podRow === 0 ? halfHeight * .42 : -halfHeight * .42);
      const [rx, ry] = rotatePoint(x + between(random, -1.8, 1.8, 1), y + between(random, -1.5, 1.5, 1), angle);
      pod.coordinate = metersToCoordinate(state.mapCenter, rx, ry);
    });
  });
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

function evidenceFor(target) {
  if (target.issue === "mortality") return [
    ["Shell-state count", `${Math.max(8, Math.round(target.mortality * 1.25))} gaping / 100`, "Repeated open-shell shapes in the sample"],
    ["Change signal", `+${Math.max(5, Math.round(target.mortality - 3))}%`, "Above the fictional prior inspection baseline"],
    ["Frame agreement", "4 of 5 passes", "The cue persists across multiple viewing angles"]
  ];
  if (target.issue === "fouling") return [
    ["Mesh obstruction", `${target.fouling}%`, "Visible mesh area covered by marine growth"],
    ["Flow openings", `${Math.max(8, 100 - target.fouling)}% clear`, "Estimated open mesh remaining in the crop"],
    ["Spread", "3 cage faces", "Similar growth appears on multiple visible surfaces"]
  ];
  if (target.issue === "equipment") return [
    ["Cage tilt", `${Math.max(9, Math.round((target.priorityScore - 65) * .7))}°`, "Angle differs from neighboring gear"],
    ["Line sag", "Visible", "Support line falls below the expected row path"],
    ["Neighbor check", "2 cages aligned", "Adjacent cages provide the local geometry baseline"]
  ];
  return [
    ["Shell pattern", "Within baseline", "No unusual open-shell cluster detected"],
    ["Mesh opening", `${100 - target.fouling}% clear`, "Visible surfaces remain mostly unobstructed"],
    ["Gear alignment", "Consistent", "Cage and line geometry match neighboring gear"]
  ];
}

function actionTimeline(target) {
  if (target.issue === "mortality") return [
    ["At the dock", "Pack count sheets and sample bags", "Choose three cages across the flagged row so the crew does not only inspect the worst-looking spot."],
    ["This tide", "Confirm live/dead counts by hand", "Record shell state, odor, size class, and water observations. Do not treat the image flag as a diagnosis."],
    ["Afterward", "Compare and escalate if needed", "Photograph the same cages, update the mortality record, and contact a shellfish specialist if the spike is confirmed."]
  ];
  if (target.issue === "fouling") return [
    ["At the dock", "Bring cleaning and flipping gear", "Prioritize the outer face and the heaviest-looking cage before committing the full crew."],
    ["This tide", "Check water flow through two cages", "Confirm how much mesh is blocked, then clean or flip only the affected row."],
    ["This week", "Shorten the rotation if growth is confirmed", "Log fouling type and severity so the next visit occurs before flow is restricted again."]
  ];
  if (target.issue === "equipment") return [
    ["At the dock", "Bring clips, line, and the repair kit", "Approach the flagged cage before handling stock elsewhere in the zone."],
    ["This tide", "Check line, clips, door, and anchor direction", "Secure loose gear and compare its alignment with the two neighboring cages."],
    ["Before weather", "Document the repair and re-scan", "Save a post-repair image so future geometry checks use the corrected position as the baseline."]
  ];
  return [
    ["Today", "Keep the normal route", "Do not divert limited crew time here based on this sample."],
    ["Next rotation", "Revisit the same cage IDs", "Consistent repeat images make later change detection more useful."],
    ["Keep recording", "Log normal conditions too", "A good baseline helps the system distinguish true change from normal variation."]
  ];
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
  $("#crew-plan").innerHTML = priority.map((zone, index) => {
    const targetPod = [...zone.pods].sort((a, b) => b.priorityScore - a.priorityScore)[0];
    return `
    <article class="crew-task">
      <span class="task-order">${index + 1}</span>
      <div><small>Zone ${zone.id} · Cage ${targetPod.id} · ${zone.name}</small><h3>${zone.recommendation}</h3><p>${zone.detail}</p></div>
      <span class="task-time">≈ ${zone.duration} min</span>
    </article>`;
  }).join("");
}

function renderMap() {
  $("#map-location").textContent = state.config.location;
  $("#map-acres").textContent = `${state.config.acres} acres`;
  $("#map-zones").textContent = state.config.zoneCount;
  $("#map-pods").textContent = state.zones.reduce((sum, zone) => sum + zone.pods.length, 0);
  $("#map-gear").textContent = state.config.gear;
  $("#map-match-label").textContent = state.locationMatch || state.config.location;
  $("#map-coordinates").textContent = state.mapCenter ? `${state.mapCenter[0].toFixed(5)}, ${state.mapCenter[1].toFixed(5)} · ${state.locationSource}` : "Location unavailable";

  if (!window.L || !state.mapCenter) {
    $("#map-loading").innerHTML = "The geographic map could not load. Zone reports remain available below.";
    return;
  }

  if (!leaseMap) {
    leaseMap = L.map("lease-map", { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(leaseMap);
    leaseLayers = L.layerGroup().addTo(leaseMap);
    leaseMap.on("click", event => {
      state.mapCenter = [event.latlng.lat, event.latlng.lng];
      state.locationMatch = `User-placed lease near ${state.config.location}`;
      state.locationSource = "Moved on map";
      positionCages();
      renderMap();
      showToast("Sample lease center moved. Cage coordinates updated.");
    });
  }

  leaseLayers.clearLayers();
  const farmBoundary = L.polygon(state.leaseBoundary, {
    color: "#17332f", weight: 2, dashArray: "7 5", fillColor: "#7bb2a8", fillOpacity: .12
  }).addTo(leaseLayers);
  farmBoundary.bindTooltip(`${state.config.farmName} · sample lease boundary`, { sticky: true });

  state.zones.forEach(zone => {
    const zoneColor = zone.status === "red" ? "#c85143" : zone.status === "yellow" ? "#d39a28" : "#44856c";
    L.polygon(zone.boundary, { color: zoneColor, weight: 1.5, fillColor: zoneColor, fillOpacity: .08 })
      .bindTooltip(`Zone ${zone.id} · ${zone.name}`, { direction: "center", sticky: true, className: "zone-map-label" })
      .addTo(leaseLayers);
    zone.pods.forEach(pod => {
      const icon = L.divIcon({
        className: "cage-marker-shell",
        html: `<div class="cage-marker ${pod.status}">${pod.id}</div>`,
        iconSize: [45, 29], iconAnchor: [22, 14], popupAnchor: [0, -13]
      });
      const marker = L.marker(pod.coordinate, { icon, title: `Cage ${pod.id}` }).addTo(leaseLayers);
      marker.bindPopup(`<div class="cage-popup"><small>Zone ${zone.id} · Cage ${pod.id}</small><b>${pod.label}</b><p>${formatCount(pod.oysters)} oysters estimated · ${pod.confidence}% detection confidence</p><button type="button" data-map-zone="${zone.id}" data-map-pod="${pod.id}">Open cage evidence</button></div>`);
    });
  });

  leaseMap.fitBounds(farmBoundary.getBounds().pad(.45), { padding: [22, 22] });
  setTimeout(() => leaseMap.invalidateSize(), 0);
  $("#map-loading").hidden = true;
}

function renderDetectionPlaybook() {
  const types = ["mortality", "fouling", "equipment"];
  const cards = types.map(type => {
    const profile = ISSUE_PROFILES[type];
    const matchingZones = state.zones.filter(zone => zone.issue === type);
    const flagCount = matchingZones.reduce((sum, zone) => sum + zone.pods.filter(pod => pod.issue === type).length, 0);
    const signal = type === "mortality" ? "Open-shell shapes and change from baseline" : type === "fouling" ? "Visible mesh coverage and blocked openings" : "Cage angle, row alignment, and line sag";
    const verify = type === "mortality" ? "Hand-count a cage sample" : type === "fouling" ? "Lift and inspect both faces" : "Check clips, line tension, and anchor direction";
    return `<article class="detection-card ${type === "mortality" ? "red-card" : "yellow-card"}"><span>${profile.detectionIcon}</span><h3>${profile.label}</h3><p>${profile.detectionMethod}</p><dl><div><dt>Visible cue</dt><dd>${signal}</dd></div><div><dt>Sample flags</dt><dd>${flagCount} cage${flagCount === 1 ? "" : "s"} in this report</dd></div><div><dt>Human check</dt><dd>${verify}</dd></div></dl></article>`;
  });
  $("#detection-grid").innerHTML = cards.join("");
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
        <div class="report-heading"><div><h3>Zone ${zone.id} · ${zone.name}</h3><p>${zone.acres} acres · ${zone.pods.length} mapped cages · ${state.config.gear}</p></div><span class="status-pill ${zone.status}">${statusLabel(zone.status)}</span></div>
        <div class="zone-metrics"><div><small>Live stock est.</small><b>${formatCount(Math.round(zone.oysters * zone.survival / 100 / 100) * 100)}</b></div><div><small>Survival est.</small><b>${zone.survival}%</b></div><div><small>Avg. size</small><b>${zone.averageSize} mm</b></div></div>
        <div class="recommendation"><span>→</span><div><small>Recommended next step</small><p>${zone.recommendation}</p></div></div>
        <button class="open-report" type="button" data-zone-id="${zone.id}">View detection evidence and response plan</button>
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
  renderDetectionPlaybook();
  renderReports();
  $("#edit-setup").hidden = false;
  showView("dashboard-view");
  requestAnimationFrame(renderMap);
}

function generateReport(showLoader = true) {
  state.zones = buildZones(state.config);
  state.conditions = buildConditions(state.config);
  state.commitment = null;
  $("#commitment-box").hidden = false;
  $("#pilot-form").hidden = true;
  $("#commitment-result").hidden = true;
  const locationPromise = resolveFarmLocation(state.config);
  const finish = async () => {
    const location = await locationPromise;
    state.mapCenter = location.center;
    state.locationMatch = location.label;
    state.locationSource = location.source;
    positionCages();
    renderDashboard();
  };
  if (showLoader) runLoadingSequence(finish);
  else finish();
}

function openZone(id, podId = null) {
  const zone = state.zones.find(item => item.id === id);
  if (!zone) return;
  const primaryPod = [...zone.pods].sort((a, b) => b.priorityScore - a.priorityScore)[0];
  const pod = podId ? zone.pods.find(item => item.id === podId) : null;
  const target = pod || primaryPod;
  const isPod = Boolean(pod);
  const evidence = evidenceFor(target);
  const timeline = actionTimeline(target);
  const coordinate = target.coordinate || primaryPod.coordinate;
  const title = isPod ? `Cage ${target.id}` : `Zone ${zone.id} · ${zone.name}`;
  const subtitle = isPod ? `Zone ${zone.id} · ${zone.name}` : `${zone.pods.length} mapped cages · primary evidence from ${primaryPod.id}`;
  const gearCondition = target.issue === "equipment" ? "Needs inspection" : target.status === "green" ? "Secure" : zone.gearCondition;
  $("#modal-content").innerHTML = `
    <div class="modal-photo"><img src="${target.photo}" style="object-position:${zone.imagePosition}" alt="Simulated underwater evidence for ${title}" /><div class="modal-scan-overlay">${target.issue === "healthy" ? "" : `<span class="detection-box" data-label="${target.shortLabel}"></span>`}<span class="frame-meta">SIMULATED FRAME · ${target.confidence}% CUE CONFIDENCE</span></div></div>
    <div class="modal-body">
      <div class="modal-title-row"><div><p class="eyebrow">${subtitle}</p><h2 id="modal-title">${title}</h2></div><span class="status-pill ${target.status}">${statusLabel(target.status)}</span></div>
      ${coordinate ? `<span class="location-chip">⌖ ${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}</span>` : ""}
      <p>${target.detail} The system created this flag using <b>${target.detectionMethod.toLowerCase()}</b>.</p>
      <div class="modal-data"><div><small>Estimated oysters</small><b>${formatCount(isPod ? target.oysters : zone.oysters)}</b></div><div><small>Mortality signal</small><b>${target.mortality}%</b></div><div><small>Mesh fouling</small><b>${target.fouling}%</b></div><div><small>Gear condition</small><b>${gearCondition}</b></div></div>
      <div class="detection-explainer"><h3>Why the system flagged this</h3><div class="evidence-list">${evidence.map(([label, value, note]) => `<div class="evidence-item"><small>${label}</small><b>${value}</b><span>${note}</span></div>`).join("")}</div></div>
      <p class="diagnosis-note"><b>What the camera cannot confirm:</b> ${target.limitation}</p>
      <div class="modal-action"><small>Recommended first action</small><b>${target.recommendation}</b><p>${target.actionDetail}</p></div>
      <div class="action-timeline"><h3>Recommended response plan</h3>${timeline.map(([when, action, detail]) => `<div class="timeline-step"><span>${when}</span><div><b>${action}</b><p>${detail}</p></div></div>`).join("")}</div>
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

$("#lease-map").addEventListener("click", event => {
  const button = event.target.closest("[data-map-zone]");
  if (button) {
    event.stopPropagation();
    openZone(button.dataset.mapZone, button.dataset.mapPod);
  }
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
  generateReport(false);
}
