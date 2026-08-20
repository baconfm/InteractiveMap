const ITEM_BADGES = {
  "2x4": ["2×4", "#a67a54"],
  Airbag: ["AB", "#a8c6d7"],
  "Alarm Clock": ["AC", "#d4b36a"],
  "Ammo Tin": ["AM", "#86a36b"],
  Attractor: ["AT", "#b886d5"],
  "Attractor Bomb": ["AX", "#b060c8"],
  Bandage: ["BD", "#e9e5d5"],
  "Baseball Bat": ["BT", "#9c6b45"],
  Bottle: ["BT", "#86aa75"],
  Can: ["CN", "#b4bdc5"],
  "Car Alarm": ["CA", "#d9795e"],
  Cairn: ["CR", "#a79b83"],
  "Cedar Sapling": ["CS", "#4f9461"],
  "Collectible Plant": ["PL", "#73ae68"],
  "Dog Toy": ["DT", "#e28b5a"],
  Flashbang: ["FB", "#f1e99a"],
  "Fire Axe": ["FA", "#c95c45"],
  "Gas Can": ["GC", "#d9684d"],
  Grenade: ["GR", "#77966e"],
  Growler: ["GW", "#7c9c6a"],
  "Gun Powder": ["GP", "#8a8177"],
  "Health Cocktail": ["HC", "#d97883"],
  Hatchet: ["HA", "#b9c2bd"],
  Kerosene: ["KE", "#e9bd62"],
  Machete: ["MA", "#c7d0d2"],
  M40: ["M40", "#6d8791"],
  Medkit: ["MK", "#d86562"],
  Molotov: ["MO", "#e3784d"],
  Mushroom: ["MS", "#c98e66"],
  Nails: ["NA", "#9ca6ab"],
  Pipe: ["PI", "#7b9196"],
  "Pipe Bomb": ["PB", "#ba6452"],
  Poison: ["PO", "#7aa94f"],
  Polystyrene: ["PS", "#d5d4cc"],
  "Prox Mine": ["PM", "#a38d59"],
  "Prox Bomb": ["PX", "#ba6658"],
  Rag: ["RA", "#ded4ac"],
  Random: ["?", "#8b78b8"],
  "Remote Bomb": ["RB", "#9b74ba"],
  "Ripper Axe": ["RX", "#a9554b"],
  SAF: ["SAF", "#6f8fa8"],
  "Saw Blade": ["SB", "#afb5ba"],
  "Sawed Off": ["SO", "#7f695b"],
  Scrap: ["SC", "#c69058"],
  Pickaxe: ["PA", "#8a7960"],
  Sledgehammer: ["SH", "#787f78"],
  "Smoke Bomb": ["SM", "#9e9ca8"],
  "Spark Igniter": ["SI", "#e7d15d"],
  "Stamina Cocktail": ["ST", "#6bb6a4"],
  Sterilizer: ["SZ", "#7caed1"],
  Suppressor: ["SU", "#555f64"],
  "Superior Axe": ["SA", "#8e9fa3"],
  "Superior Mace": ["SM", "#8e9fa3"],
};

const SHEET_GLYPHS = {
  "2x4": ["#a67a54", '<path d="M6 10h16v8H6zM8 12h12v4H8z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/>'],
  Airbag: ["#a8c6d7", '<path d="M8 19c0-6 2-9 6-9s6 3 6 9H8Zm4-8V8h4v3M7 19h14v3H7z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/>'],
  "Alarm Clock": ["#d4b36a", '<path d="M9 19a5 5 0 1 1 10 0 5 5 0 0 1-10 0Zm5-3v3l2 1M9 9l-2-2m12 2 2-2M8 23l2-2m4 0 2 2" fill="none" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>'],
  "Ammo Tin": ["#86a36b", '<path d="M6 10h16v10H6zM8 8h12v2H8zM9 14h3m2 0h3m-8 3h8" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/>'],
  Attractor: ["#b886d5", '<path d="M9 7v8a5 5 0 0 0 10 0V7h-3v8a2 2 0 0 1-4 0V7H9Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.5"/>'],
  "Attractor Bomb": ["#b060c8", '<path d="M9 7v8a5 5 0 0 0 10 0V7h-3v8a2 2 0 0 1-4 0V7H9ZM19 8l3-2m-2 5 3 1" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/>'],
  Bandage: ["#e9e5d5", '<path d="M8 10h12v8H8zM10 8h8v12h-8zM12 12h4v4h-4z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  Can: ["#b4bdc5", '<path d="M9 7h10l1 3v11H8V10l1-3Zm0 4h11M9 21h11" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Car Alarm": ["#d9795e", '<path d="M7 14h9l3-3v10l-3-3H7v-4Zm14 1c2 1 2 3 0 4m1-7c4 3 4 7 0 10" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>'],
  Flashbang: ["#f1e99a", '<path d="M14 7a7 7 0 1 0 7 7M15 5v3m6-1-2 2m4 5h-3m1 6-2-2M8 9l2 2" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>'],
  "Gas Can": ["#d9684d", '<path d="M9 8h8v3h2v11H8V11h1V8Zm3 0V6h4v2m-4 7h4" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/>'],
  Grenade: ["#77966e", '<path d="M10 20a5 5 0 1 0 8 0v-3h-8v3Zm3-7V9h4v4m-2 4v-3m-3 3v-3m6 3v-3" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Gun Powder": ["#8a8177", '<path d="M8 9h12v12H8zM10 7h8v2m-6 5h4m-6 3h8" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Health Cocktail": ["#d97883", '<path d="M11 7h6v5l2 3v7H9v-7l2-3V7Zm3 8v4m-2-2h4" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/>'],
  Medkit: ["#d86562", '<path d="M7 10h14v11H7zM11 8h6v2m-3 3v5m-2-2h4" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/>'],
  Molotov: ["#e3784d", '<path d="M11 7h6v5l2 3v7H9v-7l2-3V7Zm3 8c2 2 1 4-1 5-2-2-1-4 1-5Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  Nails: ["#9ca6ab", '<path d="m8 20 10-10m-7 9 7-7m-9 1 2 2m6-7 2 2" fill="none" stroke="#f4f1e7" stroke-linecap="round" stroke-width="2"/>'],
  Pipe: ["#7b9196", '<path d="M7 13h14v5H7zM7 11v9m14-9v9" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/>'],
  "Pipe Bomb": ["#ba6452", '<path d="M6 13h14v5H6zM6 11v9m14-9v9m-4-7 4-4m0 0 2 2" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/>'],
  Poison: ["#7aa94f", '<path d="M14 8a5 5 0 0 0-5 5c0 2 1 3 2 4v3h6v-3c1-1 2-2 2-4a5 5 0 0 0-5-5Zm-2 5h.1m3.8 0h.1M12 17h4" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/>'],
  Polystyrene: ["#d5d4cc", '<path d="m8 11 6-3 6 3v8l-6 3-6-3v-8Zm6-3v14m-6-11 6 3 6-3" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Prox Mine": ["#a38d59", '<path d="M8 14a6 6 0 1 1 12 0v6H8v-6Zm3-3V9h6v2m-5 5h4m-2-2v4" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Prox Bomb": ["#ba6658", '<path d="M8 14a6 6 0 1 1 12 0v6H8v-6Zm7-6 2-3m-2 3 3 1m-7 7h6" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/>'],
  Rag: ["#ded4ac", '<path d="M8 9h11l2 4-4 10H8l-2-5 2-9Zm2 3 6 7m2-6-6 7" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Saw Blade": ["#afb5ba", '<path d="m14 7 2 2 3-1 1 3 3 1-1 3 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-1-3 3-1 1-3 3 1 2-2Zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.1"/>'],
  Scrap: ["#c69058", '<path d="m14 7 2 2 3-1 1 3 3 1-1 3 1 3-3 1-1 3-3-1-2 2-2-2-3 1-1-3-3-1 1-3-1-3 3-1 1-3 3 1 2-2Zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.1"/>'],
  "Smoke Bomb": ["#9e9ca8", '<path d="M9 19a5 5 0 1 0 8 0v-4H9v4Zm7-5 3-3m-1 0 2 2" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Spark Igniter": ["#e7d15d", '<path d="m16 5-7 11h5l-1 11 8-13h-5V5Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
  "Stamina Cocktail": ["#6bb6a4", '<path d="M11 7h6v5l2 3v7H9v-7l2-3V7Zm4 8-3 4h2v3l3-5h-2v-2Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.2"/>'],
  Suppressor: ["#555f64", '<path d="M7 12h14v6H7zM7 10v10m14-10v10m-9-8v6" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.3"/>'],
};

export const LOOT_ITEM_NAMES = Object.keys(ITEM_BADGES);

export function canonicalLootItemName(itemName) {
  return itemName === "Beer Bottle" ? "Bottle" : itemName;
}

export function renderLootItemIcon(itemName, quantity = 1) {
  itemName = canonicalLootItemName(itemName);
  if (itemName === "Sledgehammer") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#787f78" stroke="#182018" stroke-width="2"/><path d="m8 21 9-9m-2-5 6 6m-8-4 4-4 4 4-4 4-4-4Z" fill="none" stroke="#e9e0cd" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Baseball Bat") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#9c6b45" stroke="#182018" stroke-width="2"/><path d="m8 20 9-9 3 3-9 9-3-3Zm9-9 1-4 3 3-4 1Z" fill="#ead6af" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/></svg>';
  }
  if (itemName === "Superior Axe") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#8e9fa3" stroke="#182018" stroke-width="2"/><path d="m8 21 8-8m-3-5 7 1-1 7-3-3-8 8m5-13 3 3" fill="none" stroke="#e6eee4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Superior Mace") {
    return '<span class="loot-item-icon loot-item-icon--superior-mace"><img src="/assets/icons/superiormace.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Fire Axe") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#c95c45" stroke="#182018" stroke-width="2"/><path d="m8 21 8-8m-1-5 6 2-2 6-3-3-8 8m8-13 3 3" fill="none" stroke="#fff0d6" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Ripper Axe") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#a9554b" stroke="#182018" stroke-width="2"/><path d="m8 21 8-8m-2-5 7 2-2 7-4-3-7 7m8-13 3 3" fill="none" stroke="#f5e4d0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="m11 9 2 2m4 4 2 2" stroke="#182018" stroke-linecap="round" stroke-width="1.25"/></svg>';
  }
  if (itemName === "Remote Bomb") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#9b74ba" stroke="#182018" stroke-width="2"/><path d="M9 15h10v7H9v-7Zm3-3h4v3m-3 3h2m3-6 2-2m-9 8h.01m6 0h.01" fill="#f4f1e7" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.35"/></svg>';
  }
  if (itemName === "Pickaxe") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#8a7960" stroke="#182018" stroke-width="2"/><path d="m8 21 10-10m-4-2 7 1-1 4m-6-5 3 3" fill="none" stroke="#f0e3ca" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Sawed Off") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#7f695b" stroke="#182018" stroke-width="2"/><path d="M7 17h12l2-3 2 2-3 4H7v-3Zm4-3h6v3h-6z" fill="#f0e3ca" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/></svg>';
  }
  if (itemName === "SAF") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#6f8fa8" stroke="#182018" stroke-width="2"/><path d="M7 16h11l4-3 1 2-4 4H7v-3Zm4-3h6v3h-6z" fill="#edf3f0" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/></svg>';
  }
  if (itemName === "M40") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#6d8791" stroke="#182018" stroke-width="2"/><path d="M6 16h14l3-2 1 2-4 4H6v-4Zm7-4h6v3h-6zm-3 8 2 3m5-3 2 3" fill="#edf3f0" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.4"/></svg>';
  }
  if (itemName === "Random") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#8b78b8" stroke="#182018" stroke-width="2"/><path d="M10.5 11.5a3.5 3.5 0 1 1 5.2 3l-1.7 1v1.5m0 4h.01" fill="none" stroke="#f5f0dc" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Mushroom") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#c98e66" stroke="#182018" stroke-width="2"/><path d="M8 14a6 6 0 0 1 12 0H8Zm4 0h4l1 7h-6l1-7Z" fill="#f4e8cf" stroke="#182018" stroke-linejoin="round" stroke-width="1.5"/></svg>';
  }
  if (itemName === "Cairn") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#a79b83" stroke="#182018" stroke-width="2"/><path d="M7 19h14l-3-4h-8l-3 4Zm3-5h8l-2-4h-4l-2 4Zm2-5h4l-2-3-2 3Z" fill="#e5d8b8" stroke="#182018" stroke-linejoin="round" stroke-width="1.2"/></svg>';
  }
  if (itemName === "Grenade") {
    return '<span class="loot-item-icon"><img src="/assets/icons/Grenade.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Gas Can") {
    return '<span class="loot-item-icon"><img src="/assets/icons/gascanister.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Alarm Clock") {
    return '<span class="loot-item-icon"><img src="/assets/icons/alarmclock.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Growler") {
    return '<span class="loot-item-icon"><img src="/assets/icons/Growler.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Dog Toy") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#e28b5a" stroke="#182018" stroke-width="2"/><path d="m8 11 3 3m6 0 3-3M8 17l3-3m6 0 3 3M10 11h8v6h-8z" fill="#f7e4bb" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/></svg>';
  }
  if (itemName === "Rag") {
    return '<span class="loot-item-icon"><img src="/assets/icons/rag.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Nails") {
    return '<span class="loot-item-icon"><img src="/assets/icons/nails.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Bottle") {
    const count = Number(quantity) > 1 ? `<b class="loot-item-icon__count">${quantity}</b>` : "";
    return `<span class="loot-item-icon loot-item-icon--bottle"><img src="/assets/icons/Bottle.svg" alt="" aria-hidden="true">${count}</span>`;
  }
  if (itemName === "Cedar Sapling") {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#315c3a" stroke="#182018" stroke-width="2"/><path d="M15.5 4 8.6 16.2l4.4-1.5-6.5 10.1h17l-5.8-9.5 4.8 1.5L15.5 4Zm-1.1 18.6h2.2v5h-2.2v-5Z" fill="#70b96f" stroke="#182018" stroke-linejoin="round" stroke-width="1.25"/><path d="m24.5 6-3.6 6h2.7l-3.1 6 6.1-7.5h-2.8L26.5 6h-2Z" fill="#75c7f2" stroke="#182018" stroke-linejoin="round" stroke-width=".8"/></svg>';
  }
  if (itemName === "Collectible Plant") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#73ae68" stroke="#182018" stroke-width="2"/><path d="M14 22V7M14 16c-6 0-7-5-7-8 5 0 7 3 7 8Zm0-4c5 0 7-4 7-7-5 0-7 3-7 7Z" fill="none" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Kerosene") {
    return '<span class="loot-item-icon"><img src="/assets/icons/kerosene.svg" alt="" aria-hidden="true"></span>';
  }
  if (itemName === "Sterilizer") {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#75b9db" stroke="#182018" stroke-width="2"/><path d="M8 5h5v7h5v5h7v9h-7v3h-6v-7H7v-7h1V5Zm7 12h3v3h-3v-3Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.2"/><path d="m8.5 26.5 12-12 2.4 2.4-12 12-3.7 1.1 1.3-3.5Zm11.8-13 4.8-4.8 2.9 2.9-4.8 4.8-2.9-2.9Z" fill="#f4f1e7" stroke="#182018" stroke-linejoin="round" stroke-width="1.2"/><path d="m17.8 17 2.7 2.7" fill="none" stroke="#182018" stroke-width="1.2"/></svg>';
  }
  if (SHEET_GLYPHS[itemName]) {
    const [color, body] = SHEET_GLYPHS[itemName];
    return `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="${color}" stroke="#182018" stroke-width="2"/>${body}</svg>`;
  }
  const [label, color] = ITEM_BADGES[itemName] ?? ["LO", "#c9d6b8"];
  return `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="${color}" stroke="#182018" stroke-width="2"/><text x="14" y="17" fill="#182018" font-family="Arial,sans-serif" font-size="8" font-weight="700" text-anchor="middle">${label}</text></svg>`;
}
