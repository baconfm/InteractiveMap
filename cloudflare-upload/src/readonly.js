import { APP_CONFIG } from "./core/config.js";
import { daysGoneMap } from "./data/games/days-gone/map.js";
import { renderDaysGoneMarkerIcon } from "./data/games/days-gone/marker-icons.js";
import { PUBLISHED_MAP_DATA_URL } from "./data/games/days-gone/published-map-source.js";
import { isOneTimeSpawn } from "./data/games/days-gone/loot-rules.js";
import { MapEngine } from "./map/MapEngine.js";
import { MapMarkerLayer } from "./map/MapMarkerLayer.js";
import { bindControls } from "./ui/Controls.js";

const assetUrl = (path) => new URL(`../${path}`, import.meta.url).href;
const tileTemplateUrl = (template) => assetUrl(template
  .replace("{x}", "tile-column-placeholder")
  .replace("{y}", "tile-row-placeholder"))
  .replace("tile-column-placeholder", "{x}")
  .replace("tile-row-placeholder", "{y}");
const publicMap = {
  ...daysGoneMap,
  background: { ...daysGoneMap.background, image: assetUrl(daysGoneMap.background.image) },
  tiles: daysGoneMap.tiles && { ...daysGoneMap.tiles, template: tileTemplateUrl(daysGoneMap.tiles.template) },
};
const status = document.querySelector("#map-status");
const coordinateReadout = document.querySelector("#coordinate-readout");
const emptyState = document.querySelector("#map-empty-state");
const legendItems = document.querySelector("#map-legend-items");
const legendToggle = document.querySelector("#legend-toggle");
const legendShowAll = document.querySelector("#legend-show-all");
const legendHideAll = document.querySelector("#legend-hide-all");
const clusterSettingsToggle = document.querySelector("#cluster-settings-toggle");
const clusterSettings = document.querySelector("#cluster-settings");
const clusterZoomInput = document.querySelector("#cluster-zoom");
const clusterZoomValue = document.querySelector("#cluster-zoom-value");
const markerDetails = document.querySelector("#marker-details");
const markerDetailsClose = document.querySelector("#marker-details-close");
const markerDetailsIcon = document.querySelector("#marker-details-icon");
const markerDetailsType = document.querySelector("#marker-details-type");
const markerDetailsTitle = document.querySelector("#marker-details-title");
const markerDetailsDescription = document.querySelector("#marker-details-description");
const markerDetailsPhotos = document.querySelector("#marker-details-photos");
const hideDeekToggle = document.querySelector("#hide-deek-toggle");
const hideDeekPanel = document.querySelector("#hide-deek-panel");
const hideDeekClose = document.querySelector("#hide-deek-close");
const hideDeekMessage = document.querySelector("#hide-deek-message");
const hideDeekPhoto = document.querySelector("#hide-deek-photo");
const hideDeekResult = document.querySelector("#hide-deek-result");
const hideDeekStart = document.querySelector("#hide-deek-start");
const DEFAULT_CLUSTER_SPLIT_PERCENT = 0.95;
const DEFAULT_PUBLIC_ZOOM_PERCENT = 0.8;
const savedClusterSplitPercent = Number.parseFloat(localStorage.getItem("days-gone-public-cluster-split-percent-v2"));
const clusterSplitPercent = Number.isFinite(savedClusterSplitPercent) && savedClusterSplitPercent >= 0.15 && savedClusterSplitPercent <= 1
  ? savedClusterSplitPercent
  : DEFAULT_CLUSTER_SPLIT_PERCENT;
let activePublishedLootMarkers = [];
let visibleLegendItems = new Set();
let spawnFilter = "all";
let hideDeekRound;

const LEGEND_GROUPS = [
  { id: "supplies", label: "Supplies", items: ["Ammo Tin", "Bandage", "Gas Can", "Medkit"] },
  { id: "crafting", label: "Crafting materials", items: ["2x4", "Airbag", "Alarm Clock", "Beer Bottle", "Bottle", "Can", "Kerosene", "Nails", "Polystyrene", "Rag", "Saw Blade", "Scrap", "Spark Igniter", "Sterilizer"] },
  { id: "throwables", label: "Throwables", items: ["Attractor", "Attractor Bomb", "Car Alarm", "Flashbang", "Grenade", "Molotov", "Pipe Bomb", "Prox Bomb", "Prox Mine", "Smoke Bomb"] },
  { id: "weapons", label: "Melee weapons", items: ["Baseball Bat", "Fire Axe", "Hatchet", "Machete", "Pickaxe", "Pipe", "Sledgehammer", "Superior Axe"] },
  { id: "firearms", label: "Firearms", items: ["SAF", "Sawed Off"] },
  { id: "misc", label: "Miscellaneous", items: ["Random"] },
  { id: "plants", label: "Plants & mushrooms", items: ["Cedar Sapling", "Collectible Plant", "Mushroom"] },
  { id: "collectibles", label: "Collectibles", items: ["Cairn"] },
];

function legendGroupFor(marker) {
  const group = LEGEND_GROUPS.find((entry) => entry.items.includes(marker.title));
  if (group) return group.id;
  if (marker.type?.startsWith("collectible_")) return "collectibles";
  return "crafting";
}

function renderVisibleMarkers() {
  const markers = activePublishedLootMarkers.filter((marker) => {
    if (!visibleLegendItems.has(marker.title)) return false;
    if (spawnFilter === "respawnable") return !isOneTimeSpawn(marker);
    if (spawnFilter === "one-time") return isOneTimeSpawn(marker);
    return true;
  });
  lootLayer.render(markers);
  const filterLabel = spawnFilter === "all" ? "all spawn types" : spawnFilter;
  status.textContent = `Published map - ${markers.length} of ${activePublishedLootMarkers.length} ${filterLabel} markers shown`;
}

function renderLegend() {
  const groupedItems = new Map(LEGEND_GROUPS.map((group) => [group.id, new Map()]));
  activePublishedLootMarkers.forEach((marker) => {
    const groupId = legendGroupFor(marker);
    const items = groupedItems.get(groupId);
    const item = items.get(marker.title) ?? { count: 0, marker };
    item.count += 1;
    items.set(marker.title, item);
  });
  const spawnControls = document.createElement("section");
  spawnControls.className = "map-legend__spawn-filter";
  const spawnHeading = document.createElement("h2");
  spawnHeading.textContent = "Spawn type";
  spawnControls.append(spawnHeading);
  [
    ["all", "All items"],
    ["respawnable", "Respawnable"],
    ["one-time", "One-time only"],
  ].forEach(([value, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-legend__spawn-button";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(spawnFilter === value));
    button.addEventListener("click", () => {
      spawnFilter = value;
      renderLegend();
      renderVisibleMarkers();
    });
    spawnControls.append(button);
  });
  const alphabeticalGroups = [...LEGEND_GROUPS].sort((first, second) => first.label.localeCompare(second.label));
  legendItems.replaceChildren(spawnControls, ...alphabeticalGroups.flatMap((group) => {
    const items = [...groupedItems.get(group.id).entries()].sort(([first], [second]) => first.localeCompare(second));
    if (!items.length) return [];
    const section = document.createElement("section");
    section.className = "map-legend__group";
    const heading = document.createElement("h2");
    heading.textContent = group.label;
    section.append(heading);
    items.forEach(([itemName, item]) => {
      const label = document.createElement("label");
      label.className = "map-legend__item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = visibleLegendItems.has(itemName);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) visibleLegendItems.add(itemName);
        else visibleLegendItems.delete(itemName);
        renderVisibleMarkers();
      });
      const icon = document.createElement("span");
      icon.className = "map-legend__icon";
      icon.innerHTML = renderDaysGoneMarkerIcon(item.marker);
      const text = document.createElement("span");
      text.textContent = itemName;
      const count = document.createElement("span");
      count.className = "map-legend__count";
      count.textContent = String(item.count);
      label.append(checkbox, icon, text, count);
      section.append(label);
    });
    return section;
  }));
}

function showMarkerDetails(marker) {
  const group = LEGEND_GROUPS.find((entry) => entry.items.includes(marker.title));
  const spawnLabel = marker.type === "loot_cluster"
    ? "Area summary"
    : marker.type === "loot_stack"
      ? "Nearby matching pickups"
      : isOneTimeSpawn(marker)
        ? "One-time spawn"
        : "Respawnable item";
  markerDetailsIcon.innerHTML = renderDaysGoneMarkerIcon(marker);
  markerDetailsType.textContent = group ? `${group.label} · ${spawnLabel}` : spawnLabel;
  markerDetailsTitle.textContent = marker.title;
  markerDetailsDescription.textContent = marker.note || marker.grid || "No additional location notes yet.";
  const photos = Array.isArray(marker.photos) ? marker.photos : [];
  markerDetailsPhotos.replaceChildren(...photos.map((url, index) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = `Open photo ${index + 1}`;
    const image = document.createElement("img");
    image.src = url;
    image.alt = `${marker.title} location photo ${index + 1}`;
    image.loading = "lazy";
    link.append(image);
    return link;
  }));
  markerDetailsPhotos.hidden = photos.length === 0;
  markerDetails.hidden = false;
  lootLayer.select(marker.id);
}

function renderHideDeekPins() {
  if (!hideDeekRound?.guess) {
    hideDeekLayer.render([]);
    return;
  }
  hideDeekLayer.render([
    { id: "hide-deek-guess", title: "Your guess", position: hideDeekRound.guess, kind: "guess" },
    { id: "hide-deek-answer", title: "Correct location", position: hideDeekRound.marker.position, kind: "answer" },
  ]);
}

function setHideDeekPanel(open) {
  hideDeekPanel.hidden = !open;
  hideDeekToggle.setAttribute("aria-expanded", String(open));
  hideDeekToggle.classList.toggle("is-active", open);
}

function photoCandidates() {
  return activePublishedLootMarkers.flatMap((marker) => (Array.isArray(marker.photos) ? marker.photos : [])
    .filter((photo) => typeof photo === "string" && photo.length)
    .map((photo) => ({ marker, photo })));
}

function startHideDeekRound() {
  const candidates = photoCandidates();
  if (!candidates.length) {
    hideDeekMessage.textContent = "No marker photos have been published yet.";
    hideDeekPhoto.hidden = true;
    hideDeekStart.disabled = true;
    return;
  }
  const round = candidates[Math.floor(Math.random() * candidates.length)];
  hideDeekRound = { ...round, status: "guessing" };
  hideDeekPhoto.src = round.photo;
  hideDeekPhoto.hidden = false;
  hideDeekResult.hidden = true;
  hideDeekMessage.textContent = "Where is this? Click your best guess on the map.";
  hideDeekStart.textContent = "New round";
  hideDeekStart.disabled = false;
  markerDetails.hidden = true;
  renderHideDeekPins();
}

function resolveHideDeekGuess(position) {
  if (hideDeekRound?.status !== "guessing") return;
  hideDeekRound = { ...hideDeekRound, guess: position, status: "answered" };
  const distance = Math.round(Math.hypot(
    position.x - hideDeekRound.marker.position.x,
    position.y - hideDeekRound.marker.position.y,
  ));
  hideDeekMessage.textContent = "Answer revealed.";
  hideDeekResult.textContent = `You were ${distance} map units away. Green is the location; gold is your guess.`;
  hideDeekResult.hidden = false;
  renderHideDeekPins();
}

legendToggle.addEventListener("click", () => {
  const isCollapsed = !legendItems.hidden;
  legendItems.hidden = isCollapsed;
  document.querySelector(".map-legend__actions").hidden = isCollapsed;
  legendToggle.setAttribute("aria-expanded", String(!isCollapsed));
  legendToggle.textContent = isCollapsed ? "Show" : "Hide";
});

legendShowAll.addEventListener("click", () => {
  visibleLegendItems = new Set(activePublishedLootMarkers.map((marker) => marker.title));
  renderLegend();
  renderVisibleMarkers();
});

legendHideAll.addEventListener("click", () => {
  visibleLegendItems.clear();
  renderLegend();
  renderVisibleMarkers();
});

markerDetailsClose.addEventListener("click", () => {
  markerDetails.hidden = true;
});

hideDeekToggle.addEventListener("click", () => setHideDeekPanel(hideDeekPanel.hidden));
hideDeekClose.addEventListener("click", () => setHideDeekPanel(false));
hideDeekStart.addEventListener("click", startHideDeekRound);

clusterSettingsToggle.addEventListener("click", () => {
  const willOpen = clusterSettings.hidden;
  clusterSettings.hidden = !willOpen;
  clusterSettingsToggle.setAttribute("aria-expanded", String(willOpen));
});
const engine = new MapEngine({
  viewport: document.querySelector("#map-viewport"),
  canvas: document.querySelector("#map-canvas"),
  map: publicMap,
  cameraConfig: APP_CONFIG.camera,
  onPointerMove: ({ x, y }) => {
    coordinateReadout.value = `X ${Math.round(x)} · Y ${Math.round(y)}`;
  },
  onMapClick: resolveHideDeekGuess,
  onBackgroundLoad: () => emptyState.classList.add("is-hidden"),
});
if (window.matchMedia("(max-width: 640px)").matches) engine.onPointerMove = undefined;
const routeLayer = new MapMarkerLayer(engine.layers.get("entities"), publicMap.size, { renderIcon: renderDaysGoneMarkerIcon });
const hideDeekLayer = new MapMarkerLayer(engine.layers.get("regions"), publicMap.size, {
  renderIcon: (marker) => `<span class="hide-deek-pin hide-deek-pin--${marker.kind}">${marker.kind === "guess" ? "●" : "✓"}</span>`,
});
const lootLayer = new MapMarkerLayer(engine.layers.get("annotations"), publicMap.size, {
  renderIcon: renderDaysGoneMarkerIcon,
  onMarkerClick: showMarkerDetails,
  clusterBelowZoom: APP_CONFIG.camera.maxZoom * clusterSplitPercent,
  clusterRadius: 54,
  combineMatchingBelowZoom: APP_CONFIG.camera.maxZoom,
  combineMatchingRadius: 34,
});
clusterZoomInput.value = String(Math.round(clusterSplitPercent * 100));
clusterZoomValue.textContent = `${clusterZoomInput.value}%`;
clusterZoomInput.addEventListener("input", () => {
  const percent = Number(clusterZoomInput.value) / 100;
  clusterZoomValue.textContent = `${clusterZoomInput.value}%`;
  localStorage.setItem("days-gone-public-cluster-split-percent-v2", String(percent));
  lootLayer.setClusterBelowZoom(APP_CONFIG.camera.maxZoom * percent);
});

engine.onCameraChange = ({ zoom }) => {
  routeLayer.setZoom(zoom);
  lootLayer.setZoom(zoom);
};

async function loadPublishedMarkers() {
  try {
    const publishedMapUrl = PUBLISHED_MAP_DATA_URL || assetUrl("assets/games/days-gone/published-map.json");
    const response = await fetch(publishedMapUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("No published snapshot found.");
    const snapshot = await response.json();
    const publishedLootMarkers = snapshot.publishedLootMarkers;
    if (!Array.isArray(publishedLootMarkers)) throw new Error("This snapshot predates the cleaned public export. Save a new backup from the editor.");
    routeLayer.render([]);
    window.queueMicrotask(() => {
      activePublishedLootMarkers = publishedLootMarkers;
      visibleLegendItems = new Set(publishedLootMarkers.map((marker) => marker.title));
      renderLegend();
      renderVisibleMarkers();
      hideDeekStart.disabled = photoCandidates().length === 0;
    });
    lootLayer.render(publishedLootMarkers);
    status.textContent = `Published map · ${publishedLootMarkers.length} reviewed loot markers`;
  } catch (error) {
    console.warn(error);
    status.textContent = "Published snapshot not added yet";
  }
}

bindControls(engine);
engine.mount();
engine.zoomBy((APP_CONFIG.camera.maxZoom * DEFAULT_PUBLIC_ZOOM_PERCENT) / engine.camera.zoom);
loadPublishedMarkers();
