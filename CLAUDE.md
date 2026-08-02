# Palette Thief

Single-page web app: upload a photo, extract a 5-color palette via k-means, display with export options. All client-side, no backend, no storage.

## Stack
- React 18 + Vite + Tailwind CSS v4 (`@tailwindcss/vite` plugin, no postcss config)
- Vitest for unit tests of pure logic

## Layout
- `src/lib/` — pure functions, no React imports: `kmeans.js`, `colorUtils.js`, `colorNames.js`, `harmonize.js`, `paletteCard.js`
- `src/data/cssColors.js` — ~140 CSS named colors constant
- `src/components/` — `DropZone`, `PaletteStrip`, `Swatch`, `ContrastMatrix`, `ExportBar`, `Toast`

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npx vitest run` — unit tests

## Invariants
- `extractPalette` is deterministic (seeded k-means++), always returns exactly 5 colors, never throws
- Harmonize always re-derives from the ORIGINAL extraction (idempotent for the user); Undo restores original
- Swatch/PNG text color flips near-black/near-white at relative luminance ~0.5
- Non-essential animations gated behind `prefers-reduced-motion: no-preference`

## Deploy
- Vercel, auto-detected Vite build (`dist/` output)
