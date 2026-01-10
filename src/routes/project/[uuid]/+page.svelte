<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { projects } from '$lib/stores';
	import type { Project } from '$lib/stores';
	import ImageCropper from '$lib/components/ImageCropper.svelte';

	let project: Project | undefined;
	let projectName: string = '';
	let rows: number = 0;
	let cols: number = 0;
	let gridColor: string = '#22c55e';
	let gridThickness: number = 2;

	$: {
		const uuid = $page.params.uuid;
		project = $projects.find((p) => p.uuid === uuid);
		if (project) {
			projectName = project.name;
			rows = project.rows ?? 0;
			cols = project.cols ?? 0;
			gridColor = project.gridColor ?? '#22c55e';
			gridThickness = project.gridThickness ?? 2;
		}
	}

	function saveName() {
		if (!project || !projectName.trim()) return;
		projects.updateProject(project.uuid, projectName.trim());
	}

	function clamp01(n: number) {
		if (Number.isNaN(n)) return 0;
		return Math.min(1, Math.max(0, n));
	}

	function updatePoint(idx: number, key: 'x' | 'y', value: number) {
		if (!project) return;
		const pts = project.cropPoints && project.cropPoints.length === 4 ? [...project.cropPoints] : [
			{ x: 0, y: 0 },
			{ x: 1, y: 0 },
			{ x: 1, y: 1 },
			{ x: 0, y: 1 }
		];
		pts[idx] = { ...pts[idx], [key]: clamp01(value) };
		projects.updateProjectCrop(project.uuid, pts);
		project = { ...project, cropPoints: pts }; // ensure local reactive state updates immediately
	}

	function saveGrid() {
		if (!project) return;
		const r = Number(rows) || 0;
		const c = Number(cols) || 0;
		const t = Number(gridThickness) || 0;
		rows = r;
		cols = c;
		gridThickness = t;
		projects.updateProjectGrid(project.uuid, r, c, gridColor, t);
	}

	function handleImageUpload(event: Event) {
		if (!project) return;
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				projects.updateProjectImage(project.uuid, result);
				// reset points for the new image so old points don't linger
				projects.updateProjectCrop(project.uuid, undefined);
			};
			reader.readAsDataURL(file);
		}
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
				onclick={goBack}
				class="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
			>
				← Back to Projects
			</button>
		</div>

		<div class="bg-white rounded-lg shadow p-8">
			{#if project.image}
				<div class="mb-6 relative">
					<ImageCropper
						src={project.image}
						points={project.cropPoints}
						rows={rows}
						cols={cols}
						gridColor={gridColor}
						gridThickness={gridThickness}
						on:change={(e) => projects.updateProjectCrop(project!.uuid, e.detail.points)}
					/>
				</div>
				{#if project.cropPoints && project.cropPoints.length}
					<div class="text-sm text-gray-700 mb-4 space-y-2">
						<p class="font-semibold">Edit points (0..1):</p>
						{#each project.cropPoints as p, i}
							<div class="flex items-center gap-3">
								<span class="w-10">#{i + 1}</span>
								<label class="flex items-center gap-1 text-xs text-gray-600">
									<span>x</span>
									<input
										type="number"
										step="0.001"
										min="0"
										max="1"
										value={p.x}
										oninput={(e) => updatePoint(i, 'x', parseFloat(e.currentTarget.value))}
										class="w-20 px-2 py-1 border border-gray-300 rounded"
									/>
								</label>
								<label class="flex items-center gap-1 text-xs text-gray-600">
									<span>y</span>
									<input
										type="number"
										step="0.001"
										min="0"
										max="1"
										value={p.y}
										oninput={(e) => updatePoint(i, 'y', parseFloat(e.currentTarget.value))}
										class="w-20 px-2 py-1 border border-gray-300 rounded"
									/>
								</label>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-600 mb-4">Click to add up to 4 points; drag blue circles to adjust.</p>
				{/if}
			{/if}

			<div class="mb-6">
				<label for="project-image" class="block text-sm font-medium text-gray-700 mb-2">Project Image</label>
				<input
					id="project-image"
					type="file"
					accept="image/*"
					onchange={handleImageUpload}
					class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
				/>
			</div>
			<div class="mb-6">
				<label for="project-name" class="block text-sm font-medium text-gray-700 mb-2">
					Project Name
				</label>
			<input
				id="project-name"
				type="text"
				bind:value={projectName}
				onchange={saveName}
				placeholder="Enter project name"
				class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
				<p class="font-mono text-gray-800 break-all">{project.uuid}</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
				<div>
					<label for="rows" class="block text-sm font-medium text-gray-700 mb-2">Rows</label>
					<input
						id="rows"
						type="number"
						min="0"
						bind:value={rows}
						onchange={saveGrid}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="cols" class="block text-sm font-medium text-gray-700 mb-2">Cols</label>
					<input
						id="cols"
						type="number"
						min="0"
						bind:value={cols}
						onchange={saveGrid}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label for="grid-color" class="block text-sm font-medium text-gray-700 mb-2">Grid Color</label>
					<input
						id="grid-color"
						type="color"
						bind:value={gridColor}
						onchange={saveGrid}
						class="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg cursor-pointer"
					/>
				</div>
				<div>
					<label for="grid-thickness" class="block text-sm font-medium text-gray-700 mb-2">Grid Thickness</label>
					<input
						id="grid-thickness"
						type="number"
						min="0.5"
						step="0.5"
						bind:value={gridThickness}
						onchange={saveGrid}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			<div class="mb-6">
				<p class="text-sm text-gray-600">
					Created: {new Date(project.createdAt).toLocaleString()}
				</p>
			</div>

			<div class="border-t pt-6">
				<button
					onclick={deleteProject}
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
			onclick={goBack}
			class="text-blue-600 hover:text-blue-800 font-semibold"
		>
			Back to Projects
		</button>
	</div>
{/if}