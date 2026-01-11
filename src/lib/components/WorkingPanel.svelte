<script lang="ts">
	import type { StitchType, Direction } from '$lib/stores';

	interface Props {
		displayRowNumber: number;
		totalRows: number;
		currentCol: number;
		cols: number;
		startCol: number;
		currentStitchType: StitchType;
		currentDirection: Direction;
		currentRowRLE: string;
		onIncrementRow: () => void;
		onDecrementRow: () => void;
		onIncrementCol: () => void;
		onDecrementCol: () => void;
	}

	let {
		displayRowNumber,
		totalRows,
		currentCol,
		cols,
		startCol,
		currentStitchType,
		currentDirection,
		currentRowRLE,
		onIncrementRow,
		onDecrementRow,
		onIncrementCol,
		onDecrementCol
	}: Props = $props();
</script>

<div class="bg-white/95 backdrop-blur-sm rounded-t-2xl shadow-2xl p-2 sm:p-4">
	<div class="space-y-2 sm:space-y-3">
		<!-- Row and Column Navigators - Horizontal on mobile -->
		<div class="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
			<!-- Row Navigator -->
			<div class="flex items-center gap-1 sm:gap-2">
				<button
					onclick={onDecrementRow}
					disabled={displayRowNumber <= 1}
					class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl"
				>
					−
				</button>
				<div class="text-center min-w-[70px] sm:min-w-[90px]">
					<div class="text-base sm:text-2xl font-bold text-gray-800">R {displayRowNumber}</div>
					<div class="text-[10px] sm:text-xs text-gray-500">of {totalRows}</div>
				</div>
				<button
					onclick={onIncrementRow}
					disabled={displayRowNumber >= totalRows}
					class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl"
				>
					+
				</button>
			</div>

			<!-- Column Navigator -->
			<div class="flex items-center gap-1 sm:gap-2">
				<button
					onclick={onDecrementCol}
					disabled={currentDirection === 'LTR' ? currentCol <= 1 : currentCol > cols}
					class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-200 hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl"
				>
					−
				</button>
				<div class="text-center min-w-[70px] sm:min-w-[90px]">
					<div class="text-base sm:text-2xl font-bold text-blue-600">C {currentCol + startCol}</div>
					<div class="text-[10px] sm:text-xs text-gray-500">of {cols}</div>
				</div>
				<button
					onclick={onIncrementCol}
					disabled={currentDirection === 'LTR' ? currentCol >= cols : currentCol < 1}
					class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-200 hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg sm:text-xl"
				>
					+
				</button>
			</div>

			<!-- Stitch Type Badge -->
			<div
				class={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-xs sm:text-lg whitespace-nowrap ${
					currentStitchType === 'K'
						? 'bg-purple-100 text-purple-800'
						: 'bg-orange-100 text-orange-800'
				}`}
			>
				{currentStitchType === 'K' ? 'Knit' : 'Perl'}
				<span class="ml-1 text-sm sm:text-xl">{currentDirection === 'LTR' ? '→' : '←'}</span>
			</div>
		</div>

		<!-- Row Pattern - Horizontally scrollable on mobile -->
		<div class="bg-gray-50 rounded-lg p-2 sm:p-3 overflow-x-auto">
			<div class="text-[10px] sm:text-xs font-medium text-gray-600 mb-1">Pattern</div>
			<div class="text-sm sm:text-xl font-mono font-bold text-gray-800 whitespace-nowrap">
				{currentRowRLE || 'Loading...'}
			</div>
		</div>
	</div>
</div>
