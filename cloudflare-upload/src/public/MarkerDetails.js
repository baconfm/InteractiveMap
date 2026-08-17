import { renderDaysGoneMarkerIcon } from "../data/games/days-gone/marker-icons.js";
import { isOneTimeSpawn } from "../data/games/days-gone/loot-rules.js";
import { LOOT_LEGEND_GROUPS } from "../data/games/days-gone/loot-legend.js";

function isYouTubeUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname === "youtu.be" || url.hostname.endsWith("youtube.com");
  } catch {
    return false;
  }
}

export function createMarkerDetails({ layer }) {
  const panel = document.querySelector("#marker-details");
  const close = document.querySelector("#marker-details-close");
  const icon = document.querySelector("#marker-details-icon");
  const type = document.querySelector("#marker-details-type");
  const title = document.querySelector("#marker-details-title");
  const description = document.querySelector("#marker-details-description");
  const photos = document.querySelector("#marker-details-photos");

  close?.addEventListener("click", () => { panel.hidden = true; });

  return {
    show(marker) {
      const group = LOOT_LEGEND_GROUPS.find((entry) => entry.items.includes(marker.title));
      const spawnLabel = marker.type === "loot_cluster" ? "Area summary"
        : marker.type === "loot_stack" ? "Nearby matching pickups"
          : isOneTimeSpawn(marker) ? "One-time spawn" : "Respawnable item";
      icon.innerHTML = renderDaysGoneMarkerIcon(marker);
      type.textContent = group ? `${group.label} · ${spawnLabel}` : spawnLabel;
      title.textContent = marker.title;
      description.textContent = marker.note || marker.grid || "No additional location notes yet.";
      const attachments = Array.isArray(marker.photos) ? marker.photos : [];
      photos.replaceChildren(...attachments.map((url, index) => {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        if (isYouTubeUrl(url)) {
          link.className = "marker-details__video-link";
          link.textContent = "Video";
          link.title = `Open ${marker.title} location video ${index + 1}`;
          return link;
        }
        link.title = `Open photo ${index + 1}`;
        const image = document.createElement("img");
        image.src = url;
        image.alt = `${marker.title} location photo ${index + 1}`;
        image.loading = "lazy";
        link.append(image);
        return link;
      }));
      photos.hidden = attachments.length === 0;
      panel.hidden = false;
      layer.select(marker.id);
    },
    hide() { panel.hidden = true; },
  };
}
