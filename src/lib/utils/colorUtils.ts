export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
	if (!match) return null;
	const v = parseInt(match[1], 16);
	return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

export function colorDistance(hex1: string, hex2: string): number {
	const rgb1 = hexToRgb(hex1);
	const rgb2 = hexToRgb(hex2);
	if (!rgb1 || !rgb2) return Number.POSITIVE_INFINITY;
	const dr = rgb1.r - rgb2.r;
	const dg = rgb1.g - rgb2.g;
	const db = rgb1.b - rgb2.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 * Returns a value between 0 (black) and 1 (white)
 */
export function getLuminance(hex: string): number {
	const rgb = hexToRgb(hex);
	if (!rgb) return 0;

	const toLinear = (c: number) => {
		const sRGB = c / 255;
		return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
	};

	const r = toLinear(rgb.r);
	const g = toLinear(rgb.g);
	const b = toLinear(rgb.b);

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Returns the best contrasting text color (black or white) for a given background color
 */
export function getContrastTextColor(bgHex: string): string {
	const luminance = getLuminance(bgHex);
	// Use white text on dark backgrounds, black text on light backgrounds
	return luminance > 0.179 ? '#000000' : '#ffffff';
}
