export class MapCoordinates {
  constructor({ width, height }) {
    this.width = width;
    this.height = height;
  }

  screenToMap(point, camera) {
    return {
      x: (point.x - camera.x) / camera.zoom,
      y: (point.y - camera.y) / camera.zoom,
    };
  }

  mapToScreen(point, camera) {
    return {
      x: point.x * camera.zoom + camera.x,
      y: point.y * camera.zoom + camera.y,
    };
  }

  clamp(point) {
    return {
      x: Math.min(this.width, Math.max(0, point.x)),
      y: Math.min(this.height, Math.max(0, point.y)),
    };
  }
}
