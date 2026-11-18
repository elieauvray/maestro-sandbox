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
