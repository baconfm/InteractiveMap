export const daysGoneMap = {
  id: "days-gone",
  name: "Days Gone",
  size: { width: 4269, height: 6289 },
  background: {
    image: "assets/games/days-gone/map/days-gone-world-map-overview.webp",
    alt: "Days Gone world map",
  },
  tiles: {
    template: "assets/games/days-gone/map/tiles/{x}-{y}.webp",
    logicalTileSize: 512,
    columns: 9,
    rows: 13,
    minZoom: 0.42,
  },
  coordinateMigrations: [
    {
      id: "days-gone-xl-map-v1",
      fromSize: { width: 1859, height: 2452 },
    },
  ],
  regions: [],
};
