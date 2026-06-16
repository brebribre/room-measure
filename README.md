# RoomPlan — 3D room layout editor

An interactive 3D editor for planning how to lay out a room before you move in.
Set your room's real dimensions, drop in furniture, drag pieces around, rotate
them, and check everything fits — all in the browser.

![3D view of a furnished room](docs/preview.png)

## Features

- **Room layouts** — not every room is a rectangle. Start from rectangle, L-shaped, T-shaped, or U-shaped; walls, floor, grid, and furniture containment all follow the actual polygon. Floor area is computed from the real shape, not the bounding box.
- **Editable walls** — a preset is only a starting point. In top-down view, grab a wall by its handle and slide it in or out to resize that side of the room; the wall stays straight and its two corners move together. Live length labels show every wall in meters, and the width/length sliders scale the whole room uniformly.
- **Doors & windows (German standards)** — doors follow DIN 18101 nominal sizes (610/735/860/985/1110 mm wide, 1985/2110 mm tall — interior default 860×1985). Windows default to a 0.90 m sill (Brüstungshöhe), the German fall-protection threshold, and pick from Small/Standard/Large presets. There's also a **window-door (Fenstertür)** — a full-height glazed balcony/patio door that doubles as a window, in single (900×2100) and French-double (1500×2100) sizes. Drop any of them in and drag along any wall; they stay mounted as you reshape the room.
- **Resizable windows & wall cabinets** — every window has width, height and sill-height sliders in the inspector, so you can resize it and slide it up or down the wall freely — the frame, clear glazing, sill and sun shaft all rebuild to match. Picking a preset from the size dropdown resets back to that preset's exact dimensions. Wall cabinets resize the same way (not stuck at 1200×720), and glazed window-doors (Fenstertür) get a height slider too.
- **3D, top-down & walk views** — orbit/zoom in 3D (dollhouse walls auto-cull so you always see inside), flip to a top-down floor plan to arrange precisely, or enter **Walk** mode to explore the room first-person like a game: click to capture the mouse for looking around, WASD / arrow keys to move, with wall *and* furniture collision so you can't walk through walls or furniture (flat items like rugs are walkable). Press Esc to release the mouse.
- **Real dimensions** — set width, length, and wall height in meters; live floor-area readout.
- **Furniture catalog** — bed, sofa, table, desk, chair, wardrobe, rug, plant, TV unit, shelf, suitcase, monitor — each modeled to real-world proportions.
- **Stacking** — drag a piece (e.g. a monitor onto a desk, or a suitcase onto a wardrobe) over another and it rests on top at the right height; drag it off and it drops back to the floor. Stacking heights are saved with the layout.
- **Surface finishes** — give the floor and walls a finish from the Room panel. Currently Plain or Light wood (procedural light-oak planks); saved with the layout.
- **Kitchen** — counter, sink, stove, and fridge, modeled with worktops, burners, basins, and handles, in a dedicated catalog section. All share a 0.6 m depth so they line up edge-to-edge in a run; the counter is a 1.2 × 0.6 m module, while the sink and stove are square 0.6 × 0.6 m units.
- **Stairs** — **Stairs (up)** is a full flight of steps with a railing, floor-to-ceiling like a piece of furniture (drag, rotate, resize, and it blocks walking through it). **Stairs (down)** is the matching opening in the floor above the flight below — flush with the floor like a rug, so you walk straight over it. Add one of each, on the floor below and above, to connect two floors.
- **Wall fixtures** — wall cabinet (Hängeschrank, mounted at 1.45 m) and a pull-down projector screen (mounted at 1.0 m). They mount on a wall and drag along it like doors and windows.
- **Lighting** — drop ceiling lights (pendant fixtures that actually emit light) and drag them across the ceiling; adjust brightness and warm/neutral/cool colour per light. Windows and glazed window-doors cast a directional **sun shaft** — a stretched beam of light raking across the floor with the window-pane shadow grid projected into it, as if the sun is shining through. Lighting is most striking in Walk mode.
- **Light on/off toggles** — every light source (ceiling lights, windows, and glazed window-doors) has a "Turn light/sunlight off" button in the inspector. Switching off removes its contribution to the scene (a ceiling light's shade and bulb dim too) without losing its brightness/colour or sill/size settings — toggle it back on to restore exactly as it was. Saved with the layout.
- **Bed sizes** — pick Single (900×2000), Queen (1600×2000), or King (1800×2000) from the bed's size dropdown; you can still fine-tune with the sliders afterwards.
- **Resizable furniture** — every piece has width, depth, and height sliders (in meters); resizing scales the model and updates its footprint so wall-containment still holds. One click resets to the default size.
- **Direct manipulation** — click to select, drag across the floor, rotate (15° steps or `R` for 90°), recolor, duplicate, delete.
- **Collision with walls** — pieces are clamped to stay inside the room as you drag or resize the room.
- **Multiple floors** — use the floor tabs below the top bar to add as many floors as you like (**+ Add floor**). Each floor has its own independent room shape/size, furniture, openings, lights, and interior walls; a new floor starts with the same footprint as the one you were on, empty and ready to furnish. Double-click a tab to rename it, or click its **×** to delete it. Switching tabs swaps which floor is live in the editor.
- **Save / load** — save multiple named layouts, all persisted in your browser via `localStorage`. A saved layout includes every floor. Pick a layout from the dropdown to load or overwrite it, or leave it on "New layout…" to save a copy under a new name.
- **Share via link** — **Share** encodes the current layout — all floors — into a link (copied to your clipboard) that recreates it for anyone who opens it — no account or server needed.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `R` | Rotate selected 90° |
| `Delete` / `Backspace` | Delete selected |
| `Cmd/Ctrl + D` | Duplicate selected |
| `Esc` | Deselect |
| `W A S D` / arrows | Move (Walk mode) |
| Mouse | Look around (Walk mode, after clicking) |

## Running it

No build step — it's a static site using Three.js from a CDN. Use the included
no-cache dev server so edits to the JS modules show up on a normal refresh:

```bash
python3 serve.py 8000
# then open http://localhost:8000
```

(Plain `python3 -m http.server` also works, but browsers cache ES modules
aggressively — after editing a `.js` file you'd need a hard refresh,
`Cmd/Ctrl + Shift + R`. `serve.py` sends no-cache headers to avoid that.)

## Project structure

```
index.html        # layout, panels, importmap for Three.js
styles.css        # dark editor theme
src/
  main.js         # Editor: scene, camera, controls, interaction, persistence
  icons.js        # Inline SVG line-icon set (no emoji, no deps) + hydrateIcons()
  room.js         # Room shell — editable polygon, floor, dollhouse walls, edge helpers, containment
  furniture.js    # Furniture catalog + procedural mesh builders
  openings.js     # Doors & windows — German DIN 18101 / Brüstungshöhe sizing + mesh builders
```

## Built with

[Three.js](https://threejs.org/) (WebGL) — `OrbitControls` for camera, raycasting
for selection and floor-plane dragging.
