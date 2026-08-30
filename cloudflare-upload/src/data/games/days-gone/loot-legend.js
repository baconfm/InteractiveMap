export const LOOT_LEGEND_GROUPS = [
  { id: "supplies", label: "Supplies", items: ["Ammo Tin", "Bandage", "Gas Can", "Medkit"] },
  { id: "crafting", label: "Crafting materials", items: ["2x4", "Airbag", "Alarm Clock", "Bottle", "Can", "Kerosene", "Nails", "Pipe", "Polystyrene", "Rag", "Saw Blade", "Scrap", "Spark Igniter", "Sterilizer"] },
  { id: "throwables", label: "Throwables", items: ["Attractor", "Attractor Bomb", "Car Alarm", "Flashbang", "Grenade", "Molotov", "Pipe Bomb", "Prox Bomb", "Prox Mine", "Remote Bomb", "Smoke Bomb"] },
  { id: "weapons", label: "Melee weapons", items: ["Baseball Bat", "Fire Axe", "Hatchet", "Machete", "Pickaxe", "Ripper Axe", "Sledgehammer", "Superior Axe", "Superior Mace"] },
  { id: "firearms", label: "Firearms", items: [".22 Repeater", "M40", "SAF", "SAP9", "Sawed Off", "US556"] },
  { id: "misc", label: "Miscellaneous", items: ["Dog Toy", "Random"] },
  { id: "plants", label: "Plants & mushrooms", items: ["Cedar Sapling", "Collectible Plant", "Mushroom"] },
  { id: "collectibles", label: "Collectibles", items: ["Cairn"] },
];

export function legendGroupFor(marker) {
  const group = LOOT_LEGEND_GROUPS.find((entry) => entry.items.includes(marker.title));
  if (group) return group.id;
  return marker.type?.startsWith("collectible_") ? "collectibles" : "crafting";
}
