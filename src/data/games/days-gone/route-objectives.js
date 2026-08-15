import { routeStops as fallbackRouteStops } from "./route-stops.js";

const ROUTER_DATA_URL = "assets/games/days-gone/route-data/platinum-router-default-splits.json";
const PLANT_COLLECTIBLES = new Set([
  "Mayweed", "Crowberry", "Arrowhead", "Black Currant", "Wood Lily", "Mountain Sorrel", "Wild Bergamot", "Salmon Berry", "Scaly Hedgehog", "Bristly Manzanita", "Blue Camas", "Stone Crop", "Bitterroot", "Desert Hackberry", "Agoseris", "Lavender", "Bearberry", "Coltsfoot", "Cloudberry", "Bulrush", "Beargrass", "Golden Currant", "Indian Pipe", "Bistort", "Silverweed", "Bunchberry", "Water Hemlock",
]);
const MUSHROOM_COLLECTIBLES = new Set([
  "King Bolete", "Horn of Plenty", "Mica Cap", "Ink Cap", "Larch Bolete", "Golden Chanterelle",
]);

function goalType(goal) {
  if (goal.type !== "collectible") return goal.type || "objective";
  if (MUSHROOM_COLLECTIBLES.has(goal.label)) return "collectible_mushroom";
  if (PLANT_COLLECTIBLES.has(goal.label)) return "collectible_plant";
  return "collectible";
}

export async function loadRouteQueue() {
  try {
    const response = await fetch(ROUTER_DATA_URL);
    if (!response.ok) throw new Error(`Unable to load route data (${response.status})`);
    const route = await response.json();
    return route.splits.flatMap((split) => {
      const phase = split.phaseId || "Story";
      const stop = { id: `route-stop-${split.id}`, routeStopId: split.id, phase, title: split.label, type: "route_stop", note: split.note || "", kind: "Route stop" };
      const goals = (split.ocrGoals || []).map((goal) => ({
        id: `route-goal-${goal.id}`,
        routeGoalId: goal.id,
        phase,
        title: goal.label,
        type: goalType(goal),
        note: `Route stop: ${split.label}${goal.optional ? " · Optional" : ""}`,
        kind: goal.optional ? `Optional ${goalType(goal)}` : goalType(goal),
      }));
      return [stop, ...goals];
    });
  } catch (error) {
    console.warn("Platinum Router data unavailable; using the route-stop fallback.", error);
    return fallbackRouteStops.map((stop) => ({ ...stop, type: "route_stop", kind: "Route stop" }));
  }
}
