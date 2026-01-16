<script lang="ts">
	import type { ColorEntry } from '$lib/stores';
	import { getContrastTextColor } from '$lib/utils/colorUtils';

	interface Props {
		colors: ColorEntry[];
		colorThreshold: number;
		onColorsChange: (colors: ColorEntry[]) => void;
		onAutoAdd: () => void;
		onThresholdChange: (threshold: number) => void;
	}

	let { colors, colorThreshold, onColorsChange, onAutoAdd, onThresholdChange }: Props = $props();

	let newColorHex = $state('#000000');

	function normalizeHex(hex: string): string | null {
		if (!hex) return null;
		const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
		if (!m) return null;
		return `#${m[1].toLowerCase()}`;
	}

	function addColor() {
		const norm = normalizeHex(newColorHex);
		if (!norm) return;
		if (colors.some((c) => c.hex.toLowerCase() === norm.toLowerCase())) return;
		const nextChar = String.fromCharCode(65 + colors.length);
		onColorsChange([...colors, { hex: norm, char: nextChar, textColor: getContrastTextColor(norm) }]);
	}

	function removeColor(hex: string) {
		onColorsChange(colors.filter((c) => c.hex.toLowerCase() !== hex.toLowerCase()));
	}

	function updateColor(idx: number, updates: Partial<ColorEntry>) {
		const next = [...colors];
		next[idx] = { ...next[idx], ...updates };
		onColorsChange(next);
	}
</script>

<div class="mb-6 mt-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2 sm:gap-3">
		<p class="text-sm font-semibold text-gray-800">Colors</p>
		<div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
			<label class="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
				<span>Threshold</span>
				<input
					type="number"
					min="0"
					max="441"
					step="1"
					value={colorThreshold}
					onchange={(e) => onThresholdChange(Number(e.currentTarget.value))}
					class="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded text-sm"
				/>
			</label>
			<button
				onclick={onAutoAdd}
				class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded whitespace-nowrap"
			>
				Auto-add colors
			</button>
		</div>
	</div>

	<div class="space-y-3">
		<div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
			<div class="flex-1">
				<label for="new-color" class="block text-xs text-gray-600 mb-1">New color</label>
				<input
					id="new-color"
					type="color"
					class="w-full h-10 sm:h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
					bind:value={newColorHex}
				/>
			</div>
			<button
				onclick={addColor}
				class="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded whitespace-nowrap"
			>
				Add
			</button>
		</div>

		{#if colors.length === 0}
			<p class="text-sm text-gray-600">No colors yet.</p>
		{:else}
			<div class="space-y-2 overflow-x-auto">
				{#each colors as c, idx}
					<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-gray-50 p-2 sm:p-3 rounded border border-gray-200 min-w-full sm:min-w-0">
						<!-- Char Input -->
						<div class="flex flex-col items-start sm:items-center gap-1 min-w-[80px]">
							<span class="text-xs font-semibold text-gray-600">Char</span>
							<input
								type="text"
								maxlength="2"
								value={c.char}
								onchange={(e) => updateColor(idx, { char: e.currentTarget.value || 'A' })}
								class="w-12 h-8 text-center border border-gray-300 rounded font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<!-- BG Color Picker -->
						<div class="flex flex-col items-start sm:items-center gap-1 min-w-[80px]">
							<span class="text-xs font-semibold text-gray-600">Color</span>
							<input
								type="color"
								value={c.hex}
								onchange={(e) => {
									const newColor = normalizeHex(e.currentTarget.value);
									if (newColor) {
										updateColor(idx, { hex: newColor, textColor: getContrastTextColor(newColor) });
									}
								}}
								class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
								title="Color"
							/>
						</div>
						<!-- Text Color Picker -->
						<div class="flex flex-col items-start sm:items-center gap-1 min-w-[80px]">
							<span class="text-xs font-semibold text-gray-600">Text Color</span>
							<input
								type="color"
								value={c.textColor ?? '#ffffff'}
								onchange={(e) => {
									const newColor = normalizeHex(e.currentTarget.value);
									if (newColor) updateColor(idx, { textColor: newColor });
								}}
								class="w-12 h-10 border border-gray-300 rounded cursor-pointer"
								title="Text color"
							/>
						</div>
						<!-- Delete Button -->
						<button
							onclick={() => removeColor(c.hex)}
							class="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-2 rounded h-10 sm:self-end whitespace-nowrap"
						>
							Delete
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
