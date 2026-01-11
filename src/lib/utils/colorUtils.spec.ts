import { describe, it, expect } from 'vitest';
import {
	rgbToHex,
	hexToRgb,
	colorDistance,
	getLuminance,
	getContrastTextColor
} from './colorUtils';

describe('colorUtils', () => {
	describe('rgbToHex', () => {
		it('converts RGB to hex correctly', () => {
			expect(rgbToHex(255, 0, 255)).toBe('#ff00ff');
			expect(rgbToHex(0, 128, 255)).toBe('#0080ff');
			expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
			expect(rgbToHex(0, 0, 0)).toBe('#000000');
		});

		it('pads single-digit hex values with zeros', () => {
			expect(rgbToHex(1, 2, 3)).toBe('#010203');
			expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f');
		});

		it('handles edge cases', () => {
			expect(rgbToHex(0, 0, 0)).toBe('#000000');
			expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
		});
	});

	describe('hexToRgb', () => {
		it('converts hex to RGB correctly', () => {
			const result1 = hexToRgb('#ff00ff');
			expect(result1).toEqual({ r: 255, g: 0, b: 255 });

			const result2 = hexToRgb('#0080ff');
			expect(result2).toEqual({ r: 0, g: 128, b: 255 });
		});

		it('accepts hex strings without # prefix', () => {
			const result = hexToRgb('ff00ff');
			expect(result).toEqual({ r: 255, g: 0, b: 255 });
		});

		it('handles uppercase and lowercase', () => {
			const result1 = hexToRgb('#FF00FF');
			const result2 = hexToRgb('#ff00ff');
			expect(result1).toEqual(result2);
		});

		it('returns null for invalid hex strings', () => {
			expect(hexToRgb('invalid')).toBeNull();
			expect(hexToRgb('#gggggg')).toBeNull();
			expect(hexToRgb('#fff')).toBeNull();
			expect(hexToRgb('ff00f')).toBeNull();
		});

		it('handles edge case colors', () => {
			expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
			expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
		});
	});

	describe('colorDistance', () => {
		it('returns 0 for identical colors', () => {
			expect(colorDistance('#ff0000', '#ff0000')).toBe(0);
			expect(colorDistance('#000000', '#000000')).toBe(0);
		expect(colorDistance('#123456', '#123456')).toBe(0);
			// Red to green: sqrt(255^2 + 255^2) ≈ 360.62
			expect(colorDistance('#ff0000', '#00ff00')).toBeCloseTo(360.62, 1);

			// Red to blue: sqrt(255^2 + 255^2) ≈ 360.62
			expect(colorDistance('#ff0000', '#0000ff')).toBeCloseTo(360.62, 1);

			// Black to white: sqrt(255^2 * 3) ≈ 441.67
			expect(colorDistance('#000000', '#ffffff')).toBeCloseTo(441.67, 1);
		});

		it('returns Infinity for invalid colors', () => {
			expect(colorDistance('#invalid', '#000000')).toBe(Infinity);
			expect(colorDistance('#000000', '#invalid')).toBe(Infinity);
			expect(colorDistance('#gggggg', '#000000')).toBe(Infinity);
		});

		it('is symmetric', () => {
			expect(colorDistance('#ff0000', '#00ff00')).toBe(colorDistance('#00ff00', '#ff0000'));
		});

		it('handles hex without # prefix', () => {
			expect(colorDistance('ff0000', '00ff00')).toBe(colorDistance('#ff0000', '#00ff00'));
		});
	});

	describe('getLuminance', () => {
		it('returns approximately 1 for white', () => {
			expect(getLuminance('#ffffff')).toBeCloseTo(1, 2);
		});

		it('returns approximately 0 for black', () => {
			expect(getLuminance('#000000')).toBeCloseTo(0, 2);
		});

		it('calculates correct luminance for gray tones', () => {
			// #808080 (middle gray)
			const grayLuminance = getLuminance('#808080');
			expect(grayLuminance).toBeGreaterThan(0);
			expect(grayLuminance).toBeLessThan(1);
			expect(grayLuminance).toBeCloseTo(0.22, 1); // Approximate expected value
		});

		it('green has higher luminance than red', () => {
			const redLuminance = getLuminance('#ff0000');
			const greenLuminance = getLuminance('#00ff00');
			expect(greenLuminance).toBeGreaterThan(redLuminance);
		});

		it('returns 0 for invalid hex', () => {
			expect(getLuminance('#invalid')).toBe(0);
			expect(getLuminance('not a color')).toBe(0);
		});

		it('is monotonic - darker colors have lower luminance', () => {
			const l1 = getLuminance('#333333');
			const l2 = getLuminance('#666666');
			const l3 = getLuminance('#999999');
			expect(l1).toBeLessThan(l2);
			expect(l2).toBeLessThan(l3);
		});
	});

	describe('getContrastTextColor', () => {
		it('returns white text on dark backgrounds', () => {
			expect(getContrastTextColor('#000000')).toBe('#ffffff');
			expect(getContrastTextColor('#330000')).toBe('#ffffff');
			expect(getContrastTextColor('#333333')).toBe('#ffffff');
		});

		it('returns black text on light backgrounds', () => {
			expect(getContrastTextColor('#ffffff')).toBe('#000000');
			expect(getContrastTextColor('#ffff00')).toBe('#000000');
			expect(getContrastTextColor('#cccccc')).toBe('#000000');
		});

		it('handles mid-tone colors correctly', () => {
			// Colors around the threshold should choose one or the other
			const midGray = getContrastTextColor('#808080');
			expect(midGray).toMatch(/^#(000000|ffffff)$/);
		});

		it('uses threshold consistently', () => {
			// Orange (#ff6600) should use black text
			const orange = getContrastTextColor('#ff6600');
			expect(orange).toBe('#000000');

			// Dark blue (#000066) should use white text
			const darkBlue = getContrastTextColor('#000066');
			expect(darkBlue).toBe('#ffffff');
		});

		it('returns valid color regardless of input', () => {
			// Even invalid colors should return something
			const result = getContrastTextColor('#gggggg');
			expect(result).toMatch(/^#(000000|ffffff)$/);
		});
	});
});
