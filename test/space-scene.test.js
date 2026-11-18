import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WIDTH,
  HEIGHT,
  BOUND,
  MAX_DT,
  CAPS,
  PALETTE_KEYS,
  CHAR_KEYS,
  SPRITES,
  createRng,
  project,
  worldToScreen,
  resolveSprite,
  sphereShade,
  ringPixels,
  linePixels,
  galaxyPixels,
  starPosition,
  moonPosition,
  createScene,
  step,
} from '../public/js/space-scene.js';

const DT = 1 / 30;

// A scene where nothing fires or moves on its own, so shots can be hand-built.
function calmScene() {
  const scene = createScene(3);
  for (const fleet of scene.fleets) {
    for (const ship of fleet.ships) {
      ship.amp = { x: 0, y: 0 };
      ship.laserCd = 1e9;
      ship.missileCd = 1e9;
    }
  }
  const target = scene.fleets[1].ships[0];
  target.home = { x: 0, y: 0 };
  step(scene, 0);
  return { scene, target };
}

// --- Projection ---------------------------------------------------------

test('project: origin maps to the origin', () => {
  assert.deepEqual(project(0, 0, 0), { sx: 0, sy: 0 });
});

test('project: 2:1 tiles (one step in x moves tileW/2 across, tileH/2 down)', () => {
  assert.deepEqual(project(1, 0, 0, 16), { sx: 8, sy: 4 });
  assert.deepEqual(project(0, 1, 0, 16), { sx: -8, sy: 4 });
  assert.deepEqual(project(1, 1, 0, 16), { sx: 0, sy: 8 });
});

test('project: z lifts the point up the screen', () => {
  assert.equal(project(2, 3, 5).sy, project(2, 3, 0).sy - 5);
  assert.equal(project(2, 3, 5).sx, project(2, 3, 0).sx);
});

test('project: swapping x and y mirrors sx and keeps sy', () => {
  const a = project(7, 2, 1);
  const b = project(2, 7, 1);
  assert.equal(a.sx, -b.sx);
  assert.equal(a.sy, b.sy);
});

test('project: outputs are whole pixels', () => {
  for (const [x, y, z] of [[1.3, 2.7, 0.4], [-5.5, 3.1, 9.9], [0.1, 0.1, 0.1]]) {
    const { sx, sy } = project(x, y, z);
    assert.ok(Number.isInteger(sx));
    assert.ok(Number.isInteger(sy));
  }
});

test('worldToScreen: the world origin is the middle of the canvas', () => {
  assert.deepEqual(worldToScreen(0, 0, 0), { x: WIDTH / 2, y: HEIGHT / 2 });
});

// --- Seeded random numbers ----------------------------------------------

test('createRng: same seed gives the same sequence in [0, 1)', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 50; i += 1) {
    const v = a();
    assert.equal(v, b());
    assert.ok(v >= 0 && v < 1);
  }
});

test('createRng: different seeds give different sequences', () => {
  const a = createRng(1);
  const b = createRng(2);
  const seqA = Array.from({ length: 5 }, () => a());
  const seqB = Array.from({ length: 5 }, () => b());
  assert.notDeepEqual(seqA, seqB);
});

// --- Generation ---------------------------------------------------------

test('createScene: the same seed gives deep-equal scenes', () => {
  assert.deepEqual(createScene(11), createScene(11));
});

test('createScene: different seeds give different scenes', () => {
  assert.notDeepEqual(createScene(11), createScene(12));
});

test('createScene: stars have at least two depth layers', () => {
  const { stars } = createScene(5);
  assert.ok(stars.length >= 2);
  assert.equal(new Set(stars.map((l) => l.parallax)).size, stars.length);
  for (const layer of stars) {
    assert.ok(layer.stars.length > 0);
    assert.ok(PALETTE_KEYS.includes(layer.key));
  }
});

test('createScene: planets (one ringed) and moons meet the minimums', () => {
  const { planets, moons } = createScene(5);
  assert.ok(planets.length >= 2);
  assert.ok(planets.some((p) => p.ring));
  assert.ok(moons.length >= 2);
  for (const moon of moons) assert.ok(planets[moon.host]);
});

test('createScene: two fleets of at least 3 ships with unique ids', () => {
  const { fleets } = createScene(5);
  assert.equal(fleets.length, 2);
  const ids = new Set();
  for (const fleet of fleets) {
    assert.ok(fleet.ships.length >= 3);
    for (const ship of fleet.ships) {
      assert.equal(ship.fleet, fleet.id);
      assert.ok(ship.hp > 0);
      ids.add(ship.id);
    }
  }
  assert.equal(ids.size, fleets[0].ships.length + fleets[1].ships.length);
});

test('createScene: ships per fleet cannot drop below 3', () => {
  const { fleets } = createScene(5, { shipsPerFleet: 1 });
  for (const fleet of fleets) assert.equal(fleet.ships.length, 3);
});

test('createScene: starts with no shots, explosions or particles', () => {
  const scene = createScene(5);
  for (const list of ['lasers', 'missiles', 'explosions', 'smoke', 'debris']) {
    assert.deepEqual(scene[list], []);
  }
  assert.equal(scene.time, 0);
});

test('createScene: only palette colors are referenced', () => {
  const scene = createScene(5);
  const keys = [
    ...scene.stars.map((l) => l.key),
    scene.galaxy.coreKey,
    scene.galaxy.armKey,
    scene.galaxy.shade,
    ...scene.planets.flatMap((p) => [p.body, p.hi, p.shadow, p.ringKey]),
    ...scene.moons.flatMap((m) => [m.body, m.hi, m.shadow]),
  ];
  for (const key of keys) assert.ok(PALETTE_KEYS.includes(key), key);
});

// --- Sprites and pixel helpers ------------------------------------------

test('sprites: rows share a width and use known palette characters', () => {
  const maps = [
    SPRITES.shipA,
    SPRITES.shipB,
    SPRITES.missile,
    ...SPRITES.explosion,
  ];
  assert.ok(SPRITES.explosion.length >= 3);
  for (const rows of maps) {
    for (const row of rows) {
      assert.equal(row.length, rows[0].length);
      for (const ch of row) {
        assert.ok(ch === '.' || CHAR_KEYS[ch], `unknown sprite char ${ch}`);
      }
    }
  }
  for (const key of Object.values(CHAR_KEYS)) assert.ok(PALETTE_KEYS.includes(key));
});

test('resolveSprite: returns [dx, dy, key] pixels and can flip', () => {
  const pixels = resolveSprite(SPRITES.shipA);
  assert.ok(pixels.length > 10);
  for (const [dx, dy, key] of pixels) {
    assert.ok(Number.isInteger(dx) && Number.isInteger(dy));
    assert.ok(PALETTE_KEYS.includes(key));
  }
  assert.equal(resolveSprite(SPRITES.shipA, true).length, pixels.length);
});

test('fleet ships use their fleet colors', () => {
  const keysA = new Set(resolveSprite(SPRITES.shipA).map((p) => p[2]));
  const keysB = new Set(resolveSprite(SPRITES.shipB).map((p) => p[2]));
  assert.ok(keysA.has('violet') && keysA.has('blue'));
  assert.ok(keysB.has('orange') && keysB.has('pink'));
});

test('sphereShade: round, dithered and fully inside its radius', () => {
  const r = 8;
  const pixels = sphereShade(r);
  const tones = new Set(pixels.map((p) => p[2]));
  assert.deepEqual([...tones].sort(), ['base', 'hi', 'shadow']);
  for (const [dx, dy] of pixels) assert.ok(Math.abs(dx) <= r && Math.abs(dy) <= r);
  assert.ok(pixels.some(([dx, dy]) => dx === 0 && dy === 0));
});

test('ringPixels: a 2:1 ellipse split into behind and front halves', () => {
  const pixels = ringPixels(10);
  assert.ok(pixels.some((p) => p[2]));
  assert.ok(pixels.some((p) => !p[2]));
  const maxX = Math.max(...pixels.map((p) => Math.abs(p[0])));
  const maxY = Math.max(...pixels.map((p) => Math.abs(p[1])));
  assert.equal(maxX, maxY * 2);
});

test('linePixels: includes both ends', () => {
  const line = linePixels(0, 0, 5, 2);
  assert.deepEqual(line[0], [0, 0]);
  assert.deepEqual(line[line.length - 1], [5, 2]);
});

test('galaxyPixels: deterministic and palette-only', () => {
  const { galaxy } = createScene(5);
  const a = galaxyPixels(galaxy);
  assert.deepEqual(a, galaxyPixels(galaxy));
  assert.ok(a.length > 100);
  const keys = new Set(a.map((p) => p[2]));
  assert.deepEqual(
    [...keys].sort(),
    [galaxy.armKey, galaxy.coreKey, galaxy.shade].sort(),
  );
});

test('starPosition and moonPosition: stay on whole pixels, stars wrap', () => {
  const scene = createScene(5);
  for (const layer of scene.stars) {
    for (const star of layer.stars) {
      const p = starPosition(layer, star, 1234.5);
      assert.ok(Number.isInteger(p.x) && p.x >= 0 && p.x < WIDTH);
    }
  }
  const m = moonPosition(scene.moons[0], scene.planets, 10);
  assert.ok(Number.isInteger(m.x) && Number.isInteger(m.y));
  assert.equal(typeof m.front, 'boolean');
});

// --- Simulation ---------------------------------------------------------

test('step: dt is clamped and bad values are ignored', () => {
  const scene = createScene(5);
  step(scene, 5);
  assert.equal(scene.time, MAX_DT);
  step(scene, -1);
  step(scene, Number.NaN);
  assert.equal(scene.time, MAX_DT);
});

test('step: the same seed gives the same battle', () => {
  const a = createScene(9);
  const b = createScene(9);
  for (let i = 0; i < 300; i += 1) {
    step(a, DT);
    step(b, DT);
  }
  assert.deepEqual(a, b);
});

test('laser lifecycle: hit lowers hp, removes the beam, explosion then expires', () => {
  const { scene, target } = calmScene();
  scene.lasers.push({
    id: 900,
    fleet: 'A',
    x: -20,
    y: 0,
    z: target.z,
    vx: 80,
    vy: 0,
    vz: 0,
    age: 0,
    ttl: 2,
  });

  let hit = false;
  for (let i = 0; i < 60 && !hit; i += 1) {
    step(scene, DT);
    hit = target.hp < target.maxHp;
  }
  assert.ok(hit, 'the laser should hit the ship');
  assert.equal(target.hp, target.maxHp - 1);
  assert.equal(scene.lasers.length, 0);
  assert.ok(target.alive);
  assert.equal(scene.explosions.length, 1);
  const explosion = scene.explosions[0];
  assert.ok(explosion.age < explosion.life);
  assert.ok(scene.debris.length > 0);

  for (let i = 0; i < 120; i += 1) step(scene, DT);
  assert.equal(scene.explosions.length, 0);
  assert.equal(scene.debris.length, 0);
});

test('laser: friendly ships are not hit and a miss expires', () => {
  const { scene, target } = calmScene();
  // Fired by the target's own fleet along its position: no friendly fire.
  scene.lasers.push({
    id: 901,
    fleet: 'B',
    x: -20,
    y: 0,
    z: target.z,
    vx: 80,
    vy: 0,
    vz: 0,
    age: 0,
    ttl: 0.5,
  });
  for (let i = 0; i < 30; i += 1) step(scene, DT);
  assert.equal(target.hp, target.maxHp);
  assert.equal(scene.lasers.length, 0);
});

test('missile lifecycle: smoke trail, hit for 2 damage, explosion and smoke expire', () => {
  const { scene, target } = calmScene();
  scene.missiles.push({
    id: 902,
    fleet: 'A',
    targetId: target.id,
    x: -12,
    y: 0,
    z: target.z,
    vx: 18,
    vy: 0,
    vz: 0,
    age: 0,
    ttl: 5,
    smokeAcc: 0,
  });

  let sawSmoke = false;
  let hit = false;
  for (let i = 0; i < 200 && !hit; i += 1) {
    step(scene, DT);
    if (scene.smoke.length > 0) sawSmoke = true;
    hit = target.hp < target.maxHp;
  }
  assert.ok(sawSmoke, 'the missile should leave smoke');
  assert.ok(hit, 'the missile should hit the ship');
  assert.equal(target.hp, target.maxHp - 2);
  assert.equal(scene.missiles.length, 0);
  assert.ok(scene.explosions.length >= 1);
  for (const e of scene.explosions) assert.ok(e.age < e.life);

  for (let i = 0; i < 120; i += 1) step(scene, DT);
  assert.equal(scene.explosions.length, 0);
  assert.equal(scene.smoke.length, 0);
});

test('destroyed ships explode and come back after a delay', () => {
  const { scene, target } = calmScene();
  target.hp = 1;
  scene.lasers.push({
    id: 903,
    fleet: 'A',
    x: -20,
    y: 0,
    z: target.z,
    vx: 80,
    vy: 0,
    vz: 0,
    age: 0,
    ttl: 2,
  });
  for (let i = 0; i < 60 && target.alive; i += 1) step(scene, DT);
  assert.equal(target.alive, false);
  assert.equal(target.hp, 0);
  assert.ok(scene.explosions.some((e) => e.big));

  for (let i = 0; i < 300 && !target.alive; i += 1) step(scene, DT);
  assert.equal(target.alive, true);
  assert.equal(target.hp, target.maxHp);
});

test('long battle: fleets persist, nothing is NaN, lists stay bounded', () => {
  const scene = createScene(7);
  let sawLaser = false;
  let sawMissile = false;
  let sawExplosion = false;
  let sawSmoke = false;
  for (let i = 0; i < 2000; i += 1) {
    step(scene, DT);
    for (const fleet of scene.fleets) {
      assert.ok(fleet.ships.length >= 3);
      for (const ship of fleet.ships) {
        for (const v of [ship.x, ship.y, ship.z]) assert.ok(Number.isFinite(v));
        assert.ok(Math.abs(ship.x) <= BOUND && Math.abs(ship.y) <= BOUND);
        assert.ok(ship.hp >= 0 && ship.hp <= ship.maxHp);
      }
    }
    for (const list of ['lasers', 'missiles', 'explosions', 'smoke', 'debris']) {
      assert.ok(scene[list].length <= CAPS[list], list);
      for (const item of scene[list]) {
        for (const v of [item.x, item.y, item.z]) assert.ok(Number.isFinite(v));
      }
    }
    sawLaser ||= scene.lasers.length > 0;
    sawMissile ||= scene.missiles.length > 0;
    sawExplosion ||= scene.explosions.length > 0;
    sawSmoke ||= scene.smoke.length > 0;
  }
  assert.ok(sawLaser && sawMissile && sawExplosion && sawSmoke);
});

// --- Purity -------------------------------------------------------------

test('space-scene.js stays pure: no DOM access and no Math.random', () => {
  const source = readFileSync(new URL('../public/js/space-scene.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  for (const word of ['document', 'window', 'canvas', 'Math.random', 'requestAnimationFrame']) {
    assert.ok(!source.includes(word), `space-scene.js must not use ${word}`);
  }
});
