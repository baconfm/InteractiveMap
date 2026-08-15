import { DAYS_GONE_TRACED_ICON_BODIES } from "./overlay-icons.js";
import { renderLootItemIcon } from "./loot-item-icons.js";

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

export function renderDaysGoneMarkerIcon(marker) {
  if (marker.type === "loot_cluster") {
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#f0be5d" stroke="#182018" stroke-width="2.5"/><path d="m9 12 7-4 7 4-7 4-7-4Zm0 5 7 4 7-4m-14 5 7 4 7-4" fill="none" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/><text x="16" y="20" fill="#182018" font-family="Arial,sans-serif" font-size="9" font-weight="800" text-anchor="middle">${marker.clusterCount}</text></svg>`;
  }
  if (marker.type === "loot_stack") {
    const hasBuiltInCount = marker.title === "Bottle" || marker.title === "Beer Bottle";
    const countBadge = hasBuiltInCount ? "" : `<b class="loot-stack-icon__count">${marker.stackCount}</b>`;
    return `<span class="loot-stack-icon">${renderLootItemIcon(marker.title, marker.stackCount)}${countBadge}</span>`;
  }
  if (marker.icon === "mushroom") return mushroomIcon();
  if (marker.icon === "plant") return plantIcon();
  if (!marker.icon && marker.type === "collectible_mushroom") return mushroomIcon();
  if (!marker.icon && marker.type === "collectible_plant") return plantIcon();
  if (!marker.icon && (/mushroom/i.test(`${marker.type} ${marker.title} ${marker.note}`))) return mushroomIcon();
  if (!marker.icon && isPlantMarker(marker)) return plantIcon();
  if (marker.type === "loot_item") {
    return renderLootItemIcon(marker.title, marker.quantity);
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
