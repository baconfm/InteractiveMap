import { APP_CONFIG } from "../core/config.js";
import { expandRequests, plannerOptions, rankLootZones } from "../planner/ResourcePlanner.js";
import { resourceNameForId } from "../data/games/days-gone/crafting-recipes.js";

const STORAGE_KEY = "days-gone-wip-fast-travel-v1";

function readFastTravelPoints() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; } catch { return []; }
}

export function createPlannerPanel({ engine, map, markers, locationMarkers, overlayLayer, setMapClickHandler }) {
  const toggle = document.querySelector("#planner-toggle");
  const panel = document.querySelector("#resource-planner");
  if (!panel || !toggle) return;
  const close = document.querySelector("#planner-close");
  const request = document.querySelector("#planner-request");
  const quantity = document.querySelector("#planner-quantity");
  const add = document.querySelector("#planner-add");
  const requestsRoot = document.querySelector("#planner-requests");
  const setStart = document.querySelector("#planner-set-start");
  const startReadout = document.querySelector("#planner-start-readout");
  const run = document.querySelector("#planner-run");
  const requirementsRoot = document.querySelector("#planner-requirements");
  const resultsRoot = document.querySelector("#planner-results");
  const travelName = document.querySelector("#fast-travel-name");
  const travelAdd = document.querySelector("#fast-travel-add");
  const travelRoot = document.querySelector("#fast-travel-points");
  let requests = [];
  let startPosition = { x: map.size.width / 2, y: map.size.height / 2 };
  let selectingStart = false;
  let placingTravel = false;
  let fastTravel = readFastTravelPoints();
  const linkedArrivals = locationMarkers
    .filter((marker) => marker.type === "fast_travel_arrival")
    .map((marker) => {
      const parent = locationMarkers.find((candidate) => candidate.id === marker.parentId);
      return { ...marker, title: parent ? `${parent.title} arrival` : marker.title };
    });
  const allFastTravel = () => [...linkedArrivals, ...fastTravel];

  const renderTravelPins = () => overlayLayer.render(fastTravel);
  function open(value) {
    panel.hidden = !value;
    toggle.classList.toggle("is-active", value);
    toggle.setAttribute("aria-expanded", String(value));
    if (value) render();
  }
  function renderTravelList() {
    travelRoot.replaceChildren(...fastTravel.map((point, index) => {
      const row = document.createElement("div"); row.className = "resource-planner__request";
      const label = document.createElement("span"); label.textContent = point.title;
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", () => { fastTravel.splice(index, 1); localStorage.setItem(STORAGE_KEY, JSON.stringify(fastTravel)); renderTravelPins(); renderTravelList(); });
      row.append(label, remove); return row;
    }));
    if (!fastTravel.length) travelRoot.textContent = "No fast-travel test points yet.";
  }
  function render() {
    const options = plannerOptions(markers);
    const previous = request.value;
    request.replaceChildren(...options.map(({ value, label }) => new Option(label, value)));
    if (options.some((option) => option.value === previous)) request.value = previous;
    requestsRoot.replaceChildren(...requests.map((entry, index) => {
      const row = document.createElement("div"); row.className = "resource-planner__request";
      const label = document.createElement("span"); label.textContent = `${entry.label} ×${entry.quantity}`;
      const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove";
      remove.addEventListener("click", () => { requests.splice(index, 1); requirementsRoot.hidden = true; resultsRoot.hidden = true; render(); });
      row.append(label, remove); return row;
    }));
    if (!requests.length) requestsRoot.textContent = "No resources requested yet.";
    startReadout.textContent = `Start point: X ${Math.round(startPosition.x)} · Y ${Math.round(startPosition.y)}`;
    renderTravelList();
  }
  function focus(position) {
    const viewport = engine.getViewportSize();
    engine.camera.zoom = Math.max(engine.camera.zoom, Math.min(APP_CONFIG.camera.maxZoom, 0.55));
    engine.camera.x = viewport.width / 2 - position.x * engine.camera.zoom;
    engine.camera.y = viewport.height / 2 - position.y * engine.camera.zoom;
    engine.render();
  }
  function runPlanner() {
    if (!requests.length) { resultsRoot.textContent = "Add at least one resource or craftable item first."; resultsRoot.hidden = false; return; }
    const { requirements, notes } = expandRequests(requests, markers);
    const entries = Object.entries(requirements).sort(([a], [b]) => resourceNameForId(a).localeCompare(resourceNameForId(b)));
    requirementsRoot.replaceChildren(...entries.map(([id, amount]) => { const item = document.createElement("div"); item.className = "resource-planner__requirement"; item.textContent = `${resourceNameForId(id)} ×${amount}`; return item; }));
    if (notes.length) { const note = document.createElement("small"); note.textContent = notes.join(" "); requirementsRoot.append(note); }
    requirementsRoot.hidden = false;
    const zones = rankLootZones(markers, requirements, startPosition);
    resultsRoot.replaceChildren(...zones.map((zone, index) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "resource-planner__result";
      const nearest = allFastTravel().reduce((best, point) => { const distance = Math.round(Math.hypot(point.position.x - zone.position.x, point.position.y - zone.position.y)); return !best || distance < best.distance ? { title: point.title, distance } : best; }, null);
      button.innerHTML = `<strong>Zone ${index + 1} · ${zone.distance}m away</strong><span>${zone.matchingQuantity} needed items</span><small>${zone.summary}${nearest ? ` · nearest fast travel: ${nearest.title} (${nearest.distance}m)` : ""}</small>`;
      button.addEventListener("click", () => focus(zone.position)); return button;
    }));
    if (!zones.length) resultsRoot.textContent = "No published markers match this request yet.";
    resultsRoot.hidden = false;
  }

  toggle.addEventListener("click", () => open(panel.hidden));
  close?.addEventListener("click", () => open(false));
  add?.addEventListener("click", () => { const [kind, id] = request.value.split(":"); requests.push({ kind, id, quantity: Math.max(1, Number(quantity.value) || 1), label: request.selectedOptions[0].textContent.replace(/^(Craft|Find): /, "") }); quantity.value = "1"; requirementsRoot.hidden = true; resultsRoot.hidden = true; render(); });
  setStart?.addEventListener("click", () => { selectingStart = !selectingStart; setStart.classList.toggle("is-setting", selectingStart); setStart.textContent = selectingStart ? "Click your position on the map" : "Set my map position"; });
  travelAdd?.addEventListener("click", () => { placingTravel = !placingTravel; travelAdd.classList.toggle("is-setting", placingTravel); travelAdd.textContent = placingTravel ? "Click map" : "Place"; });
  run?.addEventListener("click", runPlanner);
  setMapClickHandler((position) => {
    if (placingTravel) {
      fastTravel.push({ id: `wip-fast-travel-${Date.now()}`, type: "fast_travel", title: travelName.value.trim() || `Fast travel ${fastTravel.length + 1}`, position });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fastTravel)); placingTravel = false; travelAdd.classList.remove("is-setting"); travelAdd.textContent = "Place"; travelName.value = ""; renderTravelPins(); render(); return;
    }
    if (selectingStart) { startPosition = position; selectingStart = false; setStart.classList.remove("is-setting"); setStart.textContent = "Set my map position"; render(); }
  });
  overlayLayer.renderIcon = (marker) => marker.type === "fast_travel" ? '<span class="fast-travel-pin">✦</span>' : "";
  overlayLayer.onMarkerClick = (marker) => { if (marker.type !== "fast_travel") return; startPosition = marker.position; selectingStart = false; setStart.classList.remove("is-setting"); setStart.textContent = "Set my map position"; render(); };
  renderTravelPins();
}
