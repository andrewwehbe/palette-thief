// Renders a shareable 1600x900 palette card as a PNG Blob.
// Uses browser APIs (document, canvas) -- intentionally not unit-tested in
// the node test environment. No React.

import { rgbToHex, textColorFor } from './colorUtils.js';

const WIDTH = 1600;
const HEIGHT = 900;
const SYSTEM_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Best-effort load of "Space Grotesk". Never throws; returns the font-family
 * string to use (Space Grotesk first if it loaded, otherwise system stack).
 */
async function resolveFontFamily() {
  try {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
      const loaded = await document.fonts.load('600 40px "Space Grotesk"');
      if (loaded && loaded.length > 0) {
        return `"Space Grotesk", ${SYSTEM_STACK}`;
      }
    }
  } catch {
    // Font loading is cosmetic -- fall through to the system stack.
  }
  return SYSTEM_STACK;
}

/**
 * Render a palette card: 5 vertical color bands (320px each at k=5), each
 * band's hex code centered horizontally near the bottom in a luminance-aware
 * text color, plus a semi-transparent "Palette Thief" watermark bottom-right.
 *
 * @param {Array<[number, number, number]>} palette array of [r,g,b]
 * @returns {Promise<Blob>} PNG blob
 */
export async function renderPaletteCard(palette) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  const bandW = WIDTH / palette.length; // 320 for the standard 5-color palette

  // Bands.
  palette.forEach((rgb, i) => {
    ctx.fillStyle = rgbToHex(rgb);
    // Overdraw 1px to avoid hairline seams from fractional band widths.
    ctx.fillRect(Math.floor(i * bandW), 0, Math.ceil(bandW) + 1, HEIGHT);
  });

  const fontFamily = await resolveFontFamily();

  // Hex labels, centered in each band near the bottom.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 40px ${fontFamily}`;
  palette.forEach((rgb, i) => {
    ctx.fillStyle = textColorFor(rgb);
    ctx.fillText(rgbToHex(rgb), i * bandW + bandW / 2, HEIGHT - 90);
  });

  // Watermark bottom-right on the last band, luminance-aware, semi-transparent.
  const last = palette[palette.length - 1];
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.font = `500 24px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = textColorFor(last);
  ctx.fillText('Palette Thief', WIDTH - 24, HEIGHT - 24);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null')),
      'image/png'
    );
  });
}
