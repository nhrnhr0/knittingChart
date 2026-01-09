<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { goto } from '$app/navigation';
	import { projects } from '$lib/stores';

	function createNewProject() {
		const uuid = uuidv4();
		const defaultName = uuid.split('-')[uuid.split('-').length - 1];
		const newProject = { uuid, name: defaultName, createdAt: Date.now() };
		projects.addProject(newProject);
		goto(`/project/${uuid}`);
	}
</script>

<div class="container mx-auto p-6">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-4xl font-bold">Projects</h1>
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
					href={`/project/${project.uuid}`}
					class="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition"
				>
					<h2 class="text-xl font-semibold mb-2">{project.name}</h2>
					<p class="text-gray-500 text-sm">ID: {project.uuid}</p>
					<p class="text-gray-400 text-xs mt-2">
						{new Date(project.createdAt).toLocaleDateString()}
					</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
