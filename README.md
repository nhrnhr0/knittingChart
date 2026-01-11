# 🧶 Knitting Pattern Designer

A sophisticated, interactive web application for designing knitting patterns from images. Transform any image into a knitting pattern chart with perspective-correct grid overlay, intelligent color extraction, and an intuitive working mode for following patterns stitch-by-stitch.

## 🌟 Key Features

### 📋 Project Management
- **Create & Organize**: Generate new projects with unique UUIDs
- **Project Gallery**: View all projects with thumbnail previews and creation timestamps
- **Offline Access**: All projects automatically saved to localStorage—work offline anytime
- **Project Editing**: Rename and delete projects with confirmation dialogs

### 🖼️ Image Upload & Processing
- **Flexible Image Support**: Upload any image file (PNG, JPEG, etc.) as your pattern base
- **Image Preview**: See your uploaded image before further processing

### ✂️ Advanced Cropping System
- **4-Point Cropping**: Define a custom quadrilateral crop region by clicking corner points on the image
- **Draggable Control Points**: Interactively fine-tune crop corners by dragging blue circular handles
- **Precise Coordinate Input**: Manually enter normalized (0–1) coordinates for exact positioning
- **Real-Time Preview**: See cropped region instantly update as you adjust points

### 📐 Perspective-Correct Grid Overlay
- **Configurable Dimensions**: Set rows and columns to match your knitting gauge
- **Custom Appearance**:
  - Choose grid line color via color picker
  - Adjust line thickness (1px–5px range)
- **Advanced Rendering**: Uses bilinear interpolation to maintain perspective accuracy across non-rectangular crop regions
- **Grid Cell Labeling**: Each grid cell displays its assigned color label (A, B, C, etc.) for easy reference

### 🎨 Intelligent Color Palette Management
- **Manual Color Addition**: Add colors via color picker or hex input with custom character labels
- **Auto-Extract Colors**: Automatically sample dominant colors from each grid cell
- **Smart Deduplication**: Merge visually similar colors using Euclidean RGB distance with configurable threshold (0–441)
- **Character Labels**: Assign single or multi-character codes (A, B, C, AA, AB, etc.) for knitting chart notation
- **Automatic Contrast**: Black/white text selection based on WCAG luminance formula for optimal readability
- **Visual Preview**: Color swatches with labels in both the palette editor and grid overlay

### 🧵 Working Mode - Follow Your Pattern
Switch to **Working Mode** to follow your knitting pattern row-by-row:

- **Row/Column Navigation**: Increment/decrement current row and column with dedicated controls
- **Position Tracking**: Display current row, column, and grid cell highlight
- **Stitch Type Alternation**: Automatically alternate between Knit (K) and Purl (P) stitches based on starting stitch
- **Direction Support**: Configure Left-to-Right (LTR) or Right-to-Left (RTL) for each stitch type
- **RLE Pattern Generation**: Real-time display of Run-Length Encoded pattern (e.g., "4K 3P 2K") for the current row
- **Visual Highlighting**: Blue overlay highlights the current working row and cell
- **Configurable Starting Point**: Choose starting row and column offset to match your knitting project

### 🔧 Cell Correction Feature
Manually correct color detection errors with a powerful correction mode:

- **Paint Cells**: Click cells to manually override detected colors with your selected letter/color
- **Multi-Letter Selection**: Choose from your entire color palette for any cell
- **Variable Brush Size**: Select brush radius (1×1 to 5×5 cells) for bulk corrections
- **Visual Feedback**: Blue dashed borders highlight all corrected cells
- **Complete Undo/Redo**: Full history stack for all corrections—undo/redo individual changes or clear all at once
- **Persistent Corrections**: All cell overrides are saved with the project
- **Mobile-Friendly**: Touch-optimized controls and responsive layout

### 📱 Mobile & Accessibility
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Touch-Optimized**: Minimum 44px button sizes for easy touch interaction
- **Keyboard Support**: Full keyboard navigation throughout the interface

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | [SvelteKit](https://kit.svelte.dev/) | 2.49.1 |
| **UI Framework** | [Svelte](https://svelte.dev/) | 5.45.6 |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.9.3 |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | 4.1.17 |
| **Build Tool** | [Vite](https://vitejs.dev/) | 7.2.6 |
| **State Management** | Svelte Stores | (native) |
| **Unit Testing** | [Vitest](https://vitest.dev/) + Browser Mode | 4.0.15 |
| **E2E Testing** | [Playwright](https://playwright.dev/) | 1.57.0 |
| **Code Quality** | ESLint + Prettier | 9.39.1 / 3.7.4 |
| **UUID Generation** | uuid | 13.0.0 |
| **Deployment** | gh-pages | 6.3.0 |

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/                          # Svelte UI components
│   │   ├── ColorPaletteEditor.svelte       # Color palette management
│   │   ├── CorrectionMode.svelte           # Cell correction controls
│   │   ├── GridSettings.svelte             # Grid configuration
│   │   ├── ImageCropper.svelte             # Core canvas component
│   │   ├── ModeToggle.svelte               # Edit/Working mode switcher
│   │   ├── WorkingPanel.svelte             # Row/column navigation UI
│   │   └── WorkingSettings.svelte          # Working mode preferences
│   │
│   ├── utils/                               # Utility functions
│   │   ├── canvasDrawing.ts                # Grid, labels, overlay rendering
│   │   ├── colorUtils.ts                   # Color manipulation & contrast
│   │   ├── geometryUtils.ts                # Interpolation, point geometry
│   │   ├── imageUtils.ts                   # Image canvas, color sampling
│   │   └── workingUtils.ts                 # RLE encoding, stitch logic
│   │
│   ├── stores.ts                           # Svelte store + project persistence
│   └── assets/                             # Static assets
│
├── routes/
│   ├── +layout.svelte                      # Root layout
│   ├── +page.svelte                        # Project gallery/home
│   └── project/
│       └── [uuid]/
│           ├── +page.svelte                # Project editor (setup mode)
│           └── work/
│               └── +page.svelte            # Working mode (pattern view)
│
├── tests/                                   # Test files
├── e2e/                                     # E2E test suites
└── [config files]                          # Build, lint, and test config
```

## 💾 Data Model

### Project Interface
```typescript
interface Project {
  uuid: string;                    // Unique identifier
  name: string;                    // Display name
  createdAt: number;               // Unix timestamp
  image?: string;                  // Base64 encoded image
  cropPoints?: Point[];            // 4 corner points (normalized 0-1)
  rows?: number;                   // Grid row count
  cols?: number;                   // Grid column count
  gridColor?: string;              // Hex color for grid lines
  gridThickness?: number;          // Grid line width (pixels)
  colors?: ColorEntry[];           // Color palette with labels
  workingState?: WorkingState;     // Working mode state
  correctedLetters?: Record<string, string>;  // Cell corrections
  correctionModeActive?: boolean;  // Editing mode flag
  selectedLetter?: string;         // Currently selected letter
  brushSize?: number;              // Brush radius (1-5)
}

interface ColorEntry {
  hex: string;                     // Hex color code
  char: string;                    // Character label (A, B, C, etc.)
  textColor?: string;              // Contrasting text color
}

interface WorkingState {
  isActive: boolean;               // Working mode enabled
  currentRow: number;              // Current row (0-indexed)
  currentCol: number;              // Current column (0-indexed)
  startFromBottom: boolean;        // Work from bottom up?
  startStitch: 'K' | 'P';          // Starting stitch (Knit or Purl)
  knitDirection: 'LTR' | 'RTL';    // Direction for knit rows
  perlDirection: 'LTR' | 'RTL';    // Direction for purl rows
  highlightColor: string;          // Overlay color
  startCol: number;                // Starting column offset
}

interface Point {
  x: number;                       // X coordinate (0-1)
  y: number;                       // Y coordinate (0-1)
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd myapp

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Open in browser automatically
npm run dev -- --open
```

Visit `http://localhost:5173` and start creating patterns!

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview

# Deploy to gh-pages
npm run deploy
```

## 📖 Usage Guide

### Workflow Overview

1. **Create a Project** → Enter project name, click "Create"
2. **Upload an Image** → Select any image file from your computer
3. **Define Crop Region** → Click 4 points to define the crop area
4. **Configure Grid** → Set rows/columns and customize grid appearance
5. **Extract Colors** → Auto-sample or manually add colors from palette
6. **Set Working Preferences** → Choose stitch type, direction, starting point
7. **Working Mode** → Switch to working mode and follow your pattern row-by-row
8. **Optional: Correct Cells** → Use correction mode to fix color detection errors

### Edit Mode (Setup)

**Tasks:**
- Upload/replace your image
- Adjust crop region (drag corners or type coordinates)
- Configure grid dimensions (rows/columns)
- Customize grid appearance (color, thickness)
- Build color palette (manual add or auto-extract)
- Set working mode preferences (stitch type, direction)

**Grid Cell Labels:**
- Each cell displays its assigned color label (A, B, C, etc.)
- Helps verify correct color detection

### Working Mode

**Navigation:**
- Use **Row +/−** and **Col +/−** buttons to move through grid
- Current row and column are always displayed
- Blue overlay shows current cell

**RLE Pattern Display:**
- Shows Run-Length Encoded pattern for current row
- Format: "4K 3P 2K" (4 knits, 3 purls, 2 knits)
- Useful for following knitting instructions

**Stitch Tracking:**
- **Knit (K)** and **Purl (P)** automatically alternate based on starting stitch
- Direction automatically switches (LTR/RTL) based on stitch type
- Helps maintain correct stitch orientation

### Correction Mode (Optional)

**When to Use:**
- Color detection wasn't 100% accurate
- Need to manually fix specific cells
- Want to make artistic adjustments

**How to Use:**
1. Enable **Correction Mode** toggle
2. Select a letter/color from the palette
3. Click cells to paint them with selected color
4. Use **Brush Size** slider (1–5) for bulk corrections
5. **Undo/Redo** buttons for reverting changes
6. **Clear All** to start over

**Visual Feedback:**
- Corrected cells show blue dashed borders
- See your changes instantly in the grid

## 🔧 Advanced Features

### Perspective-Correct Grid

The grid uses **bilinear interpolation** to accurately map grid cells to image pixels:

- Non-rectangular crop regions maintain proper proportions
- Grid lines are drawn with linear interpolation between corners
- Color sampling uses bilinear blending for accuracy

This ensures your knitting pattern aligns perfectly with the original image, even for angled or skewed crops.

### Color Deduplication

When auto-extracting colors:

1. Sample color from each grid cell's center
2. Deduplicate using **Euclidean RGB distance**
3. **Configurable threshold** (0–441) controls merge aggressiveness
   - Lower values: More colors, better detail
   - Higher values: Fewer colors, simplified pattern
4. Assign sequential character labels (A, B, C, etc.)

### Automatic Contrast Text

For each color swatch, the app calculates **WCAG luminance**:
- Bright colors → Black text
- Dark colors → White text
- Ensures readable labels in all cases

### localStorage Persistence

- Projects are automatically saved to browser storage
- No external account needed
- Works completely offline
- Full project data persists including corrections

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Watch mode for development
npm run test:unit -- --watch

# Run E2E tests
npm run test:e2e

# Type checking
npm run check

# Type checking in watch mode
npm run check:watch
```

## 🎯 Code Quality

### Formatting & Linting

```bash
# Check code formatting and lint rules
npm run lint

# Auto-format all code
npm run format
```

### Type Checking

TypeScript strict mode is enforced throughout. Type errors will block compilation:

```bash
npm run check
```

## 🏗️ Architecture Overview

### Component Hierarchy

```
+layout.svelte (Root)
├── +page.svelte (Project Gallery)
│   ├── Project Cards
│   └── Create Project Form
│
└── project/[uuid]/
    ├── ModeToggle (Edit / Working)
    │
    ├── Edit Mode:
    │   ├── ImageCropper (Core Canvas)
    │   ├── GridSettings
    │   ├── ColorPaletteEditor
    │   └── WorkingSettings
    │
    └── Working Mode:
        ├── WorkingPanel (Navigation)
        ├── ImageCropper (Read-only Display)
        ├── CorrectionMode (Optional)
        └── WorkingSettings (Display Only)
```

### State Management

**Svelte Stores** (`lib/stores.ts`):
- Central project store with reactive subscriptions
- Automatic persistence to localStorage
- Immutable state updates
- Undo/Redo stacks for corrections

**Key Stores:**
- `projectStore`: All project data
- `undoStack` / `redoStack`: Correction history

### Core Algorithms

| Algorithm | Location | Purpose |
|-----------|----------|---------|
| **Bilinear Interpolation** | `geometryUtils.ts` | Map grid cells to image pixels with perspective |
| **Linear Interpolation** | `geometryUtils.ts` | Draw perspective-correct grid lines |
| **WCAG Luminance** | `colorUtils.ts` | Calculate brightness for text contrast |
| **Euclidean Distance** | `colorUtils.ts` | Deduplicate similar colors in RGB space |
| **RLE Encoding** | `workingUtils.ts` | Generate run-length encoded patterns |
| **Canvas Rendering** | `canvasDrawing.ts` | Render grid, labels, overlays |

### File Organization

**Components** (`lib/components/`):
- Pure Svelte components with reactive bindings
- Props for input, events for output
- No business logic

**Utils** (`lib/utils/`):
- Pure functions with no side effects
- Fully tested with Vitest
- Reusable across components

**Stores** (`lib/stores.ts`):
- Single source of truth for app state
- Reactive subscriptions
- Automatic persistence

## 📚 Related Documentation

- **[Cell Correction Feature](CORRECTION_FEATURE.md)** - Detailed guide for using correction mode
- **[Development Guidelines](copilot-instructions.md)** - Contributing and code style

## 🐛 Troubleshooting

### Crop Points Not Showing
- Ensure image is fully loaded
- Try refreshing the page
- Check browser console for errors

### Colors Not Extracting Correctly
- Increase the deduplication threshold to merge similar colors
- Try manually adding colors instead
- Check grid dimensions match your image aspect ratio

### Working Mode Not Tracking Correctly
- Verify starting row, column, and stitch type are correct
- Check that direction settings match your knitting pattern
- Review row/column values in Working Settings

### Corrections Not Saving
- Check browser storage isn't full
- Verify localStorage is enabled
- Try exporting project data if available

### Performance Issues with Large Grids
- Large grids (>100×100) may be slow
- Try reducing image resolution before cropping
- Use browser DevTools to profile canvas rendering

## 📝 License

This project is private and not licensed for public distribution.
