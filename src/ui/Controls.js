export function bindControls(engine) {
  document.querySelector("#zoom-in").addEventListener("click", () => engine.zoomIn());
  document.querySelector("#zoom-out").addEventListener("click", () => engine.zoomOut());
  document.querySelector("#reset-view").addEventListener("click", () => engine.resetView());
}
