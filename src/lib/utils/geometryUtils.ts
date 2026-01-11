export type Point = { x: number; y: number };

/**
 * Calculate Euclidean distance between two points.
 *
 * Formula: sqrt((ax-bx)² + (ay-by)²)
 *
 * @param ax - X coordinate of point A
 * @param ay - Y coordinate of point A
 * @param bx - X coordinate of point B
 * @param by - Y coordinate of point B
 * @returns Distance between the two points
 *
 * @example
 * distancePx(0, 0, 3, 4) // => 5 (3-4-5 triangle)
 * distancePx(10, 20, 10, 20) // => 0 (same point)
 */
export function distancePx(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return Math.hypot(dx, dy);
}

/**
 * Bilinear interpolation in 2D normalized space (0 to 1).
 *
 * Maps a position (u,v) within the normalized unit square to the corresponding position
 * within an arbitrary quadrilateral defined by 4 corner points. This is the core algorithm
 * for perspective-correct grid rendering.
 *
 * The formula performs linear interpolation along each edge first, then interpolates
 * between the two resulting edge points.
 *
 * @param u - Horizontal position in normalized space [0, 1] (0 = left edge, 1 = right edge)
 * @param v - Vertical position in normalized space [0, 1] (0 = top edge, 1 = bottom edge)
 * @param p00 - Top-left corner (at u=0, v=0)
 * @param p10 - Top-right corner (at u=1, v=0)
 * @param p01 - Bottom-left corner (at u=0, v=1)
 * @param p11 - Bottom-right corner (at u=1, v=1)
 * @returns Interpolated point at position (u,v) within the quadrilateral
 *
 * @example
 * // Get the center of a quadrilateral
 * const center = blend(0.5, 0.5, topLeft, topRight, bottomLeft, bottomRight);
 *
 * // Get grid cell (row=3, col=2) center in a 10×10 grid mapped to quadrilateral
 * const rows = 10, cols = 10;
 * const u = (2 + 0.5) / cols;  // Column center in [0,1]
 * const v = (3 + 0.5) / rows;  // Row center in [0,1]
 * const cellCenter = blend(u, v, p00, p10, p01, p11);
 *
 * @remarks
 * This function preserves perspective distortion, making it ideal for mapping a
 * rectangle defined by the quadrilateral to grid cells. This is essential for
 * the knitting pattern designer when the user crops an image with non-rectangular
 * (perspective-skewed) crop points.
 */
export function blend(
	u: number,
	v: number,
	p00: Point,
	p10: Point,
	p01: Point,
	p11: Point
): Point {
	// bilinear interpolation in normalized space
	const x =
		(1 - u) * (1 - v) * p00.x + u * (1 - v) * p10.x + (1 - u) * v * p01.x + u * v * p11.x;
	const y =
		(1 - u) * (1 - v) * p00.y + u * (1 - v) * p10.y + (1 - u) * v * p01.y + u * v * p11.y;
	return { x, y };
}

/**
 * Linear interpolation between two points.
 *
 * Calculates a point along the straight line between point A and point B.
 *
 * Formula: P(t) = A + t(B - A), where t ∈ [0, 1]
 *
 * @param a - Starting point (at t=0)
 * @param b - Ending point (at t=1)
 * @param t - Interpolation parameter [0, 1] (0 = point A, 1 = point B)
 * @returns Interpolated point
 *
 * @example
 * const start = { x: 0, y: 0 };
 * const end = { x: 10, y: 10 };
 * lerp(start, end, 0)   // => { x: 0, y: 0 }
 * lerp(start, end, 0.5) // => { x: 5, y: 5 }
 * lerp(start, end, 1)   // => { x: 10, y: 10 }
 *
 * @remarks
 * Used for drawing grid lines in the knitting pattern designer.
 * Extending t outside [0, 1] will extrapolate beyond the segment.
 */
export function lerp(a: Point, b: Point, t: number): Point {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
