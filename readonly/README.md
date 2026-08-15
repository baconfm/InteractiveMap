# Read-only Cloudflare map

1. In the editor, click **Save map**.
2. Replace `assets/games/days-gone/published-map.json` with the downloaded `days-gone-map-save.json` file.
3. Deploy this project folder to Cloudflare Pages with no build command and the project root as the output directory.
4. Open `/readonly/` on the deployed site.

The read-only page has pan and zoom only. It does not expose editing tools or browser autosave controls.
