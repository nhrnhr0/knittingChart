import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface ColorEntry {
	hex: string;
	char: string;
	textColor?: string; // color for the text label
}

export type StitchType = 'K' | 'P';
export type Direction = 'LTR' | 'RTL';

export interface WorkingState {
	isActive: boolean;
	currentRow: number; // 0-indexed working row (row 0 = first row you work)
	currentCol: number; // 0-indexed column
	startFromBottom: boolean; // true = start from bottom of grid
	startStitch: StitchType; // which stitch type for first row
	knitDirection: Direction; // direction for knit rows
	perlDirection: Direction; // direction for perl rows
	highlightColor: string; // color for row/col highlight overlay
	startCol: number; // 0-indexed starting column
	correctedLetters?: Record<number, string>; // cellIndex -> character override
	undoStack?: Array<Record<number, string>>; // stack of previous states
	redoStack?: Array<Record<number, string>>; // stack of undone states
	correctionMode?: boolean; // true = in cell correction mode
	selectedLetter?: string; // currently selected letter for painting
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
	workingState?: WorkingState;
	correctedLetters?: Record<number, string>; // cell corrections, independent of mode
	correctionModeActive?: boolean; // true when in cell correction/painting mode
	selectedLetter?: string; // currently selected letter for painting
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
	updateProjectWorkingState: (uuid: string, workingState: Partial<WorkingState>) => void;
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
		updateProjectWorkingState(uuid: string, workingState: Partial<WorkingState>) {
			update((projects) =>
				projects.map((p) =>
					p.uuid === uuid
						? {
							...p,
							workingState: {
								isActive: false,
								currentRow: 0,
								currentCol: 0,
								startFromBottom: true,
								startStitch: 'K' as StitchType,
								knitDirection: 'RTL' as Direction,
								perlDirection: 'LTR' as Direction,
								highlightColor: 'rgba(34, 197, 94, 0.4)',
								startCol: 0,
								correctedLetters: {},
								undoStack: [],
								redoStack: [],
								correctionMode: false,
								selectedLetter: undefined,
								...p.workingState,
								...workingState
							}
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
		}
	};
}

export const projects = createProjectsStore();
