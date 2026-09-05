# Days Gone Interactive Map

Public loot map, local content editor, Hide & Deek, and separate WIP resource and speedrun tools. Built with plain JavaScript modules, HTML, CSS, and a local Node server.

## Working on the project

- [AGENTS.md](AGENTS.md): concise instructions for Terra and other coding agents.
- [TERRA_GUIDE.md](TERRA_GUIDE.md): project scope, file map, data contracts, persistence, deployment, performance checks, known gaps and suggested improvements. Read the section relevant to the task.

## Run locally

From this folder:

```powershell
node scripts/local-map-server.mjs
```

Open `http://localhost:8173/editor-local.html` for the editor or `http://localhost:8173/readonly/index.html` for the public viewer. Speedrun Mode is at `/WIP/speedrun.html` and requires the external Router data path described in the guide.

The static viewer launcher `start-local-map.bat` uses port 8000 and does not provide the editor APIs. Keep the usual editor origin when accessing browser autosaves.

## Save and publish

Autosave writes browser storage. **Save map** downloads a backup. **Publish map** uses the local server to write files, synchronize data, commit and push to GitHub. These are separate operations; do not use Publish for testing.

`cloudflare-upload/` is the deployment bundle referenced by `wrangler.jsonc`. Its sync script also rebuilds data and replaces directories. Read the [workflow details](TERRA_GUIDE.md#7-packaging-publishing-and-cache) before running it. Some editor files are excluded from Git locally; see the guide before assuming a commit backs up the entire editor.
