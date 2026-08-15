# Cloudflare upload package

1. In the private editor, click **Save map**. This downloads a cleaned `days-gone-map-save.json` with reviewed/manual loot only.
2. Copy that downloaded file over `assets/games/days-gone/published-map.json` in this folder and rename it to `published-map.json` if needed.
3. In Cloudflare, open **Workers & Pages** → **Create application** → **Pages** → **Upload assets**.
4. Upload the contents of this `cloudflare-upload` folder (or the ZIP made beside it).
5. Deploy, then open the Pages URL. The root redirects to the read-only map.

The public viewer starts in loot-only mode. It can pan and zoom but cannot add, move, edit, delete, or save map markers.
