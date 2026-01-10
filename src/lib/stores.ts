import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface Project {
	uuid: string;
	name: string;
	createdAt: number;
	image?: string; // base64 encoded image
	cropPoints?: { x: number; y: number }[]; // normalized [0..1]
	rows?: number;
	cols?: number;
	gridColor?: string;
	gridThickness?: number;
}

const STORAGE_KEY = 'projects';

function createProjectsStore(): Writable<Project[]> & {
	addProject: (project: Project) => void;
	deleteProject: (uuid: string) => void;
	updateProject: (uuid: string, name: string) => void;
	updateProjectImage: (uuid: string, image: string | undefined) => void;
	updateProjectCrop: (uuid: string, points: { x: number; y: number }[] | undefined) => void;
	updateProjectGrid: (
		uuid: string,
		rows: number,
		cols: number,
		gridColor?: string,
		gridThickness?: number
	) => void;
} {
	// Load initial data from localStorage
	let initialData: Project[] = [];
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				initialData = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse projects from localStorage:', e);
			}
		}
	}

	const { subscribe, set, update } = writable<Project[]>(initialData);

	// Subscribe to changes and persist to localStorage
	subscribe((projects) => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
		}
	});

	return {
		subscribe,
		set,
		update,
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
		updateProjectImage(uuid: string, image: string | undefined) {
			update((projects) =>
				projects.map((p) => (p.uuid === uuid ? { ...p, image } : p))
			);
		},
		updateProjectCrop(uuid: string, points: { x: number; y: number }[] | undefined) {
			update((projects) =>
				projects.map((p) => (p.uuid === uuid ? { ...p, cropPoints: points } : p))
			);
		},
		updateProjectGrid(
			uuid: string,
			rows: number,
			cols: number,
			gridColor?: string,
			gridThickness?: number
		) {
			update((projects) =>
				projects.map((p) =>
					p.uuid === uuid
						? {
							...p,
							rows,
							cols,
							gridColor: gridColor ?? p.gridColor,
							gridThickness: gridThickness ?? p.gridThickness
						}
						: p
				)
			);
		}
	};
}

export const projects = createProjectsStore();
