import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface ColorEntry {
	hex: string;
	char: string;
	textColor?: string; // color for the text label
}

export type StitchType = 'K' | 'P';
export type Direction = 'LTR' | 'RTL';



export interface ViewportState {
	zoomLevel: number; // 1.0 = 100%, 2.0 = 200%
	panX: number; // normalized pan offset
	panY: number; // normalized pan offset
}

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
	colors?: ColorEntry[];
	// --- Former WorkingState fields ---
	currentRow?: number;
	currentCol?: number;
	startFromBottom?: boolean;
	startStitch?: StitchType;
	knitDirection?: Direction;
	perlDirection?: Direction;
	highlightColor?: string;
	startCol?: number; // Removed stray 'g;'
	// --- End WorkingState fields ---
	correctedLetters?: Record<number, string>; // cell corrections, independent of mode
	correctionModeActive?: boolean; // true when in cell correction/painting mode
	selectedLetter?: string; // currently selected letter for painting
	brushSize?: number; // brush radius in cells (1-5)
	viewportState?: ViewportState; // zoom and pan state
	__undoStack?: Array<Record<number, string>>; // internal undo stack
	__redoStack?: Array<Record<number, string>>; // internal redo stack
}

const STORAGE_KEY = 'projects';

function createProjectsStore(): Writable<Project[]> & {
	addProject: (project: Project) => void;
	deleteProject: (uuid: string) => void;
	updateProject: (uuid: string, name: string) => void;
	updateProjectImage: (uuid: string, image: string | undefined) => void;
	updateProjectCrop: (uuid: string, points: { x: number; y: number }[] | undefined) => void;
	updateProjectFields: (uuid: string, fields: Partial<Project>) => void;
	updateProjectGrid: (
		uuid: string,
		rows: number,
		cols: number,
		gridColor?: string,
		gridThickness?: number
	) => void;
	updateProjectColors: (uuid: string, colors: ColorEntry[]) => void;
	paintCell: (uuid: string, cellIndex: number, letter: string) => void;
	undoCorrection: (uuid: string) => void;
	redoCorrection: (uuid: string) => void;
	clearCorrections: (uuid: string) => void;
	toggleCorrectionMode: (uuid: string) => void;
	setCorrectionLetter: (uuid: string, letter: string) => void;
	setBrushSize: (uuid: string, size: number) => void;
	updateViewportState: (uuid: string, viewportState: Partial<ViewportState>) => void;
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
		},
		updateProjectColors(uuid: string, colors: ColorEntry[]) {
			update((projects) =>
				projects.map((p) => (p.uuid === uuid ? { ...p, colors: [...colors] } : p))
			);
		},
		updateProjectFields(uuid: string, fields: Partial<Project>) {
			update((projects) =>
				projects.map((p) =>
					p.uuid === uuid
						? {
							...p,
							...fields
						}
						: p
				)
			);
		},
		paintCell(uuid: string, cellIndex: number, letter: string) {
			update((projects) =>
				projects.map((p) => {
					if (p.uuid !== uuid) return p;
					const corrected = { ...(p.correctedLetters || {}) };
					const undoStack = p.__undoStack || [];
					const redoStack = p.__redoStack || [];
					
					undoStack.push({ ...corrected });
					corrected[cellIndex] = letter;
					
					return {
						...p,
						correctedLetters: corrected,
						__undoStack: undoStack,
						__redoStack: []
					};
				})
			);
		},
		undoCorrection(uuid: string) {
			update((projects) =>
				projects.map((p) => {
					if (p.uuid !== uuid) return p;
					const undoStack = p.__undoStack || [];
					if (undoStack.length === 0) return p;
					
					const prev = undoStack[undoStack.length - 1];
					const redoStack = p.__redoStack || [];
					redoStack.push(p.correctedLetters || {});
					
					return {
						...p,
						correctedLetters: prev,
						__undoStack: undoStack.slice(0, -1),
						__redoStack: redoStack
					};
				})
			);
		},
		redoCorrection(uuid: string) {
			update((projects) =>
				projects.map((p) => {
					if (p.uuid !== uuid) return p;
					const redoStack = p.__redoStack || [];
					if (redoStack.length === 0) return p;
					
					const next = redoStack[redoStack.length - 1];
					const undoStack = p.__undoStack || [];
					undoStack.push(p.correctedLetters || {});
					
					return {
						...p,
						correctedLetters: next,
						__undoStack: undoStack,
						__redoStack: redoStack.slice(0, -1)
					};
				})
			);
		},
		clearCorrections(uuid: string) {
			update((projects) =>
				projects.map((p) => {
					if (p.uuid !== uuid) return p;
					return {
						...p,
						correctedLetters: {},
						__undoStack: [],
						__redoStack: []
					};
				})
			);
		},
		toggleCorrectionMode(uuid: string) {
			update((projects) =>
				projects.map((p) => 
					p.uuid === uuid 
						? { ...p, correctionModeActive: !p.correctionModeActive }
						: p
				)
			);
		},
		setCorrectionLetter(uuid: string, letter: string) {
			update((projects) =>
				projects.map((p) =>
					p.uuid === uuid
						? { ...p, selectedLetter: letter }
						: p
				)
			);
		},
		setBrushSize(uuid: string, size: number) {
			update((projects) =>
				projects.map((p) =>
					p.uuid === uuid
						? { ...p, brushSize: Math.max(1, Math.min(5, size)) }
						: p
				)
			);
		},
		updateViewportState(uuid: string, viewportState: Partial<ViewportState>) {
			update((projects) =>
				projects.map((p) =>
					p.uuid === uuid
						? {
							...p,
							viewportState: {
								zoomLevel: 1,
								panX: 0,
								panY: 0,
								...(p.viewportState || {}),
								...viewportState
							}
						}
						: p
				)
			);
		}
	};
}

export const projects = createProjectsStore();
