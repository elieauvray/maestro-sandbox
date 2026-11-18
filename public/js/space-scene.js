// Pure scene logic for the isometric 8-bit space battle background.
// No browser APIs and no global randomness: everything random comes from a
// seeded generator whose state lives inside the scene state, so a given seed
// always produces the same scene and the same battle.
//
// State handling: step(state, dt) MUTATES the state it receives and returns the
// same object, which keeps the per-frame loop free of allocations.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WIDTH = 320; // logical canvas size, in canvas pixels
export const HEIGHT = 180;

export const TILE_W = 4; // isometric tile, 2:1 (tileH = tileW / 2)
export const TILE_H = TILE_W / 2;

// Screen position of world (0, 0, 0).
export const ORIGIN = { x: WIDTH / 2, y: HEIGHT / 2 };

// Ships stay inside [-BOUND, BOUND] on both world axes.
export const BOUND = 38;

export const MAX_DT = 0.1;
export const MIN_SHIPS_PER_FLEET = 3;

// Palette key names. background.js reads the CSS custom property
// `--art-<key>` for each one (docs/STYLE.md section 6).
export const PALETTE_KEYS = [
  'space',
  'space-2',
  'dim',
  'mid',
  'light',
  'violet',
  'violet-light',
  'blue',
  'pink',
  'orange',
  'lime',
];

const LASER_SPEED = 80;
const LASER_TTL = 1.6;
const LASER_HIT_RADIUS = 3;
const LASER_DAMAGE = 1;

const MISSILE_MAX_SPEED = 38;
const MISSILE_LAUNCH_SPEED = 18;
const MISSILE_TURN = 3;
const MISSILE_TTL = 5;
const MISSILE_HIT_RADIUS = 3;
const MISSILE_DAMAGE = 2;
const SMOKE_INTERVAL = 0.04;
const SMOKE_LIFE = 0.6;

const SHIP_MAX_HP = 3;
const RESPAWN_MIN = 3;
const RESPAWN_SPREAD = 3;

const EXPLOSION_LIFE = 0.5;
const BIG_EXPLOSION_LIFE = 0.9;
const GRAVITY = 30;

// Caps keep every list bounded however long the battle runs.
export const CAPS = {
  lasers: 24,
  missiles: 8,
  explosions: 24,
  smoke: 160,
  debris: 120,
};

// ---------------------------------------------------------------------------
// Seeded random numbers (mulberry32)
// ---------------------------------------------------------------------------

function advance(s) {
  return (s + 0x6d2b79f5) >>> 0;
}

function mix(s) {
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Returns a function that yields floats in [0, 1); same seed, same sequence. */
export function createRng(seed) {
  let s = Number(seed) >>> 0;
  return () => {
    s = advance(s);
    return mix(s);
  };
}

/** Draws the next float from the generator stored in a scene state. */
function rand(state) {
  state.rngState = advance(state.rngState);
  return mix(state.rngState);
}

function randRange(state, min, max) {
  return min + rand(state) * (max - min);
}

// ---------------------------------------------------------------------------
// Isometric projection (docs/STYLE.md section 6)
// ---------------------------------------------------------------------------

/** Projects world (x, y, z) to whole-pixel screen offsets. */
export function project(x, y, z = 0, tileW = TILE_W, tileH = tileW / 2) {
  return {
    sx: Math.round(((x - y) * tileW) / 2),
    sy: Math.round(((x + y) * tileH) / 2 - z),
  };
}

/** Projects world coordinates to absolute logical canvas pixels. */
export function worldToScreen(x, y, z = 0) {
  const { sx, sy } = project(x, y, z);
  return { x: ORIGIN.x + sx, y: ORIGIN.y + sy };
}

// ---------------------------------------------------------------------------
// Sprites: pixel maps whose characters are palette keys
// ---------------------------------------------------------------------------

export const CHAR_KEYS = {
  k: 'space',
  s: 'space-2',
  d: 'dim',
  m: 'mid',
  l: 'light',
  v: 'violet',
  V: 'violet-light',
  b: 'blue',
  p: 'pink',
  o: 'orange',
  y: 'lime',
};

function mirrorRows(rows) {
  return rows.map((row) => row.split('').reverse().join(''));
}

function recolorRows(rows, map) {
  return rows.map((row) =>
    row
      .split('')
      .map((ch) => map[ch] || ch)
      .join(''),
  );
}

// Fleet A flies to the right: mid hull, violet wings, blue engines, lime cockpit.
const SHIP_A = [
  '...vv......',
  '..vmmv.....',
  'bbvmmmmyl..',
  'bvmmmmmmmml',
  'bbvmmmmdd..',
  '..vdmv.....',
  '...dd......',
];

// Fleet B flies to the left: orange hull, pink wings and engines.
const SHIP_B = mirrorRows(recolorRows(SHIP_A, { m: 'o', v: 'p', b: 'p' }));

const MISSILE = ['..ll.', 'ollll', '..ll.'];

// Five explosion frames: flash, burst, bloom, debris, fade.
const EXPLOSION = [
  ['.y.', 'yly', '.y.'],
  ['..y..', '.yly.', 'yllly', '.yly.', '..y..'],
  ['..o.o..', '.oyyyo.', 'oyllloy', 'yllllly', 'oyllloy', '.oyyyo.', '..o.o..'],
  [
    'o...o...o',
    '.o..y..o.',
    '..o.d.o..',
    '...d.d...',
    'y.d...d.y',
    '...d.d...',
    '..o.d.o..',
    '.o..y..o.',
    'o...o...o',
  ],
  [
    'd.......d',
    '....d....',
    '..d...d..',
    '.........',
    'd.......d',
    '.........',
    '..d...d..',
    '....d....',
    'd.......d',
  ],
];

export const SPRITES = {
  shipA: SHIP_A,
  shipB: SHIP_B,
  missile: MISSILE,
  explosion: EXPLOSION,
};

/**
 * Resolves a pixel map to [dx, dy, paletteKey] triples, centred on the sprite
 * middle. Transparent pixels ('.') are skipped.
 */
export function resolveSprite(rows, flip = false) {
  const source = flip ? mirrorRows(rows) : rows;
  const cx = Math.floor(source[0].length / 2);
  const cy = Math.floor(source.length / 2);
  const pixels = [];
  source.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const key = CHAR_KEYS[row[x]];
      if (key) pixels.push([x - cx, y - cy, key]);
    }
  });
  return pixels;
}

// ---------------------------------------------------------------------------
// Pixel helpers for planets, rings, galaxy, lines
// ---------------------------------------------------------------------------

/**
 * Pixels of an isometric sphere of radius r with checkerboard dithering.
 * Returns [dx, dy, tone] with tone 'hi' | 'base' | 'shadow'. Light comes from
 * the upper left.
 */
export function sphereShade(r) {
  const pixels = [];
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      const d2 = dx * dx + dy * dy;
      if (d2 > r * r + r * 0.5) continue;
      const nx = dx / r;
      const ny = dy / r;
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const light = -0.5 * nx - 0.6 * ny + 0.62 * nz;
      const checker = (dx + dy) & 1;
      let tone;
      if (light > 0.78) tone = 'hi';
      else if (light > 0.5) tone = checker ? 'hi' : 'base';
      else if (light > 0.3) tone = 'base';
      else if (light > 0.12) tone = checker ? 'base' : 'shadow';
      else tone = 'shadow';
      pixels.push([dx, dy, tone]);
    }
  }
  return pixels;
}

/**
 * Pixels of a flat ring around a planet of radius r, as an ellipse with a 2:1
 * ratio. Returns [dx, dy, behind]; behind is true for the upper half, which is
 * drawn before the planet so the sphere hides it.
 */
export function ringPixels(r) {
  const ry = Math.round(r * 0.85);
  const rx = ry * 2;
  const pixels = [];
  for (let dy = -ry; dy <= ry; dy += 1) {
    for (let dx = -rx; dx <= rx; dx += 1) {
      const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (d <= 1 && d >= 0.55) pixels.push([dx, dy, dy < 0]);
    }
  }
  return pixels;
}

/** Bresenham line between two integer points, as [x, y] pairs. */
export function linePixels(x0, y0, x1, y1) {
  const pixels = [];
  let x = Math.round(x0);
  let y = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - x);
  const dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 1000; guard += 1) {
    pixels.push([x, y]);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return pixels;
}

/**
 * Pixels of the spiral galaxy as [x, y, paletteKey]: a dithered dark halo,
 * violet arms with a little dust, and a bright core. Deterministic from the
 * galaxy parameters.
 */
export function galaxyPixels(galaxy) {
  const { cx, cy, radius, arms, twist } = galaxy;
  const map = new Map();
  const put = (x, y, key) => map.set(`${x},${y}`, [x, y, key]);
  const rng = createRng(galaxy.seed);

  const hx = radius;
  const hy = Math.round(radius / 2);
  for (let dy = -hy; dy <= hy; dy += 1) {
    for (let dx = -hx; dx <= hx; dx += 1) {
      const d = (dx * dx) / (hx * hx) + (dy * dy) / (hy * hy);
      if (d <= 1 && ((dx + dy) & 1) === 0) put(cx + dx, cy + dy, galaxy.shade);
    }
  }

  const steps = 180;
  for (let arm = 0; arm < arms; arm += 1) {
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const angle = (arm * 2 * Math.PI) / arms + t * twist;
      const r = t * radius;
      const x = cx + Math.round(Math.cos(angle) * r);
      const y = cy + Math.round((Math.sin(angle) * r) / 2);
      put(x, y, galaxy.armKey);
      if (i % 2 === 0) put(x + 1, y, galaxy.armKey);
      if (rng() < 0.2) {
        put(x + Math.round(rng() * 6 - 3), y + Math.round(rng() * 4 - 2), galaxy.armKey);
      }
    }
  }

  const core = Math.round(radius * 0.16);
  const coreY = Math.max(1, Math.round(core / 2));
  for (let dy = -coreY; dy <= coreY; dy += 1) {
    for (let dx = -core; dx <= core; dx += 1) {
      const d = (dx * dx) / (core * core) + (dy * dy) / (coreY * coreY);
      if (d <= 0.5) put(cx + dx, cy + dy, galaxy.coreKey);
      else if (d <= 1 && ((dx + dy) & 1) === 0) put(cx + dx, cy + dy, galaxy.armKey);
    }
  }

  return [...map.values()];
}

/** Screen position of a star after parallax drift (wraps horizontally). */
export function starPosition(layer, star, time) {
  const shift = Math.floor(time * layer.speed);
  const x = (((star.x - shift) % WIDTH) + WIDTH) % WIDTH;
  return { x, y: star.y };
}

/**
 * Screen position of a moon orbiting its host planet. `front` is true when the
 * moon is on the near half of its orbit and must be drawn after the planet.
 */
export function moonPosition(moon, planets, time) {
  const host = planets[moon.host];
  const angle = moon.angle + time * moon.speed;
  return {
    x: Math.round(host.x + Math.cos(angle) * moon.dist),
    y: Math.round(host.y + (Math.sin(angle) * moon.dist) / 2),
    front: Math.sin(angle) > 0,
  };
}

// ---------------------------------------------------------------------------
// Scene generation
// ---------------------------------------------------------------------------

function makeShip(rng, fleet, index, home, id) {
  const ox = (index - 1.5) * 5 + (rng() - 0.5) * 2;
  const oy = ((index % 2) * 2 - 1) * 4 + (rng() - 0.5) * 2;
  return {
    id,
    fleet,
    home: { x: home.x + ox, y: home.y + oy },
    amp: { x: 5 + rng() * 5, y: 5 + rng() * 5 },
    freq: { x: 0.5 + rng() * 0.4, y: 0.4 + rng() * 0.4 },
    phase: rng() * Math.PI * 2,
    baseZ: 6 + rng() * 6,
    x: home.x + ox,
    y: home.y + oy,
    z: 8,
    vx: 0,
    vy: 0,
    hp: SHIP_MAX_HP,
    maxHp: SHIP_MAX_HP,
    alive: true,
    respawnIn: 0,
    laserCd: 0.4 + rng() * 1.2,
    missileCd: 2 + rng() * 3,
  };
}

/**
 * Builds a deterministic scene from a seed. opts.shipsPerFleet defaults to 4
 * and is never lower than MIN_SHIPS_PER_FLEET.
 */
export function createScene(seed = 1, opts = {}) {
  const rng = createRng(seed);
  const int = (min, max) => Math.round(min + rng() * (max - min));
  const perFleet = Math.max(MIN_SHIPS_PER_FLEET, Math.floor(opts.shipsPerFleet || 4));

  const stars = [
    {
      key: 'dim',
      parallax: 0.3,
      speed: 3,
      stars: Array.from({ length: 80 }, () => ({ x: int(0, WIDTH - 1), y: int(0, HEIGHT - 1) })),
    },
    {
      key: 'light',
      parallax: 0.6,
      speed: 6,
      stars: Array.from({ length: 28 }, () => ({ x: int(0, WIDTH - 1), y: int(0, HEIGHT - 1) })),
    },
  ];

  const galaxy = {
    cx: 205 + int(-6, 6),
    cy: 54 + int(-4, 4),
    radius: 64,
    arms: 2,
    twist: 3.2,
    seed: int(1, 1000000),
    coreKey: 'violet-light',
    armKey: 'violet',
    shade: 'space-2',
  };

  const planets = [
    {
      x: 46 + int(-6, 6),
      y: 50 + int(-6, 6),
      r: 20,
      body: 'violet',
      hi: 'violet-light',
      shadow: 'space-2',
      ring: false,
      ringKey: 'pink',
    },
    {
      x: 262 + int(-6, 6),
      y: 126 + int(-6, 6),
      r: 22,
      body: 'blue',
      hi: 'light',
      shadow: 'space-2',
      ring: true,
      ringKey: 'pink',
    },
  ];

  const moons = [
    { host: 0, r: 5, dist: 36, angle: rng() * Math.PI * 2, speed: 0.12, body: 'mid', hi: 'light', shadow: 'dim' },
    { host: 1, r: 4, dist: 46, angle: rng() * Math.PI * 2, speed: -0.09, body: 'mid', hi: 'light', shadow: 'dim' },
  ];

  const homes = { A: { x: -20, y: 20 }, B: { x: 20, y: -20 } };
  const fleets = ['A', 'B'].map((fleetId) => ({
    id: fleetId,
    ships: Array.from({ length: perFleet }, (_, i) =>
      makeShip(rng, fleetId, i, homes[fleetId], `${fleetId}${i + 1}`),
    ),
  }));

  const state = {
    seed: Number(seed) >>> 0,
    rngState: Math.floor(rng() * 4294967296) >>> 0,
    time: 0,
    nextId: 1,
    stars,
    galaxy,
    planets,
    moons,
    fleets,
    lasers: [],
    missiles: [],
    explosions: [],
    smoke: [],
    debris: [],
  };
  updateShipMotion(state.fleets.flatMap((f) => f.ships), 0);
  return state;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function allShips(state) {
  return state.fleets.flatMap((f) => f.ships);
}

function findShip(state, id) {
  return allShips(state).find((s) => s.id === id);
}

function aliveEnemies(state, fleetId) {
  return allShips(state).filter((s) => s.alive && s.fleet !== fleetId);
}

function pushCapped(list, item, cap) {
  list.push(item);
  if (list.length > cap) list.shift();
}

// Ships follow a smooth patrol around their home; velocity is the analytic
// derivative so shots can lead their targets.
function updateShipMotion(ships, time) {
  for (const s of ships) {
    const ax = s.freq.x * time + s.phase;
    const ay = s.freq.y * time + s.phase * 0.7;
    s.x = clamp(s.home.x + s.amp.x * Math.sin(ax), -BOUND, BOUND);
    s.y = clamp(s.home.y + s.amp.y * Math.cos(ay), -BOUND, BOUND);
    s.z = s.baseZ + 2 * Math.sin(ax * 1.3);
    s.vx = s.amp.x * s.freq.x * Math.cos(ax);
    s.vy = -s.amp.y * s.freq.y * Math.sin(ay);
  }
}

function spawnExplosion(state, x, y, z, big) {
  pushCapped(
    state.explosions,
    {
      id: state.nextId++,
      x,
      y,
      z,
      age: 0,
      life: big ? BIG_EXPLOSION_LIFE : EXPLOSION_LIFE,
      big,
    },
    CAPS.explosions,
  );
  const count = big ? 10 : 5;
  for (let i = 0; i < count; i += 1) {
    const angle = rand(state) * Math.PI * 2;
    const speed = randRange(state, 8, big ? 26 : 18);
    pushCapped(
      state.debris,
      {
        x,
        y,
        z,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: randRange(state, 6, 22),
        age: 0,
        life: randRange(state, 0.5, 1),
        key: rand(state) < 0.5 ? 'orange' : 'lime',
      },
      CAPS.debris,
    );
  }
}

function damageShip(state, ship, amount) {
  ship.hp -= amount;
  if (ship.hp <= 0) {
    ship.hp = 0;
    ship.alive = false;
    ship.respawnIn = RESPAWN_MIN + rand(state) * RESPAWN_SPREAD;
    spawnExplosion(state, ship.x, ship.y, ship.z, true);
  }
}

function fireLaser(state, ship, target) {
  const dist = Math.hypot(target.x - ship.x, target.y - ship.y, target.z - ship.z);
  const lead = dist / LASER_SPEED;
  const aimX = target.x + target.vx * lead + randRange(state, -2.5, 2.5);
  const aimY = target.y + target.vy * lead + randRange(state, -2.5, 2.5);
  const aimZ = target.z + randRange(state, -1.5, 1.5);
  const dx = aimX - ship.x;
  const dy = aimY - ship.y;
  const dz = aimZ - ship.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  pushCapped(
    state.lasers,
    {
      id: state.nextId++,
      fleet: ship.fleet,
      x: ship.x,
      y: ship.y,
      z: ship.z,
      vx: (dx / len) * LASER_SPEED,
      vy: (dy / len) * LASER_SPEED,
      vz: (dz / len) * LASER_SPEED,
      age: 0,
      ttl: LASER_TTL,
    },
    CAPS.lasers,
  );
}

function fireMissile(state, ship, target) {
  const dx = target.x - ship.x + randRange(state, -12, 12);
  const dy = target.y - ship.y + randRange(state, -12, 12);
  const dz = target.z - ship.z + randRange(state, 4, 14);
  const len = Math.hypot(dx, dy, dz) || 1;
  pushCapped(
    state.missiles,
    {
      id: state.nextId++,
      fleet: ship.fleet,
      targetId: target.id,
      x: ship.x,
      y: ship.y,
      z: ship.z,
      vx: (dx / len) * MISSILE_LAUNCH_SPEED,
      vy: (dy / len) * MISSILE_LAUNCH_SPEED,
      vz: (dz / len) * MISSILE_LAUNCH_SPEED,
      age: 0,
      ttl: MISSILE_TTL,
      smokeAcc: 0,
    },
    CAPS.missiles,
  );
}

function updateShips(state, dt) {
  const ships = allShips(state);
  updateShipMotion(ships, state.time);
  for (const ship of ships) {
    if (!ship.alive) {
      ship.respawnIn -= dt;
      if (ship.respawnIn <= 0) {
        ship.alive = true;
        ship.hp = ship.maxHp;
        ship.laserCd = randRange(state, 0.5, 1.5);
        ship.missileCd = randRange(state, 2, 5);
      }
      continue;
    }
    ship.laserCd -= dt;
    ship.missileCd -= dt;
    if (ship.laserCd <= 0 || ship.missileCd <= 0) {
      const enemies = aliveEnemies(state, ship.fleet);
      if (enemies.length === 0) continue;
      const target = enemies[Math.floor(rand(state) * enemies.length)];
      if (ship.laserCd <= 0) {
        fireLaser(state, ship, target);
        ship.laserCd = randRange(state, 0.5, 1.6);
      }
      if (ship.missileCd <= 0) {
        fireMissile(state, ship, target);
        ship.missileCd = randRange(state, 3, 6);
      }
    }
  }
}

// Distance from point q to the segment p0 -> p1.
function segmentDistance(p0, p1, q) {
  const sx = p1.x - p0.x;
  const sy = p1.y - p0.y;
  const sz = p1.z - p0.z;
  const len2 = sx * sx + sy * sy + sz * sz;
  let t = 0;
  if (len2 > 0) {
    t = clamp(((q.x - p0.x) * sx + (q.y - p0.y) * sy + (q.z - p0.z) * sz) / len2, 0, 1);
  }
  return Math.hypot(p0.x + sx * t - q.x, p0.y + sy * t - q.y, p0.z + sz * t - q.z);
}

// Returns the closest living enemy ship within radius of the swept segment.
function findHit(state, shot, prev, radius) {
  let best = null;
  let bestDist = radius;
  for (const ship of allShips(state)) {
    if (!ship.alive || ship.fleet === shot.fleet) continue;
    const d = segmentDistance(prev, shot, ship);
    if (d <= bestDist) {
      best = ship;
      bestDist = d;
    }
  }
  return best;
}

function updateLasers(state, dt) {
  const kept = [];
  for (const laser of state.lasers) {
    const prev = { x: laser.x, y: laser.y, z: laser.z };
    laser.x += laser.vx * dt;
    laser.y += laser.vy * dt;
    laser.z += laser.vz * dt;
    laser.age += dt;
    const ship = findHit(state, laser, prev, LASER_HIT_RADIUS);
    if (ship) {
      damageShip(state, ship, LASER_DAMAGE);
      spawnExplosion(state, laser.x, laser.y, laser.z, false);
      continue; // the beam is consumed by the hit
    }
    const outside = Math.abs(laser.x) > BOUND * 2 || Math.abs(laser.y) > BOUND * 2;
    if (laser.age < laser.ttl && !outside) kept.push(laser);
  }
  state.lasers = kept;
}

function updateMissiles(state, dt) {
  const kept = [];
  for (const m of state.missiles) {
    let target = findShip(state, m.targetId);
    if (!target || !target.alive) {
      const enemies = aliveEnemies(state, m.fleet);
      target = enemies.length ? enemies[Math.floor(rand(state) * enemies.length)] : null;
      m.targetId = target ? target.id : null;
    }
    if (target) {
      const dx = target.x - m.x;
      const dy = target.y - m.y;
      const dz = target.z - m.z;
      const len = Math.hypot(dx, dy, dz) || 1;
      const k = Math.min(1, MISSILE_TURN * dt);
      const speed = Math.min(MISSILE_MAX_SPEED, Math.hypot(m.vx, m.vy, m.vz) + 24 * dt);
      m.vx += ((dx / len) * speed - m.vx) * k;
      m.vy += ((dy / len) * speed - m.vy) * k;
      m.vz += ((dz / len) * speed - m.vz) * k;
    }
    const prev = { x: m.x, y: m.y, z: m.z };
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.z += m.vz * dt;
    m.age += dt;

    m.smokeAcc += dt;
    while (m.smokeAcc >= SMOKE_INTERVAL) {
      m.smokeAcc -= SMOKE_INTERVAL;
      pushCapped(
        state.smoke,
        { x: m.x, y: m.y, z: m.z, age: 0, life: SMOKE_LIFE },
        CAPS.smoke,
      );
    }

    const ship = findHit(state, m, prev, MISSILE_HIT_RADIUS);
    if (ship) {
      damageShip(state, ship, MISSILE_DAMAGE);
      spawnExplosion(state, m.x, m.y, m.z, true);
      continue;
    }
    const outside = Math.abs(m.x) > BOUND * 2 || Math.abs(m.y) > BOUND * 2;
    if (m.age < m.ttl && !outside) kept.push(m);
  }
  state.missiles = kept;
}

function updateEffects(state, dt) {
  for (const e of state.explosions) e.age += dt;
  state.explosions = state.explosions.filter((e) => e.age < e.life);

  for (const s of state.smoke) {
    s.age += dt;
    s.z += 3 * dt;
  }
  state.smoke = state.smoke.filter((s) => s.age < s.life);

  for (const d of state.debris) {
    d.age += dt;
    d.vz -= GRAVITY * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.z += d.vz * dt;
  }
  state.debris = state.debris.filter((d) => d.age < d.life);
}

/**
 * Advances the battle by dt seconds (clamped to [0, MAX_DT]). Mutates and
 * returns the given state.
 */
export function step(state, dt) {
  const d = Number.isFinite(dt) ? clamp(dt, 0, MAX_DT) : 0;
  state.time += d;
  updateShips(state, d);
  updateLasers(state, d);
  updateMissiles(state, d);
  updateEffects(state, d);
  return state;
}
