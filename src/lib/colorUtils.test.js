import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  relativeLuminance,
  contrastRatio,
  textColorFor,
} from './colorUtils.js';

describe('hexToRgb / rgbToHex', () => {
  it('parses full 6-digit hex with and without #', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00ff7f')).toEqual([0, 255, 127]);
  });

  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#abc')).toEqual([170, 187, 204]);
    expect(hexToRgb('fff')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000')).toEqual([0, 0, 0]);
  });

  it('serializes to lowercase #rrggbb', () => {
    expect(rgbToHex([255, 0, 0])).toBe('#ff0000');
    expect(rgbToHex([0, 0, 0])).toBe('#000000');
    expect(rgbToHex([255, 255, 255])).toBe('#ffffff');
    expect(rgbToHex([18, 52, 86])).toBe('#123456');
  });

  it('round-trips hex -> rgb -> hex', () => {
    for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#8a2be2', '#123456']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });
});

describe('rgbToHsl / hslToRgb', () => {
  it('handles known anchors', () => {
    expect(rgbToHsl([0, 0, 0])).toEqual([0, 0, 0]);
    expect(rgbToHsl([255, 255, 255])).toEqual([0, 0, 1]);
    const [h, s, l] = rgbToHsl([255, 0, 0]);
    expect(h).toBeCloseTo(0, 5);
    expect(s).toBeCloseTo(1, 5);
    expect(l).toBeCloseTo(0.5, 5);
    expect(rgbToHsl([0, 255, 0])[0]).toBeCloseTo(120, 5);
    expect(rgbToHsl([0, 0, 255])[0]).toBeCloseTo(240, 5);
  });

  it('round-trips rgb -> hsl -> rgb within +/-1 per channel', () => {
    const colors = [
      [0, 0, 0],
      [255, 255, 255],
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [138, 43, 226],
      [18, 52, 86],
      [200, 130, 70],
    ];
    for (const rgb of colors) {
      const back = hslToRgb(rgbToHsl(rgb));
      for (let c = 0; c < 3; c++) {
        expect(Math.abs(back[c] - rgb[c])).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('relativeLuminance / contrastRatio', () => {
  it('black vs white is exactly 21', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
  });

  it('same color is 1', () => {
    expect(contrastRatio([120, 40, 200], [120, 40, 200])).toBeCloseTo(1, 5);
  });

  it('#777777 vs #ffffff is about 4.48', () => {
    expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 1);
  });

  it('is symmetric and >= 1', () => {
    const a = [10, 200, 30];
    const b = [240, 12, 130];
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
    expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(1);
  });

  it('luminance anchors', () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});

describe('textColorFor', () => {
  it('white background gets dark text', () => {
    expect(textColorFor([255, 255, 255])).toBe('#0e0e11');
  });

  it('black background gets light text', () => {
    expect(textColorFor([0, 0, 0])).toBe('#f7f7f8');
  });

  it('mid-gray (128) is below the 0.5 luminance threshold -> light text', () => {
    expect(relativeLuminance([128, 128, 128])).toBeLessThan(0.5);
    expect(textColorFor([128, 128, 128])).toBe('#f7f7f8');
  });

  it('light yellow gets dark text', () => {
    expect(textColorFor([255, 255, 224])).toBe('#0e0e11');
  });
});
