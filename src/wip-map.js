import { initMapApplication } from "./public/MapApplication.js";
import { createPlannerPanel } from "./wip/PlannerPanel.js";

initMapApplication({ onReady: createPlannerPanel, showLocations: true });
