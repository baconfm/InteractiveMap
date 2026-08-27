import { craftableRecipesForItems } from "../data/games/days-gone/crafting-recipes.js";

export class MapMarkerLayer {
  constructor(element, mapSize, { renderIcon, onMarkerPointerDown, onMarkerClick, clusterBelowZoom, clusterRadius = 52, combineMatchingBelowZoom, combineMatchingRadius = 34 } = {}) {
    this.element = element;
    this.mapSize = mapSize;
    this.renderIcon = renderIcon;
    this.onMarkerPointerDown = onMarkerPointerDown;
    this.onMarkerClick = onMarkerClick;
    this.clusterBelowZoom = clusterBelowZoom;
    this.clusterRadius = clusterRadius;
    this.combineMatchingBelowZoom = combineMatchingBelowZoom;
    this.combineMatchingRadius = combineMatchingRadius;
    this.zoom = 1;
  }

  render(markers) {
    this.markers = markers;
    const laidOutMarkers = this.layoutMarkers(this.displayMarkers(markers));
    this.element.replaceChildren(...laidOutMarkers.map((marker) => this.createMarker(marker)));
  }

  setZoom(zoom) {
    const zoomChanged = Math.abs(zoom - this.zoom) > 0.001;
    if (!zoomChanged) return;
    const shouldRelayout = Math.abs(zoom - this.zoom) > 0.03 || this.displayMode(zoom) !== this.displayMode(this.zoom);
    this.zoom = zoom;
    if (shouldRelayout && this.markers?.length) {
      this.render(this.markers);
      return;
    }
    this.element.querySelectorAll(".map-marker").forEach((marker) => {
      marker.style.setProperty("--map-marker-scale", String(1 / zoom));
      marker.style.setProperty("--map-marker-offset-x", `${Number(marker.dataset.layoutOffsetX ?? 0) / zoom}px`);
      marker.style.setProperty("--map-marker-offset-y", `${Number(marker.dataset.layoutOffsetY ?? 0) / zoom}px`);
    });
  }

  isClustering(zoom) {
    return Number.isFinite(this.clusterBelowZoom) && zoom < this.clusterBelowZoom;
  }

  isCombiningMatching(zoom) {
    return !this.isClustering(zoom)
      && Number.isFinite(this.combineMatchingBelowZoom)
      && zoom < this.combineMatchingBelowZoom;
  }

  displayMode(zoom) {
    if (this.isClustering(zoom)) return "area-clusters";
    if (this.isCombiningMatching(zoom)) return "matching-stacks";
    return "individual-markers";
  }

  setClusterBelowZoom(zoom) {
    this.clusterBelowZoom = zoom;
    if (this.markers) this.render(this.markers);
  }

  displayMarkers(markers) {
    if (this.isClustering(this.zoom)) return this.clusterMarkers(markers);
    if (this.isCombiningMatching(this.zoom)) return this.combineMatchingMarkers(markers);
    return markers;
  }

  clusterMarkers(markers) {
    if (!this.isClustering(this.zoom)) return markers;
    const pending = new Map(markers.map((marker) => [marker.id, marker]));
    const clusters = [];
    const radiusInMapUnits = this.clusterRadius / this.zoom;

    while (pending.size) {
      const [seedId, seed] = pending.entries().next().value;
      pending.delete(seedId);
      const members = [seed];
      const queue = [seed];

      while (queue.length) {
        const current = queue.shift();
        pending.forEach((candidate, candidateId) => {
          if (Math.hypot(candidate.position.x - current.position.x, candidate.position.y - current.position.y) > radiusInMapUnits) return;
          pending.delete(candidateId);
          members.push(candidate);
          queue.push(candidate);
        });
      }

      if (members.length === 1) {
        clusters.push(seed);
        continue;
      }

      const position = members.reduce((total, marker) => ({
        x: total.x + marker.position.x / members.length,
        y: total.y + marker.position.y / members.length,
      }), { x: 0, y: 0 });
      const items = Object.entries(members.reduce((counts, marker) => {
        counts[marker.title] = (counts[marker.title] ?? 0) + (Number(marker.quantity) || 1);
        return counts;
      }, {}))
        .sort(([firstTitle, firstCount], [secondTitle, secondCount]) => secondCount - firstCount || firstTitle.localeCompare(secondTitle))
        .map(([title, count]) => ({ title, count }));
      clusters.push({
        id: `loot-cluster-${members.map((marker) => marker.id).sort().join("-")}`,
        title: `${members.length} nearby pickups`,
        items,
        craftable: craftableRecipesForItems(items).map(({ name }) => name),
        position,
        type: "loot_cluster",
        clusterCount: members.length,
      });
    }

    return clusters;
  }

  combineMatchingMarkers(markers) {
    const pending = new Map(markers.map((marker) => [marker.id, marker]));
    const stacks = [];
    const radiusInMapUnits = this.combineMatchingRadius / this.zoom;

    while (pending.size) {
      const [seedId, seed] = pending.entries().next().value;
      pending.delete(seedId);
      if (seed.type !== "loot_item") {
        stacks.push(seed);
        continue;
      }

      const members = [seed];
      const queue = [seed];
      while (queue.length) {
        const current = queue.shift();
        pending.forEach((candidate, candidateId) => {
          const isMatchingLoot = candidate.type === "loot_item" && candidate.title === seed.title;
          const isNearby = Math.hypot(candidate.position.x - current.position.x, candidate.position.y - current.position.y) <= radiusInMapUnits;
          if (!isMatchingLoot || !isNearby) return;
          pending.delete(candidateId);
          members.push(candidate);
          queue.push(candidate);
        });
      }

      if (members.length === 1) {
        stacks.push(seed);
        continue;
      }

      const position = members.reduce((total, marker) => ({
        x: total.x + marker.position.x / members.length,
        y: total.y + marker.position.y / members.length,
      }), { x: 0, y: 0 });
      stacks.push({
        id: `loot-stack-${members.map((marker) => marker.id).sort().join("-")}`,
        title: seed.title,
        note: `${members.length} nearby ${seed.title} pickups`,
        position,
        type: "loot_stack",
        stackCount: members.length,
      });
    }

    return stacks;
  }

  layoutMarkers(markers) {
    const minimumSpacing = 35;
    const placed = [];

    return [...markers].sort((first, second) => first.id.localeCompare(second.id)).map((marker) => {
      const origin = { x: marker.position.x * this.zoom, y: marker.position.y * this.zoom };
      let offset = { x: 0, y: 0 };

      for (let attempt = 0; attempt < 32; attempt += 1) {
        const candidate = { x: origin.x + offset.x, y: origin.y + offset.y };
        const overlaps = placed.some((point) => Math.hypot(point.x - candidate.x, point.y - candidate.y) < minimumSpacing);
        if (!overlaps) break;
        const ring = Math.floor(attempt / 7) + 1;
        const angle = attempt * 2.4;
        const radius = ring * minimumSpacing;
        offset = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      }

      placed.push({ x: origin.x + offset.x, y: origin.y + offset.y });
      return { ...marker, layoutOffset: offset };
    });
  }

  select(markerId) {
    this.element.querySelectorAll(".map-marker--selected").forEach((element) => element.classList.remove("map-marker--selected"));
    this.element.querySelector(`[data-marker-id="${CSS.escape(markerId)}"]`)?.classList.add("map-marker--selected");
  }

  createMarker(marker) {
    const element = document.createElement("span");
    element.className = "map-marker";
    element.style.left = `${(marker.position.x / this.mapSize.width) * 100}%`;
    element.style.top = `${(marker.position.y / this.mapSize.height) * 100}%`;
    element.title = [
      marker.title,
      marker.grid && `Grid ${marker.grid}`,
      marker.category,
      marker.note,
    ].filter(Boolean).join("\n");
    element.setAttribute("aria-label", marker.title);
    element.dataset.markerId = marker.id;
    element.dataset.layoutOffsetX = String(marker.layoutOffset?.x ?? 0);
    element.dataset.layoutOffsetY = String(marker.layoutOffset?.y ?? 0);
    if (marker.type === "loot_cluster") element.classList.add("map-marker--cluster");
    if (marker.type === "loot_stack") element.classList.add("map-marker--stack");
    element.style.setProperty("--map-marker-scale", String(1 / this.zoom));
    element.style.setProperty("--map-marker-offset-x", `${(marker.layoutOffset?.x ?? 0) / this.zoom}px`);
    element.style.setProperty("--map-marker-offset-y", `${(marker.layoutOffset?.y ?? 0) / this.zoom}px`);
    if (this.renderIcon) element.innerHTML = this.renderIcon(marker);
    if (this.onMarkerPointerDown) {
      element.classList.add("map-marker--editable");
      element.addEventListener("pointerdown", (event) => {
        element.setPointerCapture?.(event.pointerId);
        this.onMarkerPointerDown(marker, event);
      });
    }
    if (this.onMarkerClick) {
      element.classList.add("map-marker--interactive");
      element.tabIndex = 0;
      element.addEventListener("pointerdown", (event) => event.stopPropagation());
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        this.onMarkerClick(marker, event);
      });
      element.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        this.onMarkerClick(marker, event);
      });
    }
    return element;
  }
}
