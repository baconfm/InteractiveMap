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
const shouldReclassifyRegions = process.argv.includes("--reclassify-regions");

const lostLakeBoundaries = {
  cascadesExit: { x: 3284, y: 2304 }, highway97Exit: { x: 2715, y: 3696 },
  ironButteExits: [{ x: 1845, y: 2446 }, { x: 1797, y: 2732 }, { x: 1817, y: 2902 }],
};

const regionForPosition = (position) => {
  if (position && position.y >= lostLakeBoundaries.cascadesExit.y && position.y <= lostLakeBoundaries.highway97Exit.y) {
    return position.x < Math.min(...lostLakeBoundaries.ironButteExits.map((exit) => exit.x)) ? "Iron Butte" : "Lost Lake";
  }
  if (position && position.x >= 521 && position.x <= 1837 && position.y >= 1776 && position.y <= 3277) return "Iron Butte";
  if (position && position.x <= 2320 && position.y <= 1940) return "Belknap";
  return null;
};

const normalizeMarker = (marker) => {
  const savedRegion = aliases.get(String(marker.region ?? "").trim().toLowerCase());
  const inferredRegion = regionForPosition(marker.position);
  const region = (shouldReclassifyRegions ? inferredRegion : savedRegion)
    ?? savedRegion
    ?? inferredRegion
    ?? "Cascades";
  return { ...marker, title: marker.title === "Beer Bottle" ? "Bottle" : marker.title, region };
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
const mapLocations = dedupeMarkers((Array.isArray(snapshot.mapLocations) ? snapshot.mapLocations : []).map(normalizeMarker));
const nextSnapshot = {
  ...snapshot,
  publishedLootMarkers: allMarkers,
  lootMarkers: allMarkers,
  allLootMarkers: allMarkers,
  mapLocations,
  generatedAt: new Date().toISOString(),
};

await mkdir(regionsDirectory, { recursive: true });
await writeFile(sourcePath, `${JSON.stringify(nextSnapshot, null, 2)}\n`);

const manifestRegions = [];
for (const [id, label] of regions) {
  const markers = allMarkers.filter((marker) => marker.region === label);
  const locations = mapLocations.filter((marker) => marker.region === label);
  const path = `assets/games/days-gone/regions/${id}.json`;
  await writeFile(resolve(regionsDirectory, `${id}.json`), `${JSON.stringify({ version: 1, region: label, markers, locations }, null, 2)}\n`);
  manifestRegions.push({ id, label, path, markerCount: markers.length, locationCount: locations.length });
}
await writeFile(resolve(regionsDirectory, "manifest.json"), `${JSON.stringify({ version: 1, generatedAt: nextSnapshot.generatedAt, regions: manifestRegions }, null, 2)}\n`);
console.log(`Built ${manifestRegions.length} region files from ${allMarkers.length} markers${shouldReclassifyRegions ? " after reclassifying coordinates" : " using saved classifications"}.`);
