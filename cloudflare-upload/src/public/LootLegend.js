import { renderDaysGoneMarkerIcon } from "../data/games/days-gone/marker-icons.js";
import { isOneTimeSpawn } from "../data/games/days-gone/loot-rules.js";
import { LOOT_LEGEND_GROUPS, legendGroupFor } from "../data/games/days-gone/loot-legend.js";

export function createLootLegend({ onChange }) {
  const itemsRoot = document.querySelector("#map-legend-items");
  const toggle = document.querySelector("#legend-toggle");
  const showAll = document.querySelector("#legend-show-all");
  const hideAll = document.querySelector("#legend-hide-all");
  const actions = document.querySelector(".map-legend__actions");
  const search = document.querySelector("#map-legend-search");
  const searchInput = document.querySelector("#legend-search-input");
  let markers = [];
  let visibleTitles = new Set();
  let spawnFilter = "all";
  let searchTerm = "";

  function filteredMarkers() {
    return markers.filter((marker) => visibleTitles.has(marker.title)
      && (spawnFilter === "all" || (spawnFilter === "respawnable" ? !isOneTimeSpawn(marker) : isOneTimeSpawn(marker))));
  }

  function notify() { onChange(filteredMarkers(), { total: markers.length, spawnFilter }); }

  function render() {
    const grouped = new Map(LOOT_LEGEND_GROUPS.map((group) => [group.id, new Map()]));
    markers.forEach((marker) => {
      const items = grouped.get(legendGroupFor(marker));
      const item = items.get(marker.title) ?? { count: 0, marker };
      item.count += 1;
      items.set(marker.title, item);
    });
    const spawnControls = document.createElement("section");
    spawnControls.className = "map-legend__spawn-filter";
    spawnControls.innerHTML = "<h2>Spawn type</h2>";
    [["all", "All items"], ["respawnable", "Respawnable"], ["one-time", "One-time only"]].forEach(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-legend__spawn-button";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(spawnFilter === value));
      button.addEventListener("click", () => { spawnFilter = value; render(); notify(); });
      spawnControls.append(button);
    });
    const sections = [...LOOT_LEGEND_GROUPS].sort((a, b) => a.label.localeCompare(b.label)).flatMap((group) => {
      const entries = [...grouped.get(group.id).entries()]
        .filter(([itemName]) => itemName.toLocaleLowerCase().includes(searchTerm))
        .sort(([a], [b]) => a.localeCompare(b));
      if (!entries.length) return [];
      const section = document.createElement("section");
      section.className = "map-legend__group";
      section.innerHTML = `<h2>${group.label}</h2>`;
      entries.forEach(([itemName, item]) => {
        const label = document.createElement("label");
        label.className = "map-legend__item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = visibleTitles.has(itemName);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) visibleTitles.add(itemName); else visibleTitles.delete(itemName);
          notify();
        });
        const icon = document.createElement("span");
        icon.className = "map-legend__icon";
        icon.innerHTML = renderDaysGoneMarkerIcon(item.marker);
        const text = document.createElement("span"); text.textContent = itemName;
        const count = document.createElement("span"); count.className = "map-legend__count"; count.textContent = String(item.count);
        label.append(checkbox, icon, text, count);
        section.append(label);
      });
      return section;
    });
    itemsRoot.replaceChildren(spawnControls, ...sections);
  }

  toggle?.addEventListener("click", () => {
    const collapse = !itemsRoot.hidden;
    itemsRoot.hidden = collapse;
    search.hidden = collapse;
    actions.hidden = collapse;
    toggle.setAttribute("aria-expanded", String(!collapse));
    toggle.textContent = collapse ? "Show" : "Hide";
  });
  showAll?.addEventListener("click", () => { visibleTitles = new Set(markers.map((marker) => marker.title)); render(); notify(); });
  hideAll?.addEventListener("click", () => { visibleTitles.clear(); render(); notify(); });
  searchInput?.addEventListener("input", () => { searchTerm = searchInput.value.trim().toLocaleLowerCase(); render(); });

  return {
    setMarkers(nextMarkers) { markers = nextMarkers; visibleTitles = new Set(markers.map((marker) => marker.title)); render(); notify(); },
    setState({ titles, spawn } = {}) {
      visibleTitles = Array.isArray(titles) ? new Set(titles) : new Set(markers.map((marker) => marker.title));
      spawnFilter = ["all", "respawnable", "one-time"].includes(spawn) ? spawn : "all";
      render();
      notify();
    },
    getState() {
      const allTitles = new Set(markers.map((marker) => marker.title));
      return { titles: [...visibleTitles], spawn: spawnFilter, hasCustomSelection: visibleTitles.size !== allTitles.size || [...visibleTitles].some((title) => !allTitles.has(title)) };
    },
  };
}
