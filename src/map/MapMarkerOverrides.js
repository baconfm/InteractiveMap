export class MapMarkerOverrides {
  constructor(storageKey, markers) {
    this.storageKey = storageKey;
    this.baseMarkers = markers;
    this.manualMarkers = this.readManual();
    this.overrides = this.read();
    this.listeners = new Set();
  }

  read() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? "{}") ?? {};
    } catch { return {}; }
  }

  readManual() {
    try {
      const markers = JSON.parse(localStorage.getItem(`${this.storageKey}:manual`) ?? "[]");
      return Array.isArray(markers) ? markers : [];
    } catch { return []; }
  }

  uniqueMarkers(markers) {
    const markerIds = new Set();
    return [...markers].reverse().filter((marker) => {
      if (!marker?.id || markerIds.has(marker.id)) return false;
      markerIds.add(marker.id);
      return true;
    }).reverse();
  }

  getAll() {
    return this.uniqueMarkers([...this.baseMarkers, ...this.manualMarkers])
      .map((marker) => ({ ...marker, ...this.overrides[marker.id] }))
      .filter((marker) => !marker.hidden);
  }

  getReviewed() {
    return this.getAll();
  }

  add(marker) {
    this.manualMarkers = [...this.manualMarkers, marker];
    localStorage.setItem(`${this.storageKey}:manual`, JSON.stringify(this.manualMarkers));
    this.listeners.forEach((listener) => listener(this.getAll(), "add"));
  }

  move(id, position) {
    this.overrides[id] = { ...this.overrides[id], position };
    localStorage.setItem(this.storageKey, JSON.stringify(this.overrides));
    this.listeners.forEach((listener) => listener(this.getAll(), "move"));
  }

  update(id, patch) {
    this.overrides[id] = { ...this.overrides[id], ...patch };
    localStorage.setItem(this.storageKey, JSON.stringify(this.overrides));
    this.listeners.forEach((listener) => listener(this.getAll(), "update"));
  }

  reset(id) {
    delete this.overrides[id];
    localStorage.setItem(this.storageKey, JSON.stringify(this.overrides));
    this.listeners.forEach((listener) => listener(this.getAll(), "reset"));
  }

  remove(id) {
    const isManual = this.manualMarkers.some((marker) => marker.id === id);
    if (isManual) {
      this.manualMarkers = this.manualMarkers.filter((marker) => marker.id !== id);
      localStorage.setItem(`${this.storageKey}:manual`, JSON.stringify(this.manualMarkers));
      delete this.overrides[id];
    } else {
      this.overrides[id] = { ...this.overrides[id], hidden: true };
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.overrides));
    this.listeners.forEach((listener) => listener(this.getAll(), "remove"));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
