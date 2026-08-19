import { copyFile, cp, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const source = resolve(projectRoot, "assets/games/days-gone/published-map.json");
const destination = resolve(projectRoot, "cloudflare-upload/assets/games/days-gone/published-map.json");
const sourceCode = resolve(projectRoot, "src");
const destinationCode = resolve(projectRoot, "cloudflare-upload/src");
const readonlySource = resolve(projectRoot, "readonly");
const readonlyDestination = resolve(projectRoot, "cloudflare-upload/readonly");
const newsSource = resolve(projectRoot, "news");
const newsDestination = resolve(projectRoot, "cloudflare-upload/news");
const aboutSource = resolve(projectRoot, "about.html");
const aboutDestination = resolve(projectRoot, "cloudflare-upload/about.html");
const aboutTextSource = resolve(projectRoot, "about.txt");
const aboutTextDestination = resolve(projectRoot, "cloudflare-upload/about.txt");
const stylesSource = resolve(projectRoot, "styles.css");
const stylesDestination = resolve(projectRoot, "cloudflare-upload/styles.css");
const sitemapSource = resolve(projectRoot, "sitemap.xml");
const sitemapDestination = resolve(projectRoot, "cloudflare-upload/sitemap.xml");
const photosSource = resolve(projectRoot, "assets/photos");
const photosDestination = resolve(projectRoot, "cloudflare-upload/assets/photos");
const iconsSource = resolve(projectRoot, "assets/icons");
const iconsDestination = resolve(projectRoot, "cloudflare-upload/assets/icons");
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
await rm(destinationCode, { recursive: true, force: true });
await rm(readonlyDestination, { recursive: true, force: true });
await rm(newsDestination, { recursive: true, force: true });
await cp(sourceCode, destinationCode, { recursive: true, force: true });
await cp(readonlySource, readonlyDestination, { recursive: true, force: true });
await cp(newsSource, newsDestination, { recursive: true, force: true });
await copyFile(aboutSource, aboutDestination);
await copyFile(aboutTextSource, aboutTextDestination);
await copyFile(stylesSource, stylesDestination);
await copyFile(sitemapSource, sitemapDestination);
await cp(photosSource, photosDestination, { recursive: true, force: true });
await cp(iconsSource, iconsDestination, { recursive: true, force: true });
await cp(regionsSource, regionsDestination, { recursive: true, force: true });
console.log(`Synced ${markers.length} published markers, public pages, regional files, photo assets, and item icons into the Cloudflare upload bundle.`);
