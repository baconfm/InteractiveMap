export class MapLayers {
  constructor(canvas) {
    this.canvas = canvas;
    this.layers = new Map();
  }

  register({ id, zIndex = 1, visible = true }) {
    if (this.layers.has(id)) throw new Error(`Map layer already registered: ${id}`);
    const element = document.createElement("div");
    element.className = "map-layer";
    element.dataset.layerId = id;
    element.style.cssText = `position:absolute;inset:0;z-index:${zIndex};display:${visible ? "block" : "none"};pointer-events:none;`;
    this.canvas.append(element);
    this.layers.set(id, { element, visible });
    return element;
  }

  setVisibility(id, visible) {
    const layer = this.layers.get(id);
    if (!layer) throw new Error(`Unknown map layer: ${id}`);
    layer.visible = visible;
    layer.element.style.display = visible ? "block" : "none";
  }

  get(id) { return this.layers.get(id)?.element ?? null; }
}
