# Upsun style guide for TicTacToe

- **Source:** the official Upsun brand skill (`upsun-brand` SKILL.md), sent by the project owner (elieauvray) in the Maestro app on 2026-11-18.
- **Why not upsun.com:** the Maestro sandbox could not reach https://upsun.com (DNS failure), so no values were taken from the website.
- **Extraction date:** 2026-11-18.
- **Scope:** only colors and typography are mirrored. Do not copy Upsun logo files or font files into this repository, and do not load fonts from a CDN (SPEC T1: no external requests).

## 1. Color tokens
The game uses **light mode** by default, as the brand guide recommends. Dark mode tokens are listed for an optional `prefers-color-scheme: dark` block.

| Token | Value | Brand name | Use | Where found |
|---|---|---|---|---|
| `--color-bg` | `#ECEDEE` | Neutral 100 | Page background (light) | SKILL.md, Light mode |
| `--color-text` | `#0C0F10` | Neutral 1000 | Primary text, X and O marks, cell borders | SKILL.md, Light mode |
| `--color-text-secondary` | `#646F75` | Neutral 500 | Secondary text, **large text only** (see contrast) | SKILL.md, Light mode |
| `--color-accent` | `#6046FF` | Violet 600 | Brand accent: buttons, links, focus ring | SKILL.md, Light mode |
| `--color-on-accent` | `#ECEDEE` | Neutral 100 | Text on Violet 600 buttons | SKILL.md, Core colors |
| `--color-emphasis` | `#D5F800` | Lime 600 | Emphasis only: winning cells highlight. Always with `--color-text` on top | SKILL.md, Core colors |
| `--color-border` | `#D8DBDC` | Neutral 200 | Decorative dividers only (header and footer rules) | SKILL.md, Light mode |
| `--color-accent-orange` | `#FF4A11` | Orange 600 | Optional decorative shapes only, never text | SKILL.md, Accent colors |
| `--color-accent-blue` | `#00D0EC` | Blue 600 | Optional decorative shapes only, never text | SKILL.md, Accent colors |
| `--color-accent-pink` | `#E81CEC` | Pink 600 | Optional decorative shapes only, never text | SKILL.md, Accent colors |

Dark mode (optional): background `#0C0F10` (Neutral 1000), text `#ECEDEE` (Neutral 100), secondary text `#8B9397` (Neutral 400), accent `#BFB5FF` (Violet 300) with `#0C0F10` text on it, borders `#252D31` (Neutral 800), emphasis Lime 600 with Neutral 1000 text.

**Success and error colors:** the brand guide defines none. The game needs none: the result is shown in the status text and the winning line uses Lime 600.

### Usage hierarchy
- Lead with Neutral 1000 and Violet 600.
- Use Lime 600 only for the winning line highlight.
- Orange, Blue and Pink are optional decoration, never defaults.

### Contrast (WCAG AA, computed by Maestro)
| Pair | Ratio | Allowed use |
|---|---|---|
| Neutral 1000 on Neutral 100 | 16.41 | All text |
| Violet 600 on Neutral 100 | 4.69 | Text, links, focus ring, UI borders |
| Neutral 100 on Violet 600 | 4.69 | Button labels |
| Neutral 1000 on Lime 600 | 15.81 | Winning cells |
| Neutral 500 on Neutral 100 | **4.40** | **Large text only** (24px, or 18.66px bold); use Neutral 1000 for small text |
| Neutral 200 on Neutral 100 | **1.19** | **Decorative only**: never the only boundary of a cell or button |
| Orange 600 on Neutral 100 | **2.87** | Never for text or UI boundaries |
| Dark: Neutral 100 on Neutral 1000 / Violet 300 on Neutral 1000 / Neutral 400 on Neutral 1000 | 16.41 / 10.32 / 6.16 | All text |

Cell borders and outlines must use `--color-text` or `--color-accent` to meet the 3:1 rule for UI components.

## 2. Typography
- **Primary typeface: Instrument Sans**, for all text. Bold (700) for titles and headings, Normal (400) for body copy, Semi-bold (600) for H3 and subtitles.
- **Secondary typeface: Space Grotesk**, only for short callouts, code or legal footer text: Normal (400), small. Never for body copy.
- **Fallback:** the brand guide names Arial for both. Fonts are used only if installed locally on the player's device (`local()` / family name); no font files are committed or downloaded.
- **Body:** 12pt in the brand guide, which is `16px` (`1rem`) on screen; line-height 1.2. Use `--line-height-relaxed` for multi-line paragraphs.
- **Sentence case** for all headings, labels and buttons (for example "Reset scores", not "Reset Scores"). The product name "TicTacToe" stays as is.
- **Sizes:** the guide gives only relative sizes for headings (H2 "slightly smaller than H1"). The pixel scale below is a Maestro choice, not a brand value.

| Element | Font | Weight | Size | Color |
|---|---|---|---|---|
| h1 "TicTacToe" (document title) | Instrument Sans | 700 | `--font-size-h1` | `--color-text`, centered |
| Subtitle / status line | Instrument Sans | 600 | `--font-size-h3` | `--color-accent` (light) |
| h2 (for example "Score") | Instrument Sans | 700 | `--font-size-h2` | `--color-text` |
| Body, scoreboard | Instrument Sans | 400 | `--font-size-body` | `--color-text` |
| X and O marks in cells | Instrument Sans | 700 | `--font-size-mark` | `--color-text` |
| Footer / legal | Space Grotesk | 400 | `--font-size-small` | `--color-text` |
| Links | Instrument Sans | 400, underlined | inherit | `--color-accent` |

## 3. Ready-to-copy tokens
```css
:root {
  /* Colors: Upsun brand, light mode */
  --color-bg: #ECEDEE;              /* Neutral 100 */
  --color-text: #0C0F10;            /* Neutral 1000 */
  --color-text-secondary: #646F75;  /* Neutral 500: large text only */
  --color-accent: #6046FF;          /* Violet 600 */
  --color-on-accent: #ECEDEE;       /* Neutral 100 */
  --color-emphasis: #D5F800;        /* Lime 600: always with --color-text */
  --color-border: #D8DBDC;          /* Neutral 200: decorative only */
  --color-accent-orange: #FF4A11;   /* Orange 600: decoration only */
  --color-accent-blue: #00D0EC;     /* Blue 600: decoration only */
  --color-accent-pink: #E81CEC;     /* Pink 600: decoration only */

  /* Typography */
  --font-sans: "Instrument Sans", Arial, sans-serif;
  --font-mono: "Space Grotesk", Arial, sans-serif;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-size-small: 0.875rem;  /* 14px */
  --font-size-body: 1rem;       /* 16px = 12pt brand body */
  --font-size-h3: 1.25rem;      /* 20px */
  --font-size-h2: 1.5rem;       /* 24px */
  --font-size-h1: clamp(2rem, 6vw, 3rem);
  --font-size-mark: clamp(2.5rem, 12vw, 4rem);
  --line-height-body: 1.2;
  --line-height-relaxed: 1.5;

  /* Shape and spacing (structural, not brand values) */
  --radius-sm: 4px;
  --radius-md: 8px;
  --border-width: 2px;
  --focus-ring-width: 3px;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2rem;
  --space-6: 3rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0C0F10;              /* Neutral 1000 */
    --color-text: #ECEDEE;            /* Neutral 100 */
    --color-text-secondary: #8B9397;  /* Neutral 400 */
    --color-accent: #BFB5FF;          /* Violet 300 */
    --color-on-accent: #0C0F10;       /* Neutral 1000 */
    --color-border: #252D31;          /* Neutral 800 */
  }
}
```
The dark mode block is optional. If you use it, the winning cells keep `--color-emphasis` with `color: #0C0F10` (Neutral 1000) in both modes, so set that color directly or add a `--color-on-emphasis: #0C0F10` token.

## 4. Components
- **Page:** `background: var(--color-bg); color: var(--color-text); font-family: var(--font-sans); font-size: var(--font-size-body); line-height: var(--line-height-body);`
- **Cells:** `background: var(--color-bg)`, `border: var(--border-width) solid var(--color-text)`, `border-radius: var(--radius-sm)`. Marks in `--font-size-mark`, bold, `--color-text`. Hover on an empty, playable cell: border color `--color-accent`.
- **Winning cells:** `background: var(--color-emphasis); color: #0C0F10` (Neutral 1000).
- **Primary buttons** (Restart, Reset scores): `background: var(--color-accent); color: var(--color-on-accent); border: none; border-radius: var(--radius-md); padding: var(--space-2) var(--space-4); font-weight: var(--font-weight-semibold)`. Hover: `background: var(--color-text)`. Labels in sentence case.
- **Focus** (all interactive elements): `outline: var(--focus-ring-width) solid var(--color-accent); outline-offset: 2px;` on `:focus-visible`. Never remove the outline without this replacement.
- **Header and footer:** divider `1px solid var(--color-border)` (decorative). Footer text in `--font-mono`, `--font-size-small`.
- **Motion:** short transitions (≤ 150ms) on color and border only. Under `@media (prefers-reduced-motion: reduce)`, set `transition: none` and `animation: none`.

## 5. Copy
- Sentence case, American English, no em dashes or en dashes, no ampersands.
- Status texts: "X to play", "O to play", "X wins", "O wins", "Draw".

## 6. Space battle art palette (change request C1)
Added on 2026-11-18 for the isometric 8-bit background (docs/SPEC.md section 9). **No new colors were invented:** every art color is an existing Upsun brand value from section 1 or its dark mode line. Use these tokens in `public/styles.css` (for the panel and page) and read them from CSS in `public/js/background.js` (`getComputedStyle(document.documentElement).getPropertyValue(...)`) so that the canvas palette has a single source.

| Token | Value | Brand name | Use in the scene |
|---|---|---|---|
| `--art-space` | `#0C0F10` | Neutral 1000 | Deep space, page background behind the canvas |
| `--art-space-2` | `#252D31` | Neutral 800 | Nebula shading, planet shadows, dithering |
| `--art-dim` | `#646F75` | Neutral 500 | Far stars, moon shadow side, smoke |
| `--art-mid` | `#8B9397` | Neutral 400 | Moons, ship hulls |
| `--art-light` | `#ECEDEE` | Neutral 100 | Near stars, highlights, missile bodies, explosion core |
| `--art-violet` | `#6046FF` | Violet 600 | Galaxy arms, planet A, fleet A |
| `--art-violet-light` | `#BFB5FF` | Violet 300 | Galaxy core glow, planet A highlights |
| `--art-blue` | `#00D0EC` | Blue 600 | Fleet A lasers and engines, planet B |
| `--art-pink` | `#E81CEC` | Pink 600 | Fleet B lasers and engines, planet ring |
| `--art-orange` | `#FF4A11` | Orange 600 | Fleet B hulls, missile trails, explosions |
| `--art-lime` | `#D5F800` | Lime 600 | Explosion flash, ship cockpit lights |

```css
:root {
  /* Space battle art palette: Upsun brand values only (STYLE.md section 6) */
  --art-space: #0C0F10;        /* Neutral 1000 */
  --art-space-2: #252D31;      /* Neutral 800 */
  --art-dim: #646F75;          /* Neutral 500 */
  --art-mid: #8B9397;          /* Neutral 400 */
  --art-light: #ECEDEE;        /* Neutral 100 */
  --art-violet: #6046FF;       /* Violet 600 */
  --art-violet-light: #BFB5FF; /* Violet 300 */
  --art-blue: #00D0EC;         /* Blue 600 */
  --art-pink: #E81CEC;         /* Pink 600 */
  --art-orange: #FF4A11;       /* Orange 600 */
  --art-lime: #D5F800;         /* Lime 600 */

  /* 8-bit UI treatment (structural, not brand values) */
  --pixel: 4px;                /* size of one "pixel" in UI borders and shadows */
}
```

### Rules
- **Isometric grid:** 2:1 pixel ratio (a tile is twice as wide as it is tall). Project world (x, y, z) to screen with `sx = (x - y) * tileW / 2`, `sy = (x + y) * tileH / 2 - z`, rounded to whole canvas pixels.
- **Pixel art:** no anti-aliasing (`ctx.imageSmoothingEnabled = false`, CSS `image-rendering: pixelated`), integer coordinates, flat colors and checkerboard dithering for shading. No gradients or blur.
- **Panel (8-bit UI):** the game panel uses `background: var(--color-bg)`, square corners (`border-radius: 0`), a `var(--pixel)` solid border in `--color-text` and a stepped hard shadow (for example `box-shadow: var(--pixel) var(--pixel) 0 var(--art-violet)`). Buttons may get the same stepped shadow. Text, fonts and UI contrast follow sections 1 to 5 unchanged.
- **Brightness:** the scene stays mostly dark (`--art-space`, `--art-space-2`); bright colors are small accents (shots, explosions, highlights) so the panel stays the focus.
- **Motion:** obey `prefers-reduced-motion` (one static frame).
- **Not allowed:** Upsun logo, any image or font file, remote assets, colors outside this file.

## 7. 16-bit space flight palette (change request C2)
Added on 2026-11-18 for the 16-bit "flying through space" background (docs/SPEC.md section 10). It **extends** section 6: every section 6 token stays. A 16-bit look needs shade ramps (3 to 5 tones per hue), and the brand guide has only one or two tones per hue. The tokens below are therefore **derived shades, not new brand colors**: each one is computed by mixing two existing brand values from sections 1 and 6 in sRGB (per channel: `round(a * (1 - t) + b * t)`). Do not add any other color.

| Token | Value | Mix (a, b, t) | Use in the scene |
|---|---|---|---|
| `--art-space-mid` | `#191E21` | Neutral 1000, Neutral 800, 0.5 | Space depth between the two darks, dithering |
| `--art-violet-dark` | `#1D1A40` | Violet 600, Neutral 1000, 0.8 | Outer nebula and galaxy halo |
| `--art-violet-deep` | `#2E2570` | Violet 600, Neutral 1000, 0.6 | Galaxy arms (far), planet shadow side |
| `--art-violet-mid` | `#907EFF` | Violet 600, Violet 300, 0.5 | Galaxy arms (near), planet mid-tone |
| `--art-blue-deep` | `#075C68` | Blue 600, Neutral 1000, 0.6 | Fleet A hull shadow, planet B shadow |
| `--art-blue-light` | `#76DFED` | Blue 600, Neutral 100, 0.5 | Fleet A highlights, laser core, star twinkle |
| `--art-pink-deep` | `#641468` | Pink 600, Neutral 1000, 0.6 | Nebula accents, ring shadow, fleet B shadow |
| `--art-pink-light` | `#EA85ED` | Pink 600, Neutral 100, 0.5 | Fleet B laser core, ring highlight |
| `--art-orange-deep` | `#862D11` | Orange 600, Neutral 1000, 0.5 | Fleet B hull shadow, explosion smoke |
| `--art-orange-light` | `#EAA109` | Orange 600, Lime 600, 0.5 | Explosion mid-flash, engine flames |
| `--art-lime-light` | `#E1F377` | Lime 600, Neutral 100, 0.5 | Explosion core, cockpit glints |

```css
:root {
  /* 16-bit ramps: derived from Upsun brand values only (STYLE.md section 7) */
  --art-space-mid: #191E21;
  --art-violet-dark: #1D1A40;
  --art-violet-deep: #2E2570;
  --art-violet-mid: #907EFF;
  --art-blue-deep: #075C68;
  --art-blue-light: #76DFED;
  --art-pink-deep: #641468;
  --art-pink-light: #EA85ED;
  --art-orange-deep: #862D11;
  --art-orange-light: #EAA109;
  --art-lime-light: #E1F377;
}
```

### Ramps (dark to light)
- Space: `--art-space`, `--art-space-mid`, `--art-space-2`
- Neutral: `--art-space-2`, `--art-dim`, `--art-mid`, `--art-light`
- Violet: `--art-violet-dark`, `--art-violet-deep`, `--art-violet`, `--art-violet-mid`, `--art-violet-light`
- Blue: `--art-blue-deep`, `--art-blue`, `--art-blue-light`
- Pink: `--art-pink-deep`, `--art-pink`, `--art-pink-light`
- Fire: `--art-orange-deep`, `--art-orange`, `--art-orange-light`, `--art-lime`, `--art-lime-light`

### Rules (replace the 8-bit rules of section 6 for the background)
- **16-bit pixel art:** internal canvas resolution 480x270 (16:9), `imageSmoothingEnabled = false`, CSS `image-rendering: pixelated`, integer coordinates, flat palette colors only. Shading uses the ramps above (at least 3 tones per object) plus ordered (2x2 or 4x4 Bayer) dithering between neighbouring ramp tones. No gradients, no blur, no alpha blending, no `shadowBlur`.
- **Sprites:** ships, missiles and planets have a dark outline (`--art-space` or the darkest ramp tone), a light source from the top left (highlight on the top-left, darkest tone bottom-right) and at least 3 ramp tones. Ships are at least 12x8 pixels at full size.
- **Depth:** far objects use the darker ramp tones, near objects the lighter ones. Fast near stars may be drawn as short streaks (2 to 6 pixels, light to dim).
- **Retro game UI panel:** the game panel looks like a 16-bit game dialog box: `background: var(--color-bg)`, square corners, a two-tone pixel frame (outer `var(--pixel)` border in `--color-text`, inner 2px line in `--color-accent`, for example with `outline` + `outline-offset` or an inset `box-shadow` with zero blur) and the stepped hard shadow from section 6. Buttons get a stepped shadow that disappears with a 2px shift on `:active` (a "pressed" feel). Fonts, text colors and contrast follow sections 1 to 5 unchanged; no pixel font file may be added.
- **Brightness:** the scene stays mostly dark; bright tones are small accents, so the panel stays the focus.
- **Not allowed:** Upsun logo, any image or font file, remote assets, colors outside sections 6 and 7.
