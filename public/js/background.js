// Canvas drawing and animation loop for the space battle background.
// All scene logic lives in space-scene.js; this file only draws it. Colors are
// read from the --art-* custom properties in styles.css (docs/STYLE.md
// section 6), so the palette has a single source. Every sprite is generated in
// code and every coordinate is a whole pixel: no images, gradients or blur.

import {
  WIDTH,
  HEIGHT,
  PALETTE_KEYS,
  SPRITES,
  createScene,
  step,
  worldToScreen,
  resolveSprite,
  sphereShade,
  ringPixels,
  linePixels,
  galaxyPixels,
  starPosition,
  moonPosition,
} from './space-scene.js';

const SEED = 1118;
const FRAME_MS = 33; // about 30 frames per second
const STATIC_STEP = 1 / 30;
const STATIC_MAX_STEPS = 900;

const FLEET_LASER_KEY = { A: 'blue', B: 'pink' };

function getCanvas() {
  let canvas = document.querySelector('.space-bg');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'space-bg';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;
    document.body.insertBefore(canvas, document.body.firstChild);
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  return canvas;
}

function readPalette() {
  const style = getComputedStyle(document.documentElement);
  const palette = {};
  for (const key of PALETTE_KEYS) {
    const value = style.getPropertyValue(`--art-${key}`).trim();
    if (value) palette[key] = value;
  }
  return palette;
}

function init() {
  const canvas = getCanvas();
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;

  const palette = readPalette();
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  let scene = createScene(SEED);

  // Pixel lists that never change are resolved once.
  const galaxy = galaxyPixels(scene.galaxy);
  const planetShades = scene.planets.map((p) => sphereShade(p.r));
  const planetRings = scene.planets.map((p) => (p.ring ? ringPixels(p.r) : []));
  const moonShades = scene.moons.map((m) => sphereShade(m.r));
  const sprites = {
    A: resolveSprite(SPRITES.shipA),
    B: resolveSprite(SPRITES.shipB),
    missile: resolveSprite(SPRITES.missile),
    missileFlipped: resolveSprite(SPRITES.missile, true),
    explosion: SPRITES.explosion.map((rows) => resolveSprite(rows)),
  };

  let fill = null;
  function pixel(x, y, key) {
    const color = palette[key];
    if (!color) return;
    if (color !== fill) {
      ctx.fillStyle = color;
      fill = color;
    }
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  function drawSprite(pixels, x, y) {
    for (const [dx, dy, key] of pixels) pixel(x + dx, y + dy, key);
  }

  function drawSphere(shades, x, y, body) {
    const tones = { hi: body.hi, base: body.body, shadow: body.shadow };
    for (const [dx, dy, tone] of shades) pixel(x + dx, y + dy, tones[tone]);
  }

  function drawPlanets(state) {
    state.planets.forEach((planet, i) => {
      const moons = state.moons
        .map((moon, j) => ({ moon, j, pos: moonPosition(moon, state.planets, state.time) }))
        .filter((m) => m.moon.host === i);
      for (const m of moons) {
        if (!m.pos.front) drawSphere(moonShades[m.j], m.pos.x, m.pos.y, m.moon);
      }
      for (const [dx, dy, behind] of planetRings[i]) {
        if (behind) pixel(planet.x + dx, planet.y + dy, planet.ringKey);
      }
      drawSphere(planetShades[i], planet.x, planet.y, planet);
      for (const [dx, dy, behind] of planetRings[i]) {
        if (!behind) pixel(planet.x + dx, planet.y + dy, planet.ringKey);
      }
      for (const m of moons) {
        if (m.pos.front) drawSphere(moonShades[m.j], m.pos.x, m.pos.y, m.moon);
      }
    });
  }

  function drawShots(state) {
    for (const s of state.smoke) {
      const p = worldToScreen(s.x, s.y, s.z);
      const t = s.age / s.life;
      pixel(p.x, p.y, t < 0.3 ? 'orange' : t < 0.7 ? 'dim' : 'space-2');
    }

    for (const fleet of state.fleets) {
      for (const ship of fleet.ships) {
        if (!ship.alive) continue;
        const p = worldToScreen(ship.x, ship.y, ship.z);
        drawSprite(sprites[ship.fleet], p.x, p.y);
      }
    }

    for (const laser of state.lasers) {
      const head = worldToScreen(laser.x, laser.y, laser.z);
      const tail = worldToScreen(
        laser.x - laser.vx * 0.075,
        laser.y - laser.vy * 0.075,
        laser.z - laser.vz * 0.075,
      );
      const key = FLEET_LASER_KEY[laser.fleet];
      for (const [x, y] of linePixels(tail.x, tail.y, head.x, head.y)) pixel(x, y, key);
      pixel(head.x, head.y, 'light');
    }

    for (const m of state.missiles) {
      const p = worldToScreen(m.x, m.y, m.z);
      drawSprite(m.vx - m.vy < 0 ? sprites.missileFlipped : sprites.missile, p.x, p.y);
    }

    for (const e of state.explosions) {
      const p = worldToScreen(e.x, e.y, e.z);
      const last = sprites.explosion.length - 1;
      const frame = Math.min(last, Math.floor((e.age / e.life) * sprites.explosion.length));
      drawSprite(sprites.explosion[frame], p.x, p.y);
    }

    for (const d of state.debris) {
      const p = worldToScreen(d.x, d.y, d.z);
      pixel(p.x, p.y, d.key);
    }
  }

  function draw() {
    fill = null;
    if (palette.space) {
      ctx.fillStyle = palette.space;
      fill = palette.space;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    for (const [x, y, key] of galaxy) pixel(x, y, key);

    for (const layer of scene.stars) {
      for (const star of layer.stars) {
        const p = starPosition(layer, star, scene.time);
        pixel(p.x, p.y, layer.key);
      }
    }

    drawPlanets(scene);
    drawShots(scene);
  }

  // One fixed frame for reduced motion: run the battle until a beam, a missile
  // and an explosion are all on screen (deterministic for the fixed seed).
  function renderStatic() {
    scene = createScene(SEED);
    for (let i = 0; i < STATIC_MAX_STEPS; i += 1) {
      step(scene, STATIC_STEP);
      if (scene.lasers.length && scene.missiles.length && scene.explosions.length) break;
    }
    draw();
  }

  let rafId = 0;
  let running = false;
  let last = 0;

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (!last) {
      last = now;
      draw();
      return;
    }
    if (now - last < FRAME_MS) return;
    const dt = (now - last) / 1000;
    last = now;
    step(scene, dt);
    draw();
  }

  function start() {
    if (running) return;
    running = true;
    last = 0; // avoids a large time jump after a pause
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function applyMotionPreference() {
    stop();
    if (motionQuery.matches) {
      renderStatic();
    } else if (!document.hidden) {
      start();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (motionQuery.matches) return;
    if (document.hidden) stop();
    else start();
  });

  window.addEventListener('resize', () => {
    if (!running) draw();
  });

  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', applyMotionPreference);
  }

  applyMotionPreference();
}

try {
  init();
} catch (error) {
  // The background is decorative: the game keeps working without it.
  console.warn('Space background unavailable:', error);
}
