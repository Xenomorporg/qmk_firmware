const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');

ctx.imageSmoothingEnabled = false;

const state = {
  keys: new Set(),
  mouse: { x: canvas.width / 2, y: canvas.height / 2, down: false },
  entities: [],
  projectiles: [],
  particles: [],
  walls: [],
  relics: [],
  room: 1,
  score: 0,
  hp: 100,
  maxHp: 100,
  dead: false,
  dashCooldown: 0,
  harpoonCooldown: 0,
  spawnCooldown: 0,
  fogPulse: 0,
  time: 0,
};

function rnd(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function createBody(x, y, r, type) {
  return {
    type,
    x,
    y,
    px: x,
    py: y,
    ax: 0,
    ay: 0,
    r,
    restitution: 0.5,
    drag: 0.992,
    hp: type === 'player' ? state.hp : 12,
    color: type === 'player' ? '#9de1ff' : '#f08060',
    aiTimer: rnd(0.2, 1),
    stunned: 0,
  };
}

const player = createBody(canvas.width / 2, canvas.height / 2, 4.5, 'player');
state.entities.push(player);

function generateRoom(depth) {
  state.walls = [];
  state.relics = [];

  const border = 10;
  state.walls.push({ x: 0, y: 0, w: canvas.width, h: border });
  state.walls.push({ x: 0, y: canvas.height - border, w: canvas.width, h: border });
  state.walls.push({ x: 0, y: border, w: border, h: canvas.height - border * 2 });
  state.walls.push({ x: canvas.width - border, y: border, w: border, h: canvas.height - border * 2 });

  const obstacleCount = 3 + Math.floor(depth * 0.6);
  for (let i = 0; i < obstacleCount; i++) {
    const w = rnd(18, 42);
    const h = rnd(14, 34);
    state.walls.push({ x: rnd(border + 8, canvas.width - border - w - 8), y: rnd(border + 8, canvas.height - border - h - 8), w, h });
  }

  const relicCount = 1 + Math.floor(depth / 3);
  for (let i = 0; i < relicCount; i++) {
    state.relics.push({ x: rnd(26, canvas.width - 26), y: rnd(26, canvas.height - 26), taken: false, pulse: rnd(0, Math.PI * 2) });
  }

  const enemies = 2 + depth;
  state.entities = [player];
  for (let i = 0; i < enemies; i++) {
    const e = createBody(rnd(24, canvas.width - 24), rnd(24, canvas.height - 24), rnd(4, 5.5), 'cultist');
    e.hp = 10 + depth * 2;
    e.drag = 0.989;
    e.restitution = 0.4;
    state.entities.push(e);
  }

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.px = player.x;
  player.py = player.y;
  player.ax = 0;
  player.ay = 0;
}

function addImpulse(body, ix, iy) {
  body.px -= ix;
  body.py -= iy;
}

function resolveCircleCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distSq = dx * dx + dy * dy;
  const minDist = a.r + b.r;
  if (distSq === 0 || distSq >= minDist * minDist) return;

  const dist = Math.sqrt(distSq);
  const nx = dx / dist;
  const ny = dy / dist;
  const penetration = minDist - dist;

  a.x -= nx * penetration * 0.5;
  a.y -= ny * penetration * 0.5;
  b.x += nx * penetration * 0.5;
  b.y += ny * penetration * 0.5;

  const avx = a.x - a.px;
  const avy = a.y - a.py;
  const bvx = b.x - b.px;
  const bvy = b.y - b.py;
  const rvx = bvx - avx;
  const rvy = bvy - avy;
  const sepVel = rvx * nx + rvy * ny;
  if (sepVel < 0) {
    const impulse = -(1 + Math.min(a.restitution, b.restitution)) * sepVel * 0.5;
    a.px += nx * impulse;
    a.py += ny * impulse;
    b.px -= nx * impulse;
    b.py -= ny * impulse;
  }
}

function resolveWall(body) {
  for (const wall of state.walls) {
    const nearestX = clamp(body.x, wall.x, wall.x + wall.w);
    const nearestY = clamp(body.y, wall.y, wall.y + wall.h);
    const dx = body.x - nearestX;
    const dy = body.y - nearestY;
    const distSq = dx * dx + dy * dy;
    if (distSq >= body.r * body.r) continue;

    const dist = Math.sqrt(distSq) || 0.0001;
    const nx = dx / dist;
    const ny = dy / dist;
    const penetration = body.r - dist;
    body.x += nx * penetration;
    body.y += ny * penetration;

    const vx = body.x - body.px;
    const vy = body.y - body.py;
    const vn = vx * nx + vy * ny;
    if (vn < 0) {
      const bounce = 1 + body.restitution;
      body.px = body.x - (vx - bounce * vn * nx);
      body.py = body.y - (vy - bounce * vn * ny);
    }
  }
}

function spawnFoam(x, y, color) {
  for (let i = 0; i < 4; i++) {
    state.particles.push({
      x,
      y,
      vx: rnd(-1.3, 1.3),
      vy: rnd(-1.3, 1.3),
      life: rnd(0.25, 0.6),
      maxLife: 0.6,
      color,
    });
  }
}

function update(dt) {
  state.time += dt;
  state.fogPulse += dt;

  if (state.dead) {
    if (state.keys.has('Enter')) {
      state.dead = false;
      state.room = 1;
      state.score = 0;
      state.hp = state.maxHp;
      player.hp = state.hp;
      generateRoom(state.room);
    }
    return;
  }

  const moveForce = 0.28;
  if (state.keys.has('w') || state.keys.has('ArrowUp')) player.ay -= moveForce;
  if (state.keys.has('s') || state.keys.has('ArrowDown')) player.ay += moveForce;
  if (state.keys.has('a') || state.keys.has('ArrowLeft')) player.ax -= moveForce;
  if (state.keys.has('d') || state.keys.has('ArrowRight')) player.ax += moveForce;

  state.dashCooldown -= dt;
  if (state.keys.has(' ') && state.dashCooldown <= 0) {
    const dx = state.mouse.x - player.x;
    const dy = state.mouse.y - player.y;
    const mag = Math.hypot(dx, dy) || 1;
    addImpulse(player, (dx / mag) * 5.4, (dy / mag) * 5.4);
    state.dashCooldown = 1.1;
    spawnFoam(player.x, player.y, '#b6ecff');
  }

  state.harpoonCooldown -= dt;
  if (state.mouse.down && state.harpoonCooldown <= 0) {
    const dx = state.mouse.x - player.x;
    const dy = state.mouse.y - player.y;
    const mag = Math.hypot(dx, dy) || 1;
    state.projectiles.push({
      x: player.x,
      y: player.y,
      px: player.x - (dx / mag) * 5.7,
      py: player.y - (dy / mag) * 5.7,
      r: 1.8,
      life: 1.5,
      damage: 6,
    });
    state.harpoonCooldown = 0.25;
  }

  for (const body of state.entities) {
    if (body.type === 'cultist') {
      body.aiTimer -= dt;
      if (body.aiTimer <= 0) {
        body.aiTimer = rnd(0.25, 0.8);
        const dx = player.x - body.x + rnd(-12, 12);
        const dy = player.y - body.y + rnd(-12, 12);
        const mag = Math.hypot(dx, dy) || 1;
        body.ax += (dx / mag) * 0.18;
        body.ay += (dy / mag) * 0.18;
      }
    }

    const vx = (body.x - body.px) * body.drag;
    const vy = (body.y - body.py) * body.drag;
    body.px = body.x;
    body.py = body.y;
    body.x += vx + body.ax;
    body.y += vy + body.ay;
    body.ax = 0;
    body.ay = 0;
    resolveWall(body);
  }

  for (let i = 0; i < state.entities.length; i++) {
    for (let j = i + 1; j < state.entities.length; j++) {
      resolveCircleCollision(state.entities[i], state.entities[j]);
    }
  }

  for (const proj of state.projectiles) {
    const vx = (proj.x - proj.px) * 0.995;
    const vy = (proj.y - proj.py) * 0.995;
    proj.px = proj.x;
    proj.py = proj.y;
    proj.x += vx;
    proj.y += vy;
    proj.life -= dt;

    for (const e of state.entities) {
      if (e.type !== 'cultist') continue;
      const dx = e.x - proj.x;
      const dy = e.y - proj.y;
      const d2 = dx * dx + dy * dy;
      const r = e.r + proj.r;
      if (d2 < r * r) {
        e.hp -= proj.damage;
        addImpulse(e, (proj.x - proj.px) * 0.6, (proj.y - proj.py) * 0.6);
        proj.life = 0;
        spawnFoam(e.x, e.y, '#ffa48b');
      }
    }
    resolveWall(proj);
  }

  state.projectiles = state.projectiles.filter((p) => p.life > 0);

  for (const e of state.entities) {
    if (e.type !== 'cultist') continue;
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < player.r + e.r + 0.7) {
      const impact = 10 * dt;
      state.hp -= impact;
      player.hp = state.hp;
      addImpulse(player, (dx / (d || 1)) * -0.4, (dy / (d || 1)) * -0.4);
      spawnFoam(player.x, player.y, '#8cc8ff');
    }
  }

  state.entities = state.entities.filter((e) => e.type === 'player' || e.hp > 0);

  for (const relic of state.relics) {
    relic.pulse += dt * 4;
    if (relic.taken) continue;
    const dx = player.x - relic.x;
    const dy = player.y - relic.y;
    if (dx * dx + dy * dy < 52) {
      relic.taken = true;
      state.score += 75;
      state.hp = clamp(state.hp + 8, 0, state.maxHp);
      player.hp = state.hp;
      for (let i = 0; i < 15; i++) spawnFoam(relic.x, relic.y, '#d2ff8f');
    }
  }

  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);

  const aliveEnemies = state.entities.filter((e) => e.type === 'cultist').length;
  if (aliveEnemies === 0) {
    state.room += 1;
    state.score += 100 + state.room * 20;
    generateRoom(state.room);
  }

  if (state.hp <= 0) {
    state.dead = true;
  }
}

function drawPixelCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  const fog = Math.floor((Math.sin(state.fogPulse * 0.6) * 0.5 + 0.5) * 18);
  ctx.fillStyle = `rgb(${8 + fog}, ${14 + fog}, ${20 + fog})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const wall of state.walls) {
    ctx.fillStyle = '#26384a';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = '#1a2835';
    ctx.fillRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
  }

  for (const relic of state.relics) {
    if (relic.taken) continue;
    const bob = Math.sin(relic.pulse) * 1.5;
    drawPixelCircle(relic.x, relic.y + bob, 2.5, '#d2ff8f');
    drawPixelCircle(relic.x, relic.y + bob, 1.1, '#f4ffd8');
  }

  for (const proj of state.projectiles) drawPixelCircle(proj.x, proj.y, proj.r, '#d5f2ff');

  for (const e of state.entities) {
    if (e.type === 'player') {
      drawPixelCircle(e.x, e.y, e.r + 0.5, '#0c2944');
      drawPixelCircle(e.x, e.y, e.r, '#9de1ff');
    } else {
      drawPixelCircle(e.x, e.y, e.r + 0.4, '#3b130f');
      drawPixelCircle(e.x, e.y, e.r, '#f08060');
      drawPixelCircle(e.x + 1.2, e.y - 1, 0.8, '#1f0000');
    }
  }

  for (const p of state.particles) {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }

  const hpW = Math.floor((state.hp / state.maxHp) * 90);
  ctx.fillStyle = '#001018';
  ctx.fillRect(7, 7, 96, 9);
  ctx.fillStyle = '#427ea0';
  ctx.fillRect(10, 10, hpW, 3);
  ctx.fillStyle = '#9de1ff';
  ctx.font = '6px monospace';
  ctx.fillText(`HP ${Math.max(0, Math.floor(state.hp))}`, 10, 17);
  ctx.fillText(`ROOM ${state.room}`, 126, 12);
  ctx.fillText(`SCORE ${state.score}`, 126, 19);

  if (state.dead) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffab8f';
    ctx.font = '11px monospace';
    ctx.fillText('THE TIDE CLAIMS YOU', 86, 84);
    ctx.font = '7px monospace';
    ctx.fillStyle = '#d5eaff';
    ctx.fillText('Press Enter to surface again', 89, 98);
  }

  statusText.textContent = state.dead
    ? `Final score: ${state.score}`
    : `Depth ${state.room} · Enemies ${state.entities.filter((e) => e.type === 'cultist').length} · Relics ${state.relics.filter((r) => !r.taken).length}`;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  state.keys.add(e.key);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', (e) => state.keys.delete(e.key));

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  state.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
});
canvas.addEventListener('mousedown', () => (state.mouse.down = true));
window.addEventListener('mouseup', () => (state.mouse.down = false));

generateRoom(state.room);
requestAnimationFrame(frame);
