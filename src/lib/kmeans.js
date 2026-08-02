// Deterministic k-means palette extraction from canvas ImageData.data.
// No React, no DOM. Pure JS + typed-array reads.

import { relativeLuminance, rgbToHsl, hslToRgb } from './colorUtils.js';

const MAX_SAMPLES = 10000;
const MAX_ITERATIONS = 20;
const CONVERGENCE_EPS = 1.0;
const ALPHA_THRESHOLD = 125;

/** Small deterministic PRNG (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash over the sampled pixel bytes — deterministic seed per image. */
function hashSamples(samples) {
  let h = 0x811c9dc5;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    for (let c = 0; c < 3; c++) {
      h ^= s[c];
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}

function dist2(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** Neutral gray-scale ramp fallback, light -> dark. */
function grayRamp(k) {
  const out = [];
  for (let i = 0; i < k; i++) {
    const l = k === 1 ? 0.5 : 0.9 - (0.8 * i) / (k - 1);
    out.push(hslToRgb([0, 0, l]));
  }
  return out;
}

/**
 * Fill `colors` up to k entries with evenly-spaced lightness variants of
 * the dominant (first) color, skipping duplicates of existing entries.
 */
function fillWithLightnessVariants(colors, k) {
  const seen = new Set(colors.map((c) => (c[0] << 16) | (c[1] << 8) | c[2]));
  const base = colors.length > 0 ? colors[0] : [128, 128, 128];
  const [h, s] = rgbToHsl(base);
  // Evenly spaced lightness values across a usable range.
  const steps = 2 * k;
  for (let i = 0; i < steps && colors.length < k; i++) {
    const l = 0.88 - (0.76 * i) / (steps - 1);
    const rgb = hslToRgb([h, s, l]);
    const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    if (seen.has(key)) continue;
    seen.add(key);
    colors.push(rgb);
  }
  // Extreme edge case (tiny gamut): pad with grays.
  let g = 0;
  while (colors.length < k) {
    const rgb = hslToRgb([0, 0, (g + 1) / (k + 1)]);
    const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    if (!seen.has(key)) {
      seen.add(key);
      colors.push(rgb);
    }
    g++;
    if (g > 255) break; // absolute safety valve
  }
  while (colors.length < k) colors.push([128, 128, 128]);
  return colors;
}

/** k-means++ initialization, deterministic via provided PRNG. */
function initCentroids(samples, k, rand) {
  const centroids = [];
  centroids.push(samples[Math.floor(rand() * samples.length)].slice());
  const minDist = new Float64Array(samples.length).fill(Infinity);

  while (centroids.length < k) {
    const last = centroids[centroids.length - 1];
    let total = 0;
    for (let i = 0; i < samples.length; i++) {
      const d = dist2(samples[i], last);
      if (d < minDist[i]) minDist[i] = d;
      total += minDist[i];
    }
    if (total === 0) {
      // All points coincide with existing centroids; duplicate one and let
      // the degenerate-palette fill handle it later.
      centroids.push(centroids[0].slice());
      continue;
    }
    let target = rand() * total;
    let idx = samples.length - 1;
    for (let i = 0; i < samples.length; i++) {
      target -= minDist[i];
      if (target <= 0) {
        idx = i;
        break;
      }
    }
    centroids.push(samples[idx].slice());
  }
  return centroids;
}

/** Index of the sample farthest from all current centroids. */
function farthestSampleIndex(samples, centroids) {
  let bestIdx = 0;
  let bestDist = -1;
  for (let i = 0; i < samples.length; i++) {
    let nearest = Infinity;
    for (const c of centroids) {
      const d = dist2(samples[i], c);
      if (d < nearest) nearest = d;
    }
    if (nearest > bestDist) {
      bestDist = nearest;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Extract a palette of exactly k [r, g, b] int colors from RGBA pixel data,
 * sorted by WCAG relative luminance, light -> dark. Deterministic: the PRNG
 * is seeded from a hash of the sampled pixels, so identical input always
 * yields the identical palette. Never throws, never returns fewer than k.
 *
 * @param {Uint8ClampedArray|number[]} data RGBA layout (ImageData.data)
 * @param {number} k number of colors (default 5)
 */
export function extractPalette(data, k = 5) {
  k = Math.max(1, Math.floor(k) || 1);
  const len = data && data.length ? data.length : 0;
  const totalPixels = Math.floor(len / 4);

  // Uniform-stride sampling: at most ~MAX_SAMPLES pixels examined.
  const stride = Math.max(1, Math.ceil(totalPixels / MAX_SAMPLES));
  const samples = [];
  for (let p = 0; p < totalPixels; p += stride) {
    const o = p * 4;
    if (data[o + 3] < ALPHA_THRESHOLD) continue;
    samples.push([data[o], data[o + 1], data[o + 2]]);
  }

  // Empty / all-transparent input: sensible grayscale ramp.
  if (samples.length === 0) return grayRamp(k);

  // Count distinct colors (cheap; samples <= 10k).
  const distinct = new Map(); // key -> [count, rgb]
  for (const s of samples) {
    const key = (s[0] << 16) | (s[1] << 8) | s[2];
    const e = distinct.get(key);
    if (e) e[0]++;
    else distinct.set(key, [1, s]);
  }

  if (distinct.size <= k) {
    // Fewer distinct colors than clusters: use them directly (most frequent
    // first = dominant), then fill with lightness variants of the dominant.
    const colors = [...distinct.values()]
      .sort((a, b) => b[0] - a[0])
      .map(([, rgb]) => rgb.slice());
    fillWithLightnessVariants(colors, k);
    return colors
      .slice(0, k)
      .sort((a, b) => relativeLuminance(b) - relativeLuminance(a));
  }

  // Deterministic k-means++.
  const rand = mulberry32(hashSamples(samples));
  const centroids = initCentroids(samples, k, rand);
  const assignment = new Int32Array(samples.length);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Assign.
    for (let i = 0; i < samples.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist2(samples[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assignment[i] = best;
    }

    // Update.
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < samples.length; i++) {
      const a = sums[assignment[i]];
      const s = samples[i];
      a[0] += s[0];
      a[1] += s[1];
      a[2] += s[2];
      a[3]++;
    }

    let maxMove = 0;
    for (let c = 0; c < k; c++) {
      const [sr, sg, sb, n] = sums[c];
      let next;
      if (n === 0) {
        // Empty cluster: re-seed from the farthest point from all centroids.
        next = samples[farthestSampleIndex(samples, centroids)].slice();
      } else {
        next = [sr / n, sg / n, sb / n];
      }
      const move = Math.sqrt(dist2(next, centroids[c]));
      if (move > maxMove) maxMove = move;
      centroids[c] = next;
    }

    if (maxMove < CONVERGENCE_EPS) break;
  }

  let colors = centroids.map((c) => [
    Math.round(c[0]),
    Math.round(c[1]),
    Math.round(c[2]),
  ]);

  // Guard against duplicate centroids after rounding.
  const seen = new Set();
  colors = colors.filter((c) => {
    const key = (c[0] << 16) | (c[1] << 8) | c[2];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (colors.length < k) fillWithLightnessVariants(colors, k);

  return colors
    .slice(0, k)
    .sort((a, b) => relativeLuminance(b) - relativeLuminance(a));
}
