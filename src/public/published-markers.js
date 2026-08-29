import { PUBLISHED_MAP_DATA_URL } from "../data/games/days-gone/published-map-source.js";
import { canonicalLootItemName } from "../data/games/days-gone/loot-item-icons.js";

const assetUrl = (path) => new URL(`../../${path}`, import.meta.url).href;

export function dedupeMarkers(markers) {
  const markerIds = new Set();
  return markers.filter((marker) => {
    if (!marker?.id || markerIds.has(marker.id)) return false;
    markerIds.add(marker.id);
    return true;
  });
}

export async function loadPublishedMap() {
  let lootMarkers;
  let locationMarkers = [];
  if (PUBLISHED_MAP_DATA_URL) {
    const response = await fetch(PUBLISHED_MAP_DATA_URL);
    if (!response.ok) throw new Error("No published snapshot found.");
    const snapshot = await response.json();
    lootMarkers = snapshot.publishedLootMarkers;
    locationMarkers = snapshot.mapLocations ?? [];
  } else {
    const manifestResponse = await fetch(assetUrl("assets/games/days-gone/regions/manifest.json"), { cache: "no-store" });
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      const version = String(manifest.generatedAt ?? manifest.version ?? "");
      const cachedVersion = localStorage.getItem("days-gone-map-data-version");
      const snapshots = await Promise.all(manifest.regions.map(async (region) => {
        const url = new URL(assetUrl(region.path));
        if (version && version !== cachedVersion) url.searchParams.set("v", version);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${region.label}.`);
        return response.json();
      }));
      if (version) localStorage.setItem("days-gone-map-data-version", version);
      lootMarkers = snapshots.flatMap((snapshot) => snapshot.markers ?? []);
      locationMarkers = snapshots.flatMap((snapshot) => snapshot.locations ?? []);
    } else {
      const response = await fetch(assetUrl("assets/games/days-gone/published-map.json"));
      if (!response.ok) throw new Error("No published snapshot found.");
      const snapshot = await response.json();
      lootMarkers = snapshot.publishedLootMarkers;
      locationMarkers = snapshot.mapLocations ?? [];
    }
  }
  if (!Array.isArray(lootMarkers) || !Array.isArray(locationMarkers)) throw new Error("Published map data is invalid.");
  const normalizedLootMarkers = lootMarkers.map((marker) => ({ ...marker, title: canonicalLootItemName(marker.title) }));
  return { lootMarkers: dedupeMarkers(normalizedLootMarkers), locationMarkers: dedupeMarkers(locationMarkers) };
}

export async function loadPublishedMarkers() {
  return (await loadPublishedMap()).lootMarkers;
}
