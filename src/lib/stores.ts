import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface Project {
	uuid: string;
	name: string;
	createdAt: number;
}

const STORAGE_KEY = 'projects';

function createProjectsStore(): Writable<Project[]> {
	const { subscribe, set, update } = writable<Project[]>([]);

	// Load from localStorage on creation
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				set(JSON.parse(stored));
			} catch (e) {
				console.error('Failed to parse projects from localStorage:', e);
			}
		}
	}

	return {
		subscribe,
		set(value: Project[]) {
			if (typeof window !== 'undefined') {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			}
			set(value);
		},
		update(fn: (value: Project[]) => Project[]) {
			update((value) => {
				const newValue = fn(value);
				if (typeof window !== 'undefined') {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
				}
				return newValue;
			});
		},
		addProject(project: Project) {
			update((projects) => [...projects, project]);
		},
		deleteProject(uuid: string) {
			update((projects) => projects.filter((p) => p.uuid !== uuid));
		},
		updateProject(uuid: string, name: string) {
			update((projects) =>
				projects.map((p) => (p.uuid === uuid ? { ...p, name } : p))
			);
		},
		getProject(uuid: string): Project | undefined {
			let result: Project | undefined;
			subscribe((projects) => {
				result = projects.find((p) => p.uuid === uuid);
			})();
			return result;
		}
	};
}

export const projects = createProjectsStore();
