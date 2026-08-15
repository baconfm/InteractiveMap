import { copyFile, cp, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const source = resolve(projectRoot, "assets/games/days-gone/published-map.json");
const destination = resolve(projectRoot, "cloudflare-upload/assets/games/days-gone/published-map.json");
const photosSource = resolve(projectRoot, "assets/photos");
const photosDestination = resolve(projectRoot, "cloudflare-upload/assets/photos");
const regionsSource = resolve(projectRoot, "assets/games/days-gone/regions");
const regionsDestination = resolve(projectRoot, "cloudflare-upload/assets/games/days-gone/regions");
const run = promisify(execFile);

await run(process.execPath, [resolve(scriptDirectory, "build-regional-published-map.mjs")]);

const snapshot = JSON.parse(await readFile(source, "utf8"));
const markers = snapshot.publishedLootMarkers;

if (!Array.isArray(markers)) {
  throw new Error("The editor map data does not contain a publishedLootMarkers array.");
}

await copyFile(source, destination);
await cp(photosSource, photosDestination, { recursive: true, force: true });
await cp(regionsSource, regionsDestination, { recursive: true, force: true });
console.log(`Synced ${markers.length} published markers, regional files, and photo assets into the Cloudflare upload bundle.`);
