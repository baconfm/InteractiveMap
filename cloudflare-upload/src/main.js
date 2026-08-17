import { APP_CONFIG } from "./core/config.js";
import { daysGoneMap } from "./data/games/days-gone/map.js";
import { canonicalLootItemName, LOOT_ITEM_NAMES, renderLootItemIcon } from "./data/games/days-gone/loot-item-icons.js";
import { isOneTimeSpawn } from "./data/games/days-gone/loot-rules.js";
import { renderDaysGoneMarkerIcon } from "./data/games/days-gone/marker-icons.js";
import { loadRouteQueue } from "./data/games/days-gone/route-objectives.js";
import { MapEngine } from "./map/MapEngine.js";
import { MapMarkerLayer } from "./map/MapMarkerLayer.js";
import { MapMarkerOverrides } from "./map/MapMarkerOverrides.js";
import { MapMarkerStore } from "./map/MapMarkerStore.js";
import { bindControls } from "./ui/Controls.js";
import { MarkerEditor } from "./ui/MarkerEditor.js";
import { MapLocationEditor } from "./ui/MapLocationEditor.js";

const coordinateReadout = document.querySelector("#coordinate-readout");
const emptyState = document.querySelector("#map-empty-state");
const editorPanel = document.querySelector("#editor-panel");
const editorToggle = document.querySelector("#editor-toggle");
const lootEditorPanel = document.querySelector("#loot-editor-panel");
const lootEditorToggle = document.querySelector("#loot-editor-toggle");
const locationEditorPanel = document.querySelector("#location-editor-panel");
const locationEditorToggle = document.querySelector("#location-editor-toggle");
const addHotbar = document.querySelector("#add-hotbar");
const saveMapButton = document.querySelector("#save-map");
const publishMapButton = document.querySelector("#publish-map");
const saveState = document.querySelector("#save-state");
const lootOnlyToggle = document.querySelector("#loot-only-toggle");
const lootEditor = {
  item: document.querySelector("#loot-editor-item"),
  location: document.querySelector("#loot-editor-location"),
  x: document.querySelector("#loot-editor-x"),
  y: document.querySelector("#loot-editor-y"),
  quantity: document.querySelector("#loot-editor-quantity"),
  quantityValue: document.querySelector("#loot-editor-quantity-value"),
  notes: document.querySelector("#loot-editor-notes"),
  photos: document.querySelector("#loot-editor-photos"),
  region: document.querySelector("#loot-editor-region"),
  oneTime: document.querySelector("#loot-editor-one-time"),
  save: document.querySelector("#save-loot-position"),
  reset: document.querySelector("#reset-loot-position"),
  export: document.querySelector("#export-loot-markers"),
  count: document.querySelector("#loot-marker-count"),
  type: document.querySelector("#manual-loot-type"),
  manualLocation: document.querySelector("#manual-loot-location"),
  place: document.querySelector("#place-manual-loot"),
  cancel: document.querySelector("#cancel-manual-loot"),
  delete: document.querySelector("#delete-loot-item"),
};
let markerEditor;
let mapLocationEditor;
let lootStore;
let selectedLootId;
let placingManualLoot = false;
let selectedToolboxToolId;
let showUnreviewed = localStorage.getItem("days-gone-show-unreviewed-v1") === "true";
let lootOnly = true;
const EDITOR_CLUSTER_SPLIT_ZOOM = 0.55;
const engine = new MapEngine({
  viewport: document.querySelector("#map-viewport"),
  canvas: document.querySelector("#map-canvas"),
  map: daysGoneMap,
  cameraConfig: APP_CONFIG.camera,
  onPointerMove: ({ x, y }) => {
    coordinateReadout.value = `X ${Math.round(x)} · Y ${Math.round(y)}`;
  },
  onMapClick: (position) => {
    if (placingManualLoot) placeManualLoot(position);
    else if (!locationEditorPanel.hidden && mapLocationEditor?.place(position)) return;
    else if (!editorPanel.hidden) markerEditor?.place(position);
  },
  onBackgroundLoad: () => {
    emptyState.classList.add("is-hidden");
    document.querySelector("#map-status").textContent = "Background loaded";
  },
});

const markerStore = new MapMarkerStore("days-gone-route-markers-v1");
const mapLocationStore = new MapMarkerStore("days-gone-map-locations-v1");
daysGoneMap.coordinateMigrations?.forEach((migration) => {
  markerStore.migratePositions({ ...migration, toSize: daysGoneMap.size });
});
const markerLayer = new MapMarkerLayer(engine.layers.get("entities"), daysGoneMap.size, {
  renderIcon: renderDaysGoneMarkerIcon,
  onMarkerPointerDown: moveCollectibleMarker,
  clusterBelowZoom: EDITOR_CLUSTER_SPLIT_ZOOM,
  clusterRadius: 54,
});
const mapLocationLayer = new MapMarkerLayer(engine.layers.get("regions"), daysGoneMap.size, {
  renderIcon: renderDaysGoneMarkerIcon,
  onMarkerPointerDown: moveMapLocationMarker,
  clusterBelowZoom: EDITOR_CLUSTER_SPLIT_ZOOM,
  clusterRadius: 54,
});
const lootLayer = new MapMarkerLayer(engine.layers.get("annotations"), daysGoneMap.size, {
  renderIcon: renderDaysGoneMarkerIcon,
  onMarkerPointerDown: moveLootMarker,
  clusterBelowZoom: EDITOR_CLUSTER_SPLIT_ZOOM,
  clusterRadius: 54,
  combineMatchingBelowZoom: APP_CONFIG.camera.maxZoom,
  combineMatchingRadius: 34,
});
engine.layers.setVisibility("entities", !lootOnly);
// Map locations are editing aids, so keep camps, checkpoints, and their
// fast-travel arrivals available while the editor is in its loot-only view.
engine.layers.setVisibility("regions", true);
engine.onCameraChange = ({ zoom }) => {
  markerLayer.setZoom(zoom);
  mapLocationLayer.setZoom(zoom);
  lootLayer.setZoom(zoom);
};
markerStore.subscribe((markers) => markerLayer.render(markers));
markerStore.subscribe(() => markAutoSaved());
markerLayer.render(markerStore.getAll());
mapLocationStore.subscribe((markers) => mapLocationLayer.render(markers));
mapLocationStore.subscribe(() => markAutoSaved());
mapLocationLayer.render(mapLocationStore.getAll());
initializeLootMarkers();
lootEditor.type.replaceChildren(...LOOT_ITEM_NAMES.map((name) => new Option(name, name)));
const MAP_REGIONS = ["Cascades", "Belknap", "Lost Lake", "Iron Butte", "Crater Lake", "Highway 97"];
const ironButteLostLakeBoundaryX = (y) => {
  const top = { x: 2986, y: 2186 };
  const bottom = { x: 2919, y: 3733 };
  return top.x + ((y - top.y) / (bottom.y - top.y)) * (bottom.x - top.x);
};
const regionForPosition = (position) => {
  if (position.y >= 2186 && position.y <= 3733) {
    return position.x < ironButteLostLakeBoundaryX(position.y) ? "Iron Butte" : "Lost Lake";
  }
  if (position.x >= 521 && position.x <= 1837 && position.y >= 1776 && position.y <= 3277) return "Iron Butte";
  if (position.x <= 2320 && position.y <= 1940) return "Belknap";
  return null;
};
lootEditor.region.replaceChildren(...MAP_REGIONS.map((region) => new Option(region, region)));
document.querySelector("#marker-icon").replaceChildren(...[
  ["auto", "Automatic"], ["plant", "Plant"], ["mushroom", "Mushroom"], ["collectibles", "Collectible"],
  ["injector", "Injector"], ["horde", "Horde"], ["camp", "Camp"], ["ambush", "Ambush"],
  ["ipca", "IPCA"], ["infestation", "Infestation"], ["cairn", "Cairn"],
].map(([value, label]) => new Option(label, value)));
const TOOLBOX_GROUPS = ["All", "Loot", "Explosives", "Collectibles", "Melee", "Firearms"];
const COLLECTIBLE_TOOLS = new Set(["Collectible Plant", "Cedar Sapling", "Mushroom", "Cairn"]);
const MELEE_TOOLS = new Set(["2x4", "Hatchet", "Machete", "Pipe", "Baseball Bat", "Fire Axe", "Ripper Axe", "Superior Axe", "Sledgehammer", "Pickaxe"]);
const FIREARM_TOOLS = new Set(["SAF", "Sawed Off"]);
const EXPLOSIVE_TOOLS = new Set(["Attractor", "Attractor Bomb", "Flashbang", "Grenade", "Molotov", "Pipe Bomb", "Prox Mine", "Prox Bomb", "Remote Bomb", "Smoke Bomb"]);
const TOOLBOX_ITEMS = LOOT_ITEM_NAMES.flatMap((title) => title === "Scrap"
  ? [
      { id: "scrap-respawnable", title, label: "Scrap", oneTimeSpawn: false },
      { id: "scrap-one-time", title, label: "Scrap 1×", oneTimeSpawn: true },
    ]
  : [{ id: title.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-"), title, label: title, oneTimeSpawn: isOneTimeSpawn({ title }) }]);
let toolboxGroup = "All";
let toolboxQuery = "";

function toolboxGroupFor(item) {
  if (COLLECTIBLE_TOOLS.has(item)) return "Collectibles";
  if (MELEE_TOOLS.has(item)) return "Melee";
  if (FIREARM_TOOLS.has(item)) return "Firearms";
  if (EXPLOSIVE_TOOLS.has(item)) return "Explosives";
  return "Loot";
}

function renderToolbox(focusSearch = false) {
  const search = document.createElement("input");
  search.className = "add-hotbar__search";
  search.type = "search";
  search.placeholder = "Search items…";
  search.value = toolboxQuery;
  search.addEventListener("input", () => {
    toolboxQuery = search.value;
    renderToolbox(true);
  });

  const filters = document.createElement("div");
  filters.className = "add-hotbar__filters";
  TOOLBOX_GROUPS.forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "add-hotbar__filter";
    button.textContent = group;
    button.classList.toggle("is-active", group === toolboxGroup);
    button.addEventListener("click", () => {
      toolboxGroup = group;
      renderToolbox();
    });
    filters.append(button);
  });

  const grid = document.createElement("div");
  grid.className = "add-hotbar__grid";
  TOOLBOX_ITEMS.filter((tool) => {
    const matchesGroup = toolboxGroup === "All" || toolboxGroupFor(tool.title) === toolboxGroup;
    return matchesGroup && tool.label.toLocaleLowerCase().includes(toolboxQuery.trim().toLocaleLowerCase());
  }).forEach((tool) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "add-hotbar__slot";
    button.title = `Add ${tool.oneTimeSpawn ? "one-time " : "respawnable "}${tool.title}`;
    button.setAttribute("aria-label", `Add ${tool.oneTimeSpawn ? "one-time " : "respawnable "}${tool.title}`);
    button.dataset.tool = tool.id;
    button.innerHTML = `${renderLootItemIcon(tool.title)}<span>${tool.label}</span>`;
    button.addEventListener("click", () => {
      lootEditor.type.value = tool.title;
      lootEditor.oneTime.checked = tool.oneTimeSpawn;
      selectedToolboxToolId = tool.id;
      setManualPlacement(true);
    });
    grid.append(button);
  });

  const heading = document.createElement("div");
  heading.className = "add-hotbar__heading";
  const title = document.createElement("span");
  title.textContent = "Toolbox";
  const reviewToggle = document.createElement("button");
  reviewToggle.type = "button";
  reviewToggle.className = "add-hotbar__review";
  reviewToggle.textContent = showUnreviewed ? "Show all" : "Review only";
  reviewToggle.title = "Toggle unreviewed spreadsheet loot";
  reviewToggle.addEventListener("click", () => {
    showUnreviewed = !showUnreviewed;
    localStorage.setItem("days-gone-show-unreviewed-v1", String(showUnreviewed));
    renderLootMarkers();
    renderToolbox();
  });
  heading.append(title, reviewToggle);
  addHotbar.replaceChildren(heading, search, filters, grid);
  if (focusSearch) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
}

renderToolbox();

function moveCollectibleMarker(marker, event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (marker.type === "loot_cluster" || marker.type === "loot_stack") {
    engine.camera.zoomAt(APP_CONFIG.camera.zoomStep, engine.toViewportPoint(event));
    engine.render();
    return;
  }

  const start = { x: event.clientX, y: event.clientY };
  let moved = false;
  const move = (moveEvent) => {
    moved ||= Math.abs(moveEvent.clientX - start.x) > 3 || Math.abs(moveEvent.clientY - start.y) > 3;
    if (!moved) return;
    const position = positionForMarkerDrag(marker, moveEvent);
    markerStore.update(marker.id, { position });
  };
  const finish = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", finish);
    if (moved) document.querySelector("#map-status").textContent = `${marker.title} moved`;
    else {
      markerEditor?.edit(marker.id);
      toggleEditor(true);
    }
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", finish, { once: true });
}

function moveMapLocationMarker(marker, event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const startPosition = { x: event.clientX, y: event.clientY };
  let moved = false;
  const move = (moveEvent) => {
    if (Math.hypot(moveEvent.clientX - startPosition.x, moveEvent.clientY - startPosition.y) > 4) moved = true;
    if (moved) mapLocationStore.update(marker.id, { position: positionForMarkerDrag(marker, moveEvent) });
  };
  const end = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    if (moved) document.querySelector("#map-status").textContent = `${marker.title} moved`;
    else {
      mapLocationEditor?.edit(marker);
      mapLocationLayer.select(marker.id);
      toggleLocationEditor(true);
    }
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function positionForMarkerDrag(marker, event) {
  const camera = engine.camera.getState();
  const point = engine.coordinates.screenToMap(engine.toViewportPoint(event), camera);
  return engine.coordinates.clamp({
    x: point.x - (marker.layoutOffset?.x ?? 0) / camera.zoom,
    y: point.y - (marker.layoutOffset?.y ?? 0) / camera.zoom,
  });
}

function moveLootMarker(marker, event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  if (marker.type === "loot_cluster" || marker.type === "loot_stack") {
    engine.camera.zoomAt(APP_CONFIG.camera.zoomStep, engine.toViewportPoint(event));
    engine.render();
    return;
  }

  const start = { x: event.clientX, y: event.clientY };
  let moved = false;
  const move = (moveEvent) => {
    moved ||= Math.abs(moveEvent.clientX - start.x) > 3 || Math.abs(moveEvent.clientY - start.y) > 3;
    const position = positionForMarkerDrag(marker, moveEvent);
    lootStore.move(marker.id, position);
  };
  const finish = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", finish);
    if (moved) document.querySelector("#map-status").textContent = `${marker.title} moved`;
    else selectLootMarker(marker.id);
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", finish, { once: true });
}

async function initializeLootMarkers() {
  try {
    const response = await fetch(new URL("../assets/games/days-gone/published-map.json", import.meta.url), { cache: "no-store" });
    if (!response.ok) throw new Error("Clean loot baseline could not be loaded.");
    const snapshot = await response.json();
    const markers = (Array.isArray(snapshot.allLootMarkers)
      ? snapshot.allLootMarkers
      : snapshot.publishedLootMarkers)?.map((marker) => ({ ...marker, title: canonicalLootItemName(marker.title) }));
    if (!Array.isArray(markers)) throw new Error("Clean loot baseline is invalid.");
    lootStore = new MapMarkerOverrides("days-gone-loot-item-overrides-v2", markers);
    lootStore.subscribe(() => {
      renderLootMarkers();
      markAutoSaved();
      if (selectedLootId) {
        refreshLootEditor();
        lootLayer.select(selectedLootId);
      }
    });
    renderLootMarkers();
    lootEditor.export.disabled = false;
    document.querySelector("#map-status").textContent = `Clean loot baseline loaded · ${markers.length} markers`;
  } catch (error) {
    lootEditor.count.value = "Loot data unavailable";
    document.querySelector("#map-status").textContent = "Clean loot baseline failed to load";
    console.error(error);
  }
}

function renderLootMarkers() {
  if (!lootStore) return;
  const allMarkers = lootStore.getAll();
  const visibleMarkers = showUnreviewed ? allMarkers : lootStore.getReviewed();
  lootLayer.render(visibleMarkers);
  lootEditor.count.value = showUnreviewed
    ? `${allMarkers.length} item markers`
    : `${visibleMarkers.length} reviewed of ${allMarkers.length}`;
  document.querySelector("#map-status").textContent = showUnreviewed ? "All loot shown" : "Review cleanup view";
}

function selectLootMarker(markerId) {
  selectedLootId = markerId;
  lootLayer.select(markerId);
  refreshLootEditor();
  toggleLootEditor(true);
}

function refreshLootEditor() {
  const marker = lootStore?.getAll().find((item) => item.id === selectedLootId);
  if (!marker) return;
  lootEditor.item.textContent = marker.title;
  lootEditor.location.textContent = `${marker.location} · ${marker.region} · Grid ${marker.grid}${marker.note ? ` · ${marker.note}` : ""}`;
  lootEditor.x.value = Math.round(marker.position.x);
  lootEditor.y.value = Math.round(marker.position.y);
  lootEditor.quantity.value = marker.quantity ?? 1;
  lootEditor.quantityValue.value = lootEditor.quantity.value;
  lootEditor.notes.value = marker.note ?? "";
  lootEditor.photos.value = (marker.photos ?? []).join("\n");
  lootEditor.region.value = MAP_REGIONS.includes(marker.region) ? marker.region : "Cascades";
  lootEditor.oneTime.checked = isOneTimeSpawn(marker);
  lootEditor.oneTime.disabled = false;
  lootEditor.notes.disabled = false;
  lootEditor.photos.disabled = false;
  lootEditor.x.disabled = false;
  lootEditor.y.disabled = false;
  lootEditor.save.disabled = false;
  lootEditor.reset.disabled = false;
  lootEditor.delete.disabled = false;
}

function clearLootEditor() {
  selectedLootId = undefined;
  lootEditor.item.textContent = "Select a loot item";
  lootEditor.location.textContent = "Click a colored loot marker to inspect it. Drag it to refine its position.";
  lootEditor.x.value = "";
  lootEditor.y.value = "";
  lootEditor.quantity.value = 1;
  lootEditor.quantityValue.value = 1;
  lootEditor.notes.value = "";
  lootEditor.photos.value = "";
  lootEditor.region.value = "Cascades";
  lootEditor.oneTime.checked = false;
  lootEditor.oneTime.disabled = true;
  lootEditor.notes.disabled = true;
  lootEditor.photos.disabled = true;
  lootEditor.x.disabled = true;
  lootEditor.y.disabled = true;
  lootEditor.save.disabled = true;
  lootEditor.reset.disabled = true;
  lootEditor.delete.disabled = true;
}

function toggleLootEditor(open) {
  lootEditorPanel.hidden = !open;
  lootEditorToggle.setAttribute("aria-expanded", String(open));
  lootEditorToggle.classList.toggle("is-active", open);
  if (!open && placingManualLoot) setManualPlacement(false);
}

function parsePhotoLinks(value) {
  return [...new Set(value.split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean)
    .filter((link) => {
      try {
        const url = new URL(link, window.location.href);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    }))];
}

function setManualPlacement(active) {
  placingManualLoot = active;
  lootEditor.place.disabled = active;
  lootEditor.cancel.disabled = !active;
  lootEditor.oneTime.disabled = !active && !selectedLootId;
  addHotbar.querySelectorAll(".add-hotbar__slot").forEach((button) => {
    button.classList.toggle("is-active", active && button.dataset.tool === selectedToolboxToolId);
  });
  document.querySelector("#map-status").textContent = active ? "Click the map to place the new loot item" : "Loot editor ready";
}

function manualMarkerType(title) {
  if (title === "Cairn") return "collectible_cairn";
  if (title === "Collectible Plant" || title === "Cedar Sapling") return "collectible_plant";
  if (title === "Mushroom") return "collectible_mushroom";
  return "loot_item";
}

function placeManualLoot(position) {
  if (!lootStore) return;
  const title = lootEditor.type.value;
  const location = lootEditor.manualLocation.value.trim() || "Manual placement";
  const marker = {
    id: `manual-loot-${Date.now()}`,
    type: manualMarkerType(title),
    title,
    location,
    region: regionForPosition(position) ?? "Cascades",
    grid: "Manual",
    category: "Manual placement",
    note: lootEditor.notes.value.trim() || "Added manually",
    quantity: Number(lootEditor.quantity.value),
    oneTimeSpawn: lootEditor.oneTime.checked,
    position,
  };
  lootStore.add(marker);
  setManualPlacement(false);
  selectLootMarker(marker.id);
}

lootEditorToggle.addEventListener("click", () => toggleLootEditor(lootEditorPanel.hidden));
document.querySelector("#loot-editor-close").addEventListener("click", () => toggleLootEditor(false));
lootEditor.place.addEventListener("click", () => setManualPlacement(true));
lootEditor.cancel.addEventListener("click", () => setManualPlacement(false));
lootEditor.save.addEventListener("click", () => {
  if (!lootStore || !selectedLootId) return;
  lootStore.update(selectedLootId, {
    position: engine.coordinates.clamp({ x: Number(lootEditor.x.value), y: Number(lootEditor.y.value) }),
    quantity: Number(lootEditor.quantity.value),
    oneTimeSpawn: lootEditor.oneTime.checked,
    note: lootEditor.notes.value.trim() || "Added manually",
    photos: parsePhotoLinks(lootEditor.photos.value),
    region: lootEditor.region.value,
  });
});

function markAutoSaved() {
  saveState.textContent = "Autosaved";
}

function saveMapBackup() {
  const backup = getMapSnapshot();
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: "days-gone-map-save.json" });
  link.click();
  URL.revokeObjectURL(url);
  saveState.textContent = "Backup saved";
}

function getMapSnapshot() {
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    routeMarkers: markerStore.getAll(),
    mapLocations: mapLocationStore.getAll(),
    publishedLootMarkers: lootStore?.getReviewed() ?? [],
    lootMarkers: lootStore?.getReviewed() ?? [],
    allLootMarkers: lootStore?.getAll() ?? [],
  };
}

saveMapButton.addEventListener("click", saveMapBackup);
publishMapButton.addEventListener("click", async () => {
  if (!lootStore) return;
  publishMapButton.disabled = true;
  saveState.textContent = "Publishing to GitHub…";
  try {
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getMapSnapshot()),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Publish failed.");
    saveState.textContent = `Published ${result.markerCount} markers`;
  } catch (error) {
    saveState.textContent = error.message;
  } finally {
    publishMapButton.disabled = false;
  }
});
lootOnlyToggle.addEventListener("click", () => {
  lootOnly = !lootOnly;
  engine.layers.setVisibility("entities", !lootOnly);
  lootOnlyToggle.setAttribute("aria-pressed", String(lootOnly));
  lootOnlyToggle.classList.toggle("is-active", lootOnly);
  document.querySelector("#map-status").textContent = lootOnly ? "Loot only view" : "All map markers shown";
});
lootEditor.quantity.addEventListener("input", () => {
  lootEditor.quantityValue.value = lootEditor.quantity.value;
});
lootEditor.type.addEventListener("change", () => {
  if (!selectedLootId) {
    selectedToolboxToolId = undefined;
    lootEditor.oneTime.checked = isOneTimeSpawn({ title: lootEditor.type.value });
  }
});
lootEditor.reset.addEventListener("click", () => lootStore?.reset(selectedLootId));
lootEditor.delete.addEventListener("click", () => {
  if (!lootStore || !selectedLootId) return;
  lootStore.remove(selectedLootId);
  clearLootEditor();
  document.querySelector("#map-status").textContent = "Loot item deleted";
});
lootEditor.export.addEventListener("click", () => {
  if (!lootStore) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(lootStore.getAll(), null, 2)], { type: "application/json" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: "days-gone-loot-item-markers.json" });
  link.click();
  URL.revokeObjectURL(url);
});

const routeQueue = await loadRouteQueue();

markerEditor = new MarkerEditor({
  engine,
  store: markerStore,
  routeStops: routeQueue,
  elements: {
    stopSelect: document.querySelector("#route-stop-select"),
    search: document.querySelector("#route-stop-search"),
    title: document.querySelector("#marker-title"),
    type: document.querySelector("#marker-type"),
    icon: document.querySelector("#marker-icon"),
    note: document.querySelector("#marker-note"),
    status: document.querySelector("#placement-status"),
    save: document.querySelector("#save-marker"),
    cancel: document.querySelector("#cancel-marker"),
    export: document.querySelector("#export-markers"),
    count: document.querySelector("#marker-count"),
  },
});

mapLocationEditor = new MapLocationEditor({
  store: mapLocationStore,
  regionForPosition,
  elements: {
    type: document.querySelector("#map-location-type"),
    title: document.querySelector("#map-location-title"),
    note: document.querySelector("#map-location-note"),
    arrival: document.querySelector("#map-location-arrival"),
    place: document.querySelector("#place-map-location"),
    cancel: document.querySelector("#cancel-map-location"),
    save: document.querySelector("#save-map-location"),
    delete: document.querySelector("#delete-map-location"),
    status: document.querySelector("#map-location-status"),
    count: document.querySelector("#map-location-count"),
  },
});

function toggleEditor(open) {
  editorPanel.hidden = !open;
  editorToggle.setAttribute("aria-expanded", String(open));
  editorToggle.classList.toggle("is-active", open);
  editorToggle.textContent = open ? "Close editor" : "Place route stops";
}

editorToggle.addEventListener("click", () => toggleEditor(editorPanel.hidden));
document.querySelector("#editor-close").addEventListener("click", () => toggleEditor(false));

function toggleLocationEditor(open) {
  locationEditorPanel.hidden = !open;
  locationEditorToggle.setAttribute("aria-expanded", String(open));
  locationEditorToggle.classList.toggle("is-active", open);
  locationEditorToggle.textContent = open ? "Close locations" : "Map locations";
  if (!open) mapLocationEditor.reset();
}

locationEditorToggle.addEventListener("click", () => toggleLocationEditor(locationEditorPanel.hidden));
document.querySelector("#location-editor-close").addEventListener("click", () => toggleLocationEditor(false));

bindControls(engine);
engine.mount();
