import { describe, it, expect } from 'vitest';
import { colorDistance, rgbToHex, hexToRgb } from './colorUtils';

describe('colorUtils', () => {
	describe('rgbToHex', () => {
		it('converts RGB values to hex string', () => {
			expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
			expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
			expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
			expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
			expect(rgbToHex(0, 0, 0)).toBe('#000000');
		});

		it('pads single digit hex values', () => {
			expect(rgbToHex(1, 2, 3)).toBe('#010203');
			expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f');
		});
	});

	describe('hexToRgb', () => {
		it('converts hex string to RGB object', () => {
			expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
			expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
			expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
		});

		it('handles hex without hash', () => {
			expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
		});

		it('returns null for invalid hex', () => {
			expect(hexToRgb('#fff')).toBeNull();
			expect(hexToRgb('invalid')).toBeNull();
			expect(hexToRgb('')).toBeNull();
		});
	});

	describe('colorDistance', () => {
		it('returns 0 for identical colors', () => {
			expect(colorDistance('#ff0000', '#ff0000')).toBe(0);
			expect(colorDistance('#123456', '#123456')).toBe(0);
		});

		it('calculates distance between different colors', () => {
			// Black to white should be sqrt(255^2 + 255^2 + 255^2) ≈ 441.67
			const blackToWhite = colorDistance('#000000', '#ffffff');
			expect(blackToWhite).toBeCloseTo(441.67, 1);

			// Red to green should be sqrt(255^2 + 255^2) ≈ 360.62
			const redToGreen = colorDistance('#ff0000', '#00ff00');
			expect(redToGreen).toBeCloseTo(360.62, 1);
		});

		it('returns infinity for invalid colors', () => {
			expect(colorDistance('#ff0000', 'invalid')).toBe(Number.POSITIVE_INFINITY);
			expect(colorDistance('invalid', '#ff0000')).toBe(Number.POSITIVE_INFINITY);
		});

		it('finds closer colors correctly', () => {
			const redToOrange = colorDistance('#ff0000', '#ff8000');
			const redToBlue = colorDistance('#ff0000', '#0000ff');
			expect(redToOrange).toBeLessThan(redToBlue);
		});
	});
});

describe('color matching logic', () => {
	// Test the color matching algorithm used in drawColorLabels
	function findClosestLabel(
		cellHex: string,
		colorLabels: { hex: string; char: string }[]
	): { hex: string; char: string } | null {
		if (colorLabels.length === 0) return null;

		let closest = colorLabels[0];
		let minDist = colorDistance(cellHex, closest.hex);

		for (let i = 1; i < colorLabels.length; i++) {
			const dist = colorDistance(cellHex, colorLabels[i].hex);
			if (dist < minDist) {
				minDist = dist;
				closest = colorLabels[i];
			}
		}

		return closest;
	}

	it('returns null for empty labels', () => {
		expect(findClosestLabel('#ff0000', [])).toBeNull();
	});

	it('returns exact match when available', () => {
		const labels = [
			{ hex: '#ff0000', char: 'R' },
			{ hex: '#00ff00', char: 'G' },
			{ hex: '#0000ff', char: 'B' }
		];
		expect(findClosestLabel('#ff0000', labels)).toEqual({ hex: '#ff0000', char: 'R' });
		expect(findClosestLabel('#00ff00', labels)).toEqual({ hex: '#00ff00', char: 'G' });
	});

	it('finds closest color when no exact match', () => {
		const labels = [
			{ hex: '#ff0000', char: 'R' },
			{ hex: '#00ff00', char: 'G' },
			{ hex: '#0000ff', char: 'B' }
		];

		// Orange should be closest to red
		expect(findClosestLabel('#ff8000', labels)?.char).toBe('R');

		// Cyan should be closest to... let's calculate
		// Cyan #00ffff: distance to R = sqrt(255^2 + 255^2) ≈ 360.6
		// Cyan #00ffff: distance to G = sqrt(255^2) = 255
		// Cyan #00ffff: distance to B = sqrt(255^2) = 255
		// So cyan is equally close to G and B, will pick first one found (G)
		const cyan = findClosestLabel('#00ffff', labels);
		expect(['G', 'B']).toContain(cyan?.char);

		// Yellow should be closest to green or red
		// Yellow #ffff00: distance to R = sqrt(255^2) = 255
		// Yellow #ffff00: distance to G = sqrt(255^2) = 255
		// Yellow #ffff00: distance to B = sqrt(255^2 + 255^2) ≈ 360.6
		const yellow = findClosestLabel('#ffff00', labels);
		expect(['R', 'G']).toContain(yellow?.char);
	});

	it('handles similar shades correctly', () => {
		const labels = [
			{ hex: '#ff0000', char: 'A' }, // Pure red
			{ hex: '#cc0000', char: 'B' }, // Dark red
			{ hex: '#ff3333', char: 'C' } // Light red
		];

		// A reddish color closer to dark red
		expect(findClosestLabel('#dd0000', labels)?.char).toBe('B');

		// A reddish color closer to light red
		expect(findClosestLabel('#ff4444', labels)?.char).toBe('C');
	});

	it('works with grayscale colors', () => {
		const labels = [
			{ hex: '#000000', char: 'K' }, // Black
			{ hex: '#808080', char: 'G' }, // Gray
			{ hex: '#ffffff', char: 'W' } // White
		];

		expect(findClosestLabel('#333333', labels)?.char).toBe('K');
		expect(findClosestLabel('#999999', labels)?.char).toBe('G');
		expect(findClosestLabel('#dddddd', labels)?.char).toBe('W');
	});
});
