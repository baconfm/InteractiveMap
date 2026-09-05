# Working on the Days Gone map

This is a small vanilla JavaScript/HTML/CSS project. Optimize for a correct, focused change and a short handoff. Use the user's current request as the scope; old conversation requests are context, not an automatic backlog.

## Start cheaply

1. Run `git status --short`. Read the relevant source and its callers before editing.
2. Use the file map in `TERRA_GUIDE.md` to choose where to look. Read only the sections needed for this task, not the entire guide every turn.
3. Search source first, excluding deployment copies, large JSON snapshots, tiles, and SVGs unless those are the task. Use explicit paths with `rg`.
4. Check the corresponding deployment file before updating it. Preserve existing differences and unrelated changes.
5. Implement, run focused checks, and report the result. Broaden investigation only for a concrete failure or unresolved dependency.

## Project boundaries

- Public map: `readonly/index.html` → `src/public-map.js` → `src/public/MapApplication.js`.
- Local editor: `editor-local.html` → `src/main.js`; Node server `scripts/local-map-server.mjs`, port 8173.
- WIP route planner: `WIP/interactivewip.html`; WIP Speedrun Mode: `WIP/speedrun.html` → `src/speedrun-mode.js`.
- Shared renderer, camera, coordinates, stores: `src/map/`. Shared styles: `styles.css`.
- Public deployment copies: `cloudflare-upload/`. A public/shared change generally needs matching changes there. Do not publish WIP pages as a side effect.
- **Local-only files can be invisible to Git:** this checkout's `.git/info/exclude` excludes `editor-local.html`, `src/main.js`, two editor/publish launchers, and `.local-backups/`. Inspect these explicitly for editor tasks. Do not unignore or publish them without authorization.

## Data and behavior to preserve

- Stable marker IDs and real map coordinates must survive edits. Map space is 4269 × 6289. Cluster spacing is presentation only.
- Preserve canonical item names (`Beer Bottle` → `Bottle`), quantity, notes, photos, region, `oneTimeSpawn`, and `inaccessible` metadata through save/load/export.
- Encounters stay `type: "random_encounter"`; current editor choices set titles. Public kinds are derived from titles and currently differ from the editor choices. Read the guide before changing either.
- `inaccessible: true` is a flag on the original loot item, not a replacement item type. Absence means ordinary access; do not infer restrictions by parsing prose.
- Keep autosave keys intact. Browser autosave, JSON backup, disk save, and public publishing are different operations.
- Do not render the toolbox on every marker drag; preserve the existing `change !== "move"` guard. Keep heavy DOM work off camera/pointer hot paths.
- Preserve user-drawn artwork and original assets. Avoid large embedded raster images in SVGs.
- Speedrun source is the external PlatinumRouter All Storylines data. Keep its 240 stops and totals 144/34/12/14/12/40; include automatic counter advances. Store map metadata by split ID. Never rewrite the Platinum + 100% route as part of map work.

## Finish with proportionate verification

- `node --check` changed JavaScript files; `git diff --check` for patch hygiene. This repo has no root package.json or established test suite; do not invent `npm test` or install a framework for a small fix.
- Exercise the changed behavior. For UI changes, check the actual page, selection, layout, and any relevant save/reload interaction. Syntax checks alone do not verify UI behavior. State when browser checks were not performed.
- For shared map/gesture changes, check public and editor callers, desktop zoom/pan and mobile pinch where available. Do not claim a two-core/4 GB result from a normal desktop run.
- Never use publish endpoints as tests: they can commit and push. The full sync script rewrites data and replaces deployment directories; it is not a read-only check.
- No commits, pushes, deployment, broad cleanup, new dependencies, or source-data migration unless the task authorizes them. Keep uncommitted user work.

## Communicate economically

Use brief progress updates at meaningful milestones. Final answer: what changed, what was checked, and any remaining limitation. Do not repeat file dumps, elaborate plans, or routine command output. Ask only for choices that materially block the requested result. Update the relevant guide section when a task changes an established workflow.
