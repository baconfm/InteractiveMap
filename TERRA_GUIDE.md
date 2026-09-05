# Terra project guide

Last verified against the local working tree: **2026-09-05**. This includes uncommitted changes, not necessarily the live website. Recheck the specific files involved before relying on a historical detail. The current user request overrides this guide.

## 1. How to use this guide without wasting context

`AGENTS.md` is the short automatic entry point. This file is a reference: choose a section from the table below. Do not read all source files, the entire chat history, or both copies of the project to begin a small task.

| Task | Read here first |
| --- | --- |
| Find the right page or code | Sections 2–3 |
| Item, encounter, access, save/load change | Sections 4–5 |
| Local startup, deployment, cache issue | Sections 6–7 |
| Speedrun route or waypoint editing | Section 8 |
| Lag, clustering, zoom, mobile input | Section 9 |
| Verification and handoff | Section 10 |
| Choose the next improvement | Section 11 |

Default working loop: identify the behavior → read its entry point and data path → make the smallest complete change → check the actual outcome → synchronize relevant deployment files → summarize. A smaller model benefits from explicit acceptance criteria, not from skipping diagnosis or testing. Stop once the scoped behavior is verified; do not turn each fix into an audit.

For a new task, name the page, the requested change, one expected result, and what to preserve. Keep related follow-ups in the same task. Start fresh for unrelated work, pointing the next task at this guide rather than pasting a long conversation. A useful prompt is:

> Read AGENTS.md and the relevant section of TERRA_GUIDE.md. Implement [specific behavior] on [page]. Preserve [important behavior]. Use focused checks, update necessary deployment copies, and report any untested interaction. Do not publish.

## 2. Current product scope

The project is a free Days Gone interactive loot map. Public users browse materials, supplies, weapons, plants, and encounter locations, filter items, and inspect location notes/media. The local editor maintains those records and prepares map updates. Separate pages provide Hide & Deek, a WIP resource planner, and a WIP speedrun route editor. The longer-term speedrun goal is using split timings and map routes to estimate travel time and optimize runs; a completed travel-time optimizer is not present.

The implementation is native ES modules, HTML, CSS, and a Node HTTP server for local editor endpoints. There is no root package.json, frontend build system, or established automated validation suite in this checkout. Do not add React, a map framework, a database, or a dependency installation as routine setup.

The public URL is `https://interactivemap.baconfmspeedruns.workers.dev/`; root `index.html` redirects to `/readonly/`. A successful local change does not establish deployment or live behavior. Current region completion labels are in `news/project-status.json`; do not reuse old chat claims about which region is empty.

## 3. Find the right code

| Area | Entry point / files |
| --- | --- |
| Public map | `readonly/index.html`, `src/public-map.js`, `src/public/MapApplication.js` |
| Legend and shared-view selections | `src/public/LootLegend.js`, `src/public/MapApplication.js` |
| Public popup / media | `src/public/MarkerDetails.js` |
| Public data loading | `src/public/published-markers.js`, `src/data/games/days-gone/published-map-source.js` |
| Local editor wiring, toolbox, loot edit, export | `editor-local.html`, `src/main.js` |
| Location / encounter editor | `src/ui/MapLocationEditor.js` |
| Generic route markers / lines | `src/ui/MarkerEditor.js`, `src/ui/MapLineEditor.js`, `src/map/MapLineLayer.js` |
| Camera, gestures, coordinate transforms | `src/map/MapEngine.js`, `MapCamera.js`, `MapCoordinates.js`, `src/ui/Controls.js` |
| Tile loading and base image | `src/map/MapTileRenderer.js`, `MapRenderer.js`, `src/data/games/days-gone/map.js` |
| Marker grouping, stacking, spacing, rendering | `src/map/MapMarkerLayer.js` |
| Browser data stores | `src/map/MapMarkerOverrides.js`, `MapMarkerStore.js`, `MapLineStore.js` |
| Item names and artwork | `src/data/games/days-gone/loot-item-icons.js`, `marker-icons.js`, `overlay-icons.js`, `assets/icons/` |
| Categories, respawn, recipes | `loot-legend.js`, `loot-rules.js`, `crafting-recipes.js` in the same game data folder |
| Encounter classification | `src/data/games/days-gone/random-encounters.js` |
| WIP resource planner | `WIP/interactivewip.html`, `src/wip-map.js`, `src/wip/PlannerPanel.js`, `src/planner/ResourcePlanner.js` |
| WIP Speedrun Mode | `WIP/speedrun.html`, `src/speedrun-mode.js`, `/api/speedrun-route` in the local server |
| Hide & Deek | `src/hide-deek.js` and its page; uploads in `assets/photos/` |
| Site text / SEO | `about.html`, `about.txt`, `privacy.html`, `news/`, `sitemap.xml`, verification HTML, page metadata |
| Packaging / local endpoints | `scripts/`, documented below |

Use `rg -n 'symbol' src/public src/map` for public behavior, or an explicit file search for ignored editor source. `rg --files` and Git listings can omit ignored files. Do not assume a missing search result means the editor was deleted. Most CSS is shared; scope page-specific rules to that page's class. Resolve module assets relative to `import.meta.url` when necessary: `/readonly/` and `/WIP/` are nested paths. Tile URL construction must leave literal `{x}` and `{y}` placeholders for the tile renderer.

## 4. Data contracts

### Loot

A typical item retains `id`, `type`, `title`, `position: {x,y}`, `region`, `quantity`, `note`, and optional `photos`, `grid`, `location`, `category`, `oneTimeSpawn`, and `inaccessible`. Keep unknown metadata when patching records. A display label is not a stable ID.

- Canonicalize item names using the existing helper: Beer Bottle and Bottle must count together.
- Quantity counts units at a spawn; marker count counts records/locations. Label totals accurately.
- `oneTimeSpawn` explicitly overrides the default; `loot-rules.js` supplies fallback behavior.
- `inaccessible: true` flags the original item. It is independent of respawn status. It can describe a version restriction or map-state restriction using the existing notes/media.
- `Growler Minigun` is a regular loot item but is always labeled New Game+ only. Do not treat it as inaccessible or add it to crafting recipes.
- The current access implementation provides a checkbox, red `!` badge, popup warning, and an Inaccessible loot option under the public spawn controls. All items includes flagged items; Respawnable and One-time exclude them. It is not automatic game-version detection or a version selector.
- Flagged items bypass area clustering and matching stacks, so they do not inflate those clusters' crafting summaries. The separate WIP resource planner has not been updated to exclude them; do not claim that all planning logic understands access restrictions.
- Loot and random encounters are distinct records. Public map grouping can combine them into an area summary, but encounter records must not count as crafting resources.

### Encounters

Keep `type: "random_encounter"`. Current classification is derived from the title, not a persisted subtype.

The editor's Location type choices are Sniper, Survivor, Clothesline Trap, Marauders and Freaks, Snare Trap, Other, plus the existing camp/checkpoint choices. Selecting an encounter option fills its default title. Opening an existing marker preserves its title, including `2 Survivors`. Other defaults to `Random Encounter`; changing a free-text title can change its derived kind when reopened.

`frog_jump` is a separate map-location type for frog-jump/glitch access points. It is not loot and uses the regular location store, editor autosave, and map-location renderer.

The public legend currently has **different** kinds: Survivor, Hostage, Sniper Ambush, Exploding Car Ambush, Other. Sniper spelling variants and Survivor/2 Survivors map together. Traps and Marauders/Freaks currently fall under public Other. Keep this distinction until the user asks to align them. Public subfilters are subordinate to the master Random Encounters toggle. Test turning the master off and back on after a custom sub-selection.

### Coordinates and regions

Map space is **4269 × 6289**, not browser pixels. Use the existing screen-to-map conversion and clamp logic. Never modify saved pickup positions to space cluster icons. The tile grid currently uses 512 logical pixels, 9 columns × 13 rows, and WebP tiles from `tiles-retina/`. Keep existing migration identifiers intact; applying a migration twice corrupts positions.

The six regions are Cascades, Belknap, Lost Lake, Iron Butte, Crater Lake, Highway 97. Saved region assignments normally take precedence when building regional data. Reclassification from coordinates is a separate explicit operation.

## 5. Persistence: four different meanings of save

| Operation | What it does |
| --- | --- |
| Editor autosave | Writes browser localStorage overlays/manual items; it does not update Git or the published snapshot |
| Save map | Downloads `days-gone-map-save.json` containing the current snapshot |
| Speedrun Save route changes | POSTs map-specific overrides to a local JSON file; no Router source overwrite |
| Publish map / news / region status | Local server changes files, stages, commits, and pushes to `origin main` |

`MapMarkerOverrides` combines the baseline snapshot, manual records, and patches keyed by ID. `getReviewed()` currently returns `getAll()`; its name does not imply a separate approval queue. Reset removes a patch; delete behaves differently for baseline versus manually added markers.

Relevant storage keys include `days-gone-loot-item-overrides-v2` and its `:manual` companion, `days-gone-map-locations-v1`, `days-gone-route-markers-v1`, `days-gone-map-lines-v1`, and `days-gone-speedrun-all-storylines-autosave-v1`. Preserve keys or migrate deliberately. `localhost`, `127.0.0.1`, and different ports have separate browser storage: switching origin can look like lost work. Export before clearing storage or changing origins.

The local editor baseline is `assets/games/days-gone/published-map.json`; it prefers `allLootMarkers`, falling back to `publishedLootMarkers`. The public loader normally reads the regional manifest and six region files. Editing only one regional output is temporary: rebuilding from the snapshot overwrites it.

## 6. Running locally and checking safely

Run from the repository root in PowerShell:

```powershell
node scripts/local-map-server.mjs
```

Use `http://localhost:8173/editor-local.html`, `/readonly/index.html`, or `/WIP/speedrun.html`. The server's file handling does not resolve `/readonly/` to an index page; use the explicit filename locally. Keep the user's usual hostname/port for their browser autosave. Reuse an existing server when available; inspect its state before starting another. A server code change requires restarting that server; a static module/CSS change normally requires only reload. The launcher `start-local-map-editor.bat` opens the editor and runs this server.

`start-local-map.bat` starts a Python static server at port 8000 and opens `/readonly/`. It has no editor API endpoints, so it cannot test uploads, Speedrun route loading, or publishing. Do not mistake a static server's API errors for frontend bugs.

Focused read-only checks:

```powershell
git status --short
node --check src/public/LootLegend.js
git diff --check
git diff -- src/public/LootLegend.js
git diff --no-index -- src/public/LootLegend.js cloudflare-upload/src/public/LootLegend.js
```

Replace the sample file with the changed module. `git diff --no-index` returns 1 when files differ, not necessarily a command failure. For ignored files, inspect their contents and check them directly. Use small Node assertions when a data transformation or persistence change needs behavior verification. No reason to run a repository-wide scan for a copy edit.

## 7. Packaging, publishing, and cache

`cloudflare-upload/` is a deployment mirror. Author shared/public changes in source, then update corresponding deployment files after checking for existing differences. An editor-only HTML file has no guaranteed deployment counterpart. WIP HTML is not copied by the current sync script, but the entire `src` tree is copied; do not describe this as a fully isolated/private deployment boundary.

| Command | Side effects |
| --- | --- |
| `node scripts/build-regional-published-map.mjs` | Rewrites the canonical snapshot, six region JSON files, and manifest; updates `generatedAt` even without a content change |
| Same command with `--reclassify-regions` | Also prefers inferred coordinates for region assignment; use only for an authorized reclassification |
| `node scripts/sync-cloudflare-published-map.mjs` | Runs regional build, replaces deployment `src`, `readonly`, and `news`, then copies named pages, styles, data, icons and photos |
| `publish-days-gone-map-data.bat "C:\path\days-gone-map-save.json"` | Overwrites the source and deployment snapshots only; does not rebuild regions, commit or push. Without an argument it uses the root snapshot |
| Editor publish endpoints | Stage, commit and push after their file changes; publication must be in scope |

Full sync is not a verification command: it can erase deployment-only edits and create a large data diff. For a targeted code fix, matching file edits usually suffice. Full sync does not copy root `index.html`, `_headers`, `robots.txt`, `hide-deek/index.html`, `WIP/`, or map tiles. Photos/icons are copied without clearing stale destination files. Inspect the script for the task's asset type. The builder prefers `allLootMarkers` and rewrites all three loot arrays to that set; a raw imported backup is not automatically a curated publish set.

`wrangler.jsonc` points static assets at `cloudflare-upload`; older upload instructions describe Cloudflare Pages. Inspect the actual deployment configuration before giving instructions or deploying. No deployment was performed to create this guide. The tracked `cloudflare-upload/src/main.js` contains a copy of the Git-ignored editor source, which full sync refreshes.

Publish endpoints use `git commit` without isolating pre-staged changes. Existing staged work may be included. Never click Publish during ordinary UI tests, and do not call it as a health check. A failed push may still leave local files or a commit changed. Inspect state before retrying. A source-code edit appearing in the deployment directory is not evidence that it was committed or deployed.

Public data loading has two routes: an optional `PUBLISHED_MAP_DATA_URL` (currently empty), otherwise a manifest fetched with `cache: "no-store"`, followed by regional JSON. The loader compares `generatedAt`/version with localStorage and adds a version query on a detected change. This alone does **not** guarantee zero network traffic on later visits; browser caching depends on URL consistency and response headers. The local Node server sends `Cache-Control: no-store` for its responses, so it is not a production cache benchmark.

## 8. WIP Speedrun Mode

Source path currently configured in the local server:

```text
C:\Users\Bacon\Documents\Codex\PlatinumRouter-main\PlatinumRouter-main\data\days-gone
```

The repeated directory is intentional in this machine's configured path. Read `meta.json` and `routes/all-storylines/{counters,default-splits,phases,quotas,completion-titles}.json` directly through the local endpoint. Do not copy the catalog into this map project just to make a path error disappear.

Required totals: **240 unique stops**, advancing **144 story missions, 34 camp jobs, 12 NERO checkpoints, 14 ambush camps, 12 infestation zones, 40 hordes**. Sum OCR goals **and** `split.auto`; counting OCR alone undercounts story missions and the three story hordes. Counter overlaps remain one stop. All Storylines excludes collectibles, trophies, cairns, IPCA, research sites, injectors, plants, and loot. The separate Platinum + 100% route must remain untouched.

Map overrides are in `assets/games/days-gone/speedrun-route-overrides.json`: `routeId`, ordered split IDs, `coordinates`, `vectors`, and `transitions`. Current vectors store intermediate points by the destination split ID. Transitions hold optional `start`, `end`, and `teleport`. The renderer connects a previous mission's end to the next start, and skips that connection when the previous mission has teleport enabled.

Treat this as unfinished tooling, not a validated routing engine. Important code-review observations to investigate only when relevant:

- Only All Storylines is wired; robust route switching/state isolation is not established.
- Current/completed/upcoming filters use the selected stop's index, not an independently tracked run state.
- Path edits are keyed by destination, so reordering can associate an old detour with a new predecessor.
- The shared line editor appends points before the destination; it does not insert into the nearest segment. Endpoint handles are not fully protected, and draft rendering does not provide a complete live replacement path.
- Mission start/end coordinates are stored but the marker render only shows the ordinary objective position. Internal mission paths and teleport landing markers are not fully modeled.
- Draft selection, placement modes, reset, and route changes need interaction tests. `legId(state.selected)` can fail if no objective is selected.
- Old detached `lines` metadata is deleted from active overrides when loading. Do not migrate or save old drafts without considering their recoverability.

The external Router has its own validation command; run its `npm run validate` only when route work warrants it, from its verified project root. Do not confuse that suite with map UI testing.

## 9. Performance work that produces useful results

Target usability includes older desktops and mobile devices: responsive wheel zoom, two-finger pinch, and panning at maximum zoom. Measure before tuning. Use the same dataset, viewport, start position, zoom sequence, and cache conditions before/after. Record visible DOM marker count, long tasks/frame timing, image requests/bytes, and interaction delay for the affected scenario. CPU throttling approximates slower processing; it does not reproduce two physical cores and 4 GB RAM. Label the conditions honestly.

Existing mechanisms worth preserving:

- `MapEngine` schedules rendering through animation frames; camera changes should not cause avoidable full UI rebuilding.
- `MapTileRenderer` loads a two-tile buffer and removes tiles outside it.
- `MapMarkerLayer` has area clusters, matching stacks, viewport culling and cluster-only layout offsets.
- The toolbox has name/count sorting and ignores move-only changes for reordering. Count by canonical name.
- Public and WIP views share modules; a seemingly local gesture or marker fix can affect multiple pages.

Avoid heavy CSS filters per icon, large embedded raster SVGs, full-map image decoding at unnecessary resolution, per-pointer localStorage serialization, repeated large array comparisons, and replacing entire marker trees for tiny movements. These are investigation targets, not a mandate to rewrite the renderer. Preserve original artwork when changing formats. The user has rejected large icon backplates and fake relocation of real loot.

For clustering, check fully zoomed out, one and two zoom steps in, just below/above the split threshold, and maximum zoom. Preserve geographic coverage without inventing loot in empty areas. Historical requests favored at most six overview clusters per populated region; compare the current algorithm with the latest requested appearance before changing constants.

## 10. Acceptance checks and handoff

| Change | Minimum useful verification |
| --- | --- |
| Editor field | Load existing item → edit → save → reselect/reload → confirm export retains field; inspect another item for stale state |
| Encounter choice | Existing title variants load; selected choice saves as random_encounter; notes/media/ID/position survive |
| Icon or badge | Normal and flagged variants visible at map size; no broken asset URL; loot artwork otherwise unchanged |
| Public filter | Toggle on/off; combine with existing controls; check cluster contents/counts and shared URL behavior if relevant |
| Layout | Count panels/duplicate IDs; inspect desktop and narrow viewport, scrolling, map height, controls and selected detail visibility |
| Pointer/path change | Click versus drag, cancel, selecting another item, zoom, node drag and save/reload; pinch on a touch-capable test when available |
| Data/build change | Parse JSON; preserve IDs/metadata; compare expected counts and region assignments; inspect only authorized generated diffs |
| Performance | Same reproducible gesture before/after with stated hardware/throttling; check no functional regression |

Do not announce a visual fix from `node --check` alone. The earlier collapsed Speedrun layout involved a duplicated detail panel and IDs; CSS-only changes did not fix the structure. Inspect the actual DOM before adding sizing overrides. When browser testing is unavailable, report that limitation instead of claiming it passed.

End a task with a concise result, checks, and any remaining issue. State whether changes are only local. If switching models or starting fresh, record the affected files, latest failure, and one next check; do not replay every attempted fix. Update this guide only for material workflow/schema changes, not every minor edit.

## 11. Suggested next improvements, not automatic work

1. **Protect local work:** decide how to back up/version the ignored editor files without exposing a public editor. Browser autosave is not a durable backup.
2. **Reduce deployment drift:** a targeted sync/check mode could compare named files without rewriting snapshot timestamps or replacing whole directories. Also distinguish data publish from code deployment clearly.
3. **Finish access semantics:** consider an independent All/Accessible/Inaccessible filter so accessibility can combine with respawn status; carry restrictions into the resource planner if requested. Do not automatically mark items from notes.
4. **Align encounter taxonomy if desired:** editor and public choices currently differ; arbitrary title edits can change categories. A stable subtype field would require a deliberate backward-compatible plan, not silently changing marker types.
5. **Make Speedrun editing consistent:** define mission start/end, intermission travel and teleport arrival semantics, then fix insertion, endpoint locking, draft preview and reorder ownership together in a bounded task.
6. **Keep a small repeatable UI smoke check:** selection, filter, pan/zoom, save/reload on the exact changed page. Add reusable automation only when repeated use justifies maintaining it.
7. **Profile the most visible lag:** optimize the measured hotspot, then stop. Larger architectural rewrites need evidence that the current renderer cannot meet the requirement.

No implementation or deployment of this list is authorized merely by its inclusion here.
