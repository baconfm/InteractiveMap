# Days Gone Interactive Loot Map

> **Days Gone information, without digging through ten guides.**

A free, fan-made interactive map for finding loot, resources, weapons, encounters, and useful locations throughout **Days Gone**.

**4,000+ mapped records across all six regions.**

### 🗺️ [Open the Interactive Map](https://interactivemap.baconfmspeedruns.workers.dev/readonly/)

![Days Gone Interactive Loot Map](https://github.com/baconfm/InteractiveMap/blob/main/Screenshot%202026-09-14%20085520.png?raw=true)

---

## What is this?

Days Gone has a huge amount of useful information scattered across maps, videos, spreadsheets, guides, Reddit posts, and community discoveries.

This project tries to put that information in one place.

Search for an item, filter the map, inspect the location, and get back to the game.

The map currently covers:

- Cascades
- Belknap
- Lost Lake
- Iron Butte
- Crater Lake
- Highway 97

**No paywalls. No fake deadlines. Just a fan project getting better.**

---

## Features

- 4,000+ mapped records
- Searchable loot and resources
- Weapons and throwables
- Plants and crafting materials
- Respawn information
- Random encounters
- Item quantities
- Location notes
- Reference images
- Category and spawn filters
- Marker clustering
- Mobile controls
- Shareable map views

The underlying data is also being used for experimental **resource planning** and **speedrun routing** tools.

---

## The project

The map is built with:

**HTML · CSS · JavaScript · Native ES Modules · Node.js**

The mapping system is custom-built and includes:

- Tile rendering
- Map coordinates and camera controls
- Mouse and touch input
- Marker culling
- Spatial clustering
- Collision handling
- Regional data loading
- Search and filtering
- Local editing tools
- Data publishing
- Cloudflare deployment

The goal is to keep the project relatively lightweight while still being able to handle thousands of map records.

---

## Running locally

Clone the repository and start the local server:

```bash
node scripts/local-map-server.mjs
