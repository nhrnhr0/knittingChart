<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { projects } from '$lib/stores';
	import ImageCropper from '$lib/components/ImageCropper.svelte';
	import WorkingPanel from '$lib/components/WorkingPanel.svelte';
	import { getStitchType, getRowDirection, getGridRowFromWorking, getDisplayRowNumber, getRowRLE } from '$lib/utils/workingUtils';

	let cropper = $state<ImageCropper | null>(null);
	let cellColors: string[] = [];

	let uuid = $derived($page.params.uuid);
	let project = $derived($projects.find((p) => p.uuid === uuid));
	// Use flat project fields instead of workingState
	let rows = $derived(project?.rows ?? 0);
	let cols = $derived(project?.cols ?? 0);
	let colors = $derived(project?.colors ?? []);
	let currentStitchType = $derived(getStitchType(project?.currentRow ?? 0, project?.startStitch ?? 'K'));
	let currentDirection = $derived(getRowDirection(currentStitchType, project?.knitDirection ?? 'RTL', project?.perlDirection ?? 'LTR'));
	let currentGridRow = $derived(getGridRowFromWorking(project?.currentRow ?? 0, project?.startFromBottom ?? true, rows));
	let displayRowNumber = $derived(getDisplayRowNumber(project?.currentRow ?? 0));
	let currentRowRLE = $derived(getRowRLE(cellColors, currentGridRow, cols, colors, currentDirection, project?.correctedLetters));
	let highlightGridCol = $derived(currentDirection === 'RTL' ? cols - 1 - (project?.currentCol ?? 0) : (project?.currentCol ?? 0));
	let isOddRow = $derived(displayRowNumber % 2 === 1);


	function updateProjectFields(partial: Partial<Project>) {
		if (project) projects.updateProjectFields(project.uuid, partial);
	}

	function handleBack() {
		updateProjectFields({ isActive: false });
		goto(`${base}/project/${uuid}`);
	}


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
								highlightColor={project?.highlightColor}
							       correctedLetters={project?.correctedLetters}
							       brushSize={project?.brushSize}
							       correctionModeActive={project?.correctionModeActive}
							       editable={project?.correctionModeActive}
							       allowPan={true}
							       allowDragPoints={false}
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
						currentCol={(project?.currentCol ?? 0) + 1} 
						{cols} 
						startCol={project?.startCol ?? 0} 
						{currentStitchType} 
						{currentDirection} 
						{currentRowRLE}
						onIncrementRow={() => (project?.currentRow ?? 0) < rows - 1 && updateProjectFields({ currentRow: (project?.currentRow ?? 0) + 1, currentCol: 0 })}
						onDecrementRow={() => (project?.currentRow ?? 0) > 0 && updateProjectFields({ currentRow: (project?.currentRow ?? 0) - 1, currentCol: 0 })}
						onIncrementCol={() => {
							const shouldReverse = isOddRow;
							const newCol = shouldReverse
								? (currentDirection === 'LTR' ? Math.max((project?.currentCol ?? 0) - 1, 0) : Math.min((project?.currentCol ?? 0) + 1, cols - 1))
								: (currentDirection === 'LTR' ? Math.min((project?.currentCol ?? 0) + 1, cols - 1) : Math.max((project?.currentCol ?? 0) - 1, 0));
							updateProjectFields({ currentCol: newCol });
						}}
						onDecrementCol={() => {
							const shouldReverse = isOddRow;
							const newCol = shouldReverse
								? (currentDirection === 'LTR' ? Math.min((project?.currentCol ?? 0) + 1, cols - 1) : Math.max((project?.currentCol ?? 0) - 1, 0))
								: (currentDirection === 'LTR' ? Math.max((project?.currentCol ?? 0) - 1, 0) : Math.min((project?.currentCol ?? 0) + 1, cols - 1));
							updateProjectFields({ currentCol: newCol });
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
