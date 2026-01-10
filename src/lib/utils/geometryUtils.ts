export type Point = { x: number; y: number };

export function distancePx(ax: number, ay: number, bx: number, by: number): number {
	const dx = ax - bx;
	const dy = ay - by;
	return Math.hypot(dx, dy);
}

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

export function lerp(a: Point, b: Point, t: number): Point {
	return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
