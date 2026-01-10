import type { ColorEntry, StitchType, Direction } from '$lib/stores';

/**
 * Get the stitch type (Knit or Perl) for a given working row
 * Working row 0 uses startStitch, then alternates
 */
export function getStitchType(workingRow: number, startStitch: StitchType): StitchType {
	const isEven = workingRow % 2 === 0;
	if (startStitch === 'K') {
		return isEven ? 'K' : 'P';
	}
	return isEven ? 'P' : 'K';
}

/**
 * Get the working direction for a given stitch type
 */
export function getRowDirection(
	stitchType: StitchType,
	knitDirection: Direction,
	perlDirection: Direction
): Direction {
	return stitchType === 'K' ? knitDirection : perlDirection;
}

/**
 * Convert a working row (0 = first row you work) to actual grid row index
 * When startFromBottom is true, working row 0 = grid row (totalRows - 1)
 */
export function getGridRowFromWorking(
	workingRow: number,
	startFromBottom: boolean,
	totalRows: number
): number {
	if (startFromBottom) {
		return totalRows - 1 - workingRow;
	}
	return workingRow;
}

/**
 * Convert actual grid row index to working row number
 */
export function getWorkingRowFromGrid(
	gridRow: number,
	startFromBottom: boolean,
	totalRows: number
): number {
	if (startFromBottom) {
		return totalRows - 1 - gridRow;
	}
	return gridRow;
}

/**
 * Get the display row number (1-indexed for user display)
 */
export function getDisplayRowNumber(workingRow: number): number {
	return workingRow + 1;
}

/**
 * Get run-length encoded string for a row
 * Example: "4W 4B" for 4 white cells followed by 4 black cells
 * 
 * @param cellColors - flat array of all cell colors (row-major order)
 * @param gridRow - actual grid row index (0-indexed)
 * @param cols - number of columns
 * @param colorEntries - color palette with char mappings
 * @param direction - 'LTR' or 'RTL' determines reading order
 * @param correctedLetters - optional map of cell index -> corrected letter override
 */
export function getRowRLE(
	cellColors: string[],
	gridRow: number,
	cols: number,
	colorEntries: ColorEntry[],
	direction: Direction,
	correctedLetters?: Record<number, string>
): string {
	if (cols <= 0 || colorEntries.length === 0) return '';
	
	const rowStart = gridRow * cols;
	const rowEnd = rowStart + cols;
	
	if (rowStart >= cellColors.length) return '';
	
	// Get row colors and cell indices, optionally reverse for RTL
	let rowIndices = Array.from({ length: Math.min(cols, cellColors.length - rowStart) }, (_, i) => rowStart + i);
	let rowColors = rowIndices.map(idx => cellColors[idx]);
	
	if (direction === 'RTL') {
		rowIndices = [...rowIndices].reverse();
		rowColors = [...rowColors].reverse();
	}
	
	// Find char for each cell color, checking corrections first
	const chars = rowIndices.map((idx, position) => {
		// Check if this cell has a correction
		if (correctedLetters && idx in correctedLetters) {
			return correctedLetters[idx];
		}
		const entry = findClosestColorEntry(rowColors[position], colorEntries);
		return entry?.char ?? '?';
	});
	
	// Run-length encode
	const runs: { char: string; count: number }[] = [];
	let currentChar = chars[0];
	let count = 1;
	
	for (let i = 1; i < chars.length; i++) {
		if (chars[i] === currentChar) {
			count++;
		} else {
			runs.push({ char: currentChar, count });
			currentChar = chars[i];
			count = 1;
		}
	}
	runs.push({ char: currentChar, count });
	
	// Format as "4W 4B"
	return runs.map(run => `${run.count}${run.char}`).join(' ');
}

/**
 * Find the closest color entry by hex value
 */
function findClosestColorEntry(hex: string, colorEntries: ColorEntry[]): ColorEntry | null {
	if (colorEntries.length === 0) return null;
	
	const normalize = (h: string) => h.toLowerCase().replace('#', '');
	const target = normalize(hex);
	
	// First try exact match
	const exact = colorEntries.find(e => normalize(e.hex) === target);
	if (exact) return exact;
	
	// Otherwise find closest by color distance
	let closest = colorEntries[0];
	let minDist = colorDistanceSimple(hex, closest.hex);
	
	for (let i = 1; i < colorEntries.length; i++) {
		const dist = colorDistanceSimple(hex, colorEntries[i].hex);
		if (dist < minDist) {
			minDist = dist;
			closest = colorEntries[i];
		}
	}
	
	return closest;
}

/**
 * Simple color distance calculation
 */
function colorDistanceSimple(hex1: string, hex2: string): number {
	const rgb1 = hexToRgbSimple(hex1);
	const rgb2 = hexToRgbSimple(hex2);
	if (!rgb1 || !rgb2) return Number.POSITIVE_INFINITY;
	
	const dr = rgb1.r - rgb2.r;
	const dg = rgb1.g - rgb2.g;
	const db = rgb1.b - rgb2.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

function hexToRgbSimple(hex: string): { r: number; g: number; b: number } | null {
	const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
	if (!match) return null;
	const v = parseInt(match[1], 16);
	return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

/**
 * Default working state values
 */
export function getDefaultWorkingState() {
	return {
		isActive: false,
		currentRow: 0,
		currentCol: 0,
		startFromBottom: true,
		startStitch: 'K' as StitchType,
		knitDirection: 'RTL' as Direction,
		perlDirection: 'LTR' as Direction,
		highlightColor: 'rgba(34, 197, 94, 0.4)',
		startCol: 0
	};
}
