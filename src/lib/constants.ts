/**
 * Centralized configuration constants for the entire application.
 * Allows easy tweaking of settings and provides documentation for magic numbers.
 */

// ============================================================================
// CANVAS & ZOOM
// ============================================================================

export const CANVAS = {
	/** Minimum zoom level for canvas (0.5 = 50%) */
	MIN_ZOOM: 0.5,
	/** Maximum zoom level for canvas (4.0 = 400%) */
	MAX_ZOOM: 4.0,
	/** Zoom increment per wheel tick */
	ZOOM_STEP: 0.1,
	/** Device pixel ratio for high-DPI displays */
	DEVICE_PIXEL_RATIO: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
} as const;

// ============================================================================
// COLOR LABEL RENDERING
// ============================================================================

export const COLOR_LABEL = {
	/** Minimum circle radius for color labels (pixels) */
	CIRCLE_RADIUS_MIN: 4,
	/** Maximum circle radius for color labels (pixels) */
	CIRCLE_RADIUS_MAX: 12,
	/** Scale factor for circle radius relative to cell dimension */
	CIRCLE_RADIUS_SCALE: 0.24,
	/** Minimum font size for color label text (pixels) */
	FONT_SIZE_MIN: 8,
	/** Maximum font size for color label text (pixels) */
	FONT_SIZE_MAX: 14,
	/** Scale factor for font size relative to cell dimension */
	FONT_SIZE_SCALE: 0.28,
	/** Font family for rendering labels */
	FONT_FAMILY: 'Arial'
} as const;

// ============================================================================
// WCAG LUMINANCE CALCULATION (for text contrast)
// ============================================================================

export const WCAG_LUMINANCE = {
	/** Threshold for linearizing sRGB color component */
	THRESHOLD: 0.03928,
	/** Scale factor for dark colors in linearization */
	DARK_SCALE: 12.92,
	/** Base value for light colors in linearization */
	LIGHT_BASE: 0.055,
	/** Scale factor for light colors in linearization */
	LIGHT_SCALE: 1.055,
	/** Exponent for light colors in linearization */
	LIGHT_EXPONENT: 2.4,
	/** Relative luminance coefficient for red channel (WCAG 2.0) */
	RED_WEIGHT: 0.2126,
	/** Relative luminance coefficient for green channel (WCAG 2.0) */
	GREEN_WEIGHT: 0.7152,
	/** Relative luminance coefficient for blue channel (WCAG 2.0) */
	BLUE_WEIGHT: 0.0722,
	/** Luminance threshold for choosing black vs white text */
	TEXT_COLOR_THRESHOLD: 0.179
} as const;

// ============================================================================
// COLOR MANAGEMENT
// ============================================================================

export const COLOR = {
	/** Maximum number of colors in a project palette */
	MAX_COLORS: 100,
	/** Maximum allowed Euclidean distance in RGB space to consider colors the same */
	MAX_DEDUPLICATION_THRESHOLD: 441, // sqrt(255^2 + 255^2 + 255^2)
	/** Default color deduplication threshold */
	DEFAULT_DEDUPLICATION_THRESHOLD: 75,
	/** Default grid line color (green) */
	DEFAULT_GRID_COLOR: '#22c55e',
	/** Default grid line thickness (pixels) */
	DEFAULT_GRID_THICKNESS: 2,
	/** Color sample size for averaging (pixels) */
	SAMPLE_SIZE: 3
} as const;

// ============================================================================
// GRID CONFIGURATION
// ============================================================================

export const GRID = {
	/** Minimum number of rows in a grid */
	MIN_ROWS: 1,
	/** Maximum number of rows in a grid */
	MAX_ROWS: 500,
	/** Minimum number of columns in a grid */
	MIN_COLS: 1,
	/** Maximum number of columns in a grid */
	MAX_COLS: 500,
	/** Grid line opacity (0-1) */
	LINE_ALPHA: 0.6
} as const;

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

export const IMAGE_UPLOAD = {
	/** Maximum image file size (5 MB) */
	MAX_SIZE_MB: 5,
	/** Maximum image file size in bytes */
	MAX_SIZE_BYTES: 5 * 1024 * 1024,
	/** Allowed image MIME types */
	ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
	/** Description of allowed types for user messages */
	ALLOWED_TYPES_LABEL: 'JPEG, PNG, WebP'
} as const;

// ============================================================================
// CELL CORRECTION & PAINTING
// ============================================================================

export const CORRECTION = {
	/** Maximum number of undo steps to keep in history */
	MAX_UNDO_STEPS: 100,
	/** Minimum brush size for cell painting (1x1 cells) */
	BRUSH_SIZE_MIN: 1,
	/** Maximum brush size for cell painting (5x5 cells) */
	BRUSH_SIZE_MAX: 5,
	/** Default brush size */
	DEFAULT_BRUSH_SIZE: 1
} as const;

// ============================================================================
// WORKING MODE
// ============================================================================

export const WORKING_MODE = {
	/** Default highlight overlay color for current row/cell */
	DEFAULT_HIGHLIGHT_COLOR: 'rgba(34, 197, 94, 0.4)'
} as const;

// ============================================================================
// STORAGE
// ============================================================================

export const STORAGE = {
	/** localStorage key for saving projects */
	PROJECTS_KEY: 'projects',
	/** localStorage key for app preferences */
	PREFERENCES_KEY: 'knitting-prefs'
} as const;

// ============================================================================
// TOUCH & INTERACTION
// ============================================================================

export const INTERACTION = {
	/** Minimum distance to consider as a drag (pixels) */
	DRAG_THRESHOLD: 5,
	/** Double-click time window (milliseconds) */
	DOUBLE_CLICK_TIME: 300,
	/** Debounce delay for redrawing canvas (milliseconds) */
	REDRAW_DEBOUNCE_MS: 16, // ~60fps
	/** Pan speed multiplier for keyboard/mouse */
	PAN_SPEED: 10
} as const;

// ============================================================================
// PROJECT VALIDATION
// ============================================================================

export const PROJECT = {
	/** Minimum project name length */
	NAME_MIN_LENGTH: 1,
	/** Maximum project name length */
	NAME_MAX_LENGTH: 100
} as const;
