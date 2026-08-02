import { describe, it, expect } from 'vitest';
import { extractPalette } from './kmeans.js';
import { relativeLuminance } from './colorUtils.js';

/** Build RGBA data from a list of [r,g,b] pixels (alpha 255). */
function rgbaFrom(pixels, alpha = 255) {
  const data = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b], i) => {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = alpha;
  });
  return data;
}

/** Deterministic jitter without Math.random (tiny LCG). */
function makeLcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CLUSTER_CENTERS = [
  [250, 250, 250],
  [200, 30, 40],
  [30, 60, 200],
  [40, 180, 90],
  [15, 15, 20],
];

/** 5 noisy clusters, 800 pixels each, deterministic. */
function fiveClusterImage() {
  const rand = makeLcg(42);
  const pixels = [];
  for (const center of CLUSTER_CENTERS) {
    for (let i = 0; i < 800; i++) {
      pixels.push(
        center.map((c) =>
          Math.max(0, Math.min(255, Math.round(c + (rand() - 0.5) * 20)))
        )
      );
    }
  }
  return rgbaFrom(pixels);
}

function expectValidPalette(palette, k = 5) {
  expect(palette).toHaveLength(k);
  for (const color of palette) {
    expect(color).toHaveLength(3);
    for (const ch of color) {
      expect(Number.isInteger(ch)).toBe(true);
      expect(ch).toBeGreaterThanOrEqual(0);
      expect(ch).toBeLessThanOrEqual(255);
    }
  }
}

function expectSortedLightToDark(palette) {
  for (let i = 1; i < palette.length; i++) {
    expect(relativeLuminance(palette[i - 1])).toBeGreaterThanOrEqual(
      relativeLuminance(palette[i])
    );
  }
}

describe('extractPalette', () => {
  it('is deterministic: same input twice gives identical output', () => {
    const a = extractPalette(fiveClusterImage());
    const b = extractPalette(fiveClusterImage());
    expect(a).toEqual(b);
  });

  it('returns exactly 5 colors for a solid-color image', () => {
    const pixels = Array.from({ length: 2000 }, () => [180, 40, 90]);
    const palette = extractPalette(rgbaFrom(pixels));
    expectValidPalette(palette);
    expectSortedLightToDark(palette);
    // The dominant color itself must survive in the palette.
    expect(palette).toContainEqual([180, 40, 90]);
  });

  it('returns exactly 5 colors for a 2-color image', () => {
    const pixels = [];
    for (let i = 0; i < 1500; i++) pixels.push(i % 2 === 0 ? [255, 255, 255] : [10, 10, 10]);
    const palette = extractPalette(rgbaFrom(pixels));
    expectValidPalette(palette);
    expectSortedLightToDark(palette);
    expect(palette).toContainEqual([255, 255, 255]);
    expect(palette).toContainEqual([10, 10, 10]);
  });

  it('returns exactly 5 colors for an empty array', () => {
    const palette = extractPalette(new Uint8ClampedArray(0));
    expectValidPalette(palette);
    expectSortedLightToDark(palette);
  });

  it('returns exactly 5 colors for an all-transparent image', () => {
    const pixels = Array.from({ length: 1000 }, () => [100, 150, 200]);
    const palette = extractPalette(rgbaFrom(pixels, 0));
    expectValidPalette(palette);
    expectSortedLightToDark(palette);
  });

  it('skips low-alpha pixels', () => {
    // Opaque red plus transparent green: green must not appear.
    const opaque = rgbaFrom(Array.from({ length: 500 }, () => [200, 0, 0]));
    const mixed = new Uint8ClampedArray(1000 * 4);
    mixed.set(opaque, 0);
    for (let i = 500; i < 1000; i++) {
      mixed[i * 4] = 0;
      mixed[i * 4 + 1] = 255;
      mixed[i * 4 + 2] = 0;
      mixed[i * 4 + 3] = 50; // below 125 threshold
    }
    const palette = extractPalette(mixed);
    expectValidPalette(palette);
    for (const [, g] of palette.map((c) => [c[0], c[1]])) {
      // No pure-green swatch should exist.
      expect(g === 255).toBe(false);
    }
  });

  it('output is sorted light -> dark by relative luminance', () => {
    const palette = extractPalette(fiveClusterImage());
    expectSortedLightToDark(palette);
  });

  it('recovers ~5 distinct colors from a synthetic 5-cluster image', () => {
    const palette = extractPalette(fiveClusterImage());
    expectValidPalette(palette);

    // All 5 swatches distinct.
    const keys = new Set(palette.map(([r, g, b]) => `${r},${g},${b}`));
    expect(keys.size).toBe(5);

    // Each swatch lands near one of the true cluster centers.
    for (const color of palette) {
      const nearest = Math.min(
        ...CLUSTER_CENTERS.map((c) =>
          Math.sqrt(
            (c[0] - color[0]) ** 2 + (c[1] - color[1]) ** 2 + (c[2] - color[2]) ** 2
          )
        )
      );
      expect(nearest).toBeLessThan(30);
    }
  });

  it('handles a large input quickly via stride sampling', () => {
    // 500x500 image = 250k pixels; sampling caps work at ~10k.
    const size = 500 * 500;
    const data = new Uint8ClampedArray(size * 4);
    for (let i = 0; i < size; i++) {
      data[i * 4] = i % 256;
      data[i * 4 + 1] = (i * 7) % 256;
      data[i * 4 + 2] = (i * 13) % 256;
      data[i * 4 + 3] = 255;
    }
    const start = performance.now();
    const palette = extractPalette(data);
    const elapsed = performance.now() - start;
    expectValidPalette(palette);
    expect(elapsed).toBeLessThan(500);
  });
});
