export class MarkerEditor {
  constructor({ engine, store, routeStops, elements }) {
    this.engine = engine;
    this.store = store;
    this.routeStops = routeStops;
    this.elements = elements;
    this.pendingPosition = null;
    this.editingMarkerId = null;
    this.bindEvents();
    this.populateStops();
    this.updateCount();
  }

  bindEvents() {
    this.elements.stopSelect.addEventListener("change", () => this.selectStop());
    this.elements.search.addEventListener("input", () => this.populateStops(this.elements.search.value));
    this.elements.save.addEventListener("click", () => this.save());
    this.elements.cancel.addEventListener("click", () => this.resetPlacement());
    this.elements.export.addEventListener("click", () => this.export());
    this.store.subscribe(() => this.updateCount());
  }

  populateStops(query = "") {
    const selectedId = this.elements.stopSelect.value;
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchingStops = this.routeStops.filter((stop) => `${stop.phase} ${stop.title} ${stop.type} ${stop.note}`.toLocaleLowerCase().includes(normalizedQuery));
    this.elements.stopSelect.replaceChildren(...matchingStops.map((stop) => {
      const option = document.createElement("option");
      option.value = stop.id;
      option.textContent = `${stop.phase} · ${stop.kind} · ${stop.title}`;
      return option;
    }));
    this.elements.stopSelect.value = matchingStops.some((stop) => stop.id === selectedId) ? selectedId : matchingStops[0]?.id;
    this.selectStop();
  }

  selectStop() {
    const stop = this.routeStops.find((item) => item.id === this.elements.stopSelect.value);
    if (!stop) {
      this.elements.title.value = "";
      this.elements.note.value = "";
      return;
    }
    this.elements.title.value = stop.title;
    this.elements.note.value = stop.note;
    this.elements.type.value = stop.type;
    this.elements.icon.value = "auto";
    this.editingMarkerId = null;
    this.resetPlacement();
  }

  edit(markerId) {
    const marker = this.store.getAll().find((item) => item.id === markerId);
    if (!marker) return;
    this.editingMarkerId = marker.id;
    this.pendingPosition = marker.position;
    this.elements.title.value = marker.title;
    this.elements.type.value = marker.type;
    this.elements.note.value = marker.note ?? "";
    this.elements.icon.value = marker.icon ?? "auto";
    this.elements.save.disabled = false;
    this.elements.status.textContent = "Edit this marker, choose an icon, or drag it on the map.";
  }

  place(position) {
    this.pendingPosition = position;
    this.elements.save.disabled = false;
    this.elements.status.textContent = `Pinned at X ${Math.round(position.x)} · Y ${Math.round(position.y)}. Save when ready.`;
  }

  save() {
    if (!this.pendingPosition) return;
    const stop = this.routeStops.find((item) => item.id === this.elements.stopSelect.value);
    if (this.editingMarkerId) {
      this.store.update(this.editingMarkerId, {
        title: this.elements.title.value.trim() || "Untitled marker",
        type: this.elements.type.value.trim() || "route_stop",
        note: this.elements.note.value.trim(),
        icon: this.elements.icon.value === "auto" ? undefined : this.elements.icon.value,
        position: this.pendingPosition,
      });
      this.resetPlacement();
      return;
    }
    this.store.add({
      id: `route-${stop.id}-${Date.now()}`,
      routeItemId: stop.routeGoalId ?? stop.routeStopId ?? stop.id,
      phase: stop.phase,
      title: this.elements.title.value.trim() || stop.title,
      type: this.elements.type.value.trim() || "route_stop",
      note: this.elements.note.value.trim(),
      icon: this.elements.icon.value === "auto" ? undefined : this.elements.icon.value,
      position: this.pendingPosition,
    });
    this.resetPlacement();
  }

  resetPlacement() {
    this.pendingPosition = null;
    this.editingMarkerId = null;
    this.elements.save.disabled = true;
    this.elements.status.textContent = "Click the map to place this route item.";
  }

  updateCount() { this.elements.count.value = this.store.getAll().length; }

  export() {
    const content = JSON.stringify(this.store.getAll(), null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "days-gone-route-markers.json";
    link.click();
    URL.revokeObjectURL(url);
  }
}
