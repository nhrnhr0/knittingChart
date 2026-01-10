<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { projects } from '$lib/stores';

	function createNewProject() {
		const uuid = uuidv4();
		const defaultName = uuid.split('-')[uuid.split('-').length - 1];
		const newProject = {
			uuid,
			name: defaultName,
			createdAt: Date.now(),
			gridColor: '#22c55e',
			gridThickness: 2,
			colors: []
		};
		projects.addProject(newProject);
		goto(`${base}/project/${uuid}`);
	}
</script>

<div class="container mx-auto p-6">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-4xl font-bold">Knitting Projects</h1>
		<button
			on:click={createNewProject}
			class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
		>
			+ New Project
		</button>
	</div>

	{#if $projects.length === 0}
		<div class="text-center py-12">
			<p class="text-gray-500 text-lg mb-4">No projects yet. Create one to get started!</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each $projects as project (project.uuid)}
				<a
					href={`${base}/project/${project.uuid}`}
					class="block bg-white border border-gray-200 rounded-lg hover:shadow-lg transition overflow-hidden"
				>
					{#if project.image}
						<div class="w-full h-32 bg-gray-100">
							<img
								src={project.image}
								alt={project.name}
								class="w-full h-full object-cover"
							/>
						</div>
					{:else}
						<div class="w-full h-32 bg-gray-100 flex items-center justify-center">
							<span class="text-gray-400 text-sm">No image</span>
						</div>
					{/if}
					<div class="p-4">
						<h2 class="text-xl font-semibold mb-2">{project.name}</h2>
						<p class="text-gray-500 text-sm">ID: {project.uuid}</p>
						<p class="text-gray-400 text-xs mt-2">
							{new Date(project.createdAt).toLocaleDateString()}
						</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
