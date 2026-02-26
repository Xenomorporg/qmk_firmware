#!/usr/bin/env python3
"""ASCII roguelite prototype inspired by The Shadow over Innsmouth.

Controls:
    w/a/s/d - move
    e       - wait/listen
    q       - quit
"""

from __future__ import annotations

import random
import textwrap
from dataclasses import dataclass

WIDTH = 34
HEIGHT = 16
MAX_TURNS = 80


@dataclass
class Entity:
    x: int
    y: int
    icon: str
    name: str


class InnsmouthDemo:
    def __init__(self, seed: int | None = None) -> None:
        self.rng = random.Random(seed)
        self.turn = 1
        self.sanity = 12
        self.clues = 0
        self.message = "Fog drapes over Innsmouth. Find 4 clues, then flee to the bus stop (B)."
        self.done = False
        self.won = False
        self.grid = self._build_map()
        self.player = Entity(2, HEIGHT - 2, "@", "Investigator")
        self.bus = Entity(WIDTH - 3, 1, "B", "Bus Stop")
        self.deep_ones = [
            Entity(WIDTH - 6, HEIGHT - 3, "D", "Deep One"),
            Entity(WIDTH // 2, HEIGHT // 2, "D", "Deep One"),
            Entity(WIDTH - 10, 4, "D", "Deep One"),
        ]
        self.clue_tiles = self._scatter_clues(7)

    def _build_map(self) -> list[list[str]]:
        grid = [["." for _ in range(WIDTH)] for _ in range(HEIGHT)]
        for x in range(WIDTH):
            grid[0][x] = "#"
            grid[HEIGHT - 1][x] = "#"
        for y in range(HEIGHT):
            grid[y][0] = "#"
            grid[y][WIDTH - 1] = "#"

        # Twisting lanes and abandoned blocks.
        for x in range(4, WIDTH - 3, 5):
            for y in range(2, HEIGHT - 2):
                if y not in (HEIGHT // 2, HEIGHT // 2 + 1):
                    grid[y][x] = "#"

        for _ in range(24):
            x = self.rng.randint(2, WIDTH - 3)
            y = self.rng.randint(2, HEIGHT - 3)
            if grid[y][x] == ".":
                grid[y][x] = "~"  # slick harbor water

        return grid

    def _scatter_clues(self, count: int) -> set[tuple[int, int]]:
        points: set[tuple[int, int]] = set()
        while len(points) < count:
            x = self.rng.randint(2, WIDTH - 3)
            y = self.rng.randint(2, HEIGHT - 3)
            if self.grid[y][x] == "." and (x, y) != (self.player.x, self.player.y):
                points.add((x, y))
        return points

    def _walkable(self, x: int, y: int) -> bool:
        return 0 <= x < WIDTH and 0 <= y < HEIGHT and self.grid[y][x] != "#"

    def _distance(self, ax: int, ay: int, bx: int, by: int) -> int:
        return abs(ax - bx) + abs(ay - by)

    def _move_player(self, dx: int, dy: int) -> None:
        nx, ny = self.player.x + dx, self.player.y + dy
        if not self._walkable(nx, ny):
            self.message = "A collapsed warehouse blocks your path."
            return

        self.player.x, self.player.y = nx, ny

        if (nx, ny) in self.clue_tiles:
            self.clues += 1
            self.clue_tiles.remove((nx, ny))
            self.message = "You recover a damp journal page. The marsh whispers your name."
        elif self.grid[ny][nx] == "~":
            self.sanity -= 1
            self.message = "Harbor water laps at your boots. A hymn echoes below the waves."
        else:
            self.message = "You slip through alleys lined with staring windows."

        if nx == self.bus.x and ny == self.bus.y:
            if self.clues >= 4:
                self.won = True
                self.done = True
                self.message = "You leap onto the bus as chanting swells behind you. You escaped!"
            else:
                self.message = "The bus driver refuses to leave without proof of the cult."

    def _move_deep_ones(self) -> None:
        for monster in self.deep_ones:
            best = (monster.x, monster.y)
            best_dist = self._distance(monster.x, monster.y, self.player.x, self.player.y)
            candidates = [
                (monster.x + 1, monster.y),
                (monster.x - 1, monster.y),
                (monster.x, monster.y + 1),
                (monster.x, monster.y - 1),
                (monster.x, monster.y),
            ]
            self.rng.shuffle(candidates)
            for nx, ny in candidates:
                if not self._walkable(nx, ny):
                    continue
                dist = self._distance(nx, ny, self.player.x, self.player.y)
                if dist < best_dist:
                    best = (nx, ny)
                    best_dist = dist
            monster.x, monster.y = best

            if self._distance(monster.x, monster.y, self.player.x, self.player.y) <= 1:
                self.sanity -= 2
                self.message = "Bulging eyes find you in the fog. Your mind reels."

    def _check_end_state(self) -> None:
        if self.sanity <= 0:
            self.done = True
            self.message = "The sea's call drowns your thoughts. Innsmouth claims another soul."
        elif self.turn > MAX_TURNS:
            self.done = True
            self.message = "Dawn reveals clawed tracks around you. The last bus is long gone."

    def render(self) -> str:
        canvas = [row[:] for row in self.grid]
        canvas[self.bus.y][self.bus.x] = self.bus.icon
        for x, y in self.clue_tiles:
            canvas[y][x] = "?"
        for monster in self.deep_ones:
            canvas[monster.y][monster.x] = monster.icon
        canvas[self.player.y][self.player.x] = self.player.icon

        lines = ["".join(row) for row in canvas]
        hud = f"Turn:{self.turn:02d}/{MAX_TURNS}  Sanity:{self.sanity:02d}  Clues:{self.clues}/4"
        legend = "# wall  . street  ~ harbor  ? clue  D deep one  B bus"
        return "\n".join(lines + [hud, legend, f"{self.message}"])

    def step(self, command: str) -> None:
        if self.done:
            return

        moves = {"w": (0, -1), "a": (-1, 0), "s": (0, 1), "d": (1, 0)}
        command = command.strip().lower()

        if command == "q":
            self.done = True
            self.message = "You abandon the investigation and vanish into the fog."
            return

        if command in moves:
            self._move_player(*moves[command])
        elif command == "e":
            self.message = "You hold your breath. Somewhere, church bells answer from underwater."
        else:
            self.message = "Uncertain step. Use w/a/s/d, e, or q."
            return

        self._move_deep_ones()
        self.turn += 1
        self._check_end_state()


def run() -> None:
    intro = textwrap.dedent(
        """
        === Innsmouth Night Watch (Prototype) ===
        Gather clues, keep your sanity, and reach the bus stop before the town closes in.
        Controls: w/a/s/d move | e wait | q quit
        """
    ).strip()
    print(intro)

    game = InnsmouthDemo()
    while not game.done:
        print("\n" + game.render())
        cmd = input("\nCommand> ")
        game.step(cmd)

    print("\n" + game.render())
    print("\n" + ("VICTORY" if game.won else "DEFEAT"))


if __name__ == "__main__":
    run()
