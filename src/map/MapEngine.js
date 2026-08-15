import { MapCamera } from "./MapCamera.js";
import { MapCoordinates } from "./MapCoordinates.js";
import { MapLayers } from "./MapLayers.js";
import { MapRenderer } from "./MapRenderer.js";
import { MapTileRenderer } from "./MapTileRenderer.js";

export class MapEngine {
  constructor({ viewport, canvas, map, cameraConfig, onPointerMove, onMapClick, onBackgroundLoad, onCameraChange }) {
    this.viewport = viewport;
    this.map = map;
    this.renderer = new MapRenderer(canvas, map);
    this.tileRenderer = map.tiles ? new MapTileRenderer(canvas, map.tiles, map.size) : null;
    this.coordinates = new MapCoordinates(map.size);
    this.layers = new MapLayers(canvas);
    this.cameraConfig = cameraConfig;
    this.camera = new MapCamera(cameraConfig);
    this.onPointerMove = onPointerMove;
    this.onMapClick = onMapClick;
    this.onBackgroundLoad = onBackgroundLoad;
    this.onCameraChange = onCameraChange;
    this.dragStart = null;
    this.renderFrame = null;
    this.activePointers = new Map();
    this.pinchState = null;
    this.layers.register({ id: "regions", zIndex: 1 });
    this.layers.register({ id: "entities", zIndex: 2 });
    this.layers.register({ id: "annotations", zIndex: 3 });
    this.bindEvents();
  }

  mount() {
    this.resetView();
    this.loadBackground();
  }

  getViewportSize() { return { width: this.viewport.clientWidth, height: this.viewport.clientHeight }; }

  resetView() {
    this.camera.reset(this.getViewportSize(), this.map.size);
    this.render();
  }

  zoomIn() { this.zoomBy(this.cameraConfig.zoomStep); }
  zoomOut() { this.zoomBy(1 / this.cameraConfig.zoomStep); }

  zoomBy(factor) {
    const viewport = this.getViewportSize();
    this.camera.zoomAt(factor, { x: viewport.width / 2, y: viewport.height / 2 });
    this.render();
  }

  render() {
    const cameraState = this.camera.getState();
    this.renderer.setCamera(cameraState);
    const tilesActive = this.tileRenderer?.render(cameraState, this.getViewportSize()) ?? false;
    this.renderer.setTileMode(tilesActive);
    this.onCameraChange?.(cameraState);
  }

  requestRender() {
    if (this.renderFrame) return;
    this.renderFrame = window.requestAnimationFrame(() => {
      this.renderFrame = null;
      this.render();
    });
  }

  async loadBackground() {
    if (!this.map.background.image) return;
    const image = new Image();
    image.onload = () => {
      this.renderer.setBackground(this.map.background.image);
      this.onBackgroundLoad?.();
    };
    image.src = this.map.background.image;
  }

  bindEvents() {
    this.viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const point = this.toViewportPoint(event);
      this.camera.zoomAt(Math.exp(-event.deltaY * this.cameraConfig.wheelSensitivity), point);
      this.requestRender();
    }, { passive: false });
    this.viewport.addEventListener("pointerdown", (event) => {
      this.viewport.setPointerCapture(event.pointerId);
      this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.activePointers.size === 2) {
        this.startPinch();
        this.dragStart = null;
        return;
      }
      this.dragStart = { x: event.clientX, y: event.clientY, moved: false };
      this.viewport.classList.add("is-dragging");
    });
    this.viewport.addEventListener("pointermove", (event) => {
      if (this.activePointers.has(event.pointerId)) this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.activePointers.size === 2) {
        this.updatePinch();
        return;
      }
      const point = this.toViewportPoint(event);
      this.onPointerMove?.(this.coordinates.clamp(this.coordinates.screenToMap(point, this.camera.getState())));
      if (!this.dragStart) return;
      this.dragStart.moved ||= Math.abs(event.clientX - this.dragStart.x) > 3 || Math.abs(event.clientY - this.dragStart.y) > 3;
      this.camera.panBy(event.clientX - this.dragStart.x, event.clientY - this.dragStart.y);
      this.dragStart = { x: event.clientX, y: event.clientY, moved: this.dragStart.moved };
      this.requestRender();
    });
    const endDrag = (event) => {
      const wasPinching = this.activePointers.size === 2 || Boolean(this.pinchState);
      this.activePointers.delete(event.pointerId);
      if (this.activePointers.size === 1) {
        const [{ x, y }] = this.activePointers.values();
        this.dragStart = { x, y, moved: true };
        this.pinchState = null;
        return;
      }
      const drag = this.dragStart;
      this.dragStart = null;
      this.pinchState = null;
      this.viewport.classList.remove("is-dragging");
      if (!wasPinching && drag && !drag.moved) {
        const point = this.toViewportPoint(event);
        this.onMapClick?.(this.coordinates.clamp(this.coordinates.screenToMap(point, this.camera.getState())));
      }
    };
    this.viewport.addEventListener("pointerup", endDrag);
    this.viewport.addEventListener("pointercancel", endDrag);
    this.viewport.addEventListener("dblclick", (event) => {
      this.camera.zoomAt(this.cameraConfig.zoomStep, this.toViewportPoint(event));
      this.render();
    });
    window.addEventListener("resize", () => this.resetView());
  }

  startPinch() {
    const [first, second] = this.activePointers.values();
    this.pinchState = {
      distance: Math.hypot(second.x - first.x, second.y - first.y),
      midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    };
    this.viewport.classList.add("is-dragging");
  }

  updatePinch() {
    const [first, second] = this.activePointers.values();
    if (!this.pinchState) this.startPinch();
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const anchor = this.toViewportPoint({ clientX: midpoint.x, clientY: midpoint.y });
    this.camera.panBy(midpoint.x - this.pinchState.midpoint.x, midpoint.y - this.pinchState.midpoint.y);
    if (this.pinchState.distance > 0) this.camera.zoomAt(distance / this.pinchState.distance, anchor);
    this.pinchState = { distance, midpoint };
    this.requestRender();
  }

  toViewportPoint(event) {
    const bounds = this.viewport.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }
}
