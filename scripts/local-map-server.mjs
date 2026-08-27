import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const newsPath = join(projectRoot, "news/posts.json");
const regionStatusPath = join(projectRoot, "news/project-status.json");
const regionNames = ["Cascades", "Belknap", "Lost Lake", "Iron Butte", "Crater Lake", "Highway 97"];
const dedupeMarkers = (markers) => {
  const markerIds = new Set();
  return markers.filter((marker) => {
    if (!marker?.id || markerIds.has(marker.id)) return false;
    markerIds.add(marker.id);
    return true;
  });
};
const port = 8173;
const contentTypes = {
  ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".webp": "image/webp",
};

function send(response, status, body, type = "application/json; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  response.end(body);
}

function run(command, args) {
  return execFileSync(command, args, { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

async function syncNews() {
  await rm(join(projectRoot, "cloudflare-upload/news"), { recursive: true, force: true });
  await cp(join(projectRoot, "news"), join(projectRoot, "cloudflare-upload/news"), { recursive: true });
}

async function publish(request, response) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 15_000_000) return send(response, 413, JSON.stringify({ error: "Map data is too large to publish." }));
  }
  try {
    const snapshot = JSON.parse(raw);
    if (!Array.isArray(snapshot.publishedLootMarkers) || !Array.isArray(snapshot.allLootMarkers)) {
      throw new Error("The editor did not provide valid loot marker data.");
    }
    const publishedLootMarkers = dedupeMarkers(snapshot.publishedLootMarkers);
    const cleanedSnapshot = {
      ...snapshot,
      publishedLootMarkers,
      allLootMarkers: publishedLootMarkers,
      lootMarkers: publishedLootMarkers,
    };
    const dataPath = join(projectRoot, "assets/games/days-gone/published-map.json");
    await mkdir(dirname(dataPath), { recursive: true });
    await writeFile(dataPath, `${JSON.stringify(cleanedSnapshot, null, 2)}\n`);
    run(process.execPath, ["scripts/sync-cloudflare-published-map.mjs"]);
    run("git", ["add", "assets/games/days-gone/published-map.json", "assets/games/days-gone/regions", "cloudflare-upload/assets/games/days-gone/published-map.json", "cloudflare-upload/assets/games/days-gone/regions"]);
    try {
      run("git", ["diff", "--cached", "--quiet"]);
    } catch (error) {
      if (error.status !== 1) throw error;
      run("git", ["commit", "-m", "Update Days Gone regional map data"]);
      run("git", ["push", "origin", "main"]);
    }
    send(response, 200, JSON.stringify({ markerCount: publishedLootMarkers.length }));
  } catch (error) {
    send(response, 500, JSON.stringify({ error: error.stderr?.trim() || error.message || "Could not publish map data." }));
  }
}

async function publishNews(request, response) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 10_000) return send(response, 413, JSON.stringify({ error: "News post is too large." }));
  }
  try {
    const { date, title, body } = JSON.parse(raw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof title !== "string" || typeof body !== "string" || !title.trim() || !body.trim()) throw new Error("Enter a title, date, and post.");
    if (new Date(`${date}T12:00:00`).toISOString().slice(0, 10) !== date) throw new Error("Enter a valid date.");
    const posts = JSON.parse(await readFile(newsPath, "utf8"));
    posts.unshift({ date, title: title.trim().slice(0, 120), body: body.trim().slice(0, 2000).split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean) });
    await writeFile(newsPath, `${JSON.stringify(posts, null, 2)}\n`);
    await syncNews();
    run("git", ["add", "news", "cloudflare-upload/news"]);
    try {
      run("git", ["diff", "--cached", "--quiet"]);
    } catch (error) {
      if (error.status !== 1) throw error;
      run("git", ["commit", "-m", "Publish news post"]);
      run("git", ["push", "origin", "main"]);
    }
    send(response, 200, JSON.stringify({ postCount: posts.length }));
  } catch (error) {
    send(response, 400, JSON.stringify({ error: error.stderr?.trim() || error.message || "Could not publish news." }));
  }
}

async function publishRegionStatus(request, response) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 5_000) return send(response, 413, JSON.stringify({ error: "Region statuses are too large." }));
  }
  try {
    const { date, regions } = JSON.parse(raw);
    if (new Date(`${date}T12:00:00`).toISOString().slice(0, 10) !== date || !regions || regionNames.some((region) => typeof regions[region] !== "string" || !regions[region].trim())) throw new Error("Enter a valid date and every region status.");
    await writeFile(regionStatusPath, `${JSON.stringify({ date, regions: Object.fromEntries(regionNames.map((region) => [region, regions[region].trim().slice(0, 30)])) }, null, 2)}\n`);
    await syncNews();
    run("git", ["add", "news", "cloudflare-upload/news"]);
    try {
      run("git", ["diff", "--cached", "--quiet"]);
    } catch (error) {
      if (error.status !== 1) throw error;
      run("git", ["commit", "-m", "Update region statuses"]);
      run("git", ["push", "origin", "main"]);
    }
    send(response, 200, JSON.stringify({ updated: true }));
  } catch (error) {
    send(response, 400, JSON.stringify({ error: error.stderr?.trim() || error.message || "Could not publish statuses." }));
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "POST" && url.pathname === "/api/publish") return publish(request, response);
  if (request.method === "POST" && url.pathname === "/api/publish-news") return publishNews(request, response);
  if (request.method === "POST" && url.pathname === "/api/publish-region-status") return publishRegionStatus(request, response);
  if (request.method !== "GET" && request.method !== "HEAD") return send(response, 405, "Method not allowed", "text/plain; charset=utf-8");
  const relativePath = url.pathname === "/" ? "editor-local.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const filePath = resolve(projectRoot, normalize(relativePath));
  if (!filePath.startsWith(projectRoot)) return send(response, 403, "Forbidden", "text/plain; charset=utf-8");
  try {
    const file = await readFile(filePath);
    send(response, 200, request.method === "HEAD" ? "" : file, contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream");
  } catch {
    send(response, 404, "Not found", "text/plain; charset=utf-8");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Days Gone editor: http://localhost:${port}/editor-local.html`);
});
