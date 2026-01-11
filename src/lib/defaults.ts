/**
 * Default values for project objects and states.
 * Used to ensure consistency across the application and as a reference for initialization.
 */

import type { Project, WorkingState, ColorEntry } from './stores';
import { WORKING_MODE, COLOR, CORRECTION } from './constants';

/**
 * Default working state for a newly created project.
 * All new projects start with these values.
 */
export const DEFAULT_WORKING_STATE: WorkingState = {
	isActive: false,
	currentRow: 0,
	currentCol: 0,
	startFromBottom: true,
	startStitch: 'K',
	knitDirection: 'RTL',
	perlDirection: 'LTR',
	highlightColor: WORKING_MODE.DEFAULT_HIGHLIGHT_COLOR,
	startCol: 0,
	correctedLetters: {},
	undoStack: [],
	redoStack: [],
	correctionMode: false,
	selectedLetter: undefined
};

/**
 * Default project fields (excluding uuid, name, and createdAt which are set per-project)
 */
export const DEFAULT_PROJECT_FIELDS = {
	gridColor: COLOR.DEFAULT_GRID_COLOR,
	gridThickness: COLOR.DEFAULT_GRID_THICKNESS,
	colors: [] as ColorEntry[],
	workingState: DEFAULT_WORKING_STATE,
	correctionModeActive: false,
	selectedLetter: undefined,
	brushSize: CORRECTION.DEFAULT_BRUSH_SIZE
};

/**
 * Get a fresh default working state (creates a new object, not a reference)
 */
export function getDefaultWorkingState(): WorkingState {
	return {
		...DEFAULT_WORKING_STATE,
		correctedLetters: {},
		undoStack: [],
		redoStack: []
	};
}

/**
 * Get default project fields (creates a new object with fresh arrays)
 */
export function getDefaultProjectFields() {
	return {
		...DEFAULT_PROJECT_FIELDS,
		colors: [],
		workingState: getDefaultWorkingState()
	};
}
