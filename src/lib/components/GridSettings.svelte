<script lang="ts">
	interface Props {
		rows: number;
		cols: number;
		gridColor: string;
		gridThickness: number;
		onGridChange: (rows: number, cols: number, gridColor: string, gridThickness: number) => void;
	}

	let { rows, cols, gridColor, gridThickness, onGridChange }: Props = $props();

	function saveRows(e: Event) {
		const val = Number((e.target as HTMLInputElement).value) || 0;
		onGridChange(val, cols, gridColor, gridThickness);
	}

	function saveCols(e: Event) {
		const val = Number((e.target as HTMLInputElement).value) || 0;
		onGridChange(rows, val, gridColor, gridThickness);
	}

	function saveColor(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		onGridChange(rows, cols, val, gridThickness);
	}

	function saveThickness(e: Event) {
		const val = Number((e.target as HTMLInputElement).value) || 0;
		onGridChange(rows, cols, gridColor, val);
	}
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
	<div>
		<label for="rows" class="block text-sm font-medium text-gray-700 mb-2">Rows</label>
		<input id="rows" type="number" min="0" value={rows} onchange={saveRows}
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
	</div>
	<div>
		<label for="cols" class="block text-sm font-medium text-gray-700 mb-2">Cols</label>
		<input id="cols" type="number" min="0" value={cols} onchange={saveCols}
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
	</div>
	<div>
		<label for="grid-color" class="block text-sm font-medium text-gray-700 mb-2">Grid Color</label>
		<input id="grid-color" type="color" value={gridColor} onchange={saveColor}
			class="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer" />
	</div>
	<div>
		<label for="grid-thickness" class="block text-sm font-medium text-gray-700 mb-2">Grid Thickness</label>
		<input id="grid-thickness" type="number" min="0.5" step="0.5" value={gridThickness} onchange={saveThickness}
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
	</div>
</div>
