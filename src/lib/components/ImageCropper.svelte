<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	export type Point = { x: number; y: number }; // normalized [0..1]

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
	// Local reactive copy for immediate drawing feedback
	let pointsLocal = $state<Point[] | undefined>(undefined);

	const dispatch = createEventDispatcher<{ change: { points: Point[] | undefined } }>();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let width = $state(0);
	let height = $state(0);
	let img: HTMLImageElement | null = null;
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
		}

		// lines
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
