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

export function initMapApplication({ onReady, onMapClick, showLocations = false } = {}) {
  const map = configuredMap();
  const status = document.querySelector("#map-status");
  const readout = document.querySelector("#coordinate-readout");
  const emptyState = document.querySelector("#map-empty-state");
  const clusterSettingsToggle = document.querySelector("#cluster-settings-toggle");
  const clusterSettings = document.querySelector("#cluster-settings");
  const clusterZoomInput = document.querySelector("#cluster-zoom");
  const clusterZoomValue = document.querySelector("#cluster-zoom-value");
  const savedSplit = Number.parseFloat(localStorage.getItem("days-gone-public-cluster-split-percent-v2"));
  const splitPercent = Number.isFinite(savedSplit) && savedSplit >= 0.15 && savedSplit <= 1 ? savedSplit : 0.95;
  let mapClickHandler = onMapClick;
  let publishedMarkers = [];

  const engine = new MapEngine({
    viewport: document.querySelector("#map-viewport"),
    canvas: document.querySelector("#map-canvas"),
    map,
    cameraConfig: APP_CONFIG.camera,
    onPointerMove: ({ x, y }) => { readout.value = `X ${Math.round(x)} · Y ${Math.round(y)}`; },
    onMapClick: (position) => mapClickHandler?.(position),
    onBackgroundLoad: () => emptyState.classList.add("is-hidden"),
  });
  if (window.matchMedia("(max-width: 640px)").matches) engine.onPointerMove = undefined;

  const lootLayer = new MapMarkerLayer(engine.layers.get("annotations"), map.size, {
    renderIcon: renderDaysGoneMarkerIcon,
    clusterBelowZoom: APP_CONFIG.camera.maxZoom * splitPercent,
    clusterRadius: 54,
    combineMatchingBelowZoom: APP_CONFIG.camera.maxZoom,
    combineMatchingRadius: 34,
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
    localStorage.setItem("days-gone-public-cluster-split-percent-v2", String(percent));
    lootLayer.setClusterBelowZoom(APP_CONFIG.camera.maxZoom * percent);
  });
  engine.onCameraChange = ({ zoom }) => { locationLayer.setZoom(zoom); overlayLayer.setZoom(zoom); lootLayer.setZoom(zoom); };
  bindControls(engine);
  engine.mount();

  loadPublishedMap().then(({ lootMarkers, locationMarkers }) => {
    publishedMarkers = lootMarkers;
    legend.setMarkers(lootMarkers);
    locationLayer.render(showLocations ? locationMarkers.filter((marker) => marker.type !== "fast_travel_arrival") : []);
    status.textContent = `Published map · ${lootMarkers.length} reviewed loot markers`;
    onReady?.({ engine, map, markers: lootMarkers, locationMarkers, lootLayer, locationLayer, overlayLayer, details, setMapClickHandler });
  }).catch((error) => {
    console.warn(error);
    status.textContent = "Published snapshot not added yet";
  });

  function setMapClickHandler(handler) { mapClickHandler = handler; }
  return { engine, map, getMarkers: () => publishedMarkers, lootLayer, locationLayer, overlayLayer, details, setMapClickHandler };
}
