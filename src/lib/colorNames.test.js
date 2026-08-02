import { describe, it, expect } from 'vitest';
import { nearestColorName } from './colorNames.js';
import { cssColors } from '../data/cssColors.js';
import { hexToRgb } from './colorUtils.js';

describe('cssColors data', () => {
  it('has roughly 140+ entries with lowercase names and valid lowercase hex', () => {
    expect(cssColors.length).toBeGreaterThanOrEqual(140);
    for (const { name, hex } of cssColors) {
      expect(name).toBe(name.toLowerCase());
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('has unique names', () => {
    const names = new Set(cssColors.map((c) => c.name));
    expect(names.size).toBe(cssColors.length);
  });
});

describe('nearestColorName', () => {
  it('exact matches return themselves', () => {
    expect(nearestColorName([255, 0, 0])).toBe('red');
    expect(nearestColorName([0, 0, 0])).toBe('black');
    expect(nearestColorName([255, 255, 255])).toBe('white');
    expect(nearestColorName([0, 0, 255])).toBe('blue');
    expect(nearestColorName([255, 165, 0])).toBe('orange');
  });

  it('near-matches snap to the closest name', () => {
    expect(nearestColorName([250, 5, 5])).toBe('red');
    expect(nearestColorName([2, 2, 2])).toBe('black');
    expect(nearestColorName([252, 250, 253])).toBe('snow');
  });

  it('every catalog entry maps back to a name at zero distance', () => {
    for (const { name, hex } of cssColors) {
      const found = nearestColorName(hexToRgb(hex));
      // Aliases (gray/grey etc.) share a hex; accept any name with that hex.
      const validNames = cssColors.filter((c) => c.hex === hex).map((c) => c.name);
      expect(validNames).toContain(found);
      expect(typeof name).toBe('string');
    }
  });
});
