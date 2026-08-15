const DEFAULT_ONE_TIME_SPAWN_ITEMS = new Set([
  "Ammo Tin",
]);

export function isOneTimeSpawn(marker) {
  if (typeof marker.oneTimeSpawn === "boolean") return marker.oneTimeSpawn;
  return DEFAULT_ONE_TIME_SPAWN_ITEMS.has(marker.title);
}
