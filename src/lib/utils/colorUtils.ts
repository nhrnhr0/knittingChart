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
