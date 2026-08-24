const LOCATION_TYPES = [
  ["camp", "Camp"],
  ["ambush_camp", "Ambush camp"],
  ["nero_checkpoint", "NERO checkpoint"],
  ["random_encounter", "Random encounter"],
];

export class MapLocationEditor {
  constructor({ store, elements, regionForPosition }) {
    this.store = store;
    this.elements = elements;
    this.regionForPosition = regionForPosition;
    this.stage = null;
    this.pendingParent = null;
    this.selectedId = null;
    this.elements.type.replaceChildren(...LOCATION_TYPES.map(([value, label]) => new Option(label, value)));
    this.bindEvents();
    this.updateCount();
    this.store.subscribe(() => this.updateCount());
  }

  bindEvents() {
    this.elements.place.addEventListener("click", () => this.begin());
    this.elements.cancel.addEventListener("click", () => this.reset());
    this.elements.save.addEventListener("click", () => this.save());
    this.elements.delete.addEventListener("click", () => this.delete());
  }

  begin() {
    const title = this.elements.title.value.trim();
    if (!title) {
      this.elements.status.textContent = "Give this location a name first.";
      return;
    }
    this.stage = "location";
    this.pendingParent = null;
    this.clearSelection();
    this.elements.place.disabled = true;
    this.elements.cancel.disabled = false;
    this.elements.status.textContent = `Click the map to place ${title}.`;
  }

  place(position) {
    if (!this.stage) return false;
    if (this.stage === "location") {
      const title = this.elements.title.value.trim();
      const type = this.elements.type.value;
      const parent = this.store.add({
        id: `map-location-${Date.now()}`,
        title,
        type,
        note: this.elements.note.value.trim(),
        photos: this.elements.photos.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
        position,
        region: this.regionForPosition(position) ?? "Cascades",
      });
      if (!this.elements.arrival.checked) {
        this.reset();
        return true;
      }
      this.pendingParent = parent;
      this.stage = "arrival";
      this.elements.status.textContent = `Click the map to place the fast-travel arrival for ${title}.`;
      return true;
    }
    this.store.add({
      id: `fast-travel-arrival-${Date.now()}`,
      parentId: this.pendingParent.id,
      title: `${this.pendingParent.title} arrival`,
      type: "fast_travel_arrival",
      note: `Fast travel arrival for ${this.pendingParent.title}.`,
      position,
      region: this.regionForPosition(position) ?? this.pendingParent.region,
    });
    this.reset();
    return true;
  }

  reset() {
    this.stage = null;
    this.pendingParent = null;
    this.clearSelection();
    this.elements.place.disabled = false;
    this.elements.cancel.disabled = true;
    this.elements.status.textContent = "Choose a location type, then place its map pin.";
  }

  edit(marker) {
    this.stage = null;
    this.pendingParent = null;
    this.selectedId = marker.id;
    const isArrival = marker.type === "fast_travel_arrival";
    this.elements.title.value = marker.title;
    this.elements.note.value = marker.note ?? "";
    this.elements.photos.value = (marker.photos ?? []).join("\n");
    this.elements.type.value = isArrival ? "" : marker.type;
    this.elements.type.disabled = isArrival;
    this.elements.arrival.checked = !isArrival && this.store.getAll().some((item) => item.parentId === marker.id);
    this.elements.arrival.disabled = true;
    this.elements.place.disabled = false;
    this.elements.cancel.disabled = true;
    this.elements.save.disabled = false;
    this.elements.delete.disabled = false;
    this.elements.status.textContent = isArrival
      ? "Editing fast-travel arrival. Drag the pin to move it."
      : "Editing location. Drag the pin to move it.";
  }

  save() {
    const marker = this.store.getAll().find((item) => item.id === this.selectedId);
    const title = this.elements.title.value.trim();
    if (!marker || !title) {
      this.elements.status.textContent = "Select a pin and give it a name before saving.";
      return;
    }
    const patch = {
      title,
      note: this.elements.note.value.trim(),
      photos: this.elements.photos.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
    };
    if (marker.type !== "fast_travel_arrival") patch.type = this.elements.type.value;
    this.store.update(marker.id, patch);
    if (marker.type !== "fast_travel_arrival") {
      this.store.getAll()
        .filter((item) => item.parentId === marker.id)
        .forEach((arrival) => this.store.update(arrival.id, {
          title: `${title} arrival`,
          note: `Fast travel arrival for ${title}.`,
        }));
    }
    this.elements.status.textContent = `${title} saved.`;
  }

  delete() {
    const marker = this.store.getAll().find((item) => item.id === this.selectedId);
    if (!marker) return;
    const linkedArrivals = this.store.getAll().filter((item) => item.parentId === marker.id);
    linkedArrivals.forEach((arrival) => this.store.remove(arrival.id));
    this.store.remove(marker.id);
    this.reset();
  }

  clearSelection() {
    this.selectedId = null;
    this.elements.type.disabled = false;
    this.elements.arrival.disabled = false;
    this.elements.save.disabled = true;
    this.elements.delete.disabled = true;
  }

  updateCount() {
    this.elements.count.value = this.store.getAll().filter((marker) => marker.type !== "fast_travel_arrival").length;
  }
}
