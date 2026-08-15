import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "POST" && url.pathname === "/api/publish") return publish(request, response);
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
