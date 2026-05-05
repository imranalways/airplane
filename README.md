# SkyRider ✈️

A first-person cockpit flight game built with pure HTML5 Canvas and vanilla JavaScript. No dependencies, no build tools — just open and fly.

## How to Play

| Control | Action |
|---------|--------|
| `↑` / `W` | Pitch up — gain altitude |
| `↓` / `S` | Pitch down — lose altitude |
| `←` / `A` | Bank left — steer left |
| `→` / `D` | Bank right — steer right |
| `Space` | Afterburner boost (burns fuel faster) |
| `P` | Pause / Resume |
| `M` | Mute / Unmute |

## Gameplay

- **Collect coins** floating in the air to score points
- **Grab fuel canisters** (green cross) to refill your tank
- **Dodge obstacles** — birds, hot air balloons, and enemy aircraft
- Build a **coin streak** to multiply your score (up to 4x)
- **Fuel runs out = game over**, so keep collecting canisters
- Speed increases over time — stay sharp!

## Biomes

The world cycles through three zones every ~90 seconds:
- 🌆 **City** — Skyscrapers, towers, night sky with stars
- 🌾 **Countryside** — Rolling hills, barns, windmills, blue sky
- 🌲 **Rural / Forest** — Dense trees, mountains, rivers, dark canopy

## Run Locally

No setup needed:

```bash
git clone https://github.com/YOUR_USERNAME/airplane-game.git
cd airplane-game
# Open index.html in your browser
open index.html   # macOS
start index.html  # Windows
xdg-open index.html  # Linux
```

> **Note**: If you see a module error, serve with a local server:
> ```bash
> npx serve .
> # or
> python3 -m http.server 8080
> ```

## Deploy to GitHub Pages

1. Push this repo to GitHub
2. Go to your repo → **Settings** → **Pages**
3. Under **Source**, select `main` branch and `/ (root)` folder
4. Click **Save**
5. Your game will be live at `https://YOUR_USERNAME.github.io/airplane-game/`

## Project Structure

```
airplane-game/
├── index.html          # Entry point
├── css/
│   └── style.css       # UI and overlay styles
├── js/
│   ├── main.js         # Game loop, state management
│   ├── renderer.js     # Canvas drawing engine
│   ├── terrain.js      # Biome system, perspective terrain
│   ├── entities.js     # Coins, fuel, obstacles, particles
│   ├── hud.js          # Instrument panel, gauges, warnings
│   └── controls.js     # Keyboard input handler
└── README.md
```

All graphics are procedurally drawn using the Canvas 2D API — no image files required.

## License

MIT — free to use, modify, and distribute.
