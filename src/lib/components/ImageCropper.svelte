<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export type Point = { x: number; y: number }; // normalized [0..1]
	export type ColorLabel = { hex: string; char: string };

	const props = $props<{
		src: string;
		points: Point[] | undefined;
		editable?: boolean;
		maxPoints?: number;
		showOverlay?: boolean;
		rows?: number;
		cols?: number;
		gridColor?: string;
		gridThickness?: number;
		colorLabels?: ColorLabel[];
	}>();
		let {
			src,
			points,
			editable = true,
			maxPoints = 4,
			showOverlay = true,
			rows = 0,
			cols = 0,
			gridColor = '#22c55e',
			gridThickness = 2,
			colorLabels = []
		} = props;
	let rowsLocal = $state<number>(rows ?? 0);
	let colsLocal = $state<number>(cols ?? 0);
		let gridColorLocal = $state<string>(gridColor ?? '#22c55e');
		let gridThicknessLocal = $state<number>(gridThickness ?? 2);
	// Local reactive copy for immediate drawing feedback
	let pointsLocal = $state<Point[] | undefined>(undefined);

	const dispatch = createEventDispatcher<{ change: { points: Point[] | undefined } }>();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let width = $state(0);
	let height = $state(0);
	let img: HTMLImageElement | null = null;
	let imgCanvas: HTMLCanvasElement | null = null;
	let imgCtx: CanvasRenderingContext2D | null = null;
	let draggingIndex: number | null = null;

	function setCanvasSize(w: number, h: number) {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.max(1, Math.floor(w * dpr));
		canvas.height = Math.max(1, Math.floor(h * dpr));
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		ctx = canvas.getContext('2d');
		if (ctx) {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
	}

	function updateSize() {
		if (!container || !img) return;
		const rect = container.getBoundingClientRect();
		const w = rect.width;
		const aspect = img.naturalHeight / img.naturalWidth || 1;
		const h = Math.max(1, Math.round(w * aspect));
		width = w;
		height = h;
		setCanvasSize(width, height);
		draw();
	}

	function loadImage(source: string) {
		const image = new Image();
		image.onload = () => {
			img = image;
			imgCanvas = document.createElement('canvas');
			imgCanvas.width = img.naturalWidth || 1;
			imgCanvas.height = img.naturalHeight || 1;
			imgCtx = imgCanvas.getContext('2d');
			if (imgCtx) {
				imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
				imgCtx.drawImage(img, 0, 0);
			}
			updateSize();
			// initialize default 4-corner points if none
			const hasIncoming = (points && points.length > 0) || (pointsLocal && pointsLocal.length > 0);
			if (!hasIncoming) {
				const defaults: Point[] = [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
					{ x: 1, y: 1 },
					{ x: 0, y: 1 }
				];
				pointsLocal = defaults;
				dispatch('change', { points: defaults });
			}
			draw();
		};
		image.src = source;
	}

	function toRelative(clientX: number, clientY: number): Point {
		const rect = canvas.getBoundingClientRect();
		const x = (clientX - rect.left) / rect.width;
		const y = (clientY - rect.top) / rect.height;
		return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
	}

	function distancePx(ax: number, ay: number, bx: number, by: number) {
		const dx = ax - bx;
		const dy = ay - by;
		return Math.hypot(dx, dy);
	}

	function blend(u: number, v: number, p00: Point, p10: Point, p01: Point, p11: Point): Point {
		// bilinear interpolation in normalized space
		const x =
			(1 - u) * (1 - v) * p00.x +
			u * (1 - v) * p10.x +
			(1 - u) * v * p01.x +
			u * v * p11.x;
		const y =
			(1 - u) * (1 - v) * p00.y +
			u * (1 - v) * p10.y +
			(1 - u) * v * p01.y +
			u * v * p11.y;
		return { x, y };
	}

	function rgbToHex(r: number, g: number, b: number) {
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}

	function sampleAverage(x: number, y: number, size: number) {
		if (!imgCtx || !imgCanvas) return null;
		const half = Math.max(1, Math.floor(size / 2));
		const sx = Math.min(Math.max(0, Math.round(x) - half), imgCanvas.width - 1);
		const sy = Math.min(Math.max(0, Math.round(y) - half), imgCanvas.height - 1);
		const w = Math.min(size, imgCanvas.width - sx);
		const h = Math.min(size, imgCanvas.height - sy);
		const data = imgCtx.getImageData(sx, sy, w, h).data;
		let r = 0, g = 0, b = 0, count = 0;
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

	export function getCellColors(opts: { rows: number; cols: number; sampleSize?: number }) {
		const r = Math.max(0, Math.floor(opts.rows ?? 0));
		const c = Math.max(0, Math.floor(opts.cols ?? 0));
		const sampleSize = Math.max(1, Math.floor(opts.sampleSize ?? 3));
		if (!img || !imgCtx || !imgCanvas) return [];
		if (!pointsLocal || pointsLocal.length !== 4) return [];
		if (r <= 0 || c <= 0) return [];
		const p00 = pointsLocal[0];
		const p10 = pointsLocal[1];
		const p01 = pointsLocal[3];
		const p11 = pointsLocal[2];
		const colors: string[] = [];
		for (let row = 0; row < r; row++) {
			for (let col = 0; col < c; col++) {
				const u0 = col / c;
				const u1 = (col + 1) / c;
				const v0 = row / r;
				const v1 = (row + 1) / r;
				const u = (u0 + u1) / 2;
				const v = (v0 + v1) / 2;
				const pt = blend(u, v, p00, p10, p01, p11);
				const x = pt.x * imgCanvas.width;
				const y = pt.y * imgCanvas.height;
				const rgb = sampleAverage(x, y, sampleSize);
				if (rgb) {
					colors.push(rgbToHex(rgb.r, rgb.g, rgb.b));
				}
			}
		}
		return colors;
	}

	function draw() {
		if (!ctx || !img) return;
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(img, 0, 0, width, height);

		const pts = pointsLocal ?? [];
		if (!showOverlay || pts.length === 0) return;

		const thickness = Math.max(0.5, gridThicknessLocal || 0);
		ctx.lineWidth = thickness;
		ctx.strokeStyle = gridColorLocal;
		ctx.fillStyle = '#3b82f6';

		// grid lines inside quad when rows/cols > 0 and we have 4 points
		if (pts.length === 4) {
			// Internal grid lines = (rows - 1) and (cols - 1)
			const r = Math.max(0, Math.floor(rowsLocal ?? 0));
			const c = Math.max(0, Math.floor(colsLocal ?? 0));
			const lerp = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

			ctx.save();
			ctx.lineWidth = Math.max(0.5, thickness);
			ctx.strokeStyle = gridColorLocal;
			ctx.globalAlpha = 0.6;

			// horizontal lines
			for (let i = 1; i < r; i++) {
				const t = i / r;
				const a = lerp(pts[0], pts[3], t);
				const b = lerp(pts[1], pts[2], t);
				ctx.beginPath();
				ctx.moveTo(a.x * width, a.y * height);
				ctx.lineTo(b.x * width, b.y * height);
				ctx.stroke();
			}

			// vertical lines
			for (let j = 1; j < c; j++) {
				const t = j / c;
				const a = lerp(pts[0], pts[1], t);
				const b = lerp(pts[3], pts[2], t);
				ctx.beginPath();
				ctx.moveTo(a.x * width, a.y * height);
				ctx.lineTo(b.x * width, b.y * height);
				ctx.stroke();
			}

			ctx.restore();

			ctx.lineWidth = thickness;
			ctx.strokeStyle = gridColorLocal;

		// draw color labels on cells
		if (colorLabels && colorLabels.length > 0 && r > 0 && c > 0) {
			ctx.font = 'bold 14px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			for (let row = 0; row < r; row++) {
				for (let col = 0; col < c; col++) {
					const cellIdx = row * c + col;
					if (cellIdx >= colorLabels.length) break;
					const label = colorLabels[cellIdx];
					const u0 = col / c;
					const u1 = (col + 1) / c;
					const v0 = row / r;
					const v1 = (row + 1) / r;
					const u = (u0 + u1) / 2;
					const v = (v0 + v1) / 2;
					const pt = lerp(pts[0], pts[3], v);
					const pt2 = lerp(pts[1], pts[2], v);
					const centerPt = lerp(pt, pt2, u);
					const cx = centerPt.x * width;
					const cy = centerPt.y * height;
					// Draw background circle for label
					ctx.fillStyle = label.hex;
					ctx.beginPath();
					ctx.arc(cx, cy, 12, 0, Math.PI * 2);
					ctx.fill();
					// Draw label text
					ctx.fillStyle = label.textColor ?? '#ffffff';
					ctx.fillText(label.char, cx, cy);
				}
			}
		}
	}

	// quad outline
	ctx.beginPath();
	ctx.moveTo(pts[0].x * width, pts[0].y * height);
	for (let i = 1; i < pts.length; i++) {
		ctx.lineTo(pts[i].x * width, pts[i].y * height);
	}
	ctx.stroke();
	if (pts.length === maxPoints) {
		ctx.beginPath();
		ctx.moveTo(pts[pts.length - 1].x * width, pts[pts.length - 1].y * height);
		ctx.lineTo(pts[0].x * width, pts[0].y * height);
		ctx.stroke();
	}

	// handles
	for (let i = 0; i < pts.length; i++) {
			const px = pts[i].x * width;
			const py = pts[i].y * height;
			ctx.beginPath();
			ctx.arc(px, py, 6, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 2;
			ctx.stroke();
			ctx.strokeStyle = gridColorLocal;
			ctx.lineWidth = thickness;
		}
	}

	function handleCanvasClick(e: MouseEvent) {
		e.stopPropagation();
		if (!editable) return;
		const current = pointsLocal ? [...pointsLocal] : [];
		if (current.length >= maxPoints) return;
		const rel = toRelative(e.clientX, e.clientY);
		current.push(rel);
		pointsLocal = current;
		dispatch('change', { points: current });
		draw();
	}

	function onPointerDown(e: PointerEvent) {
		if (!editable) return;
		const pts = pointsLocal ?? [];
		const rect = canvas.getBoundingClientRect();
		const cx = (e.clientX - rect.left) / rect.width * width;
		const cy = (e.clientY - rect.top) / rect.height * height;
		for (let i = 0; i < pts.length; i++) {
			const px = pts[i].x * width;
			const py = pts[i].y * height;
			if (distancePx(px, py, cx, cy) <= 10) {
				draggingIndex = i;
				(canvas as HTMLElement).setPointerCapture(e.pointerId);
				break;
			}
		}
	}

	function onPointerMove(e: PointerEvent) {
		if (draggingIndex === null) return;
		const rel = toRelative(e.clientX, e.clientY);
		const current = pointsLocal ? [...pointsLocal] : [];
		current[draggingIndex] = rel;
		pointsLocal = current;
		dispatch('change', { points: current });
		draw();
	}

	function onPointerUp(e: PointerEvent) {
		if (draggingIndex === null) return;
		(canvas as HTMLElement).releasePointerCapture(e.pointerId);
		draggingIndex = null;
	}

	onMount(() => {
		loadImage(src);
		const ro = new ResizeObserver(() => updateSize());
		ro.observe(container);
		return () => ro.disconnect();
	});

	$effect(() => {
		// Re-load when src changes
		loadImage(src);
	});

	$effect(() => {
		// sync incoming props to local state and constrain
		const incoming = points ? [...points] : [];
		pointsLocal = incoming.slice(0, maxPoints);
		draw();
	});

	$effect(() => {
		// sync grid props to local state for drawing
		rowsLocal = Number.isFinite(props.rows ?? 0) ? Number(props.rows ?? 0) : 0;
		colsLocal = Number.isFinite(props.cols ?? 0) ? Number(props.cols ?? 0) : 0;
		gridColorLocal = props.gridColor ?? '#22c55e';
		gridThicknessLocal = Number.isFinite(props.gridThickness ?? 0)
			? Number(props.gridThickness ?? 0)
			: 2;
		draw();
	});

	$effect(() => {
		// redraw when color labels change
		props.colorLabels;
		draw();
	});
</script>

<div bind:this={container} class="relative w-full select-none">
	<canvas
		bind:this={canvas}
		onclick={handleCanvasClick}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointerleave={onPointerUp}
		class="block w-full"
	></canvas>
</div>
