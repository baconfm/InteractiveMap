import { DAYS_GONE_TRACED_ICON_BODIES } from "./overlay-icons.js";
import { canonicalLootItemName, renderLootItemIcon } from "./loot-item-icons.js";
import { isOneTimeSpawn } from "./loot-rules.js";
import { randomEncounterKind } from "./random-encounters.js";

const ICON_COLORS = {
  collectibles: "#d9d6bd",
  injector: "#a7d2ef",
  cairn: "#c9a777",
  horde: "#d65a50",
  camp: "#83b977",
  ambush: "#e69755",
  ipca: "#b780d2",
  infestation: "#cc8f61",
};

function iconName(marker) {
  const text = `${marker.type} ${marker.title} ${marker.note}`.toLocaleLowerCase();
  if (marker.type === "trophy") return "trophy";
  if (text.includes("ipca")) return "ipca";
  if (text.includes("horde")) return "horde";
  if (text.includes("infestation") || text.includes("nest")) return "infestation";
  if (text.includes("ambush")) return "ambush";
  if (text.includes("camp")) return "camp";
  if (text.includes("cairn")) return "cairn";
  if (text.includes("nero") || text.includes("injector")) return "injector";
  return "collectibles";
}

function isPlantMarker(marker) {
  const text = `${marker.type} ${marker.title} ${marker.note}`.toLocaleLowerCase();
  return marker.type === "collectible_plant" || /\bplant\b|lavender|herb|berry|scaly hedgehog/.test(text);
}

function plantIcon() {
  return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#73ae68" stroke="#182018" stroke-width="2"/><path d="M14 22V7M14 16c-6 0-7-5-7-8 5 0 7 3 7 8Zm0-4c5 0 7-4 7-7-5 0-7 3-7 7Z" fill="none" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
}

function mushroomIcon() {
  return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#c98e66" stroke="#182018" stroke-width="2"/><path d="M8 14a6 6 0 0 1 12 0H8Zm4 0h4l1 7h-6l1-7Z" fill="#f4e8cf" stroke="#182018" stroke-linejoin="round" stroke-width="1.5"/></svg>';
}

function withOneTimeSpawnBadge(marker, icon) {
  if (!isOneTimeSpawn(marker)) return icon;
  return `<span class="one-time-spawn-icon">${icon}<b class="one-time-spawn-icon__badge">1×</b></span>`;
}

export function renderDaysGoneMarkerIcon(marker) {
  const title = canonicalLootItemName(marker.title);
  if (marker.type === "random_encounter") {
    const kind = randomEncounterKind(marker);
    const icons = {
      survivor: '<circle cx="14" cy="14" r="12" fill="#4d91d0" stroke="#182018" stroke-width="2"/><circle cx="14" cy="9.5" r="3" fill="#f4f1e7"/><path d="M8.5 21c.8-4 2.8-6 5.5-6s4.7 2 5.5 6" fill="none" stroke="#f4f1e7" stroke-linecap="round" stroke-width="2.5"/>',
      hostage: '<circle cx="14" cy="14" r="12" fill="#9b79b8" stroke="#182018" stroke-width="2"/><circle cx="14" cy="9" r="2.5" fill="#f4f1e7"/><path d="M9 20c1-3 2.7-4.5 5-4.5s4 1.5 5 4.5M8 14h12M10 12v4m8-4v4" fill="none" stroke="#f4f1e7" stroke-linecap="round" stroke-width="1.8"/>',
      sniper: '<circle cx="14" cy="14" r="12" fill="#bd5b56" stroke="#182018" stroke-width="2"/><circle cx="14" cy="14" r="4" fill="none" stroke="#f4f1e7" stroke-width="2"/><path d="M14 6v4m0 8v4M6 14h4m8 0h4" stroke="#f4f1e7" stroke-linecap="round" stroke-width="2"/>',
      "exploding-car": '<circle cx="14" cy="14" r="12" fill="#df8c3f" stroke="#182018" stroke-width="2"/><path d="m14 5-2 5h3l-1 5 4-6h-3l2-4Z" fill="#fff1b6"/><path d="M7 17h14v4H7zM9 21a2 2 0 1 0 0 .01M19 21a2 2 0 1 0 0 .01" fill="none" stroke="#182018" stroke-linejoin="round" stroke-width="1.5"/>',
      other: '<circle cx="14" cy="14" r="12" fill="#718078" stroke="#182018" stroke-width="2"/><path d="M10.5 11.5a3.5 3.5 0 1 1 5.2 3l-1.7 1v1.5m0 4h.01" fill="none" stroke="#f4f1e7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>',
    };
    return `<svg viewBox="0 0 28 28" aria-hidden="true">${icons[kind]}</svg>`;
  }
  if (marker.type === "fast_travel_arrival") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#7bc8e8" stroke="#182018" stroke-width="2"/><path d="M14 6v12m0 0-4-4m4 4 4-4M8 20h12" fill="none" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (marker.type === "loot_cluster") {
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#f0be5d" stroke="#182018" stroke-width="2.5"/><path d="m9 12 7-4 7 4-7 4-7-4Zm0 5 7 4 7-4m-14 5 7 4 7-4" fill="none" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/><text x="16" y="20" fill="#182018" font-family="Arial,sans-serif" font-size="9" font-weight="800" text-anchor="middle">${marker.clusterCount}</text></svg>`;
  }
  if (marker.type === "loot_stack") {
    const hasBuiltInCount = title === "Bottle";
    const countBadge = hasBuiltInCount ? "" : `<b class="loot-stack-icon__count">${marker.stackCount}</b>`;
    return withOneTimeSpawnBadge(marker, `<span class="loot-stack-icon">${renderLootItemIcon(title, marker.stackCount)}${countBadge}</span>`);
  }
  if (title === "Cedar Sapling") return withOneTimeSpawnBadge(marker, renderLootItemIcon(title, marker.quantity));
  if (marker.icon === "mushroom") return mushroomIcon();
  if (marker.icon === "plant") return plantIcon();
  if (!marker.icon && marker.type === "collectible_mushroom") return mushroomIcon();
  if (!marker.icon && marker.type === "collectible_plant") return plantIcon();
  if (!marker.icon && (/mushroom/i.test(`${marker.type} ${marker.title} ${marker.note}`))) return mushroomIcon();
  if (!marker.icon && isPlantMarker(marker)) return plantIcon();
  if (marker.type === "loot_item") {
    return withOneTimeSpawnBadge(marker, renderLootItemIcon(title, marker.quantity));
  }
  if (marker.type === "loot_location") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" style="color:#f0be5d"><path fill="currentColor" d="M4 8h16v12H4zM6 4h12v3H6zM10.75 11h2.5v3h-2.5z"/></svg>';
  }
  const name = marker.icon && marker.icon !== "auto" ? marker.icon : iconName(marker);
  if (name === "trophy") {
    return '<img src="assets/games/days-gone/map/days-gone-chain-skull.png" alt="" />';
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true" style="color:${ICON_COLORS[name]}">${DAYS_GONE_TRACED_ICON_BODIES[name]}</svg>`;
}
