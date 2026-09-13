import { APP_CONFIG } from "./core/config.js";
import { daysGoneMap } from "./data/games/days-gone/map.js";
import { DAYS_GONE_TRACED_ICON_BODIES } from "./data/games/days-gone/overlay-icons.js";
import { renderDaysGoneMarkerIcon } from "./data/games/days-gone/marker-icons.js";
import { MapEngine } from "./map/MapEngine.js";
import { MapLineLayer } from "./map/MapLineLayer.js";
import { MapMarkerLayer } from "./map/MapMarkerLayer.js";
import { MapLineEditor } from "./ui/MapLineEditor.js";
import { bindControls } from "./ui/Controls.js";

const TYPE_LABELS = { storymissions: "Story missions", encampmentjobs: "Camp jobs", nerosites: "NERO checkpoints", ambushcamps: "Ambush camps", infestations: "Infestation zones", hordes: "Hordes" };
const AUTOSAVE_KEY = "days-gone-speedrun-all-storylines-autosave-v1";
const assetUrl = (path) => new URL(`../${path}`, import.meta.url).href;
const tileTemplateUrl = (template) => assetUrl(template.replace("{x}", "tile-column-placeholder").replace("{y}", "tile-row-placeholder")).replace("tile-column-placeholder", "{x}").replace("tile-row-placeholder", "{y}");
const speedrunMap = { ...daysGoneMap, background: { ...daysGoneMap.background, image: assetUrl(daysGoneMap.background.image) }, tiles: { ...daysGoneMap.tiles, template: tileTemplateUrl(daysGoneMap.tiles.template) } };
const els = Object.fromEntries(["speedrun-status", "speedrun-totals", "speedrun-search", "speedrun-status-filter", "speedrun-filters", "speedrun-list", "objective-title", "objective-details", "objective-x", "objective-y", "route-preview"].map((id) => [id.replaceAll("-", ""), document.querySelector(`#${id}`)]));
const state = { route: [], selected: null, types: new Set(Object.keys(TYPE_LABELS)), region: "", status: "all", missingOnly: false, lines: true, placing: false, endpoint: null, showMissionLoot: false, loot: null, overrides: { routeId: "all-storylines", order: [], coordinates: {}, vectors: {}, transitions: {}, customMissions: [] } };
function autosave() { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state.overrides)); els.speedrunstatus.textContent = "Autosaved locally"; }
function savedDraft() { try { const draft = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || "null"); return draft?.routeId === "all-storylines" ? draft : null; } catch { return null; } }
let lineEditor;
const engine = new MapEngine({ viewport: document.querySelector("#map-viewport"), canvas: document.querySelector("#map-canvas"), map: speedrunMap, cameraConfig: APP_CONFIG.camera, onMapClick: handleMapPoint, onBackgroundLoad: () => document.querySelector("#map-empty-state").classList.add("is-hidden") });
const markerLayer = new MapMarkerLayer(engine.layers.get("entities"), speedrunMap.size, { renderIcon: routeIcon, onMarkerClick: (marker) => { if (state.endpoint !== null || state.placing) handleMapPoint(marker.position); else select(marker.id); } });
const routeLineLayer = engine.layers.get("routes");
const missionLineLayer = new MapLineLayer(routeLineLayer, speedrunMap.size);
const missionMarkerLayer = new MapMarkerLayer(engine.layers.get("annotations"), speedrunMap.size, {
  renderIcon: (marker) => `<svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="${marker.color}" stroke="#142019" stroke-width="2"/><text x="17" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="800" fill="#142019">${marker.symbol}</text></svg>`,
  onMarkerClick: (marker) => { if (state.endpoint !== null || state.placing) handleMapPoint(marker.position); else focus(marker.position); },
});
const missionLootLayer = new MapMarkerLayer(engine.layers.get("regions"), speedrunMap.size, { renderIcon: renderDaysGoneMarkerIcon, onMarkerClick: addLootKeyPoint });
const correctionLayer = new MapLineLayer(engine.layers.get("map-lines"), speedrunMap.size, { onLineClick: (line) => { cancelPlacement(); lineEditor?.select(line); }, onPointPointerDown: (line, index, event) => lineEditor?.movePoint(line, index, event) });
const lineListeners = new Set();
const legId = (stop) => `route-leg-${stop.id}`;
const transition = (stop) => { state.overrides.transitions ??= {}; return state.overrides.transitions[stop.id] ?? {}; };
const missionLegs = () => state.route.slice(1).flatMap((stop, index) => { const previous = state.route[index], before = transition(previous), after = transition(stop); return before.teleport || !(before.end ?? previous.position) || !(after.start ?? stop.position) ? [] : [{ id: legId(stop), type: "mission", title: `${previous.label} → ${stop.label}`, points: [before.end ?? previous.position, ...(state.overrides.vectors?.[stop.id] ?? []), after.start ?? stop.position], stopId: stop.id }]; });
const correctionStore = { getAll: missionLegs, subscribe: (listener) => (lineListeners.add(listener), () => lineListeners.delete(listener)), add: () => {}, update: (id, patch) => changeVector(id, patch.points), remove: (id) => changeVector(id, []) };
function changeVector(id, points) { const stop = state.route.find((entry) => legId(entry) === id); if (!stop) return; state.overrides.vectors[stop.id] = (points ?? []).slice(1, -1); autosave(); lineListeners.forEach((listener) => listener(missionLegs())); }
engine.onCameraChange = ({ zoom }) => { markerLayer.setZoom(zoom); missionMarkerLayer.setZoom(zoom); missionLootLayer.setZoom(zoom); };
bindControls(engine); engine.mount();
lineEditor = new MapLineEditor({ store: correctionStore, layer: correctionLayer, elements: { type: document.createElement("select"), title: document.createElement("input"), start: document.querySelector("#route-line-start"), finish: document.querySelector("#route-line-finish"), cancel: document.querySelector("#route-line-cancel"), delete: document.querySelector("#route-line-delete"), status: document.querySelector("#route-line-status") }, positionForEvent: (event) => engine.coordinates.clamp(engine.coordinates.screenToMap(engine.toViewportPoint(event), engine.camera.getState())), draftForStart: (id) => { const line = missionLegs().find((entry) => entry.id === (id || (state.selected && legId(state.selected)))); return line && { ...line, points: line.points.map((point) => ({ ...point })), fixedEndpoints: true }; }, onFinish: (line) => changeVector(line.id, line.points) });

function routeIcon(marker) { const color = marker.color || "#f6c453"; const icon = { storymissions: "collectibles", encampmentjobs: "camp", nerosites: "injector", ambushcamps: "ambush", infestations: "infestation", hordes: "horde" }[marker.type]; return `<svg viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="${color}" stroke="#142019" stroke-width="2.5"/><g transform="translate(5 3) scale(.5)" style="color:#142019">${DAYS_GONE_TRACED_ICON_BODIES[icon]}</g><circle cx="25.5" cy="25.5" r="7" fill="#142019" stroke="#f4f1e7" stroke-width="1"/><text x="25.5" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="800" fill="#f4f1e7">${marker.order}</text></svg>`; }
function setCoordinate(position) { if (!state.placing || !state.selected) return false; state.selected.position = { x: Math.round(position.x), y: Math.round(position.y) }; state.overrides.coordinates[state.selected.id] = state.selected.position; cancelPlacement(); autosave(); render(); return true; }
function cancelPlacement() {
  state.endpoint = null; state.placing = false; engine.viewport.classList.remove("is-placing-mission");
  document.querySelector("#cancel-mission-point").disabled = true;
  document.querySelector("#mission-placement-status").textContent = state.selected ? "Choose a point to mark on the map." : "Select a mission to begin.";
}
function beginMissionPoint(kind) {
  if (!state.selected) return;
  lineEditor.reset(); cancelPlacement(); state.endpoint = kind; engine.viewport.classList.add("is-placing-mission");
  document.querySelector("#cancel-mission-point").disabled = false;
  document.querySelector("#mission-placement-status").textContent = "Click the map to mark " + (kind === "start" ? "the mission start." : kind === "end" ? "the mission end." : "a required key point.");
}
function handleMapPoint(position) {
  if (state.endpoint !== null && state.selected) {
    const point = { x: Math.round(position.x), y: Math.round(position.y) };
    const details = state.overrides.transitions[state.selected.id] ??= {};
    if (state.endpoint === "new") (details.keyPoints ??= []).push(point);
    else if (typeof state.endpoint === "number") details.keyPoints[state.endpoint] = { ...details.keyPoints[state.endpoint], ...point };
    else details[state.endpoint] = point;
    cancelPlacement(); autosave(); render();
  } else if (!lineEditor?.place(position)) setCoordinate(position);
}
function missionPoints(stop) {
  if (!stop) return [];
  const details = transition(stop);
  return [
    ...(details.start ? [{ ...details.start, kind: "start", symbol: "S", color: "#7cdb99", label: "Start" }] : []),
    ...(details.keyPoints ?? []).map((point, index) => ({ ...point, kind: index, symbol: index + 1, color: "#69d9ef", label: point.label || `Key point ${index + 1}` })),
    ...(details.end ? [{ ...details.end, kind: "end", symbol: "E", color: "#ef9789", label: "End" }] : []),
  ];
}
function missionArea(stop) {
  const points = missionPoints(stop);
  if (!transition(stop).start || !transition(stop).end) return null;
  const padding = 450;
  return {
    left: Math.min(...points.map((point) => point.x)) - padding,
    right: Math.max(...points.map((point) => point.x)) + padding,
    top: Math.min(...points.map((point) => point.y)) - padding,
    bottom: Math.max(...points.map((point) => point.y)) + padding,
  };
}
async function loadMissionLoot() {
  if (state.loot) return state.loot;
  document.querySelector("#mission-loot-status").textContent = "Loading nearby loot…";
  try {
    const response = await fetch(assetUrl("assets/games/days-gone/published-map.json"));
    if (!response.ok) throw new Error("Loot data unavailable.");
    const data = await response.json();
    state.loot = data.allLootMarkers ?? data.publishedLootMarkers ?? [];
    return state.loot;
  } catch (error) {
    document.querySelector("#mission-loot-status").textContent = error.message;
    return [];
  }
}
function addLootKeyPoint(loot) {
  if (!state.selected || !state.showMissionLoot) return;
  const details = transition(state.selected);
  details.keyPoints ??= [];
  if (details.keyPoints.some((point) => point.lootId === loot.id)) {
    els.speedrunstatus.textContent = `${loot.title} is already a key point.`;
    return;
  }
  details.keyPoints.push({ x: Math.round(loot.position.x), y: Math.round(loot.position.y), label: loot.title, lootId: loot.id });
  autosave(); render();
}
function renderMissionLoot() {
  const toggle = document.querySelector("#mission-loot-toggle");
  const status = document.querySelector("#mission-loot-status");
  const area = state.selected && missionArea(state.selected);
  toggle.disabled = !area;
  toggle.checked = state.showMissionLoot;
  if (!state.showMissionLoot || !area) {
    missionLootLayer.render([]);
    status.textContent = state.selected && !area ? "Mark this mission’s start and end to show loot in its area." : "";
    return;
  }
  const loot = state.loot ?? [];
  const nearby = loot.filter((marker) => marker.position && marker.position.x >= area.left && marker.position.x <= area.right && marker.position.y >= area.top && marker.position.y <= area.bottom);
  missionLootLayer.render(nearby);
  status.textContent = `${nearby.length} loot marker${nearby.length === 1 ? "" : "s"} in this mission area. Click one to add it as a key point.`;
}
function renderMissionPoints() {
  const stop = state.selected, points = missionPoints(stop);
  const next = state.route[state.route.indexOf(stop) + 1];
  const landing = stop && next && transition(stop).teleport && transition(next).start;
  const markers = landing ? [...points, { ...landing, kind: "landing", symbol: "T", color: "#c89cf4", label: `Teleport to ${next.label}` }] : points;
  missionMarkerLayer.render(markers.map((point) => ({ ...point, id: `mission-${stop.id}-${point.kind}`, title: point.label, position: { x: point.x, y: point.y } })));
  for (const id of ["set-mission-start", "set-mission-end", "add-mission-point"]) document.getElementById(id).disabled = !stop;
  document.querySelector("#insert-mission").disabled = !stop;
  document.querySelector("#delete-custom-mission").disabled = !stop?.custom;
  document.querySelector("#mission-points").replaceChildren(...points.map((point) => {
    const row = document.createElement("li");
    const heading = document.createElement("strong"); heading.textContent = `${point.symbol} · ${point.label}`;
    const coordinates = document.createElement("p"); coordinates.className = "speedrun-help"; coordinates.textContent = `${point.x}, ${point.y}`;
    const actions = document.createElement("div"); actions.className = "speedrun-actions";
    const button = (label, action, disabled = false) => { const element = document.createElement("button"); element.type = "button"; element.textContent = label; element.disabled = disabled; element.setAttribute("aria-label", `${label}: ${point.label}`); element.onclick = action; actions.append(element); };
    const update = (action) => { cancelPlacement(); action(transition(stop)); autosave(); render(); };
    row.append(heading, coordinates);
    if (typeof point.kind === "number") {
      const input = document.createElement("input"); input.value = point.label; input.setAttribute("aria-label", `Key point ${point.kind + 1} name`); input.maxLength = 160;
      input.onchange = () => update((details) => { details.keyPoints[point.kind].label = input.value.trim(); }); row.append(input);
      const move = (offset) => update((details) => { const [entry] = details.keyPoints.splice(point.kind, 1); details.keyPoints.splice(point.kind + offset, 0, entry); });
      button("Move up", () => move(-1), point.kind === 0);
      button("Move down", () => move(1), point.kind === transition(stop).keyPoints.length - 1);
    }
    button("Show", () => focus(point)); button("Move on map", () => beginMissionPoint(point.kind));
    button("Remove", () => update((details) => { if (typeof point.kind === "number") details.keyPoints.splice(point.kind, 1); else delete details[point.kind]; }));
    row.append(actions); return row;
  }));
}
function regionsFor(completionTitles) { const lookup = new Map(); Object.entries(completionTitles.categories || {}).forEach(([type, category]) => category.titles.forEach((entry) => lookup.set(`${type}:${entry.title}`, entry.region))); return lookup; }
function loadRoute(data) {
  const regions = regionsFor(data.completionTitles);
  state.savedOverrides = { routeId: "all-storylines", order: [], coordinates: {}, vectors: {}, transitions: {}, customMissions: [], ...data.overrides };
  state.overrides = structuredClone({ ...state.savedOverrides, ...savedDraft() });
  delete state.overrides.lines;
  state.overrides.vectors ??= {}; state.overrides.transitions ??= {}; state.overrides.customMissions ??= [];
  const sourceStops = data.defaultSplits.splits.map((split, index) => {
    const goals = [...split.ocrGoals.filter((goal) => data.counters[goal.counterKey]), ...Object.entries(split.auto || {}).flatMap(([counterKey, count]) => Array.from({ length: count }, (_, autoIndex) => ({ id: `auto-${counterKey}-${autoIndex}`, counterKey, label: TYPE_LABELS[counterKey], auto: true })) )];
    const types = [...new Set(goals.map((goal) => goal.counterKey))];
    const type = split.ocrGoals.find((goal) => data.counters[goal.counterKey])?.counterKey || types[0] || "storymissions";
    return { ...split, goals, types, type, region: goals.map((goal) => regions.get(`${goal.counterKey}:${goal.label}`)).find(Boolean) || split.phaseId, position: state.overrides.coordinates[split.id], defaultIndex: index };
  });
  const customStops = state.overrides.customMissions
    .filter((mission) => typeof mission?.id === "string" && typeof mission.label === "string" && TYPE_LABELS[mission.type])
    .map((mission, index) => ({ ...mission, custom: true, goals: [], types: [mission.type], region: mission.region || "Custom", position: state.overrides.coordinates[mission.id], defaultIndex: sourceStops.length + index }));
  const valid = new Set([...sourceStops, ...customStops].map((stop) => stop.id));
  state.overrides.order = state.overrides.order.filter((id) => valid.has(id));
  const rank = new Map(state.overrides.order.map((id, index) => [id, index]));
  state.route = [...sourceStops, ...customStops].sort((a, b) => (rank.get(a.id) ?? a.defaultIndex) - (rank.get(b.id) ?? b.defaultIndex));
  state.overrides.order = state.route.map((stop) => stop.id);
  if (sourceStops.length !== 240) throw new Error(`Expected 240 Router stops; loaded ${sourceStops.length}.`);
  const totals = Object.fromEntries(Object.keys(data.counters).map((key) => [key, sourceStops.reduce((sum, stop) => sum + stop.goals.filter((goal) => goal.counterKey === key).length, 0)]));
  Object.entries(data.counters).forEach(([key, counter]) => { if (totals[key] !== counter.max) throw new Error(`${counter.label}: expected ${counter.max}, got ${totals[key]}.`); });
  state.counters = data.counters;
  lineListeners.forEach((listener) => listener(missionLegs()));
  els.speedrunstatus.textContent = `${sourceStops.length} Router stops${customStops.length ? ` + ${customStops.length} custom mission${customStops.length === 1 ? "" : "s"}` : ""} loaded`;
  renderFilters(); render();
}
const missionMapped = (stop) => Boolean(transition(stop).start && transition(stop).end);
const objectivePosition = (stop) => transition(stop).start ?? stop.position;
function filtered() { const search = els.speedrunsearch.value.trim().toLowerCase(); const current = state.route.indexOf(state.selected); return state.route.filter((stop, index) => state.types.has(stop.type) && (!state.region || stop.region === state.region) && (!state.missingOnly || !missionMapped(stop)) && (state.status === "all" || state.status === "missing" && !missionMapped(stop) || state.status === "current" && index === current || state.status === "completed" && current >= 0 && index < current || state.status === "upcoming" && current >= 0 && index > current) && (!search || `${stop.label} ${stop.note} ${stop.region}`.toLowerCase().includes(search))); }
function renderFilters() { const regions = [...new Set(state.route.map((stop) => stop.region))].sort(); els.speedrunfilters.replaceChildren(...Object.entries(state.counters).map(([key, counter]) => { const button = document.createElement("button"); button.type = "button"; button.textContent = TYPE_LABELS[key]; button.style.setProperty("--route-color", counter.accent); button.className = "speedrun-filter is-active"; button.addEventListener("click", () => { state.types.has(key) ? state.types.delete(key) : state.types.add(key); button.classList.toggle("is-active", state.types.has(key)); render(); }); return button; }), Object.assign(document.createElement("select"), { innerHTML: `<option value="">All regions</option>${regions.map((region) => `<option>${region}</option>`).join("")}`, onchange: (event) => { state.region = event.target.value; render(); } })); }
function render() { renderMissionPoints(); renderMissionLoot(); const visible = filtered(); markerLayer.render(visible.filter((stop) => objectivePosition(stop) && (stop.id !== state.selected?.id || !transition(stop).start)).map((stop) => ({ id: stop.id, title: stop.label, type: stop.type, color: state.counters[stop.type].accent, order: state.route.indexOf(stop) + 1, position: objectivePosition(stop) }))); renderLines(); els.speedruntotals.replaceChildren(...Object.entries(state.counters).map(([key, counter]) => Object.assign(document.createElement("span"), { textContent: `${counter.shortLabel}: ${state.route.reduce((sum, stop) => sum + stop.goals.filter((goal) => goal.counterKey === key).length, 0)}/${counter.max}`, style: `--route-color:${counter.accent}` }))); els.speedrunlist.replaceChildren(...visible.map((stop) => listItem(stop))); renderDetails(); els.routepreview.value = JSON.stringify(state.overrides, null, 2); }
function renderLines() {
  const points = missionPoints(state.selected);
  const lines = points.length > 1 ? [{ id: "mission-path", type: "passable", points }] : [];
  const index = state.route.indexOf(state.selected);
  for (const from of [index - 1, index]) {
    const previous = state.route[from], next = state.route[from + 1];
    if (!previous || !next || !transition(previous).teleport) continue;
    const end = transition(previous).end, start = transition(next).start;
    if (end && start) lines.push({ id: `teleport-${previous.id}`, type: "teleport", points: [end, start] });
  }
  missionLineLayer.render(state.lines ? lines : []); if (!state.lines) { correctionLayer.element.replaceChildren(); return; } lineEditor?.render(); }
function listItem(stop) { const item = document.createElement("li"); item.draggable = true; item.className = `speedrun-stop${stop.id === state.selected?.id ? " is-selected" : ""}${missionMapped(stop) ? "" : " is-missing"}`; item.innerHTML = `<b>${state.route.indexOf(stop) + 1}</b><span><strong>${stop.label}</strong><small>${TYPE_LABELS[stop.type]} · ${stop.region}${missionMapped(stop) ? " · start/end marked" : " · needs start/end"}</small></span>`; item.addEventListener("click", () => select(stop.id)); item.addEventListener("dragstart", () => { state.dragId = stop.id; }); item.addEventListener("dragover", (event) => event.preventDefault()); item.addEventListener("drop", () => { const from = state.route.findIndex((entry) => entry.id === state.dragId); const to = state.route.findIndex((entry) => entry.id === stop.id); state.route.splice(to, 0, state.route.splice(from, 1)[0]); state.overrides.order = state.route.map((entry) => entry.id); autosave(); render(); }); return item; }
function select(id) { lineEditor.reset(); state.selected = state.route.find((stop) => stop.id === id); cancelPlacement(); render(); const position = transition(state.selected).start ?? state.selected.position; if (position) focus(position); }
function renderDetails() { const stop = state.selected; if (!stop) return; const routeTransition = transition(stop); els.objectivetitle.textContent = `${state.route.indexOf(stop) + 1}. ${stop.label}`; const previous = state.route[state.route.indexOf(stop) - 1]; const next = state.route[state.route.indexOf(stop) + 1]; els.objectivedetails.innerHTML = `<p><b>${TYPE_LABELS[stop.type]}</b> · ${stop.region}</p><p>${stop.note || "No split note."}</p><p><b>OCR:</b> ${stop.goals.map((goal) => goal.label).join(" · ") || "Custom mission"}</p><p><b>Previous:</b> ${previous?.label || "Start"}<br><b>Next:</b> ${next?.label || "Finish"}</p><p>${stop.custom ? "Custom mission: does not advance Router counters." : stop.goals.length > 1 ? `Completing this advances ${stop.goals.length} counters.` : "Completing this advances one counter."}</p>`; els.objectivex.value = stop.position?.x ?? ""; els.objectivey.value = stop.position?.y ?? ""; document.querySelector("#transition-summary").textContent = `Start: ${routeTransition.start ? `${routeTransition.start.x}, ${routeTransition.start.y}` : "not marked"} · End: ${routeTransition.end ? `${routeTransition.end.x}, ${routeTransition.end.y}` : "not marked"}${routeTransition.teleport ? " · teleports to next mission" : ""}`; document.querySelector("#teleport-after").setAttribute("aria-pressed", String(Boolean(routeTransition.teleport)));
  document.querySelector("#teleport-after").disabled = !next;
  const arrival = previous && transition(previous).teleport;
  document.querySelector("#teleport-summary").textContent = routeTransition.teleport && next
    ? `Teleport: end of this mission → start of ${state.route.indexOf(next) + 1}. ${next.label}.${transition(next).start ? " Purple dashed line = teleport, not a driving route." : " Mark the next mission’s start to show the landing."}`
    : arrival ? `Arrive here by teleport after ${state.route.indexOf(previous) + 1}. ${previous.label}.` : ""; }
function focus(position) { const { width, height } = engine.getViewportSize(); engine.camera.zoom = Math.max(engine.camera.zoom, 0.5); engine.camera.x = width / 2 - position.x * engine.camera.zoom; engine.camera.y = height / 2 - position.y * engine.camera.zoom; engine.render(); }
function setPositionFromInputs() { if (!state.selected) return; const x = Number(els.objectivex.value), y = Number(els.objectivey.value); if (Number.isFinite(x) && Number.isFinite(y)) { state.selected.position = { x, y }; state.overrides.coordinates[state.selected.id] = state.selected.position; autosave(); } render(); }
function insertCustomMission() {
  if (!state.selected) return;
  const title = document.querySelector("#custom-mission-title").value.trim();
  const type = document.querySelector("#custom-mission-type").value;
  if (!title) { els.speedrunstatus.textContent = "Give the inserted mission a name first."; return; }
  const mission = { id: `custom-${crypto.randomUUID()}`, label: title, type, region: state.selected.region, goals: [], types: [type], custom: true, defaultIndex: state.route.length };
  state.overrides.customMissions ??= [];
  state.overrides.customMissions.push({ id: mission.id, label: mission.label, type: mission.type, region: mission.region });
  const index = state.route.indexOf(state.selected);
  state.route.splice(index + 1, 0, mission);
  state.overrides.order = state.route.map((stop) => stop.id);
  state.selected = mission;
  document.querySelector("#custom-mission-title").value = "";
  autosave(); render();
}
function deleteCustomMission() {
  if (!state.selected?.custom) return;
  const index = state.route.indexOf(state.selected);
  const { id } = state.selected;
  state.overrides.customMissions = state.overrides.customMissions.filter((mission) => mission.id !== id);
  delete state.overrides.coordinates[id]; delete state.overrides.transitions[id]; delete state.overrides.vectors[id];
  state.route.splice(index, 1);
  state.selected = state.route[index] ?? state.route[index - 1] ?? null;
  state.overrides.order = state.route.map((stop) => stop.id);
  autosave(); render();
}
els.speedrunsearch.addEventListener("input", render);
els.speedrunstatusfilter.addEventListener("change", (event) => { state.status = event.target.value; render(); });
[els.objectivex, els.objectivey].forEach((input) => input.addEventListener("change", setPositionFromInputs));
document.querySelector("#set-coordinate").addEventListener("click", () => { if (!state.selected) return; cancelPlacement(); lineEditor.reset(); state.placing = true; engine.viewport.classList.add("is-placing-mission"); document.querySelector("#cancel-mission-point").disabled = false; els.speedrunstatus.textContent = "Click the map to set this coordinate"; });
document.querySelector("#clear-coordinate").addEventListener("click", () => { if (state.selected) { delete state.overrides.coordinates[state.selected.id]; state.selected.position = undefined; autosave(); } render(); });
document.querySelector("#set-mission-start").addEventListener("click", () => beginMissionPoint("start"));
document.querySelector("#set-mission-end").addEventListener("click", () => beginMissionPoint("end"));
document.querySelector("#add-mission-point").addEventListener("click", () => beginMissionPoint("new"));
document.querySelector("#mission-loot-toggle").addEventListener("change", async (event) => { state.showMissionLoot = event.currentTarget.checked; if (state.showMissionLoot) await loadMissionLoot(); render(); });
document.querySelector("#insert-mission").addEventListener("click", insertCustomMission);
document.querySelector("#delete-custom-mission").addEventListener("click", deleteCustomMission);
document.querySelector("#cancel-mission-point").addEventListener("click", cancelPlacement);
document.querySelector("#route-line-start").addEventListener("click", cancelPlacement);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") cancelPlacement(); });
document.querySelector("#teleport-after").addEventListener("click", () => { if (!state.selected) return; const routeTransition = transition(state.selected); state.overrides.transitions[state.selected.id] = { ...routeTransition, teleport: !routeTransition.teleport }; autosave(); render(); });
document.querySelector("#missing-only").addEventListener("click", (event) => { state.missingOnly = !state.missingOnly; event.currentTarget.setAttribute("aria-pressed", String(state.missingOnly)); render(); });
document.querySelector("#jump-current").addEventListener("click", () => state.selected && objectivePosition(state.selected) && focus(objectivePosition(state.selected)));
document.querySelector("#fit-route").addEventListener("click", () => document.querySelector("#reset-view").click());
document.querySelector("#fit-region").addEventListener("click", () => { const positions = state.route.filter((stop) => stop.region === state.selected?.region && objectivePosition(stop)).map(objectivePosition); if (positions[0]) focus(positions[0]); });
document.querySelector("#route-lines").addEventListener("click", (event) => { state.lines = !state.lines; event.currentTarget.setAttribute("aria-pressed", String(state.lines)); renderLines(); });
document.querySelector("#reset-route-edits").addEventListener("click", () => {
  localStorage.removeItem(AUTOSAVE_KEY);
  window.location.reload();
});
document.querySelector("#save-route").addEventListener("click", async () => {
  if (!confirm("Save mission starts, ends, key points, and route changes locally?")) return;
  const response = await fetch("/api/speedrun-route", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state.overrides) });
  const result = await response.json(); if (response.ok) { state.savedOverrides = structuredClone(state.overrides); localStorage.removeItem(AUTOSAVE_KEY); }
  els.speedrunstatus.textContent = response.ok ? "Route override saved" : result.error;
});
function dataOrder() { return state.route.slice().sort((a, b) => a.defaultIndex - b.defaultIndex).map((stop) => stop.id); }
fetch("/api/speedrun-route").then((response) => response.ok ? response.json() : Promise.reject(new Error("Restart the local editor, then reopen Speedrun Mode."))).then(loadRoute).catch((error) => { els.speedrunstatus.textContent = error.message; });
