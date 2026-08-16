import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const sourcePath = resolve(projectRoot, "assets/games/days-gone/published-map.json");
const regionsDirectory = resolve(projectRoot, "assets/games/days-gone/regions");
const regions = [
  ["cascades", "Cascades"],
  ["belknap", "Belknap"],
  ["lost-lake", "Lost Lake"],
  ["iron-butte", "Iron Butte"],
  ["crater-lake", "Crater Lake"],
  ["highway-97", "Highway 97"],
];
const aliases = new Map([
  ["manual", "Cascades"],
  ["cascade", "Cascades"],
  ["cascades", "Cascades"],
  ["belknap", "Belknap"],
  ["lost lake", "Lost Lake"],
  ["iron butte", "Iron Butte"],
  ["crater lake", "Crater Lake"],
  ["highway 97", "Highway 97"],
]);

const ironButteLostLakeBoundaryX = (y) => {
  const top = { x: 2986, y: 2186 };
  const bottom = { x: 2919, y: 3733 };
  return top.x + ((y - top.y) / (bottom.y - top.y)) * (bottom.x - top.x);
};

const regionForPosition = (position) => {
  if (position && position.y >= 2186 && position.y <= 3733) {
    return position.x < ironButteLostLakeBoundaryX(position.y) ? "Iron Butte" : "Lost Lake";
  }
  if (position && position.x >= 521 && position.x <= 1837 && position.y >= 1776 && position.y <= 3277) return "Iron Butte";
  if (position && position.x <= 2320 && position.y <= 1940) return "Belknap";
  return null;
};

const normalizeMarker = (marker) => {
  const region = regionForPosition(marker.position)
    ?? aliases.get(String(marker.region ?? "").trim().toLowerCase())
    ?? "Cascades";
  return { ...marker, region };
};
const dedupeMarkers = (markers) => {
  const markerIds = new Set();
  return markers.filter((marker) => {
    if (!marker?.id || markerIds.has(marker.id)) return false;
    markerIds.add(marker.id);
    return true;
  });
};
const snapshot = JSON.parse(await readFile(sourcePath, "utf8"));
const allMarkers = dedupeMarkers(
  (Array.isArray(snapshot.allLootMarkers) ? snapshot.allLootMarkers : snapshot.publishedLootMarkers ?? [])
    .map(normalizeMarker),
);
const nextSnapshot = {
  ...snapshot,
  publishedLootMarkers: allMarkers,
  lootMarkers: allMarkers,
  allLootMarkers: allMarkers,
  generatedAt: new Date().toISOString(),
};

await mkdir(regionsDirectory, { recursive: true });
await writeFile(sourcePath, `${JSON.stringify(nextSnapshot, null, 2)}\n`);

const manifestRegions = [];
for (const [id, label] of regions) {
  const markers = allMarkers.filter((marker) => marker.region === label);
  const path = `assets/games/days-gone/regions/${id}.json`;
  await writeFile(resolve(regionsDirectory, `${id}.json`), `${JSON.stringify({ version: 1, region: label, markers }, null, 2)}\n`);
  manifestRegions.push({ id, label, path, markerCount: markers.length });
}
await writeFile(resolve(regionsDirectory, "manifest.json"), `${JSON.stringify({ version: 1, generatedAt: nextSnapshot.generatedAt, regions: manifestRegions }, null, 2)}\n`);
console.log(`Built ${manifestRegions.length} region files from ${allMarkers.length} markers.`);
