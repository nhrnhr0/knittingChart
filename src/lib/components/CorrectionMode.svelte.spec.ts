
// Patch globalThis.projects before importing CorrectionMode
let originalProjects: any;
let fakeProjects: any;
beforeAll(() => {
	originalProjects = globalThis.projects;
	fakeProjects = {
		toggleCorrectionMode: () => { fakeProjects.toggled = true; },
		setCorrectionLetter: () => {},
		setBrushSize: () => {},
		undoCorrection: () => {},
		redoCorrection: () => {},
		clearCorrections: () => {},
		toggled: false,
	};
	globalThis.projects = fakeProjects;
});
afterAll(() => {
	globalThis.projects = originalProjects;
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import CorrectionMode from './CorrectionMode.svelte';

describe('CorrectionMode', () => {
	it('renders Correction Mode button', () => {
		const { getByText } = render(CorrectionMode, {
			props: {
				project: { uuid: '1', colors: [], correctionModeActive: false },
			},
		});
		expect(getByText(/Correction Mode/)).toBeTruthy();
	});
	});
