# Palette Thief

Upload a photo, steal its palette. A fully client-side web app that extracts a 5-color palette from any image with deterministic k-means clustering, checks every color pair against WCAG contrast thresholds, and exports the result as CSS variables, a Figma-ready hex list, or a PNG palette card. No backend, no uploads, no storage - everything runs in the browser.

## Features

- **Drag-and-drop image upload** - drop or pick a photo; pixels are read from a canvas and never leave the browser
- **5-color palette extraction** - deterministic k-means++ clustering over sampled pixels, sorted light to dark
- **Named colors** - each swatch is labeled with the nearest CSS named color (~140 candidates, nearest by RGB distance)
- **WCAG contrast matrix** - contrast ratio for every pair of palette colors, flagged at the 3:1 and 4.5:1 thresholds
- **Palette harmonization** - one click nudges hues toward an analogous/complementary scheme anchored on the dominant swatch, with undo back to the original extraction
- **Export three ways** - copy as CSS custom properties, copy as a hex list for Figma, or download a rendered PNG palette card

## Tech stack

- React 18 + Vite
- Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- Vitest for unit tests

The core logic lives in `src/lib/` as pure functions with no React or DOM dependencies, which keeps it fully unit-testable:

| Module | Responsibility |
| --- | --- |
| `kmeans.js` | Deterministic k-means++ palette extraction |
| `colorUtils.js` | Hex/RGB/HSL conversions, WCAG luminance and contrast math |
| `colorNames.js` | Nearest CSS named color lookup |
| `harmonize.js` | Hue and saturation harmonization |
| `paletteCard.js` | Canvas rendering of the exportable PNG card |

UI components (`DropZone`, `PaletteStrip`, `Swatch`, `ContrastMatrix`, `ExportBar`, `Toast`) live in `src/components/`.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. Other commands:

```bash
npm run build    # production build (dist/)
npm run preview  # preview the production build
npm test         # run the vitest unit suite
```

## The interesting parts

**Deterministic k-means.** Naive k-means gives a different palette every run because initialization is random. Here the PRNG (mulberry32) is seeded from an FNV-1a hash of the sampled pixel bytes, so the same image always produces the exact same palette. Extraction samples at most ~10,000 pixels with uniform stride, skips mostly-transparent pixels, uses k-means++ seeding, re-seeds empty clusters from the farthest point, and guarantees exactly 5 colors even for degenerate inputs (solid-color or fully transparent images fall back to lightness variants or a gray ramp). It never throws.

**WCAG contrast math.** `colorUtils.js` implements WCAG 2.1 relative luminance (sRGB channel linearization, then the 0.2126/0.7152/0.0722 weighting) and the `(L1 + 0.05) / (L2 + 0.05)` contrast ratio. The contrast matrix flags each pair against the 3:1 (large text) and 4.5:1 (normal text) thresholds, and swatch label text flips between near-black and near-white based on the background's relative luminance.

**Harmonization that can be undone.** Harmonize always re-derives from the original extraction rather than compounding on previous results, so repeated clicks are idempotent and undo restores the exact original palette. Near-gray colors are left untouched so neutrals never get tinted.

## Tests

Unit tests cover the pure-logic modules (`kmeans`, `colorUtils`, `colorNames`, `harmonize`):

```bash
npx vitest run
```

## Accessibility

- Contrast matrix rendered as a real table with row/column headers and a screen-reader caption
- Non-essential animations are gated behind `prefers-reduced-motion`
- Swatch text color chosen for contrast against its background
