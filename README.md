Days Gone Interactive Loot Map

Days Gone information, without digging through ten guides.

A free, fan-made interactive map for finding loot, crafting materials, weapons, throwables, plants, encounters, and other useful locations across the world of Days Gone.

No paywalls. No fake deadlines. Just a fan project getting better.

🗺️ Open the Interactive Map

Project News · About the Project · Discord · Bacon FM on YouTube · Speedrun.com


What is this?

The Days Gone Interactive Loot Map is an attempt to build one detailed, searchable source for useful information scattered throughout Days Gone's Oregon.

There are already maps, videos, spreadsheets, guides, Reddit posts, forum threads, and community discoveries covering parts of the game. The problem is that finding one specific item or piece of information can mean digging through several different resources.

This project tries to bring that information together in a form that is actually useful while playing.

Need a crafting material?

Want to know if an item respawns?

Looking for a weapon, throwable, plant, encounter, or useful pickup?

Search for it, filter the map, and see where it is.

The project is being built from my own Days Gone research, routing, testing, speedrunning, and contributions or discoveries from the wider community.

Current coverage

The map currently contains 4,000+ loot markers across all six major regions:

Cascades
Belknap
Lost Lake
Iron Butte
Crater Lake
Highway 97

The dataset is still being reviewed and expanded. A marker appearing on the map does not mean I consider every piece of information final or perfect.

For current progress and project updates, see:

Project News & Status

If you find something missing, incorrectly positioned, mislabeled, or behaving differently from the description, please report it.

What the map can show

Depending on the item or location, the map can contain information such as:

Crafting materials and supplies
Weapons
Throwables
Plants
One-time pickups
Respawning loot
Non-respawning loot
Inaccessible or version-specific items
Random encounters
Special locations
Location notes
Reference images
Item quantities
Spawn information

The public map includes searching, category filtering, spawn filtering, map clustering, adjustable cluster behavior, marker details, mobile controls, and shareable map views.

Why build another Days Gone map?

Because the goal isn't simply to put pins on a picture.

The long-term goal is to create a structured Days Gone information resource that can support more than one use case.

The same location data that helps a casual player find a crafting material can eventually help with route planning, challenge runs, speedrunning research, resource optimization, and other community tools.

Instead of rebuilding the same information separately for every new guide or tool, the project tries to maintain one useful underlying dataset and build different interfaces on top of it.

Related tools

The repository contains more than the public loot map.

Interactive Loot Map

The main public project.

Browse the world, search for items, filter categories, inspect locations, and share specific map views.

Status: Public and actively maintained.

Local Map Editor

A separate local editing interface used to maintain the underlying map data.

The editor supports adding and editing map records, location information, notes, media, saved overrides, and publishing data used by the public map.

It is intentionally not exposed as part of the public read-only site.

Hide & Deek

A separate Days Gone map-based side project included in the site.

Play Hide & Deek

Resource Planner

An experimental tool for using map data to reason about available resources and crafting requirements.

Status: Work in progress.

Speedrun Mode

Experimental routing tooling intended to connect map locations with speedrun routes and timing information.

The longer-term idea is to make map data useful for comparing routes and estimating travel costs rather than treating the map only as a collectible viewer.

Status: Work in progress.

Experimental pages should not be treated as finished public features.

How it works

The project deliberately uses a relatively simple web stack:

HTML · CSS · JavaScript · Native ES Modules · Node.js

There is no React frontend, map framework, database, or large client-side build system required for the main application.

The map system itself is custom-built for this project.

Among other things, the codebase contains systems for:

Map camera and coordinate conversion
Panning and zooming
Mouse, touch, and pinch input
Tiled map rendering
Viewport-based tile loading
Marker rendering
Marker culling
Spatial clustering
Matching-item stacks
Marker collision handling
Search and filtering
Regionalized map data
Location details and media
Shareable map state
Local editing
Browser autosave
Data publishing
Cloudflare deployment

The purpose isn't to avoid libraries at all costs. The current architecture simply doesn't need a large framework to do what the project does.

Data architecture

The public map does not need to load one enormous collection of every map record before it becomes useful.

Published Days Gone data is divided into regional datasets for:

Cascades
Belknap
Lost Lake
Iron Butte
Crater Lake
Highway 97

The public application loads the published data and presents it through the map renderer, filtering and clustering systems.

Map coordinates use their own game-map coordinate system rather than browser pixel positions so locations remain independent of screen resolution, zoom level, and device size.

The editor maintains the underlying records and creates the published data consumed by the public viewer.

Project structure
InteractiveMap/
│
├── assets/
│   └── games/days-gone/       # Published map data, tiles, icons and game assets
│
├── readonly/                  # Public interactive map
├── hide-deek/                 # Hide & Deek
├── news/                      # Project news and status
├── WIP/                       # Experimental tools
│
├── src/
│   ├── map/                   # Map engine, rendering, camera and marker systems
│   ├── public/                # Public map application
│   ├── data/                  # Game-specific data and rules
│   ├── planner/               # Resource planning systems
│   ├── ui/                    # Editing and interface components
│   └── wip/                   # Experimental application code
│
├── scripts/                   # Local server, publishing and data scripts
├── cloudflare-upload/         # Deployment bundle
│
├── AGENTS.md                  # Short instructions for coding agents
├── TERRA_GUIDE.md             # Detailed engineering/project guide
└── README.md

The repository is actively evolving, so this diagram is intended as an orientation rather than a permanent API contract.

Running the project locally

The public viewer itself is static, but the local editor uses a small Node server for its editing and publishing APIs.

From the repository root:

node scripts/local-map-server.mjs

Then open:

http://localhost:8173/readonly/

for the public map.

The local editor is available at:

http://localhost:8173/editor-local.html

The editor uses browser storage for parts of its working state. Different origins, hostnames, and ports have separate browser storage, so changing between localhost, 127.0.0.1, or different ports can make an existing autosave appear to be missing.

Export important editing work before clearing browser storage.

Editing and publishing

There are several different operations that can look like "saving" but do different things.

Editor autosave stores working changes in browser storage.

Save map exports a backup of the current map state.

Publish map uses the local server and project scripts to update published files and synchronize the deployment data.

Publishing should not be used as a substitute for testing.

For detailed instructions covering persistence, regional data, publishing, deployment, map behavior, and known technical limitations, read:

TERRA_GUIDE.md

For concise instructions intended for coding agents:

AGENTS.md
Contributing and corrections

This project benefits enormously from people who know Days Gone well.

If you find:

A missing item
A badly positioned marker
An incorrect quantity
Incorrect respawn information
A version-specific difference
A location that needs a better description
A bug in the website
A useful Days Gone discovery that should be documented

you can report it through GitHub Issues or the project's Discord.

When reporting map data, screenshots, videos, save/version information, or other evidence are extremely useful.

Code contributions are also welcome, but please check the existing architecture and documentation before replacing established systems or introducing new dependencies.

Why is it free?

Because this is a fan project.

Days Gone isn't my IP, and this project exists because I enjoy researching the game and wanted a resource that I wished already existed.

AI-assisted development tools are also used for parts of the project's infrastructure and implementation. They make it possible for one person to build and maintain more than would otherwise be practical.

Charging people for access to information about somebody else's game—especially while using tools that reduce some of the implementation cost—doesn't feel right for this project.

So the map has no paywall.

That does not mean development takes no work. Researching locations, testing game behavior, maintaining data, fixing bugs, taking reference material, and building new tools all require time.

Updates happen when time allows.

There are no fake deadlines and no obligation to turn a hobby into a second job.

If the project helps you, using it, sharing it, reporting errors, contributing information, joining the community, or subscribing to Bacon FM is more than enough.

About Bacon FM

I'm a Days Gone speedrunner who spends an unreasonable amount of time testing mechanics, documenting strange behavior, routing categories, and finding ways to make Oregon slightly more broken.

A large part of this project exists because speedrunning creates a need for unusually detailed information: exact item positions, quantities, respawns, route options, travel costs, encounter behavior, and version differences.

Rather than keeping that research inside spreadsheets and speedrun notes, this project turns as much of it as possible into something useful for everyone.

YouTube · Speedrun.com

Development status

This project is under active development.

The public map is usable, but the dataset is still being reviewed and several experimental tools are unfinished.

Expect things to change.

Breaking experimental features while improving them is preferable to pretending unfinished systems are production-ready.

For current public progress, check the project's News & Status page.

Disclaimer

This is an unofficial fan-made project.

Days Gone, its world, names, artwork, characters, game assets, and related intellectual property belong to their respective rights holders.

This project is not affiliated with, sponsored by, or endorsed by Bend Studio or Sony Interactive Entertainment.

The Interactive Loot Map is provided as a free community resource.

Thanks

Thanks to the Days Gone community, speedrunners, guide makers, researchers, modders, players, and everyone who has spent far too much time checking whether one random bottle respawns.

Every correction makes the map better.

See you on the Broken Road.
