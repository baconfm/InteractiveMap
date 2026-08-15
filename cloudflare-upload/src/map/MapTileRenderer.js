export class MapTileRenderer {
  constructor(canvas, tileSet, mapSize) {
    this.canvas = canvas;
    this.tileSet = tileSet;
    this.mapSize = mapSize;
    this.tiles = new Map();
    this.element = document.createElement("div");
    this.element.className = "map-tiles";
    this.element.style.cssText = "position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;";
    this.canvas.append(this.element);
  }

  render(camera, viewport) {
    if (camera.zoom < this.tileSet.minZoom) {
      if (this.tiles.size) this.clear();
      return false;
    }

    const tileSize = this.tileSet.logicalTileSize;
    const left = Math.max(0, Math.floor((-camera.x / camera.zoom) / tileSize));
    const top = Math.max(0, Math.floor((-camera.y / camera.zoom) / tileSize));
    const right = Math.min(this.tileSet.columns - 1, Math.floor(((viewport.width - camera.x) / camera.zoom) / tileSize));
    const bottom = Math.min(this.tileSet.rows - 1, Math.floor(((viewport.height - camera.y) / camera.zoom) / tileSize));
    const visible = new Set();

    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const key = `${x}-${y}`;
        visible.add(key);
        if (!this.tiles.has(key)) this.addTile(x, y, tileSize, key);
      }
    }

    this.tiles.forEach((tile, key) => {
      if (!visible.has(key)) {
        tile.remove();
        this.tiles.delete(key);
      }
    });
    return true;
  }

  addTile(x, y, tileSize, key) {
    const tile = new Image();
    tile.className = "map-tile";
    tile.alt = "";
    tile.decoding = "async";
    tile.loading = "eager";
    tile.style.left = `${x * tileSize}px`;
    tile.style.top = `${y * tileSize}px`;
    tile.style.width = `${Math.min(tileSize, this.mapSize.width - x * tileSize)}px`;
    tile.style.height = `${Math.min(tileSize, this.mapSize.height - y * tileSize)}px`;
    tile.src = this.tileSet.template.replace("{x}", x).replace("{y}", y);
    this.tiles.set(key, tile);
    this.element.append(tile);
  }

  clear() {
    this.tiles.forEach((tile) => tile.remove());
    this.tiles.clear();
  }
}
