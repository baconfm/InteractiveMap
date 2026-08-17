export class MapLineStore {
  constructor(storageKey) {
    this.storageKey = storageKey;
    try { this.lines = JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { this.lines = []; }
    if (!Array.isArray(this.lines)) this.lines = [];
    this.listeners = new Set();
  }

  getAll() { return [...this.lines]; }
  add(line) { this.lines = [...this.lines, line]; this.persist(); }
  remove(id) { this.lines = this.lines.filter((line) => line.id !== id); this.persist(); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  persist() { localStorage.setItem(this.storageKey, JSON.stringify(this.lines)); this.listeners.forEach((listener) => listener(this.getAll())); }
}
