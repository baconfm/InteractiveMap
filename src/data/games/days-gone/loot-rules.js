const DEFAULT_ONE_TIME_SPAWN_ITEMS = new Set([
  "Ammo Tin",
]);
const NEW_GAME_PLUS_ONLY_ITEMS = new Set([
  "Growler Minigun",
]);

export function isOneTimeSpawn(marker) {
  if (typeof marker.oneTimeSpawn === "boolean") return marker.oneTimeSpawn;
  return DEFAULT_ONE_TIME_SPAWN_ITEMS.has(marker.title);
}

export function isNewGamePlusOnly(marker) {
  return marker.newGamePlusOnly === true || NEW_GAME_PLUS_ONLY_ITEMS.has(marker.title);
}
