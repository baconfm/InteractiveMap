export class MapMarkerStore {
  constructor(storageKey) {
    this.storageKey = storageKey;
    this.markers = this.read();
    this.listeners = new Set();
  }

  read() {
    try {
      const markers = JSON.parse(localStorage.getItem(this.storageKey) ?? "[]");
      return Array.isArray(markers) ? markers : [];
    } catch { return []; }
  }

  getAll() { return [...this.markers]; }

  migratePositions({ id, fromSize, toSize }) {
    const migrationKey = `${this.storageKey}:migration:${id}`;
    if (localStorage.getItem(migrationKey)) return;

    this.markers = this.markers.map((marker) => ({
      ...marker,
      position: {
        x: marker.position.x * (toSize.width / fromSize.width),
        y: marker.position.y * (toSize.height / fromSize.height),
      },
    }));

    localStorage.setItem(this.storageKey, JSON.stringify(this.markers));
    localStorage.setItem(migrationKey, "complete");
  }

  add(marker) {
    this.markers = [...this.markers, marker];
    this.persist();
    return marker;
  }

  update(id, patch) {
    this.markers = this.markers.map((marker) => marker.id === id ? { ...marker, ...patch } : marker);
    this.persist();
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.markers));
    this.listeners.forEach((listener) => listener(this.getAll()));
  }
}
