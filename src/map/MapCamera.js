export class MapCamera {
  constructor({ minZoom, maxZoom, initialZoom = 1 }) {
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;
    this.zoom = initialZoom;
    this.x = 0;
    this.y = 0;
  }

  getState() { return { x: this.x, y: this.y, zoom: this.zoom }; }

  reset(viewport, mapSize) {
    const zoom = Math.min(viewport.width / mapSize.width, viewport.height / mapSize.height);
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
    this.x = (viewport.width - mapSize.width * this.zoom) / 2;
    this.y = (viewport.height - mapSize.height * this.zoom) / 2;
  }

  panBy(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
  }

  zoomAt(factor, anchor) {
    const nextZoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom * factor));
    const zoomRatio = nextZoom / this.zoom;
    this.x = anchor.x - (anchor.x - this.x) * zoomRatio;
    this.y = anchor.y - (anchor.y - this.y) * zoomRatio;
    this.zoom = nextZoom;
  }
}
