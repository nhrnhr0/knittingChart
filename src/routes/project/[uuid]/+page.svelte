<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { projects } from '$lib/stores';
	import type { ColorEntry } from '$lib/stores';
	import type { Point } from '$lib';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import GridSettings from '$lib/components/GridSettings.svelte';
	import ColorPaletteEditor from '$lib/components/ColorPaletteEditor.svelte';
	import CorrectionMode from '$lib/components/CorrectionMode.svelte';
	import { getContrastTextColor } from '$lib/utils/colorUtils';

	let cropper = $state<ImageCropper | null>(null);
	let colorThreshold = $state(75);

	let uuid = $derived($page.params.uuid);
	let project = $derived($projects.find((p) => p.uuid === uuid));
	let rows = $derived(project?.rows ?? 0);
	let cols = $derived(project?.cols ?? 0);
	let colors = $derived(project?.colors ?? []);

	function handleGridChange(r: number, c: number, color: string, thickness: number) {
		if (project) projects.updateProjectGrid(project.uuid, r, c, color, thickness);
	}

	function handleColorsChange(newColors: ColorEntry[]) {
		if (project) projects.updateProjectColors(project.uuid, newColors);
	}

	async function handleAutoAddColors() {
		if (!project?.image || !cropper || !project.cropPoints?.length || rows <= 0 || cols <= 0) return;
		const sampled = await cropper.getCellColors({ rows, cols, sampleSize: 3 });
		const entries = sampled.map((hex: string, i: number) => ({
			hex, char: String.fromCharCode(65 + colors.length + i), textColor: getContrastTextColor(hex)
		}));
		handleColorsChange(dedupeColors([...colors, ...entries], colorThreshold));
	}

	function dedupeColors(list: ColorEntry[], threshold: number): ColorEntry[] {
		const out: ColorEntry[] = [];
		for (const e of list) { const norm = e.hex.toLowerCase(); if (out.every((o) => colorDist(o.hex, norm) > threshold)) out.push({ ...e, hex: norm }); }
		return out;
	}

	function colorDist(a: string, b: string): number {
		const ra = parseInt(a.slice(1, 3), 16), ga = parseInt(a.slice(3, 5), 16), ba = parseInt(a.slice(5, 7), 16);
		const rb = parseInt(b.slice(1, 3), 16), gb = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
		return Math.sqrt((ra - rb) ** 2 + (ga - gb) ** 2 + (ba - bb) ** 2);
	}

	function handleCropChange(e: CustomEvent<{ points: Point[] | undefined }>) {
		if (project) projects.updateProjectCrop(project.uuid, e.detail.points);
	}

	function handleCellClick(e: CustomEvent<{ row: number; col: number; cellIndex: number }>) {
		// Handle cell clicks when in correction mode
		if (!project?.correctionModeActive || !project?.selectedLetter) return;
		const { cellIndex } = e.detail;
		projects.paintCell(project.uuid, cellIndex, project.selectedLetter);
	}

	function handleImageUpload(e: Event) {
		if (!project) return;
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			projects.updateProjectImage(project!.uuid, ev.target?.result as string);
			projects.updateProjectCrop(project!.uuid, undefined);
		};
		reader.readAsDataURL(file);
	}

	function saveName(e: Event) {
		const name = (e.target as HTMLInputElement).value;
		if (project && name.trim()) projects.updateProject(project.uuid, name);
	}

	function deleteProject() {
		if (project && confirm(`Delete "${project.name}"?`)) {
			projects.deleteProject(project.uuid);
			goto(`${base}/`);
		}
	}
</script>

{#if project}
	<div class="container mx-auto p-6 max-w-2xl">
		<div class="mb-6 flex items-center justify-between">
			<button onclick={() => goto(`${base}/`)} class="text-blue-600 hover:text-blue-800 font-semibold">← Back</button>
			<button 
				onclick={() => goto(`${base}/project/${uuid}/work`)}
				class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
			>
				🧶 Start Working
			</button>
		</div>
		<div class="bg-white rounded-lg shadow p-8">
			{#if project.image}
				<ImageCropper bind:this={cropper} src={project.image} points={project.cropPoints}
					rows={rows} cols={cols} gridColor={project.gridColor ?? '#22c55e'}
					gridThickness={project.gridThickness ?? 2} colorLabels={colors}
					correctedLetters={project?.correctedLetters}
					brushSize={project?.brushSize}
					correctionModeActive={project?.correctionModeActive}
					editable={true}
				on:change={handleCropChange}
				on:cellClick={handleCellClick} />
				<CorrectionMode {project} />
			{/if}
			<div class="mb-6">
				<label for="project-image" class="block text-sm font-medium text-gray-700 mb-2">Image</label>
				<input id="project-image" type="file" accept="image/*" onchange={handleImageUpload} class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700" />
			</div>
			<div class="mb-6">
				<label for="project-name" class="block text-sm font-medium text-gray-700 mb-2">Name</label>
				<input id="project-name" type="text" value={project.name} onchange={saveName} class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
			</div>
			<GridSettings rows={rows} cols={cols} gridColor={project.gridColor ?? '#22c55e'} gridThickness={project.gridThickness ?? 2} onGridChange={handleGridChange} />
			<ColorPaletteEditor {colors} {colorThreshold} onColorsChange={handleColorsChange} onAutoAdd={handleAutoAddColors} onThresholdChange={(t) => (colorThreshold = t)} />
			<div class="border-t pt-6">
				<button onclick={deleteProject} class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">Delete</button>
			</div>
		</div>
	</div>
{:else}
	<div class="container mx-auto p-6 text-center">
		<p class="text-gray-500 text-lg mb-4">Project not found</p>
		<button onclick={() => goto(`${base}/`)} class="text-blue-600 hover:text-blue-800 font-semibold">Back</button>
	</div>
{/if}