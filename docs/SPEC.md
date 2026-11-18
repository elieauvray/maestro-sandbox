# TicTacToe: specification

Source of truth for the TicTacToe browser game. Written by Maestro. Read together with docs/STYLE.md and AGENTS.md.

## 1. Goal
A TicTacToe game for two players on one device, played in the browser, styled after Upsun's public brand and hosted on Upsun.

## 2. Rules
- R1. The board is a 3x3 grid of cells. X always starts and turns alternate between X and O.
- R2. Clicking (or activating) an occupied cell does nothing: the board and the turn do not change.
- R3. The 8 winning lines are detected: 3 rows, 3 columns and 2 diagonals. A player who fills one of them wins.
- R4. A draw is declared when the board is full and there is no winner.
- R5. No move is allowed after the game ends (win or draw).
- R6. A Restart button clears the board and starts a new game with X to play.

## 3. UI
- U1. A status line shows whose turn it is ("X to play" / "O to play"), the winner ("X wins" / "O wins") or a draw ("Draw").
- U2. The cells of the winning line are visually highlighted.
- U3. A session scoreboard counts X wins, O wins and draws. It is persisted in localStorage and survives a page reload.
- U4. A Reset scores button sets all three counters back to 0 (and updates localStorage).

## 4. Accessibility
- A1. Every cell is a `<button>` with an aria-label that states its position and content, for example "Row 1, column 2, empty" or "Row 3, column 1, X".
- A2. The status line uses `aria-live` (polite) so that turn changes and results are announced.
- A3. The game is fully playable with the keyboard: Tab moves between cells and buttons, Enter or Space plays a move or activates a button.
- A4. Focus is always visible on every interactive element.
- A5. Text and interactive elements meet WCAG 2.1 AA contrast (4.5:1 for text, 3:1 for large text and UI components).

## 5. Responsive and motion
- M1. The layout works from 320px to 1440px wide without horizontal scrolling; the board stays square and fully visible.
- M2. Animations and transitions are disabled or reduced under `prefers-reduced-motion: reduce`.

## 6. Tech
- T1. Plain HTML, CSS and JavaScript ES modules. No framework, no CDN, no runtime dependency, no external request.
- T2. Files:
  - `public/index.html`: page markup.
  - `public/styles.css`: all styles, using the tokens from docs/STYLE.md.
  - `public/js/game.js`: pure game logic (board state, moves, winner and draw detection, score logic). No DOM access.
  - `public/js/app.js`: DOM binding (rendering, events, localStorage).
- T3. Tests live in `test/*.test.js` and use `node:test`. `package.json` has the script `"test": "node --test"` and no dependencies or devDependencies.

## 7. Hosting
- H1. Hosted on Upsun. `.upsun/config.yaml` defines one application that serves `public/` statically at the root route `https://{default}/`.
- H2. Every pull request gets an Upsun preview environment; production follows the `main` branch.

## 8. Acceptance checklist
Each line is checked in final acceptance against the code and production.
1. The page has `<title>TicTacToe</title>` and an h1 "TicTacToe". (H1)
2. The board shows 9 cells in a 3x3 grid. (R1)
3. The first move places X; the next move places O; turns keep alternating. (R1)
4. Activating an occupied cell changes neither the board nor the turn. (R2)
5. Each of the 3 rows, 3 columns and 2 diagonals is detected as a win (covered by tests). (R3)
6. A full board with no winning line is declared a draw (covered by tests). (R4)
7. After a win or a draw, activating an empty cell does nothing. (R5)
8. Restart clears the board and X plays first again. (R6)
9. The status line shows the turn, the winner or a draw. (U1)
10. The winning cells are highlighted. (U2)
11. The scoreboard counts X wins, O wins and draws and keeps them after a reload (localStorage). (U3)
12. Reset scores sets the three counters to 0. (U4)
13. Every cell is a `<button>` with an aria-label of the form "Row r, column c, <empty|X|O>". (A1)
14. The status line has `aria-live`. (A2)
15. A full game can be played with Tab and Enter/Space only. (A3)
16. Every interactive element has a visible focus style. (A4)
17. Colors meet WCAG AA contrast. (A5)
18. No horizontal scroll and a fully visible board from 320px to 1440px wide. (M1)
19. Motion is reduced under prefers-reduced-motion. (M2)
20. No framework, CDN, external request or runtime dependency; files match section 6. (T1, T2)
21. `node --test` passes and `package.json` has no dependencies. (T3)
22. `.upsun/config.yaml` serves `public/` at `https://{default}/`; production serves the game. (H1, H2)
23. The CSS uses the tokens from docs/STYLE.md. (STYLE)

## 9. Space battle theme (change request C1, 2026-11-18)
The project owner asked for a more striking design: an isometric, 8-bit (pixel art) background showing a galaxy, moons and planets, and spaceships at war with explosions, missiles and lasers. The game rules (sections 2 to 4) do not change.

- V1. **Scene.** Behind the game, a full-viewport animated background shows, in isometric projection (2:1 pixel diamonds, 30 degree look), a pixel-art space scene with:
  - a starfield (at least two depth layers) and a spiral or band galaxy;
  - at least 2 planets (one with a ring) and at least 2 moons, drawn as isometric pixel spheres with simple dithered shading;
  - at least two opposing fleets of pixel spaceships (at least 3 ships each) that fly and fight;
  - lasers (straight beams), missiles (sprites with a pixel smoke trail) and pixel explosions (expanding debris and flash) when a shot hits.
- V2. **8-bit look.** The scene is rendered at a low internal resolution (for example 320x180 or 480x270) on a `<canvas>` and scaled up with `image-rendering: pixelated` (crisp pixels, no smoothing). Colors come only from the art palette in docs/STYLE.md section 6.
- V3. **Generated, not downloaded.** All sprites and scenery are generated in code (pixel maps or drawing routines in JavaScript). No image, sprite sheet, font or audio file is fetched, and no external request is made (T1 still applies). No Upsun logo is drawn.
- V4. **Pure scene logic.** Isometric projection, seeded random generation and the per-frame simulation (ship movement, shots, hits, explosion lifetimes) live in `public/js/space-scene.js` with no DOM access, and are covered by tests in `test/space-scene.test.js`. Canvas drawing and the animation loop live in `public/js/background.js`.
- V5. **The game stays readable.** Header, game, scoreboard and footer sit in an opaque panel that uses the existing STYLE.md UI tokens, so every contrast ratio in STYLE.md section 1 still holds (A5). The panel gets an 8-bit treatment: square corners and a stepped pixel border/shadow. The canvas never sits on top of text or controls.
- V6. **Accessibility.** The canvas is decorative: `aria-hidden="true"`, `pointer-events: none`, not focusable, outside the tab order. Keyboard play, focus styles and aria-live behave as before (A1 to A4).
- V7. **Motion.** Under `prefers-reduced-motion: reduce`, the scene renders one static frame and does not animate (M2). The animation also pauses when the tab is hidden (`visibilitychange`).
- V8. **Performance and layout.** One `requestAnimationFrame` loop, capped at about 30 frames per second; the canvas follows the viewport on resize; no horizontal scroll from 320px to 1440px (M1).

### Acceptance checklist additions
24. The page shows the animated isometric 8-bit space scene behind the game: starfield, galaxy, at least 2 planets (one ringed), at least 2 moons, two fleets of at least 3 ships each fighting with lasers, missiles and explosions. (V1)
25. The scene is drawn on a low-resolution canvas scaled with `image-rendering: pixelated`, using only the STYLE.md art palette. (V2)
26. No image, sprite, font or audio file is loaded, and no external request is made; no Upsun logo is drawn. (V3)
27. `public/js/space-scene.js` has no DOM access and `test/space-scene.test.js` covers the isometric projection, seeded generation and hit/explosion lifecycle. (V4)
28. The game sits in an opaque, pixel-bordered panel; all text and controls keep their STYLE.md contrast. (V5)
29. The canvas is `aria-hidden`, ignores pointer events and is not focusable; a full game is still playable with the keyboard. (V6)
30. With `prefers-reduced-motion: reduce`, the scene is static; the animation pauses when the tab is hidden. (V7)
31. No horizontal scroll from 320px to 1440px wide, and the canvas resizes with the viewport. (V8)
