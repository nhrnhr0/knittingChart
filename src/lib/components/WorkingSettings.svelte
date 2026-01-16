<script lang="ts">
	import type { Project, StitchType, Direction } from '$lib/stores';

	interface Props {
		project: Project;
		onUpdate: (partial: Partial<Project>) => void;
	}

	let { project, onUpdate }: Props = $props();
</script>

<div class="border-t pt-6 mb-6">
	<h3 class="text-sm font-semibold text-gray-800 mb-4">Working Settings</h3>
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<!-- Start Direction -->
		<div>
			<span class="block text-sm font-medium text-gray-700 mb-2">Start From</span>
			<div class="flex gap-2">
				<button
					onclick={() => onUpdate({ startFromBottom: true })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						project.startFromBottom
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					↑ Bottom
				</button>
				<button
					onclick={() => onUpdate({ startFromBottom: false })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						!project.startFromBottom
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					↓ Top
				</button>
			</div>
		</div>

		<!-- Starting Stitch -->
		<div>
			<span class="block text-sm font-medium text-gray-700 mb-2">First Row Stitch</span>
			<div class="flex gap-2">
				<button
					onclick={() => onUpdate({ startStitch: 'K' })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						project.startStitch === 'K'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					K (Knit)
				</button>
				<button
					onclick={() => onUpdate({ startStitch: 'P' })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						project.startStitch === 'P'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					P (Perl)
				</button>
			</div>
		</div>

		<!-- Knit Direction -->
		<div>
			<span class="block text-sm font-medium text-gray-700 mb-2">Knit Row Direction</span>
			<div class="flex gap-2">
				<button
					onclick={() => onUpdate({ knitDirection: 'RTL' })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						project.knitDirection === 'RTL'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					← RTL
				</button>
				<button
					onclick={() => onUpdate({ knitDirection: 'LTR' })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						project.knitDirection === 'LTR'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					→ LTR
				</button>
			</div>
		</div>

		<!-- Perl Direction -->
		<div>
			<span class="block text-sm font-medium text-gray-700 mb-2">Perl Row Direction</span>
			<div class="flex gap-2">
				<button
					onclick={() => onUpdate({ perlDirection: 'RTL' })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						project.perlDirection === 'RTL'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					← RTL
				</button>
				<button
					onclick={() => onUpdate({ perlDirection: 'LTR' })}
					class={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
						project.perlDirection === 'LTR'
							? 'bg-blue-600 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
					}`}
				>
					→ LTR
				</button>
			</div>
		</div>
		
		<!-- Highlight Color -->
		<div>
			<span class="block text-sm font-medium text-gray-700 mb-2">Highlight Color</span>
			<input
				type="color"
				value={project.highlightColor?.slice(0, 7)}
				onchange={(e) => {
					const hex = e.currentTarget.value;
					const opacity = project.highlightColor?.match(/[\d.]+\)$/)?.[0].slice(0, -1) || '0.4';
					const r = parseInt(hex.slice(1, 3), 16);
					const g = parseInt(hex.slice(3, 5), 16);
					const b = parseInt(hex.slice(5, 7), 16);
					onUpdate({ highlightColor: `rgba(${r}, ${g}, ${b}, ${opacity})` });
				}}
				class="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
			/>
		</div>

		<!-- Starting Column -->
		<div>
			<span class="block text-sm font-medium text-gray-700 mb-2">Starting Column (0-indexed)</span>
			<input
				type="number"
				value={project.startCol ?? 0}
				onchange={(e) => onUpdate({ startCol: Math.max(0, parseInt(e.currentTarget.value, 10)) })}
				min="0"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	</div>
</div>
