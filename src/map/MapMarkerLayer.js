import { craftableRecipesForItems } from "../data/games/days-gone/crafting-recipes.js";

export class MapMarkerLayer {
  constructor(element, mapSize, { renderIcon, onMarkerPointerDown, onMarkerClick, clusterBelowZoom, clusterRadius = 52, combineMatchingBelowZoom, combineMatchingRadius = 34, clusterSingletons = false } = {}) {
    this.element = element;
    this.mapSize = mapSize;
    this.renderIcon = renderIcon;
    this.onMarkerPointerDown = onMarkerPointerDown;
    this.onMarkerClick = onMarkerClick;
    this.clusterBelowZoom = clusterBelowZoom;
    this.clusterRadius = clusterRadius;
    this.combineMatchingBelowZoom = combineMatchingBelowZoom;
    this.combineMatchingRadius = combineMatchingRadius;
    this.clusterSingletons = clusterSingletons;
    this.zoom = 1;
    this.layoutZoom = 1;
    this.viewBounds = null;
    this.renderedViewCenter = null;
  }

  render(markers) {
    this.markers = markers;
    this.layoutZoom = this.zoom;
    const laidOutMarkers = this.layoutMarkers(this.displayMarkers(markers));
    this.element.replaceChildren(...laidOutMarkers.map((marker) => this.createMarker(marker)));
  }

  setZoom(zoom) {
    const zoomChanged = Math.abs(zoom - this.zoom) > 0.001;
    if (!zoomChanged) return;
    const previousZoom = this.zoom;
    this.zoom = zoom;
    this.element.style.setProperty("--map-marker-scale", String(1 / zoom));
    const shouldRelayout = Math.abs(zoom - this.layoutZoom) > 0.3 || this.displayMode(zoom) !== this.displayMode(previousZoom);
    if (shouldRelayout && this.markers?.length) {
      this.render(this.markers);
    }
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

  setView({ x, y, zoom }, { width, height }) {
    const buffer = 180 / zoom;
    const center = { x: (width / 2 - x) / zoom, y: (height / 2 - y) / zoom };
    this.viewBounds = {
      left: -x / zoom - buffer, right: (width - x) / zoom + buffer,
      top: -y / zoom - buffer, bottom: (height - y) / zoom + buffer,
    };
    if (!this.markers?.length || this.isClustering(this.zoom)) return;
    const minimumMove = buffer / 2;
    if (!this.renderedViewCenter || Math.hypot(center.x - this.renderedViewCenter.x, center.y - this.renderedViewCenter.y) > minimumMove) {
      this.renderedViewCenter = center;
      this.render(this.markers);
    }
  }

  displayMarkers(markers) {
    if (this.isClustering(this.zoom)) return this.clusterSingletons ? this.gridClusters(markers) : this.clusterMarkers(markers);
    const visible = this.visibleMarkers(markers);
    if (this.isCombiningMatching(this.zoom)) return this.combineMatchingMarkers(visible);
    return visible;
  }

  visibleMarkers(markers) {
    if (!this.viewBounds) return markers;
    const { left, right, top, bottom } = this.viewBounds;
    return markers.filter(({ position }) => position.x >= left && position.x <= right && position.y >= top && position.y <= bottom);
  }

  clusterMarkers(markers) {
    if (!this.isClustering(this.zoom)) return markers;
    const radiusInMapUnits = this.clusterRadius / this.zoom;
    return this.clustersFromGroups(this.nearbyGroups(markers, radiusInMapUnits));
  }

  gridClusters(markers) {
    const cellSize = 100 / this.zoom;
    const cells = new Map();
    markers.forEach((marker) => {
      const key = `${Math.floor(marker.position.x / cellSize)},${Math.floor(marker.position.y / cellSize)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(marker);
    });
    return this.clustersFromGroups(cells.values());
  }

  clustersFromGroups(groups) {
    const clusters = [];
    [...groups].forEach((members) => {
      const seed = members[0];
      if (members.length === 1 && !this.clusterSingletons) {
        clusters.push(seed);
        return;
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
    });
    return clusters;
  }

  combineMatchingMarkers(markers) {
    const stacks = markers.filter((marker) => marker.type !== "loot_item");
    const radiusInMapUnits = this.combineMatchingRadius / this.zoom;
    this.nearbyGroups(markers.filter((marker) => marker.type === "loot_item"), radiusInMapUnits, (seed, candidate) => seed.title === candidate.title).forEach((members) => {
      const seed = members[0];
      if (members.length === 1) {
        stacks.push(seed);
        return;
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
    });

    return stacks;
  }

  nearbyGroups(markers, radius, matches = () => true) {
    const radiusSquared = radius * radius;
    const cellKey = (marker) => `${Math.floor(marker.position.x / radius)},${Math.floor(marker.position.y / radius)}`;
    const cells = new Map();
    markers.forEach((marker) => {
      const key = cellKey(marker);
      if (!cells.has(key)) cells.set(key, new Set());
      cells.get(key).add(marker);
    });
    const pending = new Set(markers);
    const remove = (marker) => {
      pending.delete(marker);
      cells.get(cellKey(marker))?.delete(marker);
    };
    const groups = [];
    while (pending.size) {
      const seed = pending.values().next().value;
      const members = [seed];
      const queue = [seed];
      remove(seed);
      while (queue.length) {
        const current = queue.shift();
        const x = Math.floor(current.position.x / radius);
        const y = Math.floor(current.position.y / radius);
        for (let row = y - 1; row <= y + 1; row += 1) for (let column = x - 1; column <= x + 1; column += 1) {
          for (const candidate of [...(cells.get(`${column},${row}`) ?? [])]) {
            const xDistance = candidate.position.x - current.position.x;
            const yDistance = candidate.position.y - current.position.y;
            if (!matches(seed, candidate) || xDistance * xDistance + yDistance * yDistance > radiusSquared) continue;
            remove(candidate);
            members.push(candidate);
            queue.push(candidate);
          }
        }
      }
      groups.push(members);
    }
    return groups;
  }

  layoutMarkers(markers) {
    if (this.clusterSingletons) return markers.map((marker) => ({ ...marker, layoutOffset: { x: 0, y: 0 } }));
    const minimumSpacing = this.clusterSingletons ? 44 : Math.round(Math.max(50, 100 - 50 * Math.min(1, this.zoom)));
    const minimumSpacingSquared = minimumSpacing * minimumSpacing;
    const placed = [];
    const clusters = markers.filter((marker) => marker.type === "loot_cluster");
    const offsets = new Map();

    clusters.sort((first, second) => first.id.localeCompare(second.id)).forEach((marker) => {
      const origin = { x: marker.position.x * this.zoom, y: marker.position.y * this.zoom };
      let offset = { x: 0, y: 0 };

      for (let attempt = 0; attempt < 32; attempt += 1) {
        const candidate = { x: origin.x + offset.x, y: origin.y + offset.y };
        const overlaps = placed.some((point) => {
          const xDistance = point.x - candidate.x;
          const yDistance = point.y - candidate.y;
          return xDistance * xDistance + yDistance * yDistance < minimumSpacingSquared;
        });
        if (!overlaps) break;
        const ring = Math.floor(attempt / 7) + 1;
        const angle = attempt * 2.4;
        const radius = Math.min(ring * minimumSpacing, minimumSpacing * 2);
        offset = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      }

      placed.push({ x: origin.x + offset.x, y: origin.y + offset.y });
      offsets.set(marker.id, offset);
    });
    return markers.map((marker) => ({ ...marker, layoutOffset: offsets.get(marker.id) ?? { x: 0, y: 0 } }));
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
    element.style.setProperty("--map-marker-offset-x", `${marker.layoutOffset?.x ?? 0}px`);
    element.style.setProperty("--map-marker-offset-y", `${marker.layoutOffset?.y ?? 0}px`);
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
