<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { projects } from '$lib/stores';
	import type { Project } from '$lib/stores';

	let project: Project | undefined;
	let projectName: string = '';
	let isSaving = false;

	$: {
		const uuid = $page.params.uuid;
		project = $projects.find((p) => p.uuid === uuid);
		if (project) {
			projectName = project.name;
		}
	}

	async function saveName() {
		if (!project || !projectName.trim()) return;

		isSaving = true;
		projects.updateProject(project.uuid, projectName.trim());

		// Simulate save delay for UX feedback
		await new Promise((resolve) => setTimeout(resolve, 300));
		isSaving = false;
	}

	function goBack() {
		goto('/');
	}

	function deleteProject() {
		if (!project) return;
		if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
			projects.deleteProject(project.uuid);
			goto('/');
		}
	}
</script>

{#if project}
	<div class="container mx-auto p-6 max-w-2xl">
		<div class="mb-6">
			<button
				on:click={goBack}
				class="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
			>
				← Back to Projects
			</button>
		</div>

		<div class="bg-white rounded-lg shadow p-8">
			<div class="mb-6">
				<label for="project-name" class="block text-sm font-medium text-gray-700 mb-2">
					Project Name
				</label>
				<div class="flex gap-2">
					<input
						id="project-name"
						type="text"
						bind:value={projectName}
						on:change={saveName}
						placeholder="Enter project name"
						class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						on:click={saveName}
						disabled={isSaving}
						class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
					>
						{isSaving ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>

			<div class="mb-6 p-4 bg-gray-50 rounded-lg">
				<p class="text-sm text-gray-600 mb-1">Project UUID</p>
				<p class="font-mono text-gray-800 break-all">{project.uuid}</p>
			</div>

			<div class="mb-6">
				<p class="text-sm text-gray-600">
					Created: {new Date(project.createdAt).toLocaleString()}
				</p>
			</div>

			<div class="border-t pt-6">
				<button
					on:click={deleteProject}
					class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
				>
					Delete Project
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="container mx-auto p-6 text-center">
		<p class="text-gray-500 text-lg mb-4">Project not found</p>
		<button
			on:click={goBack}
			class="text-blue-600 hover:text-blue-800 font-semibold"
		>
			Back to Projects
		</button>
	</div>
{/if}