import type { Point } from './geometryUtils';
import { lerp } from './geometryUtils';

export type ColorLabel = { hex: string; char: string; textColor?: string };

export interface DrawConfig {
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	points: Point[];
	rows: number;
	cols: number;
	gridColor: string;
	gridThickness: number;
	colorLabels: ColorLabel[];
	maxPoints: number;
}

export function drawGrid(config: DrawConfig): void {
	const { ctx, width, height, points, rows, cols, gridColor, gridThickness } = config;

	if (points.length !== 4) return;

	const r = Math.max(0, Math.floor(rows));
	const c = Math.max(0, Math.floor(cols));
	if (r <= 0 || c <= 0) return;

	ctx.save();
	ctx.lineWidth = Math.max(0.5, gridThickness);
	ctx.strokeStyle = gridColor;
	ctx.globalAlpha = 0.6;

	// horizontal lines
	for (let i = 1; i < r; i++) {
		const t = i / r;
		const a = lerp(points[0], points[3], t);
		const b = lerp(points[1], points[2], t);
		ctx.beginPath();
		ctx.moveTo(a.x * width, a.y * height);
		ctx.lineTo(b.x * width, b.y * height);
		ctx.stroke();
	}

	// vertical lines
	for (let j = 1; j < c; j++) {
		const t = j / c;
		const a = lerp(points[0], points[1], t);
		const b = lerp(points[3], points[2], t);
		ctx.beginPath();
		ctx.moveTo(a.x * width, a.y * height);
		ctx.lineTo(b.x * width, b.y * height);
		ctx.stroke();
	}

	ctx.restore();
}

export function drawColorLabels(config: DrawConfig): void {
	const { ctx, width, height, points, rows, cols, colorLabels } = config;

	if (!colorLabels || colorLabels.length === 0 || points.length !== 4) return;

	const r = Math.max(0, Math.floor(rows));
	const c = Math.max(0, Math.floor(cols));
	if (r <= 0 || c <= 0) return;

	// Calculate dynamic sizing
	const avgCellWidth = width / c;
	const avgCellHeight = height / r;
	const minCellDim = Math.min(avgCellWidth, avgCellHeight);
	const circleRadius = Math.max(4, Math.min(12, minCellDim * 0.24));
	const fontSize = Math.max(8, Math.min(14, minCellDim * 0.28));

	ctx.font = `bold ${fontSize}px Arial`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	for (let row = 0; row < r; row++) {
		for (let col = 0; col < c; col++) {
			const cellIdx = row * c + col;
			if (cellIdx >= colorLabels.length) break;

			const label = colorLabels[cellIdx];
			const u = (col + 0.5) / c;
			const v = (row + 0.5) / r;
			const pt = lerp(points[0], points[3], v);
			const pt2 = lerp(points[1], points[2], v);
			const centerPt = lerp(pt, pt2, u);
			const cx = centerPt.x * width;
			const cy = centerPt.y * height;

			// Draw background circle
			ctx.fillStyle = label.hex;
			ctx.beginPath();
			ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
			ctx.fill();

			// Draw label text
			ctx.fillStyle = label.textColor ?? '#ffffff';
			ctx.fillText(label.char, cx, cy);
		}
	}
}

export function drawQuadOutline(config: DrawConfig): void {
	const { ctx, width, height, points, gridColor, gridThickness, maxPoints } = config;

	ctx.lineWidth = gridThickness;
	ctx.strokeStyle = gridColor;

	ctx.beginPath();
	ctx.moveTo(points[0].x * width, points[0].y * height);
	for (let i = 1; i < points.length; i++) {
		ctx.lineTo(points[i].x * width, points[i].y * height);
	}
	ctx.stroke();

	if (points.length === maxPoints) {
		ctx.beginPath();
		ctx.moveTo(points[points.length - 1].x * width, points[points.length - 1].y * height);
		ctx.lineTo(points[0].x * width, points[0].y * height);
		ctx.stroke();
	}
}

export function drawHandles(config: DrawConfig): void {
	const { ctx, width, height, points, gridColor, gridThickness } = config;

	ctx.fillStyle = '#3b82f6';

	for (let i = 0; i < points.length; i++) {
		const px = points[i].x * width;
		const py = points[i].y * height;
		ctx.beginPath();
		ctx.arc(px, py, 6, 0, Math.PI * 2);
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.strokeStyle = gridColor;
		ctx.lineWidth = gridThickness;
	}
}
