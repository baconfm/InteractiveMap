import { DAYS_GONE_RECIPES, resourceIdForName, resourceNameForId } from "../data/games/days-gone/crafting-recipes.js";

const add = (target, key, amount) => { target[key] = (target[key] ?? 0) + amount; };

export function plannerOptions(markers) {
  const rawResources = [...new Set(markers.map((marker) => marker.title).filter((title) => resourceIdForName(title)))].sort();
  return [
    ...DAYS_GONE_RECIPES.map((item) => ({ value: `recipe:${item.id}`, label: `Craft: ${item.name}` })),
    ...rawResources.map((item) => ({ value: `resource:${item}`, label: `Find: ${item}` })),
  ];
}

export function expandRequests(requests, markers) {
  const availability = markers.reduce((counts, marker) => {
    const resourceId = resourceIdForName(marker.title);
    if (resourceId) add(counts, resourceId, Number(marker.quantity) || 1);
    return counts;
  }, {});
  const requirements = {};
  const notes = [];
  requests.forEach((request) => {
    const quantity = Math.max(1, Number(request.quantity) || 1);
    if (request.kind === "resource") {
      const resourceId = resourceIdForName(request.id);
      if (resourceId) add(requirements, resourceId, quantity);
      return;
    }
    const selectedRecipe = DAYS_GONE_RECIPES.find((item) => item.id === request.id);
    if (!selectedRecipe) return;
    const batches = Math.ceil(quantity / selectedRecipe.outputQuantity);
    selectedRecipe.ingredients.forEach(([resourceId, amount]) => add(requirements, resourceId, amount * batches));
    selectedRecipe.alternatives.forEach(([groupName, choices]) => {
      const [resourceId, amount] = [...choices].sort(([first], [second]) => (availability[second] ?? 0) - (availability[first] ?? 0))[0];
      add(requirements, resourceId, amount * batches);
      notes.push(`${selectedRecipe.name}: using ${resourceNameForId(resourceId)} for ${groupName.replace(/_/g, " ")}.`);
    });
  });
  return { requirements, notes };
}

export function rankLootZones(markers, requirements, startPosition, zoneSize = 300) {
  const needed = new Set(Object.keys(requirements));
  const zones = new Map();
  markers.forEach((marker) => {
    const resourceId = resourceIdForName(marker.title);
    if (!needed.has(resourceId)) return;
    const key = `${Math.floor(marker.position.x / zoneSize)}:${Math.floor(marker.position.y / zoneSize)}`;
    const zone = zones.get(key) ?? { key, markers: [], resources: {}, position: { x: 0, y: 0 } };
    const amount = Number(marker.quantity) || 1;
    add(zone.resources, resourceId, amount);
    zone.markers.push(marker);
    zone.position.x += marker.position.x;
    zone.position.y += marker.position.y;
    zones.set(key, zone);
  });
  return [...zones.values()].map((zone) => {
    zone.position.x /= zone.markers.length;
    zone.position.y /= zone.markers.length;
    zone.distance = Math.round(Math.hypot(zone.position.x - startPosition.x, zone.position.y - startPosition.y));
    zone.matchingQuantity = Object.entries(zone.resources).reduce((total, [resourceId, amount]) => total + Math.min(amount, requirements[resourceId]), 0);
    zone.score = zone.matchingQuantity * 100 - zone.distance * 0.12;
    zone.summary = Object.entries(zone.resources)
      .sort(([, first], [, second]) => second - first)
      .map(([resourceId, amount]) => `${resourceNameForId(resourceId)} ×${amount}`)
      .join(", ");
    return zone;
  }).sort((first, second) => second.score - first.score || first.distance - second.distance).slice(0, 8);
}
