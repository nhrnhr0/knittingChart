import type { Point } from './geometryUtils';
import { lerp, blend } from './geometryUtils';
import { colorDistance, rgbToHex } from './colorUtils';

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
	imgCtx?: CanvasRenderingContext2D | null;
	imgCanvas?: HTMLCanvasElement | null;
	correctedLetters?: Record<number, string>;
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
	const { ctx, width, height, points, rows, cols, colorLabels, imgCtx, imgCanvas, correctedLetters } = config;

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

	const p00 = points[0];
	const p10 = points[1];
	const p01 = points[3];
	const p11 = points[2];

	for (let row = 0; row < r; row++) {
		for (let col = 0; col < c; col++) {
			const cellIndex = row * c + col;
			const u = (col + 0.5) / c;
			const v = (row + 0.5) / r;

			// Use bilinear interpolation for cell center
			const cellCenter = blend(u, v, p00, p10, p01, p11);
			const cx = cellCenter.x * width;
			const cy = cellCenter.y * height;

			// Find the label - check corrections first
			let label: ColorLabel | null = null;
			let isCorrected = false;

			if (correctedLetters && cellIndex in correctedLetters) {
				// Use corrected letter
				const correctedChar = correctedLetters[cellIndex];
				label = colorLabels.find(l => l.char === correctedChar) ?? null;
				isCorrected = true;
			} else if (imgCtx && imgCanvas) {
				// Sample the color from the image at this cell position
				const imgX = cellCenter.x * imgCanvas.width;
				const imgY = cellCenter.y * imgCanvas.height;
				const cellHex = sampleColorAt(imgCtx, imgCanvas, imgX, imgY);

				if (cellHex) {
					label = findClosestLabel(cellHex, colorLabels);
				}
			}

			if (!label) continue;

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

function sampleColorAt(
	imgCtx: CanvasRenderingContext2D,
	imgCanvas: HTMLCanvasElement,
	x: number,
	y: number
): string | null {
	const size = 3;
	const half = Math.floor(size / 2);
	const sx = Math.min(Math.max(0, Math.round(x) - half), imgCanvas.width - 1);
	const sy = Math.min(Math.max(0, Math.round(y) - half), imgCanvas.height - 1);
	const w = Math.min(size, imgCanvas.width - sx);
	const h = Math.min(size, imgCanvas.height - sy);
	const data = imgCtx.getImageData(sx, sy, w, h).data;

	let r = 0,
		g = 0,
		b = 0,
		count = 0;
	for (let i = 0; i < data.length; i += 4) {
		r += data[i];
		g += data[i + 1];
		b += data[i + 2];
		count++;
	}
	if (count === 0) return null;

	return rgbToHex(Math.round(r / count), Math.round(g / count), Math.round(b / count));
}

function findClosestLabel(cellHex: string, colorLabels: ColorLabel[]): ColorLabel | null {
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

export interface HighlightConfig {
	ctx: CanvasRenderingContext2D;
	width: number;
	height: number;
	points: Point[];
	rows: number;
	cols: number;
	highlightRow?: number; // grid row index to highlight
	highlightCol?: number; // grid col index to highlight
	highlightColor?: string; // color for highlight overlay
	direction?: 'LTR' | 'RTL'; // direction arrow indicator
}

/**
 * Draw highlight overlay on specified row and/or column
 * Also draws direction arrow on the highlighted row
 */
export function drawHighlight(config: HighlightConfig): void {
	const { ctx, width, height, points, rows, cols, highlightRow, highlightCol, highlightColor = 'rgba(59, 130, 246, 0.3)', direction } = config;

	if (points.length !== 4) return;
	if (highlightRow === undefined && highlightCol === undefined) return;

	const r = Math.max(0, Math.floor(rows));
	const c = Math.max(0, Math.floor(cols));
	if (r <= 0 || c <= 0) return;

	const p00 = points[0];
	const p10 = points[1];
	const p01 = points[3];
	const p11 = points[2];

	ctx.save();
	ctx.fillStyle = highlightColor;

	// Draw row highlight
	if (highlightRow !== undefined && highlightRow >= 0 && highlightRow < r) {
		const v0 = highlightRow / r;
		const v1 = (highlightRow + 1) / r;

		// Get the four corners of the row band
		const topLeft = blend(0, v0, p00, p10, p01, p11);
		const topRight = blend(1, v0, p00, p10, p01, p11);
		const bottomLeft = blend(0, v1, p00, p10, p01, p11);
		const bottomRight = blend(1, v1, p00, p10, p01, p11);

		ctx.beginPath();
		ctx.moveTo(topLeft.x * width, topLeft.y * height);
		ctx.lineTo(topRight.x * width, topRight.y * height);
		ctx.lineTo(bottomRight.x * width, bottomRight.y * height);
		ctx.lineTo(bottomLeft.x * width, bottomLeft.y * height);
		ctx.closePath();
		ctx.fill();

		// Draw direction arrow
		if (direction) {
			const centerY = (topLeft.y + bottomLeft.y) / 2 * height;
			const leftX = topLeft.x * width;
			const rightX = topRight.x * width;
			const arrowSize = Math.min(20, (rightX - leftX) * 0.1);
			const padding = 10;

			ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 2;

			if (direction === 'LTR') {
				// Arrow pointing right on the left side
				const arrowX = leftX + padding;
				ctx.beginPath();
				ctx.moveTo(arrowX, centerY - arrowSize / 2);
				ctx.lineTo(arrowX + arrowSize, centerY);
				ctx.lineTo(arrowX, centerY + arrowSize / 2);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			} else {
				// Arrow pointing left on the right side
				const arrowX = rightX - padding;
				ctx.beginPath();
				ctx.moveTo(arrowX, centerY - arrowSize / 2);
				ctx.lineTo(arrowX - arrowSize, centerY);
				ctx.lineTo(arrowX, centerY + arrowSize / 2);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
		}
	}

	// Draw column highlight (with different opacity to show intersection)
	if (highlightCol !== undefined && highlightCol >= 0 && highlightCol < c) {
		ctx.fillStyle = highlightColor;
		const u0 = highlightCol / c;
		const u1 = (highlightCol + 1) / c;

		// Get the four corners of the column band
		const topLeft = blend(u0, 0, p00, p10, p01, p11);
		const topRight = blend(u1, 0, p00, p10, p01, p11);
		const bottomLeft = blend(u0, 1, p00, p10, p01, p11);
		const bottomRight = blend(u1, 1, p00, p10, p01, p11);

		ctx.beginPath();
		ctx.moveTo(topLeft.x * width, topLeft.y * height);
		ctx.lineTo(topRight.x * width, topRight.y * height);
		ctx.lineTo(bottomRight.x * width, bottomRight.y * height);
		ctx.lineTo(bottomLeft.x * width, bottomLeft.y * height);
		ctx.closePath();
		ctx.fill();
	}

	ctx.restore();
}
