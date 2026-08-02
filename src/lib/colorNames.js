import { cssColors } from '../data/cssColors.js';
import { hexToRgb } from './colorUtils.js';

// Precompute RGB triples once at module load.
const entries = cssColors.map(({ name, hex }) => ({ name, rgb: hexToRgb(hex) }));

/**
 * Return the name of the nearest CSS named color by Euclidean distance in RGB.
 * An exact hex match always returns that color's name (distance 0 wins;
 * ties resolve to the first entry in list order, so canonical names like
 * "gray" beat later aliases like "grey").
 */
export function nearestColorName([r, g, b]) {
  let bestName = entries[0].name;
  let bestDist = Infinity;
  for (const { name, rgb } of entries) {
    const dr = r - rgb[0];
    const dg = g - rgb[1];
    const db = b - rgb[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) {
      bestDist = d;
      bestName = name;
      if (d === 0) break;
    }
  }
  return bestName;
}
