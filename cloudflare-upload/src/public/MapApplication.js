import { APP_CONFIG } from "../core/config.js";
import { daysGoneMap } from "../data/games/days-gone/map.js";
import { renderDaysGoneMarkerIcon } from "../data/games/days-gone/marker-icons.js";
import { MapEngine } from "../map/MapEngine.js";
import { MapMarkerLayer } from "../map/MapMarkerLayer.js";
import { bindControls } from "../ui/Controls.js";
import { createLootLegend } from "./LootLegend.js";
import { createMarkerDetails } from "./MarkerDetails.js";
import { loadPublishedMap } from "./published-markers.js";

const assetUrl = (path) => new URL(`../../${path}`, import.meta.url).href;
const tileTemplateUrl = (template) => assetUrl(template.replace("{x}", "tile-column-placeholder").replace("{y}", "tile-row-placeholder"))
  .replace("tile-column-placeholder", "{x}").replace("tile-row-placeholder", "{y}");

function configuredMap() {
  return {
    ...daysGoneMap,
    background: { ...daysGoneMap.background, image: assetUrl(daysGoneMap.background.image) },
    tiles: daysGoneMap.tiles && { ...daysGoneMap.tiles, template: tileTemplateUrl(daysGoneMap.tiles.template) },
  };
}

function sharedMapState() {
  const params = new URLSearchParams(window.location.search);
  return {
    x: Number(params.get("x")), y: Number(params.get("y")), z: Number(params.get("z")),
    hasView: params.has("x") && params.has("y") && params.has("z"),
    titles: params.has("selection") ? params.getAll("item") : undefined,
    spawn: params.get("spawn") || "all",
  };
}

function applySharedView(engine, state) {
  if (!state.hasView || ![state.x, state.y, state.z].every(Number.isFinite)) return;
  const { width, height } = engine.getViewportSize();
  const zoom = Math.min(APP_CONFIG.camera.maxZoom, Math.max(APP_CONFIG.camera.minZoom, state.z));
  engine.camera.zoom = zoom;
  engine.camera.x = width / 2 - state.x * zoom;
  engine.camera.y = height / 2 - state.y * zoom;
  engine.render();
}

export function initMapApplication({ onReady, onMapClick, showLocations = false, showRandomEncounters = false } = {}) {
  const map = configuredMap();
  const status = document.querySelector("#map-status");
  const readout = document.querySelector("#coordinate-readout");
  const emptyState = document.querySelector("#map-empty-state");
  const clusterSettingsToggle = document.querySelector("#cluster-settings-toggle");
  const clusterSettings = document.querySelector("#cluster-settings");
  const clusterZoomInput = document.querySelector("#cluster-zoom");
  const clusterZoomValue = document.querySelector("#cluster-zoom-value");
  const share = document.querySelector("#share-map");
  const mobileFiltersToggle = document.querySelector("#mobile-filters-toggle");
  const mobileMenuToggle = document.querySelector("#mobile-menu-toggle");
  const topBarLinks = document.querySelector("#top-bar-links");
  const mapLegend = document.querySelector(".map-legend");
  const randomEncountersToggle = document.querySelector("#random-encounters-toggle");
  const randomEncountersFilter = document.querySelector("#map-legend-location-filters");
  const randomEncountersIcon = document.querySelector("#random-encounters-icon");
  const randomEncountersCount = document.querySelector("#random-encounters-count");
  const sharedState = sharedMapState();
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const savedSplit = Number.parseFloat(localStorage.getItem("days-gone-public-cluster-split-percent-v3"));
  const splitPercent = Math.max(isMobile ? 0.94 : 0.92, Number.isFinite(savedSplit) && savedSplit >= 0.15 && savedSplit <= 1 ? savedSplit : 0);
  let mapClickHandler = onMapClick;
  let publishedMarkers = [];
  let locationMarkers = [];
  mobileFiltersToggle?.addEventListener("click", () => {
    const open = !mapLegend.classList.contains("is-mobile-open");
    mapLegend.classList.toggle("is-mobile-open", open);
    mobileFiltersToggle.setAttribute("aria-expanded", String(open));
  });
  mobileMenuToggle?.addEventListener("click", () => {
    const open = !topBarLinks.classList.contains("is-open");
    topBarLinks.classList.toggle("is-open", open);
    mobileMenuToggle.setAttribute("aria-expanded", String(open));
  });

  const engine = new MapEngine({
    viewport: document.querySelector("#map-viewport"),
    canvas: document.querySelector("#map-canvas"),
    map,
    cameraConfig: APP_CONFIG.camera,
    onPointerMove: ({ x, y }) => { readout.value = `X ${Math.round(x)} · Y ${Math.round(y)}`; },
    onMapClick: (position) => mapClickHandler?.(position),
    onBackgroundLoad: () => emptyState.classList.add("is-hidden"),
  });
  if (isMobile) engine.onPointerMove = undefined;

  const lootLayer = new MapMarkerLayer(engine.layers.get("annotations"), map.size, {
    renderIcon: renderDaysGoneMarkerIcon,
    clusterBelowZoom: APP_CONFIG.camera.maxZoom * splitPercent,
    clusterRadius: isMobile ? 46 : 38,
    combineMatchingBelowZoom: APP_CONFIG.camera.maxZoom,
    combineMatchingRadius: 42,
  });
  const details = createMarkerDetails({ layer: lootLayer });
  lootLayer.onMarkerClick = (marker) => details.show(marker);
  const locationLayer = new MapMarkerLayer(engine.layers.get("regions"), map.size, {
    renderIcon: renderDaysGoneMarkerIcon,
    onMarkerClick: (marker) => details.show(marker),
  });
  const overlayLayer = new MapMarkerLayer(engine.layers.get("entities"), map.size, { renderIcon: renderDaysGoneMarkerIcon });
  const legend = createLootLegend({
    onChange: (visibleMarkers, { total, spawnFilter }) => {
      lootLayer.render(visibleMarkers);
      const filterLabel = spawnFilter === "all" ? "all spawn types" : spawnFilter;
      status.textContent = `Published map - ${visibleMarkers.length} of ${total} ${filterLabel} markers shown`;
    },
  });
  const renderLocationMarkers = () => locationLayer.render(showLocations
    ? locationMarkers.filter((marker) => marker.type !== "fast_travel_arrival")
    : locationMarkers.filter((marker) => marker.type === "random_encounter" && showRandomEncounters && randomEncountersToggle?.checked));
  randomEncountersToggle?.addEventListener("change", renderLocationMarkers);

  clusterZoomInput.value = String(Math.round(splitPercent * 100));
  clusterZoomValue.textContent = `${clusterZoomInput.value}%`;
  clusterSettingsToggle?.addEventListener("click", () => {
    const open = clusterSettings.hidden;
    clusterSettings.hidden = !open;
    clusterSettingsToggle.setAttribute("aria-expanded", String(open));
  });
  clusterZoomInput?.addEventListener("input", () => {
    const percent = Number(clusterZoomInput.value) / 100;
    clusterZoomValue.textContent = `${clusterZoomInput.value}%`;
    localStorage.setItem("days-gone-public-cluster-split-percent-v3", String(percent));
    lootLayer.setClusterBelowZoom(APP_CONFIG.camera.maxZoom * percent);
  });
  engine.onCameraChange = (camera) => {
    locationLayer.setZoom(camera.zoom);
    overlayLayer.setZoom(camera.zoom);
    lootLayer.setZoom(camera.zoom);
    lootLayer.setView(camera, engine.getViewportSize());
  };
  bindControls(engine);
  engine.mount();
  applySharedView(engine, sharedState);

  share?.addEventListener("click", async () => {
    const { width, height } = engine.getViewportSize();
    const { x, y, zoom } = engine.camera.getState();
    const filters = legend.getState();
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("x", String(Math.round((width / 2 - x) / zoom)));
    url.searchParams.set("y", String(Math.round((height / 2 - y) / zoom)));
    url.searchParams.set("z", String(Number(zoom.toFixed(3))));
    if (filters.hasCustomSelection) {
      url.searchParams.set("selection", "custom");
      filters.titles.forEach((title) => url.searchParams.append("item", title));
    }
    if (filters.spawn !== "all") url.searchParams.set("spawn", filters.spawn);
    try {
      await navigator.clipboard.writeText(url.href);
      share.textContent = "Link copied";
      window.setTimeout(() => { share.textContent = "Share view"; }, 1800);
    } catch {
      window.prompt("Copy this map link:", url.href);
    }
  });

  loadPublishedMap().then(({ lootMarkers, locationMarkers: nextLocationMarkers }) => {
    publishedMarkers = lootMarkers;
    locationMarkers = nextLocationMarkers;
    legend.setMarkers(lootMarkers);
    legend.setState(sharedState);
    const randomEncounters = locationMarkers.filter((marker) => marker.type === "random_encounter");
    if (randomEncountersFilter) randomEncountersFilter.hidden = !showRandomEncounters || !randomEncounters.length;
    if (randomEncountersIcon && randomEncounters[0]) randomEncountersIcon.innerHTML = renderDaysGoneMarkerIcon(randomEncounters[0]);
    if (randomEncountersCount) randomEncountersCount.textContent = String(randomEncounters.length);
    renderLocationMarkers();
    status.textContent = `Published map · ${lootMarkers.length} reviewed loot markers`;
    onReady?.({ engine, map, markers: lootMarkers, locationMarkers, lootLayer, locationLayer, overlayLayer, details, setMapClickHandler });
  }).catch((error) => {
    console.warn(error);
    status.textContent = "Published snapshot not added yet";
  });

  function setMapClickHandler(handler) { mapClickHandler = handler; }
  return { engine, map, getMarkers: () => publishedMarkers, lootLayer, locationLayer, overlayLayer, details, setMapClickHandler };
}
