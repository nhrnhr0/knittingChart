<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { distancePx, blend } from '$lib/utils/geometryUtils';
	import { createImageCanvas, extractCellColors } from '$lib/utils/imageUtils';
	import {
		drawGrid,
		drawColorLabels,
		drawQuadOutline,
		drawHandles,
		drawHighlight
	} from '$lib/utils/canvasDrawing';

	export type { Point } from '$lib/utils/geometryUtils';
	export type { ColorLabel } from '$lib/utils/canvasDrawing';

	import type { Point } from '$lib/utils/geometryUtils';
	import type { ColorLabel } from '$lib/utils/canvasDrawing';

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
		highlightRow?: number;
		highlightCol?: number;
		highlightDirection?: 'LTR' | 'RTL';
		highlightColor?: string;
		correctedLetters?: Record<number, string>;
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
		gridThickness = 2
	} = props;

	let rowsLocal = $state<number>(rows ?? 0);
	let colsLocal = $state<number>(cols ?? 0);
	let gridColorLocal = $state<string>(gridColor ?? '#22c55e');
	let gridThicknessLocal = $state<number>(gridThickness ?? 2);
	let pointsLocal = $state<Point[] | undefined>(undefined);

	const dispatch = createEventDispatcher<{
		change: { points: Point[] | undefined };
		cellClick: { row: number; col: number; cellIndex: number };
	}>();

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
			const result = createImageCanvas(image);
			if (result) {
				imgCanvas = result.canvas;
				imgCtx = result.ctx;
			}
			updateSize();

			// Initialize default 4-corner points if none
			const hasIncoming =
				(points && points.length > 0) || (pointsLocal && pointsLocal.length > 0);
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

	export function getCellColors(opts: { rows: number; cols: number; sampleSize?: number }) {
		if (!img || !imgCtx || !imgCanvas || !pointsLocal) return [];
		const sampleSize = Math.max(1, Math.floor(opts.sampleSize ?? 3));
		return extractCellColors(
			imgCtx,
			imgCanvas,
			pointsLocal,
			opts.rows ?? 0,
			opts.cols ?? 0,
			sampleSize,
			blend
		);
	}

	function draw() {
		if (!ctx || !img) return;
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(img, 0, 0, width, height);

		const pts = pointsLocal ?? [];
		if (!showOverlay || pts.length === 0) return;

		const thickness = Math.max(0.5, gridThicknessLocal || 0);
		const config = {
			ctx,
			width,
			height,
			points: pts,
			rows: rowsLocal,
			cols: colsLocal,
			gridColor: gridColorLocal,
			gridThickness: thickness,
			colorLabels: props.colorLabels ?? [],
			maxPoints,
			imgCtx,
			imgCanvas,
			correctedLetters: props.correctedLetters
		};

		if (pts.length === 4) {
			// Draw highlight first (behind grid)
			drawHighlight({
				ctx,
				width,
				height,
				points: pts,
				rows: rowsLocal,
				cols: colsLocal,
				highlightRow: props.highlightRow,
				highlightCol: props.highlightCol,
				direction: props.highlightDirection,
				highlightColor: props.highlightColor
			});
			drawGrid(config);
			drawColorLabels(config);
		}

		drawQuadOutline(config);
		drawHandles(config);
	}

	function handleCanvasClick(e: MouseEvent) {
		e.stopPropagation();
		const rel = toRelative(e.clientX, e.clientY);
		
		// Check if click is on a cell (if in correction mode)
		if (editable && rowsLocal > 0 && colsLocal > 0 && pointsLocal && pointsLocal.length === 4) {
			const cellInfo = getCellAtPoint(rel, pointsLocal);
			if (cellInfo) {
				dispatch('cellClick', cellInfo);
				return;
			}
		}
		
		// Otherwise, add a new point
		if (!editable) return;
		const current = pointsLocal ? [...pointsLocal] : [];
		if (current.length >= maxPoints) return;
		current.push(rel);
		pointsLocal = current;
		dispatch('change', { points: current });
		draw();
	}

	function getCellAtPoint(point: Point, quadPoints: Point[]) {
		// Given a normalized point (0-1), determine which cell it's in
		// Use inverse bilinear interpolation or ray casting
		const { x, y } = point;
		
		// Simple approach: for each cell, check if point is inside
		for (let row = 0; row < rowsLocal; row++) {
			for (let col = 0; col < colsLocal; col++) {
				const cellCorners = getCellCornerNormalized(row, col, quadPoints);
				if (pointInQuad(point, cellCorners)) {
					const cellIndex = row * colsLocal + col;
					return { row, col, cellIndex };
				}
			}
		}
		return null;
	}

	function getCellCornerNormalized(row: number, col: number, quadPoints: Point[]): Point[] {
		// Get normalized quad corners for a specific cell using bilinear interpolation
		const normRow = row / rowsLocal;
		const normCol = col / colsLocal;
		const normRowNext = (row + 1) / rowsLocal;
		const normColNext = (col + 1) / colsLocal;

		// Quad points: [0]=TL, [1]=TR, [2]=BR, [3]=BL
		// Bilinear interpolation: blend(u, v, p00, p10, p01, p11)
		const tl = blend(normCol, normRow, quadPoints[0], quadPoints[1], quadPoints[3], quadPoints[2]);
		const tr = blend(normColNext, normRow, quadPoints[0], quadPoints[1], quadPoints[3], quadPoints[2]);
		const bl = blend(normCol, normRowNext, quadPoints[0], quadPoints[1], quadPoints[3], quadPoints[2]);
		const br = blend(normColNext, normRowNext, quadPoints[0], quadPoints[1], quadPoints[3], quadPoints[2]);

		return [tl, tr, br, bl];
	}

	function pointInQuad(point: Point, quad: Point[]): boolean {
		// Simple point-in-quad test using cross product method
		const [p0, p1, p2, p3] = quad;
		const p = point;

		const sign = (x: number) => x > 0 ? 1 : x < 0 ? -1 : 0;
		const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

		const s0 = sign(cross(p0, p1, p));
		const s1 = sign(cross(p1, p2, p));
		const s2 = sign(cross(p2, p3, p));
		const s3 = sign(cross(p3, p0, p));

		return (s0 === s1 && s1 === s2 && s2 === s3) || (s0 === 0 || s1 === 0 || s2 === 0 || s3 === 0);
	}

	function onPointerDown(e: PointerEvent) {
		if (!editable) return;
		const pts = pointsLocal ?? [];
		const rect = canvas.getBoundingClientRect();
		const cx = ((e.clientX - rect.left) / rect.width) * width;
		const cy = ((e.clientY - rect.top) / rect.height) * height;
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
		loadImage(props.src);
		const ro = new ResizeObserver(() => updateSize());
		ro.observe(container);
		return () => ro.disconnect();
	});

	$effect(() => {
		loadImage(props.src);
	});

	$effect(() => {
		const incoming = points ? [...points] : [];
		pointsLocal = incoming.slice(0, maxPoints);
		draw();
	});

	$effect(() => {
		rowsLocal = Number.isFinite(props.rows ?? 0) ? Number(props.rows ?? 0) : 0;
		colsLocal = Number.isFinite(props.cols ?? 0) ? Number(props.cols ?? 0) : 0;
		gridColorLocal = props.gridColor ?? '#22c55e';
		gridThicknessLocal = Number.isFinite(props.gridThickness ?? 0)
			? Number(props.gridThickness ?? 0)
			: 2;
		draw();
	});

	$effect(() => {
		props.colorLabels;
		draw();
	});

	$effect(() => {
		props.highlightRow;
		props.highlightCol;
		props.highlightDirection;
		props.highlightColor;
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
