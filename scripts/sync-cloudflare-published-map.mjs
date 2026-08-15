import { copyFile, cp, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const source = resolve(projectRoot, "assets/games/days-gone/published-map.json");
const destination = resolve(projectRoot, "cloudflare-upload/assets/games/days-gone/published-map.json");
const photosSource = resolve(projectRoot, "assets/photos");
const photosDestination = resolve(projectRoot, "cloudflare-upload/assets/photos");

const snapshot = JSON.parse(await readFile(source, "utf8"));
const markers = snapshot.publishedLootMarkers;

if (!Array.isArray(markers)) {
  throw new Error("The editor map data does not contain a publishedLootMarkers array.");
}

await copyFile(source, destination);
await cp(photosSource, photosDestination, { recursive: true, force: true });
console.log(`Synced ${markers.length} published markers and photo assets into the Cloudflare upload bundle.`);
