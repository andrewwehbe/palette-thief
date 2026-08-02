// Palette harmonization. Pure and deterministic: same input -> same output,
// never mutates its input.
//
// Algorithm (documented choices):
// - The DOMINANT color is the MID swatch of the palette (index floor(len/2)).
//   Palettes from extractPalette are sorted light -> dark, so the mid swatch
//   is the most tonally representative; its hue anchors the scheme.
// - Target angles are the dominant hue's analogous (+/-30 deg) and
//   complementary (+180 deg) angles, plus the dominant hue itself.
// - Every other color's hue moves 70% of the way toward its nearest target
//   angle (circular distance). The dominant swatch keeps its hue.
// - Saturation is normalized: each color's saturation is pulled 50% toward
//   the palette's mean saturation (mean over chromatic colors only).
// - Near-gray colors (saturation < 0.05) are left completely untouched --
//   their hue is meaningless and injecting saturation would tint them.
// - Lightness is never changed.

import { rgbToHsl, hslToRgb } from './colorUtils.js';

const HUE_PULL = 0.7;
const SAT_PULL = 0.5;
const GRAY_SAT_THRESHOLD = 0.05;

/** Signed shortest angular difference from a to b, in (-180, 180]. */
function hueDelta(a, b) {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * Harmonize a palette of [r, g, b] colors. Returns a NEW array of the same
 * length with harmonized [r, g, b] int colors.
 */
export function harmonize(palette) {
  if (!Array.isArray(palette) || palette.length === 0) return [];

  const hsls = palette.map((rgb) => rgbToHsl(rgb));
  const domIdx = Math.floor(palette.length / 2);
  const domHue = hsls[domIdx][0];

  const targets = [
    domHue,
    (domHue + 30) % 360,
    (domHue + 330) % 360, // -30
    (domHue + 180) % 360,
  ];

  const chromatic = hsls.filter(([, s]) => s >= GRAY_SAT_THRESHOLD);
  const meanSat =
    chromatic.length > 0
      ? chromatic.reduce((acc, [, s]) => acc + s, 0) / chromatic.length
      : 0;

  return hsls.map(([h, s, l], i) => {
    if (s < GRAY_SAT_THRESHOLD) {
      // Near-gray: leave untouched.
      return hslToRgb([h, s, l]);
    }

    let newH = h;
    if (i !== domIdx) {
      let bestDelta = 0;
      let bestAbs = Infinity;
      for (const t of targets) {
        const d = hueDelta(h, t);
        if (Math.abs(d) < bestAbs) {
          bestAbs = Math.abs(d);
          bestDelta = d;
        }
      }
      newH = (((h + HUE_PULL * bestDelta) % 360) + 360) % 360;
    }

    const newS = Math.min(1, Math.max(0, s + SAT_PULL * (meanSat - s)));
    return hslToRgb([newH, newS, l]);
  });
}
