import { APP_CONFIG } from "./core/config.js";
import { daysGoneMap } from "./data/games/days-gone/map.js";
import { MapEngine } from "./map/MapEngine.js";
import { MapMarkerLayer } from "./map/MapMarkerLayer.js";
import { bindControls } from "./ui/Controls.js";

const assetUrl = (path) => new URL(`../${path}`, import.meta.url).href;
const tileTemplateUrl = (template) => assetUrl(template.replace("{x}", "tile-column-placeholder").replace("{y}", "tile-row-placeholder"))
  .replace("tile-column-placeholder", "{x}").replace("tile-row-placeholder", "{y}");
const map = { ...daysGoneMap, background: { ...daysGoneMap.background, image: assetUrl(daysGoneMap.background.image) }, tiles: { ...daysGoneMap.tiles, template: tileTemplateUrl(daysGoneMap.tiles.template) } };
const intro = document.querySelector("#hide-deek-intro");
const photo = document.querySelector("#hide-deek-photo");
const thinking = document.querySelector("#hide-deek-thinking");
const goButton = document.querySelector("#hide-deek-go");
const mapShell = document.querySelector("#map-shell");
const roundTimer = document.querySelector("#hide-deek-round-timer");
const gameTitle = document.querySelector("#hide-deek-game-title");
const gameMessage = document.querySelector("#hide-deek-game-message");
const nextButton = document.querySelector("#hide-deek-next");
let candidates = [];
let round;
let thinkingInterval;
let roundInterval;

const engine = new MapEngine({ viewport: document.querySelector("#map-viewport"), canvas: document.querySelector("#map-canvas"), map, cameraConfig: APP_CONFIG.camera, onMapClick: guess });
const resultLayer = new MapMarkerLayer(engine.layers.get("annotations"), map.size, { renderIcon: (marker) => `<span class="hide-deek-pin hide-deek-pin--${marker.kind}">${marker.kind === "guess" ? "●" : "✓"}</span>` });

function formatTime(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

async function loadCandidates() {
  const manifestResponse = await fetch(assetUrl("assets/games/days-gone/regions/manifest.json"), { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("No map regions have been published yet.");
  const manifest = await manifestResponse.json();
  const snapshots = await Promise.all(manifest.regions.map(async (region) => (await fetch(assetUrl(region.path), { cache: "no-store" })).json()));
  candidates = snapshots.flatMap((snapshot) => snapshot.markers ?? []).flatMap((marker) => (marker.photos ?? []).map((image) => ({ marker, image })));
  if (!candidates.length) throw new Error("No marker photos have been published yet.");
}

function beginThinking() {
  clearInterval(thinkingInterval);
  clearInterval(roundInterval);
  resultLayer.render([]);
  round = { ...candidates[Math.floor(Math.random() * candidates.length)], phase: "thinking", thinkingEndsAt: Date.now() + 30_000 };
  photo.src = round.image;
  photo.onerror = () => { gameMessage.textContent = "This photo could not be loaded. Start another round."; };
  intro.hidden = false;
  mapShell.hidden = true;
  nextButton.hidden = true;
  const tick = () => {
    const remaining = (round.thinkingEndsAt - Date.now()) / 1000;
    thinking.textContent = `Think time: ${formatTime(remaining)}`;
    if (remaining <= 0) revealMap();
  };
  tick();
  thinkingInterval = setInterval(tick, 250);
}

function revealMap() {
  if (!round || round.phase !== "thinking") return;
  clearInterval(thinkingInterval);
  round = { ...round, phase: "guessing", guessEndsAt: Date.now() + 300_000 };
  intro.hidden = true;
  mapShell.hidden = false;
  window.requestAnimationFrame(() => {
    engine.mount();
  });
  const tick = () => {
    const elapsed = Math.max(0, (Date.now() - (round.guessEndsAt - 300_000)) / 1000);
    roundTimer.textContent = elapsed < 300 ? formatTime(300 - elapsed) : "5:00+";
    if (elapsed >= 300) gameMessage.textContent = "Time bonus is gone. Guess for accuracy points.";
  };
  tick();
  roundInterval = setInterval(tick, 250);
}

function guess(position) {
  if (round?.phase !== "guessing") return;
  clearInterval(roundInterval);
  const elapsed = Math.max(0, (Date.now() - (round.guessEndsAt - 300_000)) / 1000);
  const distance = Math.round(Math.hypot(position.x - round.marker.position.x, position.y - round.marker.position.y));
  const diagonal = Math.hypot(map.size.width, map.size.height);
  const accuracy = Math.round(700 * Math.max(0, 1 - distance / diagonal));
  const speed = elapsed < 300 ? Math.round(300 * (1 - elapsed / 300)) : 0;
  const score = accuracy + speed;
  round = { ...round, phase: "answered" };
  resultLayer.render([{ id: "guess", title: "Your guess", position, kind: "guess" }, { id: "answer", title: "Correct location", position: round.marker.position, kind: "answer" }]);
  gameTitle.textContent = `${score} / 1000 points`;
  gameMessage.textContent = `${distance} map units away · ${accuracy} accuracy + ${speed} speed. Green is correct; gold is your guess.`;
  nextButton.hidden = false;
}

goButton.addEventListener("click", revealMap);
nextButton.addEventListener("click", beginThinking);
try { await loadCandidates(); beginThinking(); } catch (error) { thinking.textContent = error.message; goButton.disabled = true; }
bindControls(engine);
