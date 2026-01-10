<script lang="ts">
	import { projects } from '$lib/stores';
	import type { ColorEntry, Project } from '$lib/stores';

	export let project: Project;

	$: colors = project.colors || [];
	$: correctionMode = project.correctionModeActive || false;
	$: selectedLetter = project.selectedLetter || (colors[0]?.char ?? '');
	$: brushSize = project.brushSize ?? 1;
	$: undoStack = project.__undoStack || [];
	$: redoStack = project.__redoStack || [];
	$: canUndo = undoStack.length > 0;
	$: canRedo = redoStack.length > 0;

	function toggleCorrectionMode() {
		projects.toggleCorrectionMode(project.uuid);
	}

	function selectLetter(letter: string) {
		projects.setCorrectionLetter(project.uuid, letter);
	}

	function setBrush(size: number) {
		projects.setBrushSize(project.uuid, size);
	}

	function undo() {
		projects.undoCorrection(project.uuid);
	}

	function redo() {
		projects.redoCorrection(project.uuid);
	}

	function clearAll() {
		if (confirm('Clear all cell corrections?')) {
			projects.clearCorrections(project.uuid);
		}
	}
</script>

<div class="correction-panel border rounded-lg p-3 sm:p-4 bg-slate-50 space-y-3">
	<!-- Mode Toggle -->
	<div class="flex items-center gap-2">
		<button
			on:click={toggleCorrectionMode}
			class={`px-3 sm:px-4 py-2 rounded font-medium text-sm sm:text-base transition ${
				correctionMode
					? 'bg-blue-500 text-white'
					: 'bg-gray-300 text-gray-700 hover:bg-gray-400'
			}`}
		>
			{correctionMode ? '✏️ Correction Mode ON' : 'Correction Mode OFF'}
		</button>
	</div>

	{#if correctionMode}
		<!-- Brush Size Selector -->
		<div class="space-y-2">
			<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
				<label for="brush-size" class="text-sm font-semibold text-gray-700 whitespace-nowrap">Brush Size:</label>
				<div class="flex flex-1 items-center gap-2">
					<input
						id="brush-size"
						type="range"
						min="1"
						max="5"
						value={brushSize}
						on:change={(e) => setBrush(parseInt(e.currentTarget.value))}
						class="flex-1 min-w-0"
					/>
					<span class="text-sm font-bold bg-blue-100 px-2 sm:px-3 py-1 rounded whitespace-nowrap">{brushSize}×{brushSize}</span>
				</div>
			</div>
		</div>

		<!-- Letter Selector -->
		<div class="space-y-2">
			<div class="text-sm font-semibold text-gray-700">Select Letter to Paint:</div>
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-x-auto">
				{#each colors as color (color.char)}
					<button
						on:click={() => selectLetter(color.char)}
						class={`px-2 sm:px-3 py-2 rounded text-xs sm:text-sm font-bold transition border-2 min-h-10 ${
							selectedLetter === color.char
								? 'border-blue-500 bg-white scale-105'
								: 'border-transparent hover:border-gray-300'
						}`}
						style={`background-color: ${color.hex}; color: ${color.textColor || 'black'};`}
						title={`Select letter ${color.char}`}
					>
						{color.char}
					</button>
				{/each}
			</div>
		</div>

		<!-- Instructions -->
		<p class="text-xs sm:text-sm text-gray-600 bg-blue-50 p-2 rounded">
			💡 Click on cells to paint with <strong>{selectedLetter}</strong> (brush: {brushSize}×{brushSize})
		</p>

		<!-- Undo/Redo/Clear Controls -->
		<div class="flex gap-2 flex-wrap">
			<button
				on:click={undo}
				disabled={!canUndo}
				class={`px-2 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium transition ${
					canUndo
						? 'bg-orange-500 text-white hover:bg-orange-600'
						: 'bg-gray-300 text-gray-500 cursor-not-allowed'
				}`}
			>
				↶ Undo
			</button>
			<button
				on:click={redo}
				disabled={!canRedo}
				class={`px-2 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium transition ${
					canRedo
						? 'bg-orange-500 text-white hover:bg-orange-600'
						: 'bg-gray-300 text-gray-500 cursor-not-allowed'
				}`}
			>
				↷ Redo
			</button>
			<button
				on:click={clearAll}
				class="px-2 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition"
			>
				🗑️ Clear All
			</button>
		</div>
	{/if}
</div>

<style>
	.correction-panel {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
</style>
