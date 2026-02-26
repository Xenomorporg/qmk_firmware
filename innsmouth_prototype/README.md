# Innsmouth Undertow (Prototype)

A tiny browser demo of a **physics-only, pixel-art roguelite** with maritime horror flavor inspired by *The Shadow over Innsmouth*.

## Features
- Verlet-style integration for all moving actors (player, enemies, projectiles).
- Physics collisions with walls and entities (bounce, impulse, separation).
- Procedural combat rooms that scale by depth.
- Relic pickups, health pressure, score progression, and permadeath loop.
- Pixel-art rendering using a low-resolution canvas scaled up with nearest-neighbor styling.

## Run locally
From the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/innsmouth_prototype/`.

## Controls
- Move: `WASD` / arrow keys
- Dash toward cursor: `Space`
- Aim: mouse
- Throw harpoon: left click
- Restart after death: `Enter`
