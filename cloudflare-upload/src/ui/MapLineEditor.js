const TYPES = [["passable", "Passable route"], ["blocked", "Impassable barrier"], ["boundary", "Area boundary"]];

export class MapLineEditor {
  constructor({ store, layer, elements, positionForEvent, draftForStart, onFinish }) {
    this.store = store; this.layer = layer; this.elements = elements; this.positionForEvent = positionForEvent; this.draftForStart = draftForStart; this.onFinish = onFinish; this.draft = null; this.selectedId = null;
    elements.type.replaceChildren(...TYPES.map(([value, label]) => new Option(label, value)));
    elements.start.addEventListener("click", () => this.start());
    elements.finish.addEventListener("click", () => this.finish());
    elements.cancel.addEventListener("click", () => this.reset());
    elements.delete.addEventListener("click", () => this.delete());
    store.subscribe(() => this.render()); this.render();
  }
  render() { this.layer.render(this.store.getAll(), this.draft, this.selectedId); }
  start() { const draft = this.draftForStart?.(this.selectedId); if (this.draftForStart && !draft) { this.elements.status.textContent = "Select a route line with two mapped objectives first."; return; } this.selectedId = null; this.draft = draft ?? { type: this.elements.type.value, title: this.elements.title.value.trim(), points: [] }; this.elements.start.disabled = true; this.elements.finish.disabled = false; this.elements.cancel.disabled = false; this.elements.delete.disabled = true; this.elements.status.textContent = "Click the mission line to add waypoints, then save the path."; this.render(); }
  place(position) { if (!this.draft) return false; this.draft.fixedEndpoints ? this.draft.points.splice(-1, 0, position) : this.draft.points.push(position); this.render(); this.elements.status.textContent = `${Math.max(0, this.draft.points.length - (this.draft.fixedEndpoints ? 2 : 0))} waypoint(s) on this mission line. Add more or save the path.`; return true; }
  finish() { if (!this.draft || this.draft.points.length < 2) { this.elements.status.textContent = "Add at least two control points to connect a line."; return; } if (this.onFinish) this.onFinish(this.draft); else this.store.add({ id: `map-line-${Date.now()}`, ...this.draft }); this.reset(); }
  select(line) { this.selectedId = line.id; this.draft = null; this.elements.type.value = line.type; this.elements.title.value = line.title ?? ""; this.elements.start.disabled = false; this.elements.finish.disabled = true; this.elements.cancel.disabled = false; this.elements.delete.disabled = false; this.elements.status.textContent = `${line.points.length}-point line selected. Drag its white control points to reshape it.`; this.render(); }
  movePoint(line, pointIndex, event) {
    const move = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      const points = line.points.map((point, index) => index === pointIndex ? this.positionForEvent(moveEvent) : point);
      line = { ...line, points };
      this.store.update(line.id, { points });
    };
    const finish = (finishEvent) => {
      finishEvent.preventDefault();
      finishEvent.stopPropagation();
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", finish, true);
      window.removeEventListener("pointercancel", finish, true);
    };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", finish, true);
    window.addEventListener("pointercancel", finish, true);
  }
  delete() { if (!this.selectedId) return; this.store.remove(this.selectedId); this.reset(); }
  reset() { this.draft = null; this.selectedId = null; this.elements.start.disabled = false; this.elements.finish.disabled = true; this.elements.cancel.disabled = true; this.elements.delete.disabled = true; this.elements.status.textContent = "Choose a line type, then start drawing."; this.render(); }
}
