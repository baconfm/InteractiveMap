export const RANDOM_ENCOUNTER_KINDS = [
  ["survivor", "Survivor"],
  ["hostage", "Hostage"],
  ["sniper", "Sniper Ambush"],
  ["exploding-car", "Exploding Car Ambush"],
  ["other", "Other"],
];

export function randomEncounterKind(marker) {
  const title = String(marker.title ?? "").toLocaleLowerCase();
  if (title.includes("survivor")) return "survivor";
  if (title.includes("hostage")) return "hostage";
  if (title.includes("sniper")) return "sniper";
  if (title.includes("exploding car") || title.includes("car ambush")) return "exploding-car";
  return "other";
}
