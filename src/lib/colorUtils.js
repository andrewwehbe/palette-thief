// Pure color utility functions. No React, no DOM.

/**
 * Parse a hex color string into an [r, g, b] array of ints 0-255.
 * Accepts "#rrggbb", "rrggbb", "#rgb", "rgb".
 */
export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Convert an [r, g, b] array to a lowercase "#rrggbb" string.
 */
export function rgbToHex([r, g, b]) {
  const to2 = (v) => {
    const c = Math.max(0, Math.min(255, Math.round(v)));
    return c.toString(16).padStart(2, '0');
  };
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

/**
 * Convert [r, g, b] (0-255) to [h, s, l] with h in 0-360, s and l in 0-1.
 */
export function rgbToHsl([r, g, b]) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return [0, 0, l];

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;
  if (max === rn) {
    h = ((gn - bn) / d) % 6;
  } else if (max === gn) {
    h = (bn - rn) / d + 2;
  } else {
    h = (rn - gn) / d + 4;
  }
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

/**
 * Convert [h, s, l] (h 0-360, s/l 0-1) to rounded [r, g, b] ints.
 */
export function hslToRgb([h, s, l]) {
  const hn = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = l - c / 2;

  let rp, gp, bp;
  if (hn < 60) [rp, gp, bp] = [c, x, 0];
  else if (hn < 120) [rp, gp, bp] = [x, c, 0];
  else if (hn < 180) [rp, gp, bp] = [0, c, x];
  else if (hn < 240) [rp, gp, bp] = [0, x, c];
  else if (hn < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return [
    Math.round((rp + m) * 255),
    Math.round((gp + m) * 255),
    Math.round((bp + m) * 255),
  ];
}

/**
 * WCAG 2.1 relative luminance, 0-1.
 */
export function relativeLuminance([r, g, b]) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two [r, g, b] colors. Always >= 1.
 */
export function contrastRatio(rgbA, rgbB) {
  const la = relativeLuminance(rgbA);
  const lb = relativeLuminance(rgbB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Luminance-aware text color for a swatch background.
 * Light backgrounds get near-black text, dark backgrounds get near-white.
 */
export function textColorFor(rgb) {
  return relativeLuminance(rgb) > 0.5 ? '#0e0e11' : '#f7f7f8';
}
