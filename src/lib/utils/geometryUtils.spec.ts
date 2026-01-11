import { describe, it, expect } from 'vitest';
import { distancePx, blend, lerp, type Point } from './geometryUtils';

describe('geometryUtils', () => {
	describe('distancePx', () => {
		it('calculates distance between two points correctly', () => {
			// 3-4-5 right triangle
			expect(distancePx(0, 0, 3, 4)).toBe(5);

			// 45-degree angle
			expect(distancePx(0, 0, 1, 1)).toBeCloseTo(Math.sqrt(2), 5);
		});

		it('returns 0 for identical points', () => {
			expect(distancePx(10, 20, 10, 20)).toBe(0);
			expect(distancePx(0, 0, 0, 0)).toBe(0);
		});

		it('handles negative coordinates', () => {
			expect(distancePx(-3, 0, 0, 4)).toBe(5); // Still 3-4-5 triangle
			expect(distancePx(-5, -5, 0, 0)).toBeCloseTo(Math.sqrt(50), 5);
		});

		it('is symmetric', () => {
			expect(distancePx(0, 0, 3, 4)).toBe(distancePx(3, 4, 0, 0));
		});

		it('handles large coordinates', () => {
			const d = distancePx(1000, 2000, 1003, 2004);
			expect(d).toBeCloseTo(5, 5);
		});
	});

	describe('lerp (linear interpolation)', () => {
		it('returns start point at t=0', () => {
			const result = lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 0);
			expect(result).toEqual({ x: 0, y: 0 });
		});

		it('returns end point at t=1', () => {
			const result = lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 1);
			expect(result).toEqual({ x: 10, y: 10 });
		});

		it('returns midpoint at t=0.5', () => {
			const result = lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5);
			expect(result).toEqual({ x: 5, y: 10 });
		});

		it('interpolates at arbitrary t values', () => {
			const result = lerp({ x: 0, y: 0 }, { x: 100, y: 100 }, 0.25);
			expect(result).toEqual({ x: 25, y: 25 });
		});

		it('extrapolates beyond t=1', () => {
			const result = lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 2);
			expect(result).toEqual({ x: 20, y: 20 });
		});

		it('extrapolates before t=0', () => {
			const result = lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, -1);
			expect(result).toEqual({ x: -10, y: -10 });
		});

		it('handles negative coordinates', () => {
			const result = lerp({ x: -10, y: -10 }, { x: 10, y: 10 }, 0.5);
			expect(result).toEqual({ x: 0, y: 0 });
		});
	});

	describe('blend (bilinear interpolation)', () => {
		const unit_square = {
			p00: { x: 0, y: 0 }, // top-left
			p10: { x: 1, y: 0 }, // top-right
			p01: { x: 0, y: 1 }, // bottom-left
			p11: { x: 1, y: 1 }  // bottom-right
		};

		it('returns p00 at (u=0, v=0)', () => {
			const result = blend(0, 0, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(result).toEqual({ x: 0, y: 0 });
		});

		it('returns p10 at (u=1, v=0)', () => {
			const result = blend(1, 0, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(result).toEqual({ x: 1, y: 0 });
		});

		it('returns p01 at (u=0, v=1)', () => {
			const result = blend(0, 1, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(result).toEqual({ x: 0, y: 1 });
		});

		it('returns p11 at (u=1, v=1)', () => {
			const result = blend(1, 1, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(result).toEqual({ x: 1, y: 1 });
		});

		it('interpolates center correctly for unit square', () => {
			const result = blend(0.5, 0.5, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(result).toEqual({ x: 0.5, y: 0.5 });
		});

		it('interpolates edges correctly for unit square', () => {
			// Middle of top edge
			const topMid = blend(0.5, 0, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(topMid).toEqual({ x: 0.5, y: 0 });

			// Middle of bottom edge
			const botMid = blend(0.5, 1, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(botMid).toEqual({ x: 0.5, y: 1 });

			// Middle of left edge
			const leftMid = blend(0, 0.5, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(leftMid).toEqual({ x: 0, y: 0.5 });

			// Middle of right edge
			const rightMid = blend(1, 0.5, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(rightMid).toEqual({ x: 1, y: 0.5 });
		});

		it('handles quadrilateral (non-rectangular) correctly', () => {
			// A trapezoid: narrower at top
			const trapezoid = {
				p00: { x: 0.25, y: 0 },
				p10: { x: 0.75, y: 0 },
				p01: { x: 0, y: 1 },
				p11: { x: 1, y: 1 }
			};

			// At top (v=0), width is 0.5
			const topCenter = blend(0.5, 0, trapezoid.p00, trapezoid.p10, trapezoid.p01, trapezoid.p11);
			expect(topCenter.x).toBeCloseTo(0.5, 5);
			expect(topCenter.y).toBe(0);

			// At bottom (v=1), width is 1.0
			const botCenter = blend(0.5, 1, trapezoid.p00, trapezoid.p10, trapezoid.p01, trapezoid.p11);
			expect(botCenter.x).toBeCloseTo(0.5, 5);
			expect(botCenter.y).toBe(1);

			// Middle (v=0.5), width should be 0.75
			const midCenter = blend(0.5, 0.5, trapezoid.p00, trapezoid.p10, trapezoid.p01, trapezoid.p11);
			expect(midCenter.x).toBeCloseTo(0.5, 5);
			expect(midCenter.y).toBeCloseTo(0.5, 5);
		});

		it('handles perspective skew correctly', () => {
			// Perspective-skewed quadrilateral (like looking at a rectangle at an angle)
			const perspective = {
				p00: { x: 0.2, y: 0 },   // Top-left, shifted right
				p10: { x: 0.95, y: 0 },  // Top-right, way right
				p01: { x: 0, y: 1 },     // Bottom-left
				p11: { x: 1, y: 1 }      // Bottom-right
			};

			// At v=0 (top), x should go from 0.2 to 0.95
			const top = blend(0.5, 0, perspective.p00, perspective.p10, perspective.p01, perspective.p11);
			expect(top.x).toBeCloseTo(0.575, 2);

			// At v=1 (bottom), x should go from 0 to 1
			const bot = blend(0.5, 1, perspective.p00, perspective.p10, perspective.p01, perspective.p11);
			expect(bot.x).toBeCloseTo(0.5, 2);
		});

		it('handles negative and large coordinates', () => {
			const quad = {
				p00: { x: -10, y: -10 },
				p10: { x: 10, y: -10 },
				p01: { x: -10, y: 10 },
				p11: { x: 10, y: 10 }
			};

			const result = blend(0.5, 0.5, quad.p00, quad.p10, quad.p01, quad.p11);
			expect(result).toEqual({ x: 0, y: 0 });
		});

		it('maintains linearity along edges', () => {
			// u varies, v=0 (top edge)
			const p1 = blend(0.25, 0, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			const p2 = blend(0.75, 0, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			expect(p1.x).toBeCloseTo(0.25, 5);
			expect(p2.x).toBeCloseTo(0.75, 5);
		});

		it('quarter points interpolate correctly', () => {
			const q1 = blend(0.25, 0.25, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			const q2 = blend(0.75, 0.25, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			const q3 = blend(0.25, 0.75, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);
			const q4 = blend(0.75, 0.75, unit_square.p00, unit_square.p10, unit_square.p01, unit_square.p11);

			expect(q1).toEqual({ x: 0.25, y: 0.25 });
			expect(q2).toEqual({ x: 0.75, y: 0.25 });
			expect(q3).toEqual({ x: 0.25, y: 0.75 });
			expect(q4).toEqual({ x: 0.75, y: 0.75 });
		});
	});
});
