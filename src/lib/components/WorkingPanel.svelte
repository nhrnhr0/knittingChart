<script lang="ts">
	import type { StitchType, Direction } from '$lib/stores';

	interface Props {
		displayRowNumber: number;
		totalRows: number;
		currentCol: number;
		cols: number;
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

<div class="bg-white rounded-lg shadow p-6 mt-6">
	<h2 class="text-lg font-semibold text-gray-800 mb-4 text-center">
		Working on Row {displayRowNumber} of {totalRows}
	</h2>

	<div class="space-y-6">
		<!-- Row and Column Navigators -->
		<div class="flex items-center justify-center gap-6 flex-wrap">
			<div class="flex items-center gap-3">
				<button
					onclick={onDecrementRow}
					disabled={displayRowNumber <= 1}
					class="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-2xl"
				>
					−
				</button>
				<div class="text-center min-w-[100px]">
					<div class="text-3xl font-bold text-gray-800">Row {displayRowNumber}</div>
					<div class="text-sm text-gray-500">of {totalRows}</div>
				</div>
				<button
					onclick={onIncrementRow}
					disabled={displayRowNumber >= totalRows}
					class="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-2xl"
				>
					+
				</button>
			</div>

			<!-- Column Navigator -->
			<div class="flex items-center gap-3">
				<button
					onclick={onDecrementCol}
					disabled={currentDirection === 'LTR' ? currentCol <= 1 : currentCol > cols}
					class="w-12 h-12 rounded-full bg-blue-200 hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-2xl"
				>
					−
				</button>
				<div class="text-center min-w-[100px]">
					<div class="text-3xl font-bold text-blue-600">Col {currentCol}</div>
					<div class="text-sm text-gray-500">of {cols}</div>
				</div>
				<button
					onclick={onIncrementCol}
					disabled={currentDirection === 'LTR' ? currentCol >= cols : currentCol < 1}
					class="w-12 h-12 rounded-full bg-blue-200 hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-2xl"
				>
					+
				</button>
			</div>

			<!-- Stitch Type Badge -->
			<div
				class={`px-6 py-3 rounded-xl font-bold text-2xl ${
					currentStitchType === 'K'
						? 'bg-purple-100 text-purple-800'
						: 'bg-orange-100 text-orange-800'
				}`}
			>
				{currentStitchType === 'K' ? 'Knit' : 'Perl'}
				<span class="ml-2 text-3xl">{currentDirection === 'LTR' ? '→' : '←'}</span>
			</div>
		</div>

		<!-- Row Pattern -->
		<div class="bg-gray-50 rounded-xl p-6 text-center">
			<div class="text-sm font-medium text-gray-600 mb-2">Row Pattern</div>
			<div class="text-2xl font-mono font-bold text-gray-800">
				{currentRowRLE || 'Loading...'}
			</div>
			<div class="text-sm text-gray-500 mt-2">
				{currentDirection === 'LTR' ? 'Reading left → right' : 'Reading right ← left'}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="flex justify-center gap-4">
			<button
				onclick={onGoToFirst}
				class="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50"
			>
				← Go to Row 1
			</button>
			<button
				onclick={onGoToLast}
				class="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-50"
			>
				Go to Last Row →
			</button>
		</div>
	</div>
</div>
