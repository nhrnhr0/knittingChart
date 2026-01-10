<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { projects } from '$lib/stores';
	import type { Project, ColorEntry } from '$lib/stores';
	import ImageCropper, { type Point } from '$lib/components/ImageCropper.svelte';

	let project: Project | undefined;
	let projectName: string = '';
	let rows: number = 0;
	let cols: number = 0;
	let gridColor: string = '#22c55e';
	let gridThickness: number = 2;
	let colors: ColorEntry[] = [];
	let colorThreshold: number = 30;
	let newColorHex: string = '#000000';
	let cropper: ImageCropper | null = null;

	$: {
		const uuid = $page.params.uuid;
		project = $projects.find((p) => p.uuid === uuid);
		if (project) {
			projectName = project.name;
			rows = project.rows ?? 0;
			cols = project.cols ?? 0;
			gridColor = project.gridColor ?? '#22c55e';
			gridThickness = project.gridThickness ?? 2;
			colors = project.colors ?? [];
		}
	}

	function saveName() {
		if (!project || !projectName.trim()) return;
		projects.updateProject(project.uuid, projectName.trim());
	}

	function clamp01(n: number) {
		if (Number.isNaN(n)) return 0;
		return Math.min(1, Math.max(0, n));
	}

	function updatePoint(idx: number, key: 'x' | 'y', value: number) {
		if (!project) return;
		const pts = project.cropPoints && project.cropPoints.length === 4 ? [...project.cropPoints] : [
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 1, y: 1 },
			{ x: 0, y: 1 }
		];
		pts[idx] = { ...pts[idx], [key]: clamp01(value) };
		projects.updateProjectCrop(project.uuid, pts);
		project = { ...project, cropPoints: pts }; // ensure local reactive state updates immediately
	}

	function saveGrid() {
		if (!project) return;
		const r = Number(rows) || 0;
		const c = Number(cols) || 0;
		const t = Number(gridThickness) || 0;
		rows = r;
		cols = c;
		gridThickness = t;
		projects.updateProjectGrid(project.uuid, r, c, gridColor, t);
	}

	function setColors(next: ColorEntry[]) {
		if (!project) return;
		colors = [...next];
		projects.updateProjectColors(project.uuid, colors);
	}

	function removeColor(hex: string) {
		setColors(colors.filter((c) => c.hex.toLowerCase() !== hex.toLowerCase()));
	}

	function addColor(hex: string) {
		const norm = normalizeHex(hex);
		if (!norm) return;
		if (colors.some((c) => c.hex.toLowerCase() === norm.toLowerCase())) return;
		const nextChar = String.fromCharCode(65 + colors.length);
		setColors([...colors, { hex: norm, char: nextChar }]);
	}

	function normalizeHex(hex: string): string | null {
		if (!hex) return null;
		const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
		if (!m) return null;
		return `#${m[1].toLowerCase()}`;
	}

	function hexToRgb(hex: string) {
		const m = normalizeHex(hex);
		if (!m) return null;
		const v = parseInt(m.slice(1), 16);
		return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
	}

	function colorDistance(a: string, b: string) {
		const ra = hexToRgb(a);
		const rb = hexToRgb(b);
		if (!ra || !rb) return Number.POSITIVE_INFINITY;
		const dr = ra.r - rb.r;
		const dg = ra.g - rb.g;
		const db = ra.b - rb.b;
		return Math.sqrt(dr * dr + dg * dg + db * db);
	}

	function dedupeColorsWithThreshold(list: ColorEntry[], threshold: number) {
		const out: ColorEntry[] = [];
		for (const entry of list) {
			const norm = normalizeHex(entry.hex);
			if (!norm) continue;
			if (out.every((o) => colorDistance(o.hex, norm) > threshold)) {
				out.push({ ...entry, hex: norm });
			}
		}
		return out;
	}

	async function autoAddColors() {
		if (!project || !project.image) return;
		if (!cropper || typeof cropper.getCellColors !== 'function') return;
		if (!project.cropPoints || project.cropPoints.length !== 4) return;
		if ((rows ?? 0) <= 0 || (cols ?? 0) <= 0) return;
		const cellColors = await cropper.getCellColors({ rows, cols, sampleSize: 3 });
		const cellEntries = cellColors.map((hex: string, i: number) => ({
			hex,
			char: String.fromCharCode(65 + (colors.length + i)),
			textColor: '#ffffff'
		}));
		const deduped = dedupeColorsWithThreshold(cellEntries, colorThreshold);
		const merged = dedupeColorsWithThreshold([...colors, ...deduped], colorThreshold);
		setColors(merged);
	}

	function handleImageUpload(event: Event) {
		if (!project) return;
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (e: ProgressEvent<FileReader>) => {
				const result = e.target?.result as string;
				projects.updateProjectImage(project!.uuid, result);
				// reset points for the new image so old points don't linger
				projects.updateProjectCrop(project!.uuid, undefined);
			};
			reader.readAsDataURL(file);
		}
	}

	function goBack() {
		goto('/');
	}

	function deleteProject() {
		if (!project) return;
		if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
			projects.deleteProject(project.uuid);
			goto('/');
		}
	}
</script>

{#if project}
	<div class="container mx-auto p-6 max-w-2xl">
		<div class="mb-6">
			<button
				onclick={goBack}
				class="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
			>
				← Back to Projects
			</button>
		</div>

		<div class="bg-white rounded-lg shadow p-8">
			{#if project.image}
				<div class="mb-6 relative">
					<ImageCropper
						bind:this={cropper}
						src={project.image}
						points={project.cropPoints}
						rows={rows}
						cols={cols}
						gridColor={gridColor}
						gridThickness={gridThickness}
						colorLabels={colors}
						on:change={(e: CustomEvent<{ points: Point[] | undefined }>) => projects.updateProjectCrop(project!.uuid, e.detail.points)}
					/>
				</div>
				{#if project.cropPoints && project.cropPoints.length}
					<div class="text-sm text-gray-700 mb-4 space-y-2">
						<p class="font-semibold">Edit points (0..1):</p>
						{#each project.cropPoints as p, i}
							<div class="flex items-center gap-3">
								<span class="w-10">#{i + 1}</span>
								<label class="flex items-center gap-1 text-xs text-gray-600">
									<span>x</span>
									<input
										type="number"
										step="0.001"
										min="0"
										max="1"
										value={p.x}
										oninput={(e) => updatePoint(i, 'x', parseFloat(e.currentTarget.value))}
										class="w-20 px-2 py-1 border border-gray-300 rounded"
									/>
								</label>
								<label class="flex items-center gap-1 text-xs text-gray-600">
									<span>y</span>
									<input
										type="number"
										step="0.001"
										min="0"
										max="1"
										value={p.y}
										oninput={(e) => updatePoint(i, 'y', parseFloat(e.currentTarget.value))}
										class="w-20 px-2 py-1 border border-gray-300 rounded"
									/>
								</label>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-600 mb-4">Click to add up to 4 points; drag blue circles to adjust.</p>
				{/if}
			{/if}

			<div class="mb-6">
				<label for="project-image" class="block text-sm font-medium text-gray-700 mb-2">Project Image</label>
				<input
					id="project-image"
					type="file"
					accept="image/*"
					onchange={handleImageUpload}
					class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
				/>
			</div>
			<div class="mb-6">
				<label for="project-name" class="block text-sm font-medium text-gray-700 mb-2">
					Project Name
				</label>
			<input
				id="project-name"
				type="text"
				bind:value={projectName}
				onchange={saveName}
				placeholder="Enter project name"
				class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
				<p class="font-mono text-gray-800 break-all">{project.uuid}</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
				<div>
					<label for="rows" class="block text-sm font-medium text-gray-700 mb-2">Rows</label>
					<input
						id="rows"
						type="number"
						min="0"
						bind:value={rows}
						onchange={saveGrid}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="cols" class="block text-sm font-medium text-gray-700 mb-2">Cols</label>
					<input
						id="cols"
						type="number"
						min="0"
						bind:value={cols}
						onchange={saveGrid}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="grid-color" class="block text-sm font-medium text-gray-700 mb-2">Grid Color</label>
					<input
						id="grid-color"
						type="color"
						bind:value={gridColor}
						onchange={saveGrid}
						class="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
					/>
				</div>
				<div>
					<label for="grid-thickness" class="block text-sm font-medium text-gray-700 mb-2">Grid Thickness</label>
					<input
						id="grid-thickness"
						type="number"
						min="0.5"
						step="0.5"
						bind:value={gridThickness}
						onchange={saveGrid}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			<div class="mb-6">
				<p class="text-sm text-gray-600">
					Created: {new Date(project.createdAt).toLocaleString()}
				</p>
			</div>

			<div class="border-t pt-6">
				<button
					onclick={deleteProject}
					class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
				>
					Delete Project
				</button>
			</div>
		</div>

		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<p class="text-sm font-semibold text-gray-800">Colors</p>
				<div class="flex items-center gap-3">
					<label class="text-xs text-gray-600 flex items-center gap-2">
						<span>Threshold</span>
						<input
							type="number"
							min="0"
							max="441"
							step="1"
							bind:value={colorThreshold}
							class="w-20 px-2 py-1 border border-gray-300 rounded"
						/>
					</label>
					<button
						onclick={autoAddColors}
						class="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3 py-2 rounded"
					>
						Auto-add colors
					</button>
				</div>
			</div>
			<div class="space-y-3">
				<div class="flex gap-2 items-end">
					<div class="flex-1">
						<label for="new-color" class="block text-xs text-gray-600 mb-1">New color</label>
						<input
							id="new-color"
							type="color"
							class="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
							bind:value={newColorHex}
						/>
					</div>
					<button
						onclick={() => addColor(newColorHex)}
						class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded"
					>
						Add
					</button>
				</div>
			{#if colors.length === 0}
				<p class="text-sm text-gray-600">No colors yet.</p>
			{:else}
				<div class="space-y-2">
					{#each colors as c, idx}
						<div class="flex items-center gap-3 bg-gray-50 p-3 rounded border border-gray-200">
							<div class="flex flex-col items-center gap-1">
								<label class="text-xs font-semibold text-gray-600">Char</label>
								<input
									type="text"
									maxlength="2"
									value={c.char}
									onchange={(e) => {
										const next = [...colors];
										next[idx] = { ...c, char: e.currentTarget.value || 'A' };
										setColors(next);
									}}
									class="w-12 h-8 text-center border border-gray-300 rounded font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>
							<div class="flex flex-col items-center gap-1">
								<label class="text-xs font-semibold text-gray-600">BG Color</label>
								<input
									type="color"
									value={c.hex}
									onchange={(e) => {
										const newColor = normalizeHex(e.currentTarget.value);
										if (newColor) {
											const next = [...colors];
											next[idx] = { ...c, hex: newColor };
											setColors(next);
										}
									}}
									class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
									title="Background color"
								/>
							</div>
							<div class="flex flex-col items-center gap-1">
								<label class="text-xs font-semibold text-gray-600">Text Color</label>
								<input
									type="color"
									value={c.textColor ?? '#ffffff'}
									onchange={(e) => {
										const newColor = normalizeHex(e.currentTarget.value);
										if (newColor) {
											const next = [...colors];
											next[idx] = { ...c, textColor: newColor };
											setColors(next);
										}
									}}
									class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
									title="Text color"
								/>
							</div>
							<div class="flex flex-col gap-1 flex-1">
								<label class="text-xs font-semibold text-gray-600">Hex</label>
								<input
									type="text"
									value={c.hex}
									onchange={(e) => {
										const newColor = normalizeHex(e.currentTarget.value);
										if (newColor) {
											const next = [...colors];
											next[idx] = { ...c, hex: newColor };
											setColors(next);
										}
									}}
									class="px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="#000000"
								/>
							</div>
							<button
								onclick={() => removeColor(c.hex)}
								class="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2 rounded h-10 self-end"
							>
								Delete
							</button>
						</div>
					{/each}
				</div>
			{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="container mx-auto p-6 text-center">
		<p class="text-gray-500 text-lg mb-4">Project not found</p>
		<button
			onclick={goBack}
			class="text-blue-600 hover:text-blue-800 font-semibold"
		>
			Back to Projects
		</button>
	</div>
{/if}