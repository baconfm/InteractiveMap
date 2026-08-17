const LOCATION_TYPES = [
  ["camp", "Camp"],
  ["ambush_camp", "Ambush camp"],
  ["nero_checkpoint", "NERO checkpoint"],
];

export class MapLocationEditor {
  constructor({ store, elements, regionForPosition }) {
    this.store = store;
    this.elements = elements;
    this.regionForPosition = regionForPosition;
    this.stage = null;
    this.pendingParent = null;
    this.elements.type.replaceChildren(...LOCATION_TYPES.map(([value, label]) => new Option(label, value)));
    this.bindEvents();
    this.updateCount();
    this.store.subscribe(() => this.updateCount());
  }

  bindEvents() {
    this.elements.place.addEventListener("click", () => this.begin());
    this.elements.cancel.addEventListener("click", () => this.reset());
  }

  begin() {
    const title = this.elements.title.value.trim();
    if (!title) {
      this.elements.status.textContent = "Give this location a name first.";
      return;
    }
    this.stage = "location";
    this.pendingParent = null;
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
    this.elements.place.disabled = false;
    this.elements.cancel.disabled = true;
    this.elements.status.textContent = "Choose a location type, then place its map pin.";
  }

  updateCount() {
    this.elements.count.value = this.store.getAll().filter((marker) => marker.type !== "fast_travel_arrival").length;
  }
}
