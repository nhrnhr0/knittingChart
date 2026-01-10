<script lang="ts">
	interface Props {
		isWorking: boolean;
		onToggle: (isWorking: boolean) => void;
	}

	let { isWorking, onToggle }: Props = $props();
</script>

<div class="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
	<button
		onclick={() => onToggle(false)}
		class={`px-4 py-2 rounded-md text-sm font-medium transition ${
			!isWorking
				? 'bg-white shadow text-gray-900'
				: 'text-gray-600 hover:text-gray-900'
		}`}
	>
		✏️ Edit
	</button>
	<button
		onclick={() => onToggle(true)}
		class={`px-4 py-2 rounded-md text-sm font-medium transition ${
			isWorking
				? 'bg-white shadow text-gray-900'
				: 'text-gray-600 hover:text-gray-900'
		}`}
	>
		🧶 Work
	</button>
</div>
