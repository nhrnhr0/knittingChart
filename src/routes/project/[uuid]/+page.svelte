<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { projects } from '$lib/stores';
	import type { Project, ColorEntry, WorkingState } from '$lib/stores';
	import type { Point } from '$lib';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import GridSettings from '$lib/components/GridSettings.svelte';
	import ColorPaletteEditor from '$lib/components/ColorPaletteEditor.svelte';
	import WorkingSettings from '$lib/components/WorkingSettings.svelte';
	import WorkingPanel from '$lib/components/WorkingPanel.svelte';
	import { getContrastTextColor } from '$lib/utils/colorUtils';
	import { getStitchType, getRowDirection, getGridRowFromWorking, getDisplayRowNumber, getRowRLE, getDefaultWorkingState } from '$lib/utils/workingUtils';

	let cropper = $state<ImageCropper | null>(null);
	let cellColors = $state<string[]>([]);
	let colorThreshold = $state(75);

	let uuid = $derived($page.params.uuid);
	let project = $derived($projects.find((p) => p.uuid === uuid));
	let workingState = $derived(project?.workingState ?? getDefaultWorkingState());
	let rows = $derived(project?.rows ?? 0);
	let cols = $derived(project?.cols ?? 0);
	let colors = $derived(project?.colors ?? []);
	let currentStitchType = $derived(getStitchType(workingState.currentRow, workingState.startStitch));
	let currentDirection = $derived(getRowDirection(currentStitchType, workingState.knitDirection, workingState.perlDirection));
	let currentGridRow = $derived(getGridRowFromWorking(workingState.currentRow, workingState.startFromBottom, rows));
	let displayRowNumber = $derived(getDisplayRowNumber(workingState.currentRow));
	let currentRowRLE = $derived(getRowRLE(cellColors, currentGridRow, cols, colors, currentDirection));

	async function updateCellColors() {
		if (!cropper || rows <= 0 || cols <= 0) { cellColors = []; return; }
		try { cellColors = await cropper.getCellColors({ rows, cols, sampleSize: 3 }); } catch { cellColors = []; }
	}

	function updateWorkingState(partial: Partial<WorkingState>) {
		if (project) projects.updateProjectWorkingState(project.uuid, partial);
	}

	function handleModeToggle(isWorking: boolean) {
		updateWorkingState({ isActive: isWorking });
		if (isWorking) updateCellColors();
	}

	$effect(() => {
		if (workingState.isActive && cropper) updateCellColors();
	});

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
		const name = (e.target as HTMLInputElement).value.trim();
		if (project && name) projects.updateProject(project.uuid, name);
	}

	function deleteProject() {
		if (project && confirm(`Delete "${project.name}"?`)) {
			projects.deleteProject(project.uuid);
			goto('/');
		}
	}
</script>

{#if project}
	<div class="container mx-auto p-6 max-w-2xl">
		<div class="mb-6 flex items-center justify-between">
			<button onclick={() => goto('/')} class="text-blue-600 hover:text-blue-800 font-semibold">← Back</button>
			<ModeToggle isWorking={workingState.isActive} onToggle={handleModeToggle} />
		</div>
		<div class="bg-white rounded-lg shadow p-8">
			{#if project.image}
				<ImageCropper bind:this={cropper} src={project.image} points={project.cropPoints}
					rows={rows} cols={cols} gridColor={project.gridColor ?? '#22c55e'}
					gridThickness={project.gridThickness ?? 2} colorLabels={colors}
					highlightRow={workingState.isActive ? currentGridRow : undefined}
					highlightCol={workingState.isActive ? workingState.currentCol : undefined}
					highlightDirection={workingState.isActive ? currentDirection : undefined}
					highlightColor={workingState.highlightColor}
					editable={!workingState.isActive} on:change={handleCropChange} />
			{/if}
			{#if !workingState.isActive}
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
				<WorkingSettings {workingState} onUpdate={updateWorkingState} />
				<div class="border-t pt-6">
					<button onclick={deleteProject} class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">Delete</button>
				</div>
			{/if}
		</div>
		{#if workingState.isActive}
			<WorkingPanel {displayRowNumber} totalRows={rows} currentCol={workingState.currentCol + 1} {cols} {currentStitchType} {currentDirection} {currentRowRLE}
				onIncrementRow={() => workingState.currentRow < rows - 1 && updateWorkingState({ currentRow: workingState.currentRow + 1, currentCol: 0 })}
				onDecrementRow={() => workingState.currentRow > 0 && updateWorkingState({ currentRow: workingState.currentRow - 1, currentCol: 0 })}
				onIncrementCol={() => {
					const newCol = currentDirection === 'LTR' 
						? Math.min(workingState.currentCol + 1, cols - 1)
						: Math.max(workingState.currentCol - 1, 0);
					updateWorkingState({ currentCol: newCol });
				}}
				onDecrementCol={() => {
					const newCol = currentDirection === 'LTR'
						? Math.max(workingState.currentCol - 1, 0)
						: Math.min(workingState.currentCol + 1, cols - 1);
					updateWorkingState({ currentCol: newCol });
				}}
				onGoToFirst={() => updateWorkingState({ currentRow: 0, currentCol: 0 })} onGoToLast={() => updateWorkingState({ currentRow: rows - 1, currentCol: 0 })} />
		{/if}
	</div>
{:else}
	<div class="container mx-auto p-6 text-center">
		<p class="text-gray-500 text-lg mb-4">Project not found</p>
		<button onclick={() => goto('/')} class="text-blue-600 hover:text-blue-800 font-semibold">Back</button>
	</div>
{/if}