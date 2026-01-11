/**
 * Convert RGB components to hexadecimal color string.
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color string (e.g., "#ff00ff")
 *
 * @example
 * rgbToHex(255, 0, 255) // => "#ff00ff"
 * rgbToHex(0, 128, 255) // => "#0080ff"
 */
export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hexadecimal color string to RGB components.
 * Accepts hex strings with or without the "#" prefix.
 *
 * @param hex - Hex color string (e.g., "#ff00ff" or "ff00ff")
 * @returns Object with r, g, b components (0-255), or null if invalid format
 *
 * @example
 * hexToRgb("#ff00ff")   // => { r: 255, g: 0, b: 255 }
 * hexToRgb("0080ff")    // => { r: 0, g: 128, b: 255 }
 * hexToRgb("invalid")   // => null
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
	if (!match) return null;
	const v = parseInt(match[1], 16);
	return { r: (v >> 16) & 0xff, g: (v >> 8) & 0xff, b: v & 0xff };
}

/**
 * Calculate the Euclidean distance between two colors in RGB space.
 *
 * Distance is calculated as: sqrt((r1-r2)² + (g1-g2)² + (b1-b2)²)
 *
 * Used for color deduplication and similarity matching.
 * Maximum possible distance between two valid colors is ~441.67 (black to white).
 *
 * @param hex1 - First hex color string
 * @param hex2 - Second hex color string
 * @returns Distance in RGB space (0 = identical, Infinity = invalid color)
 *
 * @example
 * colorDistance("#ff0000", "#ff0000") // => 0 (identical)
 * colorDistance("#000000", "#ffffff") // => ~441 (maximum distance)
 * colorDistance("#ff0000", "#00ff00") // => ~255 (orthogonal)
 */
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
 * Calculate the relative luminance of a color using the WCAG 2.0 formula.
 *
 * Luminance represents the perceived brightness of a color to the human eye.
 * Formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 *
 * @param hex - Hex color string
 * @returns Relative luminance between 0 (black) and 1 (white)
 *
 * @example
 * getLuminance("#ffffff") // => ~1.0 (white)
 * getLuminance("#000000") // => ~0.0 (black)
 * getLuminance("#808080") // => ~0.22 (gray)
 *
 * @see {@link https://www.w3.org/TR/WCAG20/#relativeluminancedef}
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
 * Determine the best contrasting text color (black or white) for a given background color.
 *
 * Uses WCAG 2.0 relative luminance to ensure readable text contrast.
 * Returns white text on dark backgrounds, black text on light backgrounds.
 *
 * Threshold: Luminance > 0.179 uses black text, otherwise white text
 *
 * @param bgHex - Background hex color string
 * @returns "#000000" (black) or "#ffffff" (white)
 *
 * @example
 * getContrastTextColor("#ffffff") // => "#000000" (black text on white)
 * getContrastTextColor("#000000") // => "#ffffff" (white text on black)
 * getContrastTextColor("#ff6600") // => "#000000" (black text on orange)
 */
export function getContrastTextColor(bgHex: string): string {
	const luminance = getLuminance(bgHex);
	// Use white text on dark backgrounds, black text on light backgrounds
	return luminance > 0.179 ? '#000000' : '#ffffff';
}
