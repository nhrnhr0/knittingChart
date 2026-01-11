import { describe, it, expect } from 'vitest';
import {
	getStitchType,
	getRowDirection,
	getGridRowFromWorking,
	getWorkingRowFromGrid,
	getDisplayRowNumber,
	getRowRLE,
	getDefaultWorkingState
} from './workingUtils';
import type { ColorEntry, StitchType, Direction } from '$lib/stores';

describe('workingUtils', () => {
	describe('getStitchType', () => {
		it('returns starting stitch for row 0 when startStitch is K', () => {
			expect(getStitchType(0, 'K')).toBe('K');
		});

		it('returns starting stitch for row 0 when startStitch is P', () => {
			expect(getStitchType(0, 'P')).toBe('P');
		});

		it('alternates stitches for subsequent rows starting with K', () => {
			expect(getStitchType(0, 'K')).toBe('K');
			expect(getStitchType(1, 'K')).toBe('P');
			expect(getStitchType(2, 'K')).toBe('K');
			expect(getStitchType(3, 'K')).toBe('P');
		});

		it('alternates stitches for subsequent rows starting with P', () => {
			expect(getStitchType(0, 'P')).toBe('P');
			expect(getStitchType(1, 'P')).toBe('K');
			expect(getStitchType(2, 'P')).toBe('P');
			expect(getStitchType(3, 'P')).toBe('K');
		});

		it('handles large row numbers', () => {
			expect(getStitchType(1000, 'K')).toBe('K'); // even
			expect(getStitchType(1001, 'K')).toBe('P'); // odd
		});
	});

	describe('getRowDirection', () => {
		it('returns knit direction for K stitches', () => {
			expect(getRowDirection('K', 'LTR', 'RTL')).toBe('LTR');
			expect(getRowDirection('K', 'RTL', 'LTR')).toBe('RTL');
		});

		it('returns purl direction for P stitches', () => {
			expect(getRowDirection('P', 'LTR', 'RTL')).toBe('RTL');
			expect(getRowDirection('P', 'RTL', 'LTR')).toBe('LTR');
		});
	});

	describe('getGridRowFromWorking', () => {
		it('returns same row when startFromBottom is false', () => {
			expect(getGridRowFromWorking(0, false, 10)).toBe(0);
			expect(getGridRowFromWorking(5, false, 10)).toBe(5);
			expect(getGridRowFromWorking(9, false, 10)).toBe(9);
		});

		it('inverts row when startFromBottom is true', () => {
			expect(getGridRowFromWorking(0, true, 10)).toBe(9);
			expect(getGridRowFromWorking(1, true, 10)).toBe(8);
			expect(getGridRowFromWorking(9, true, 10)).toBe(0);
		});

		it('handles single row', () => {
			expect(getGridRowFromWorking(0, true, 1)).toBe(0);
			expect(getGridRowFromWorking(0, false, 1)).toBe(0);
		});

		it('handles large grids', () => {
			const totalRows = 500;
			expect(getGridRowFromWorking(0, true, totalRows)).toBe(totalRows - 1);
			expect(getGridRowFromWorking(totalRows - 1, true, totalRows)).toBe(0);
		});
	});

	describe('getWorkingRowFromGrid', () => {
		it('returns same row when startFromBottom is false', () => {
			expect(getWorkingRowFromGrid(0, false, 10)).toBe(0);
			expect(getWorkingRowFromGrid(5, false, 10)).toBe(5);
			expect(getWorkingRowFromGrid(9, false, 10)).toBe(9);
		});

		it('inverts row when startFromBottom is true', () => {
			expect(getWorkingRowFromGrid(0, true, 10)).toBe(9);
			expect(getWorkingRowFromGrid(1, true, 10)).toBe(8);
			expect(getWorkingRowFromGrid(9, true, 10)).toBe(0);
		});

		it('is inverse of getGridRowFromWorking', () => {
			for (let workingRow = 0; workingRow < 10; workingRow++) {
				const gridRow = getGridRowFromWorking(workingRow, true, 10);
				expect(getWorkingRowFromGrid(gridRow, true, 10)).toBe(workingRow);
			}
		});
	});

	describe('getDisplayRowNumber', () => {
		it('converts 0-indexed working row to 1-indexed display row', () => {
			expect(getDisplayRowNumber(0)).toBe(1);
			expect(getDisplayRowNumber(1)).toBe(2);
			expect(getDisplayRowNumber(9)).toBe(10);
		});

		it('handles large row numbers', () => {
			expect(getDisplayRowNumber(999)).toBe(1000);
		});
	});

	describe('getRowRLE', () => {
		const basicColors: ColorEntry[] = [
			{ hex: '#ff0000', char: 'A' },
			{ hex: '#00ff00', char: 'B' },
			{ hex: '#0000ff', char: 'C' }
		];

		it('generates RLE for single-color row', () => {
			const colors = ['#ff0000', '#ff0000', '#ff0000'];
			const result = getRowRLE(colors, 0, 3, basicColors, 'LTR');
			expect(result).toBe('3A');
		});

		it('generates RLE for mixed colors LTR', () => {
			const colors = ['#ff0000', '#ff0000', '#00ff00', '#00ff00'];
			const result = getRowRLE(colors, 0, 4, basicColors, 'LTR');
			expect(result).toBe('2A 2B');
		});

		it('reverses order for RTL', () => {
			const colors = ['#ff0000', '#00ff00', '#00ff00'];
			const result = getRowRLE(colors, 0, 3, basicColors, 'RTL');
			expect(result).toBe('2B 1A');
		});

		it('respects cell corrections', () => {
			const colors = ['#ff0000', '#00ff00', '#0000ff'];
			const corrections = {
				0: 'B', // Override first cell to B
				1: 'B', // Override second cell to B
				2: 'A'  // Override third cell to A
			};
			const result = getRowRLE(colors, 0, 3, basicColors, 'LTR', corrections);
			expect(result).toBe('2B 1A'); // Now B B A
		});

		it('encodes rows with gaps', () => {
			const colors = Array(15).fill('#ff0000');
			colors[10] = '#00ff00';
			colors[11] = '#00ff00';
			const result = getRowRLE(colors, 2, 5, basicColors, 'LTR');
		expect(result).toBe('2B 3A');
	});

	it('handles zero columns gracefully', () => {
		const colors = ['#ff0000'];
		const result = getRowRLE(colors, 0, 0, basicColors, 'LTR');
		expect(result).toBe('');
	});

	it('handles row beyond array bounds gracefully', () => {
		const colors = ['#ff0000', '#00ff00'];
		const result = getRowRLE(colors, 100, 2, basicColors, 'LTR');
		expect(result).toBe('');
	});

	it('handles more columns than available data', () => {
		const colors = ['#ff0000', '#00ff00']; // Only 2 colors
		const result = getRowRLE(colors, 0, 5, basicColors, 'LTR'); // Asking for 5
		expect(result).toContain('A');
		expect(result).toContain('B');
	});

	it('generates multiple runs correctly', () => {
		const colors = [
			'#ff0000', '#ff0000',
			'#00ff00',
			'#0000ff', '#0000ff', '#0000ff'
		];
		const result = getRowRLE(colors, 0, 6, basicColors, 'LTR');
		expect(result).toBe('2A 1B 3C');
	});
	});

	describe('getDefaultWorkingState', () => {
		it('returns a valid working state object', () => {
			const state = getDefaultWorkingState();
			expect(state).toBeDefined();
			expect(state.isActive).toBe(false);
			expect(state.currentRow).toBe(0);
			expect(state.currentCol).toBe(0);
		});

		it('has reasonable default values', () => {
			const state = getDefaultWorkingState();
			expect(state.startFromBottom).toBe(true);
			expect(state.startStitch).toBe('K');
			expect(state.knitDirection).toBe('RTL');
			expect(state.perlDirection).toBe('LTR');
			expect(typeof state.highlightColor).toBe('string');
		});

		it('returns new object each time (not cached)', () => {
			const state1 = getDefaultWorkingState();
			const state2 = getDefaultWorkingState();
			expect(state1).not.toBe(state2);
			expect(state1).toEqual(state2);
		});
	});
});
