const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const STYLES = {
  mission: { color: "#f6c453", dash: "" },
  passable: { color: "#69d9ef", dash: "" },
  blocked: { color: "#ed6b62", dash: "22 13" },
  boundary: { color: "#e3b746", dash: "10 8" },
};

export class MapLineLayer {
  constructor(element, mapSize, { onLineClick, onPointPointerDown } = {}) { this.element = element; this.mapSize = mapSize; this.onLineClick = onLineClick; this.onPointPointerDown = onPointPointerDown; }

  render(lines, draft, selectedId) {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.classList.add("map-line-layer");
    svg.setAttribute("viewBox", `0 0 ${this.mapSize.width} ${this.mapSize.height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    lines.forEach((line) => {
      const style = STYLES[line.type] ?? STYLES.boundary;
      const path = document.createElementNS(SVG_NAMESPACE, "path");
      path.classList.add("map-line", `map-line--${line.type}`);
      path.setAttribute("d", line.points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" "));
      path.setAttribute("fill", "none"); path.setAttribute("stroke", style.color); path.setAttribute("stroke-width", "9");
      path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
      if (style.dash) path.setAttribute("stroke-dasharray", style.dash);
      if (line.id !== "draft") path.addEventListener("pointerdown", (event) => { event.preventDefault(); event.stopPropagation(); this.onLineClick?.(line); });
      svg.append(path);
      if (line.id === selectedId) this.appendHandles(svg, line);
    });
    if (draft) this.appendHandles(svg, { ...draft, id: "draft" });
    this.element.replaceChildren(svg);
  }

  appendHandles(svg, line) {
    line.points.forEach((point, index) => {
      const handle = document.createElementNS(SVG_NAMESPACE, "circle");
      handle.classList.add("map-line__handle");
      handle.setAttribute("cx", point.x); handle.setAttribute("cy", point.y); handle.setAttribute("r", "15");
      handle.setAttribute("fill", line.id === "draft" ? "#e3b746" : "#f2f4ef");
      handle.setAttribute("stroke", "#172018"); handle.setAttribute("stroke-width", "5");
      if (line.id !== "draft") handle.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        handle.setPointerCapture?.(event.pointerId);
        this.onPointPointerDown?.(line, index, event);
      });
      svg.append(handle);
    });
  }
}
