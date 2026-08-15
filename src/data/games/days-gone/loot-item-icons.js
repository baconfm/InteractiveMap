const ITEM_BADGES = {
  "2x4": ["2×4", "#a67a54"],
  Airbag: ["AB", "#a8c6d7"],
  "Alarm Clock": ["AC", "#d4b36a"],
  "Ammo Tin": ["AM", "#86a36b"],
  Attractor: ["AT", "#b886d5"],
  "Attractor Bomb": ["AX", "#b060c8"],
  Bandage: ["BD", "#e9e5d5"],
  "Baseball Bat": ["BT", "#9c6b45"],
  "Beer Bottle": ["BB", "#8cae66"],
  Bottle: ["BT", "#86aa75"],
  Can: ["CN", "#b4bdc5"],
  "Car Alarm": ["CA", "#d9795e"],
  Cairn: ["CR", "#a79b83"],
  "Cedar Sapling": ["CS", "#4f9461"],
  "Collectible Plant": ["PL", "#73ae68"],
  Flashbang: ["FB", "#f1e99a"],
  "Gas Can": ["GC", "#d9684d"],
  Grenade: ["GR", "#77966e"],
  Growler: ["GW", "#7c9c6a"],
  "Gun Powder": ["GP", "#8a8177"],
  "Health Cocktail": ["HC", "#d97883"],
  Hatchet: ["HA", "#b9c2bd"],
  Kerosene: ["KE", "#e9bd62"],
  Machete: ["MA", "#c7d0d2"],
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
  "Saw Blade": ["SB", "#afb5ba"],
  Scrap: ["SC", "#c69058"],
  Sledgehammer: ["SH", "#787f78"],
  "Smoke Bomb": ["SM", "#9e9ca8"],
  "Spark Igniter": ["SI", "#e7d15d"],
  "Stamina Cocktail": ["ST", "#6bb6a4"],
  Sterilizer: ["SZ", "#7caed1"],
  Suppressor: ["SU", "#555f64"],
  "Superior Axe": ["SA", "#8e9fa3"],
};

export const LOOT_ITEM_NAMES = Object.keys(ITEM_BADGES);

export function renderLootItemIcon(itemName, quantity = 1) {
  if (itemName === "Sledgehammer") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#787f78" stroke="#182018" stroke-width="2"/><path d="m8 21 9-9m-2-5 6 6m-8-4 4-4 4 4-4 4-4-4Z" fill="none" stroke="#e9e0cd" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Baseball Bat") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#9c6b45" stroke="#182018" stroke-width="2"/><path d="m8 20 9-9 3 3-9 9-3-3Zm9-9 1-4 3 3-4 1Z" fill="#ead6af" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/></svg>';
  }
  if (itemName === "Superior Axe") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#8e9fa3" stroke="#182018" stroke-width="2"/><path d="m8 21 8-8m-3-5 7 1-1 7-3-3-8 8m5-13 3 3" fill="none" stroke="#e6eee4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Mushroom") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#c98e66" stroke="#182018" stroke-width="2"/><path d="M8 14a6 6 0 0 1 12 0H8Zm4 0h4l1 7h-6l1-7Z" fill="#f4e8cf" stroke="#182018" stroke-linejoin="round" stroke-width="1.5"/></svg>';
  }
  if (itemName === "Cairn") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#a79b83" stroke="#182018" stroke-width="2"/><path d="M7 19h14l-3-4h-8l-3 4Zm3-5h8l-2-4h-4l-2 4Zm2-5h4l-2-3-2 3Z" fill="#e5d8b8" stroke="#182018" stroke-linejoin="round" stroke-width="1.2"/></svg>';
  }
  if (itemName === "Bottle" || itemName === "Beer Bottle") {
    return `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#86aa75" stroke="#182018" stroke-width="2"/><path d="M11 7h6v4l2 3v7H9v-7l2-3V7Z" fill="#e7f0d5" stroke="#182018" stroke-linejoin="round" stroke-width="1.5"/><text x="20" y="10" fill="#182018" font-family="Arial,sans-serif" font-size="7" font-weight="700" text-anchor="middle">${quantity}</text></svg>`;
  }
  if (itemName === "Cedar Sapling") {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#315c3a" stroke="#182018" stroke-width="2"/><path d="M15.5 4 8.6 16.2l4.4-1.5-6.5 10.1h17l-5.8-9.5 4.8 1.5L15.5 4Zm-1.1 18.6h2.2v5h-2.2v-5Z" fill="#70b96f" stroke="#182018" stroke-linejoin="round" stroke-width="1.25"/><path d="m24.5 6-3.6 6h2.7l-3.1 6 6.1-7.5h-2.8L26.5 6h-2Z" fill="#75c7f2" stroke="#182018" stroke-linejoin="round" stroke-width=".8"/></svg>';
  }
  if (itemName === "Collectible Plant") {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#73ae68" stroke="#182018" stroke-width="2"/><path d="M14 22V7M14 16c-6 0-7-5-7-8 5 0 7 3 7 8Zm0-4c5 0 7-4 7-7-5 0-7 3-7 7Z" fill="none" stroke="#182018" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  }
  if (itemName === "Kerosene") {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#d89d39" stroke="#182018" stroke-width="2"/><path d="M16 4.5c1.3 4.1 6.5 6.8 6.5 12.1A6.5 6.5 0 0 1 16 23a6.5 6.5 0 0 1-6.5-6.4c0-3.8 3.4-6.1 5.4-9.6.7 2.4-.2 4.3 1.7 6.1 1.9-2 1-5.2-.6-8.6Z" fill="#fff0a4" stroke="#182018" stroke-linejoin="round" stroke-width="1.4"/><path d="M15.3 21c-1.7-1.5-1.4-3.7.5-5.7 2.2 1.8 2.9 4.2 1.2 5.7h-2.7Z" fill="#e86e37"/></svg>';
  }
  if (itemName === "Sterilizer") {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#75b9db" stroke="#182018" stroke-width="2"/><path d="M9 11h8v3l1.8 2.5V23H7.2v-6.5L9 14v-3Zm1.5-3h5v3h-5V8Z" fill="#eff7ed" stroke="#182018" stroke-linejoin="round" stroke-width="1.25"/><path d="m18 20.2 7.2-7.2 1.9 1.9-7.2 7.2-2.6.7.7-2.6Z" fill="#dff5ff" stroke="#182018" stroke-linejoin="round" stroke-width="1.15"/><path d="m24.3 11.8 1.9 1.9" stroke="#182018" stroke-width="1.2" stroke-linecap="round"/></svg>';
  }
  const [label, color] = ITEM_BADGES[itemName] ?? ["LO", "#c9d6b8"];
  return `<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="${color}" stroke="#182018" stroke-width="2"/><text x="14" y="17" fill="#182018" font-family="Arial,sans-serif" font-size="8" font-weight="700" text-anchor="middle">${label}</text></svg>`;
}
