import { rgbToHex } from './colorUtils';

export function sampleAverage(
	imgCtx: CanvasRenderingContext2D,
	imgCanvas: HTMLCanvasElement,
	x: number,
	y: number,
	size: number
): { r: number; g: number; b: number } | null {
	const half = Math.max(1, Math.floor(size / 2));
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
	return {
		r: Math.round(r / count),
		g: Math.round(g / count),
		b: Math.round(b / count)
	};
}

export function createImageCanvas(img: HTMLImageElement): {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
} | null {
	const canvas = document.createElement('canvas');
	canvas.width = img.naturalWidth || 1;
	canvas.height = img.naturalHeight || 1;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0);
	return { canvas, ctx };
}

export function extractCellColors(
	imgCtx: CanvasRenderingContext2D,
	imgCanvas: HTMLCanvasElement,
	points: { x: number; y: number }[],
	rows: number,
	cols: number,
	sampleSize: number,
	blend: (
		u: number,
		v: number,
		p00: { x: number; y: number },
		p10: { x: number; y: number },
		p01: { x: number; y: number },
		p11: { x: number; y: number }
	) => { x: number; y: number }
): string[] {
	const r = Math.max(0, Math.floor(rows));
	const c = Math.max(0, Math.floor(cols));
	if (r <= 0 || c <= 0 || points.length !== 4) return [];

	const p00 = points[0];
	const p10 = points[1];
	const p01 = points[3];
	const p11 = points[2];
	const colors: string[] = [];

	for (let row = 0; row < r; row++) {
		for (let col = 0; col < c; col++) {
			const u = (col + 0.5) / c;
			const v = (row + 0.5) / r;
			const pt = blend(u, v, p00, p10, p01, p11);
			const x = pt.x * imgCanvas.width;
			const y = pt.y * imgCanvas.height;
			const rgb = sampleAverage(imgCtx, imgCanvas, x, y, sampleSize);
			if (rgb) {
				colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
			}
		}
	}
	return colors;
}
