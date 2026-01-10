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
		onGoToFirst: () => void;
		onGoToLast: () => void;
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
		onDecrementCol,
		onGoToFirst,
		onGoToLast
	}: Props = $props();
</script>

<div class="bg-white rounded-lg shadow p-3 sm:p-6 mt-6">
	<h2 class="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 text-center">
		Working on Row {displayRowNumber} of {totalRows}
	</h2>

	<div class="space-y-3 sm:space-y-6">
		<!-- Row and Column Navigators - Stack on mobile -->
		<div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-wrap">
			<!-- Row Navigator -->
			<div class="flex items-center gap-2 sm:gap-3">
				<button
					onclick={onDecrementRow}
					disabled={displayRowNumber <= 1}
					class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl sm:text-2xl"
				>
					−
				</button>
				<div class="text-center min-w-[90px] sm:min-w-[100px]">
					<div class="text-lg sm:text-3xl font-bold text-gray-800">Row {displayRowNumber}</div>
					<div class="text-xs sm:text-sm text-gray-500">of {totalRows}</div>
				</div>
				<button
					onclick={onIncrementRow}
					disabled={displayRowNumber >= totalRows}
					class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl sm:text-2xl"
				>
					+
				</button>
			</div>

			<!-- Column Navigator -->
			<div class="flex items-center gap-2 sm:gap-3">
				<button
					onclick={onDecrementCol}
					disabled={currentDirection === 'LTR' ? currentCol <= 1 : currentCol > cols}
					class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-200 hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl sm:text-2xl"
				>
					−
				</button>
				<div class="text-center min-w-[90px] sm:min-w-[100px]">
					<div class="text-lg sm:text-3xl font-bold text-blue-600">Col {currentCol + startCol}</div>
					<div class="text-xs sm:text-sm text-gray-500">of {cols}</div>
				</div>
				<button
					onclick={onIncrementCol}
					disabled={currentDirection === 'LTR' ? currentCol >= cols : currentCol < 1}
					class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-200 hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl sm:text-2xl"
				>
					+
				</button>
			</div>

			<!-- Stitch Type Badge -->
			<div
				class={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-2xl whitespace-nowrap ${
					currentStitchType === 'K'
						? 'bg-purple-100 text-purple-800'
						: 'bg-orange-100 text-orange-800'
				}`}
			>
				{currentStitchType === 'K' ? 'Knit' : 'Perl'}
				<span class="ml-1 sm:ml-2 text-lg sm:text-3xl">{currentDirection === 'LTR' ? '→' : '←'}</span>
			</div>
		</div>

		<!-- Row Pattern - Horizontally scrollable on mobile -->
		<div class="bg-gray-50 rounded-xl p-3 sm:p-6 overflow-x-auto">
			<div class="text-xs sm:text-sm font-medium text-gray-600 mb-2">Row Pattern</div>
			<div class="text-lg sm:text-2xl font-mono font-bold text-gray-800 whitespace-nowrap">
				{currentRowRLE || 'Loading...'}
			</div>
			<div class="text-xs sm:text-sm text-gray-500 mt-2 whitespace-normal">
				{currentDirection === 'LTR' ? 'Reading left → right' : 'Reading right ← left'}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
			<button
				onclick={onGoToFirst}
				class="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-50"
			>
				← Go to Row 1
			</button>
			<button
				onclick={onGoToLast}
				class="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-50"
			>
				Go to Last Row →
			</button>
		</div>
	</div>
</div>
