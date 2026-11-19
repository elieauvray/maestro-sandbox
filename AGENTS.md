# Agent instructions (TicTacToe)

- Read docs/SPEC.md and docs/STYLE.md before writing any code.
- Stay strictly within the scope of the issue: change only the files it lists.
- Use only the CSS tokens defined in docs/STYLE.md (custom properties in `:root`); no other brand colors or fonts.
- Keep the game logic pure in `public/js/game.js` (no DOM access); DOM code goes in `public/js/app.js`.
- Run `node --test` and keep it green; add tests for any logic change.
- Do not change `.upsun/config.yaml` unless the issue asks for it.
- No external dependencies, frameworks, CDNs, remote fonts or external requests.
- Space battle background (docs/SPEC.md section 9): keep scene logic pure in `public/js/space-scene.js` (tested in `test/space-scene.test.js`) and canvas drawing in `public/js/background.js`; use only the art palette in docs/STYLE.md section 6; generate all sprites in code, never load image or font files.
- 16-bit space flight background (docs/SPEC.md section 10, which replaces the isometric camera and 8-bit look of section 9): perspective forward flight, colors only from docs/STYLE.md sections 6 and 7, same pure/DOM split between `public/js/space-scene.js` and `public/js/background.js`.
