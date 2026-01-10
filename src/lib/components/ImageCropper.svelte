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
		brushSize?: number;
		correctionModeActive?: boolean;
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

	// Zoom and pan state for mobile
	let zoomLevel = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	const MIN_ZOOM = 0.5;
	const MAX_ZOOM = 4;
	let lastDistance = 0; // For pinch gesture tracking

	const dispatch = createEventDispatcher<{
		change: { points: Point[] | undefined };
		cellClick: { row: number; col: number; cellIndex: number };
		viewportChange?: { zoom: number; panX: number; panY: number };
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
	let mousePos = $state<{ x: number; y: number } | null>(null);
	let brushSize = $state(props.brushSize ?? 1);
	let isPainting = $state(false);
	let paintedThisStroke = $state<Set<number>>(new Set());
	let isPanning = $state(false);
	let panStartX = $state(0);
	let panStartY = $state(0);
	let panStartPanX = $state(0);
	let panStartPanY = $state(0);
	let isSpacePressed = $state(false);

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
		
		// Apply zoom and pan transformations
		ctx.save();
		ctx.translate(width / 2, height / 2);
		ctx.scale(zoomLevel, zoomLevel);
		ctx.translate(panX * width / zoomLevel, panY * height / zoomLevel);
		ctx.translate(-width / 2, -height / 2);
		
		ctx.drawImage(img, 0, 0, width, height);

		const pts = pointsLocal ?? [];
		if (!showOverlay || pts.length === 0) {
			ctx.restore();
			return;
		}

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

		// Draw brush preview only when correction mode is active
		if (props.correctionModeActive && mousePos && props.brushSize) {
			drawBrushPreview(ctx, mousePos.x, mousePos.y, props.brushSize);
		}
		
		ctx.restore();
	}

	function drawBrushPreview(ctx: CanvasRenderingContext2D, x: number, y: number, brushSize: number) {
		const radius = (brushSize * width) / (2 * colsLocal);
		ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 5]);
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.stroke();
		ctx.setLineDash([]);

		// Draw crosshair
		ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x - 8, y);
		ctx.lineTo(x + 8, y);
		ctx.moveTo(x, y - 8);
		ctx.lineTo(x, y + 8);
		ctx.stroke();
	}

	function handleCanvasClick(e: MouseEvent) {
		e.stopPropagation();
		const rel = toRelative(e.clientX, e.clientY);
		
		// Check if click is on a cell (if in correction mode)
		if (props.correctionModeActive && editable && rowsLocal > 0 && colsLocal > 0 && pointsLocal && pointsLocal.length === 4) {
			const cellInfo = getCellAtPoint(rel, pointsLocal);
			if (cellInfo) {
				// Paint with brush - multiple cells in a radius
				const brush = props.brushSize ?? 1;
				const cellsToFill = getAffectedCells(cellInfo.row, cellInfo.col, brush, rowsLocal, colsLocal);
				for (const idx of cellsToFill) {
					dispatch('cellClick', { row: 0, col: 0, cellIndex: idx });
				}
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

	function getDistance(touches: TouchList): number {
		if (touches.length < 2) return 0;
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getPinchCenter(touches: TouchList): { x: number; y: number } {
		const x = (touches[0].clientX + touches[1].clientX) / 2;
		const y = (touches[0].clientY + touches[1].clientY) / 2;
		return { x, y };
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 2 && !editable) {
			// Only allow pinch zoom when not in edit mode (crop mode)
			lastDistance = getDistance(e.touches);
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 2 && lastDistance > 0 && !editable) {
			e.preventDefault();
			const currentDistance = getDistance(e.touches);
			const scale = currentDistance / lastDistance;
			const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * scale));
			
			const center = getPinchCenter(e.touches);
			const rect = canvas.getBoundingClientRect();
			const centerX = (center.x - rect.left) / rect.width;
			const centerY = (center.y - rect.top) / rect.height;
			
			// Adjust pan to keep pinch center stable
			if (newZoom !== zoomLevel) {
				const zoomDiff = newZoom - zoomLevel;
				panX -= (centerX - 0.5) * zoomDiff / zoomLevel;
				panY -= (centerY - 0.5) * zoomDiff / zoomLevel;
				zoomLevel = newZoom;
				draw();
			}
			lastDistance = currentDistance;
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2) {
			lastDistance = 0;
		}
	}

	function handleWheel(e: WheelEvent) {
		if (!editable && Math.abs(e.deltaY) > 0) {
			e.preventDefault();
			const delta = e.deltaY > 0 ? 0.9 : 1.1;
			const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel * delta));
			
			if (newZoom !== zoomLevel) {
				const rect = canvas.getBoundingClientRect();
				const x = (e.clientX - rect.left) / rect.width;
				const y = (e.clientY - rect.top) / rect.height;
				
				// Zoom towards cursor position
				panX -= (x - 0.5) * (newZoom - zoomLevel) / zoomLevel;
				panY -= (y - 0.5) * (newZoom - zoomLevel) / zoomLevel;
				
				zoomLevel = newZoom;
				draw();
				dispatch('viewportChange', { zoom: zoomLevel, panX, panY });
			}
		}
	}

	function resetZoom() {
		zoomLevel = 1;
		panX = 0;
		panY = 0;
		draw();
		dispatch('viewportChange', { zoom: zoomLevel, panX, panY });
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.code === 'Space') {
			isSpacePressed = true;
			e.preventDefault();
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.code === 'Space') {
			isSpacePressed = false;
		}
	}

	function getAffectedCells(row: number, col: number, brushSize: number, totalRows: number, totalCols: number): number[] {
		const cells: number[] = [];
		const radius = Math.floor(brushSize / 2);
		
		for (let r = Math.max(0, row - radius); r <= Math.min(totalRows - 1, row + radius); r++) {
			for (let c = Math.max(0, col - radius); c <= Math.min(totalCols - 1, col + radius); c++) {
				cells.push(r * totalCols + c);
			}
		}
		
		return cells;
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

		// If in correction mode, start painting immediately
		if (props.correctionModeActive && rowsLocal > 0 && colsLocal > 0 && pointsLocal && pointsLocal.length === 4) {
			isPainting = true;
			paintedThisStroke.clear();
			paintAtPointer(e.clientX, e.clientY);
			(canvas as HTMLElement).setPointerCapture(e.pointerId);
			return;
		}

		// Check if user is trying to pan (spacebar + drag or middle mouse button when zoomed)
		if ((isSpacePressed || e.button === 1) && zoomLevel > MIN_ZOOM) {
			isPanning = true;
			panStartX = e.clientX;
			panStartY = e.clientY;
			panStartPanX = panX;
			panStartPanY = panY;
			(canvas as HTMLElement).setPointerCapture(e.pointerId);
			return;
		}

		// Otherwise, allow dragging crop points - use 44px touch target
		const touchRadius = 44;
		for (let i = 0; i < pts.length; i++) {
			const px = pts[i].x * width;
			const py = pts[i].y * height;
			if (distancePx(px, py, cx, cy) <= touchRadius) {
				draggingIndex = i;
				(canvas as HTMLElement).setPointerCapture(e.pointerId);
				break;
			}
		}
	}

	function onPointerMove(e: PointerEvent) {
		// Track mouse position for brush preview
		const rect = canvas.getBoundingClientRect();
		mousePos = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};

		// If painting, continue painting on move
		if (isPainting && props.correctionModeActive) {
			paintAtPointer(e.clientX, e.clientY);
			return;
		}

		// If panning, update pan position
		if (isPanning && zoomLevel > MIN_ZOOM) {
			const deltaX = (e.clientX - panStartX) / rect.width;
			const deltaY = (e.clientY - panStartY) / rect.height;
			panX = panStartPanX + deltaX;
			panY = panStartPanY + deltaY;
			draw();
			return;
		}

		if (draggingIndex === null) return;
		const rel = toRelative(e.clientX, e.clientY);
		const current = pointsLocal ? [...pointsLocal] : [];
		current[draggingIndex] = rel;
		pointsLocal = current;
		dispatch('change', { points: current });
		draw();
	}

	function onPointerUp(e: PointerEvent) {
		(canvas as HTMLElement).releasePointerCapture(e.pointerId);
		// End painting or dragging or panning
		isPainting = false;
		isPanning = false;
		paintedThisStroke.clear();
		if (draggingIndex !== null) {
			draggingIndex = null;
		}
	}

	function paintAtPointer(clientX: number, clientY: number) {
		if (!(editable && rowsLocal > 0 && colsLocal > 0 && pointsLocal && pointsLocal.length === 4)) return;
		const rel = toRelative(clientX, clientY);
		const cellInfo = getCellAtPoint(rel, pointsLocal);
		if (!cellInfo) return;
		const brush = props.brushSize ?? 1;
		const cellsToFill = getAffectedCells(cellInfo.row, cellInfo.col, brush, rowsLocal, colsLocal);
		for (const idx of cellsToFill) {
			if (!paintedThisStroke.has(idx)) {
				paintedThisStroke.add(idx);
				dispatch('cellClick', { row: 0, col: 0, cellIndex: idx });
			}
		}
	}

	onMount(() => {
		loadImage(props.src);
		const ro = new ResizeObserver(() => updateSize());
		ro.observe(container);
		
		// Add keyboard listeners for spacebar pan
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		
		return () => {
			ro.disconnect();
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
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

	$effect(() => {
		brushSize = props.brushSize ?? 1;
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
		onpointerleave={() => { mousePos = null; draggingIndex = null; isPainting = false; paintedThisStroke.clear(); }}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		onwheel={handleWheel}
		class="block w-full cursor-grab active:cursor-grabbing"
		style="touch-action: none;"
	></canvas>
	{#if zoomLevel > MIN_ZOOM && !editable}
		<button
			onclick={resetZoom}
			class="absolute bottom-2 left-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs z-10"
			aria-label="Reset zoom"
			title="Hold Space + Drag to pan, Scroll to zoom"
		>
			↺ Reset
		</button>
	{/if}
</div>
