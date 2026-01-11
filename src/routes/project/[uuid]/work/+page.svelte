<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { projects } from '$lib/stores';
	import type { WorkingState } from '$lib/stores';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import WorkingPanel from '$lib/components/WorkingPanel.svelte';
	import { getStitchType, getRowDirection, getGridRowFromWorking, getDisplayRowNumber, getRowRLE, getDefaultWorkingState } from '$lib/utils/workingUtils';

	let cropper = $state<ImageCropper | null>(null);
	let cellColors = $state<string[]>([]);

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
	let currentRowRLE = $derived(getRowRLE(cellColors, currentGridRow, cols, colors, currentDirection, project?.correctedLetters));
	let highlightGridCol = $derived(currentDirection === 'RTL' ? cols - 1 - workingState.currentCol : workingState.currentCol);
	let isOddRow = $derived(displayRowNumber % 2 === 1);

	async function updateCellColors() {
		if (!cropper || rows <= 0 || cols <= 0) { cellColors = []; return; }
		try { cellColors = await cropper.getCellColors({ rows, cols, sampleSize: 3 }); } catch { cellColors = []; }
	}

	function updateWorkingState(partial: Partial<WorkingState>) {
		if (project) projects.updateProjectWorkingState(project.uuid, partial);
	}

	function handleBack() {
		updateWorkingState({ isActive: false });
		goto(`${base}/project/${uuid}`);
	}

	$effect(() => {
		if (project && cropper) {
			// Activate work state when entering this route
			updateWorkingState({ isActive: true });
			updateCellColors();
		}
	});

	// Handle cell clicks for correction mode (if needed in work view)
	function handleCellClick(e: CustomEvent<{ row: number; col: number; cellIndex: number }>) {
		if (!project?.correctionModeActive || !project?.selectedLetter) return;
		const { cellIndex } = e.detail;
		projects.paintCell(project.uuid, cellIndex, project.selectedLetter);
	}
</script>

{#if project}
	<div class="h-screen flex flex-col overflow-hidden bg-gray-900">
		<!-- Header with back button - more compact on mobile -->
		<div class="flex-shrink-0 px-3 py-2 bg-white/95 backdrop-blur-sm shadow-sm">
			<div class="flex items-center justify-between">
				<button onclick={handleBack} class="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-sm sm:text-base">
					<span>←</span>
					<span class="hidden sm:inline">Back to Edit</span>
					<span class="sm:hidden">Back</span>
				</button>
				<h1 class="text-sm sm:text-lg font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">{project.name}</h1>
				<div class="w-16 sm:w-20"></div> <!-- Spacer for centering -->
			</div>
		</div>

		<!-- Main content area - full screen with overlay controls -->
		<div class="flex-1 relative overflow-hidden">
			<!-- Grid area - full screen background -->
			<div class="absolute inset-0 bg-gray-50">
				{#if project.image}
					<div class="h-full w-full flex items-center justify-center">
						<ImageCropper 
							bind:this={cropper} 
							src={project.image} 
							points={project.cropPoints}
							rows={rows} 
							cols={cols} 
							gridColor={project.gridColor ?? '#22c55e'}
							gridThickness={project.gridThickness ?? 2} 
							colorLabels={colors}
							highlightRow={!project?.correctionModeActive ? currentGridRow : undefined}
							highlightCol={!project?.correctionModeActive ? highlightGridCol : undefined}
							highlightDirection={!project?.correctionModeActive ? currentDirection : undefined}
							highlightColor={workingState.highlightColor}
							correctedLetters={project?.correctedLetters}
							brushSize={project?.brushSize}
							correctionModeActive={project?.correctionModeActive}
							editable={project?.correctionModeActive}
							allowPan={true}
							on:cellClick={handleCellClick} />
					</div>
				{:else}
					<div class="h-full flex items-center justify-center">
						<p class="text-gray-500">No image uploaded</p>
					</div>
				{/if}
			</div>

			<!-- Working panel - overlaid at bottom -->
			<div class="absolute bottom-0 left-0 right-0">
				<WorkingPanel
						{displayRowNumber} 
						totalRows={rows} 
						currentCol={workingState.currentCol + 1} 
						{cols} 
						startCol={workingState.startCol} 
						{currentStitchType} 
						{currentDirection} 
						{currentRowRLE}
						onIncrementRow={() => workingState.currentRow < rows - 1 && updateWorkingState({ currentRow: workingState.currentRow + 1, currentCol: 0 })}
						onDecrementRow={() => workingState.currentRow > 0 && updateWorkingState({ currentRow: workingState.currentRow - 1, currentCol: 0 })}
						onIncrementCol={() => {
							const shouldReverse = isOddRow;
							const newCol = shouldReverse
								? (currentDirection === 'LTR' ? Math.max(workingState.currentCol - 1, 0) : Math.min(workingState.currentCol + 1, cols - 1))
								: (currentDirection === 'LTR' ? Math.min(workingState.currentCol + 1, cols - 1) : Math.max(workingState.currentCol - 1, 0));
							updateWorkingState({ currentCol: newCol });
						}}
						onDecrementCol={() => {
							const shouldReverse = isOddRow;
							const newCol = shouldReverse
								? (currentDirection === 'LTR' ? Math.min(workingState.currentCol + 1, cols - 1) : Math.max(workingState.currentCol - 1, 0))
								: (currentDirection === 'LTR' ? Math.max(workingState.currentCol - 1, 0) : Math.min(workingState.currentCol + 1, cols - 1));
							updateWorkingState({ currentCol: newCol });
						}} />
			</div>
		</div>
	</div>
{:else}
	<div class="h-screen flex items-center justify-center">
		<div class="text-center">
			<p class="text-gray-500 text-lg mb-4">Project not found</p>
			<button onclick={() => goto(`${base}/`)} class="text-blue-600 hover:text-blue-800 font-semibold">Back to Projects</button>
		</div>
	</div>
{/if}
