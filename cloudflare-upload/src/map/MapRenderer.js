export class MapRenderer {
  constructor(canvas, map) {
    this.canvas = canvas;
    this.map = map;
    this.canvas.style.width = `${map.size.width}px`;
    this.canvas.style.height = `${map.size.height}px`;
  }

  setCamera(cameraState) {
    this.canvas.style.transform = `translate(${cameraState.x}px, ${cameraState.y}px) scale(${cameraState.zoom})`;
  }

  setBackground(imageUrl) {
    this.backgroundImage = imageUrl;
    this.canvas.style.backgroundImage = `url("${imageUrl}")`;
    this.canvas.classList.add("has-background");
  }

  setTileMode(isActive) {
    if (!this.backgroundImage) return;
    this.canvas.style.backgroundImage = isActive ? "none" : `url("${this.backgroundImage}")`;
  }
}
