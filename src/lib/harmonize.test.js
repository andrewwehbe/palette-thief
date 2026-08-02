import { describe, it, expect } from 'vitest';
import { harmonize } from './harmonize.js';

const SAMPLE_PALETTE = [
  [240, 230, 210],
  [200, 120, 60],
  [140, 60, 160],
  [60, 120, 180],
  [25, 20, 30],
];

describe('harmonize', () => {
  it('returns a same-length array of valid RGB ints', () => {
    const out = harmonize(SAMPLE_PALETTE);
    expect(out).toHaveLength(SAMPLE_PALETTE.length);
    for (const color of out) {
      expect(color).toHaveLength(3);
      for (const ch of color) {
        expect(Number.isInteger(ch)).toBe(true);
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
    }
  });

  it('is deterministic: same input twice gives deep-equal output', () => {
    const a = harmonize(SAMPLE_PALETTE);
    const b = harmonize(SAMPLE_PALETTE);
    expect(a).toEqual(b);
  });

  it('does not mutate its input', () => {
    const input = SAMPLE_PALETTE.map((c) => c.slice());
    const snapshot = JSON.parse(JSON.stringify(input));
    harmonize(input);
    expect(input).toEqual(snapshot);
  });

  it('returns a new array (not the same reference)', () => {
    const input = SAMPLE_PALETTE.map((c) => c.slice());
    const out = harmonize(input);
    expect(out).not.toBe(input);
    for (let i = 0; i < input.length; i++) {
      expect(out[i]).not.toBe(input[i]);
    }
  });

  it('leaves near-gray colors untouched', () => {
    const grays = [
      [255, 255, 255],
      [128, 128, 128],
      [0, 0, 0],
    ];
    const out = harmonize(grays);
    expect(out).toEqual(grays);
  });

  it('handles empty and single-color palettes without throwing', () => {
    expect(harmonize([])).toEqual([]);
    const single = harmonize([[200, 50, 50]]);
    expect(single).toHaveLength(1);
    expect(single[0].every((ch) => Number.isInteger(ch))).toBe(true);
  });
});
