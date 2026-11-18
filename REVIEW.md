# Review checklist (TicTacToe)

- Complies with docs/SPEC.md (rules, UI, tech, hosting) for the parts in the issue scope.
- Uses only the CSS tokens from docs/STYLE.md; no hard-coded brand colors or fonts.
- Accessibility: cells are `<button>` with aria-labels, status line has aria-live, keyboard play, visible focus, WCAG AA contrast.
- Logic changes come with `node:test` tests in `test/`, and `node --test` passes.
- No dependencies in package.json, no CDN, no external requests.
- Changes are limited to the files listed in the issue scope.
