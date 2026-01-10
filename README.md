# Knitting Pattern Designer

A modern web application for creating knitting patterns from images. Upload an image, define a crop region, configure a grid overlay, and automatically extract colors to build your knitting pattern chart.

## Features

### 🎨 Project Management
- **Create Projects**: Generate new projects with unique UUIDs
- **Project List**: View all projects with thumbnails and metadata
- **Persistent Storage**: All projects are saved to localStorage for offline access
- **Delete Projects**: Remove unwanted projects with confirmation

### 🖼️ Image Handling
- **Image Upload**: Upload any image file to use as your pattern base
- **Interactive Cropping**: Define a 4-point quadrilateral crop region by clicking on the image
- **Draggable Control Points**: Fine-tune crop corners by dragging the blue handle circles
- **Precise Coordinate Entry**: Manually input normalized (0-1) coordinates for exact positioning

### 📐 Grid Overlay
- **Configurable Grid**: Set the number of rows and columns for your knitting pattern
- **Customizable Appearance**: 
  - Choose grid line color with a color picker
  - Adjust grid line thickness
- **Perspective-Correct Rendering**: Grid lines are drawn using bilinear interpolation to match the crop region's perspective

### 🎨 Color Palette Management
- **Manual Color Addition**: Add colors using a color picker or hex input
- **Auto-Extract Colors**: Automatically sample colors from each grid cell
- **Color Deduplication**: Configurable threshold to merge similar colors
- **Character Labels**: Assign single/double character codes to each color for chart notation
- **Contrast Text Colors**: Automatic text color selection (black/white) based on background luminance for readability
- **Cell Color Labels**: Each grid cell displays its matching color label in the overlay

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with Svelte 5
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Build Tool**: [Vite](https://vitejs.dev/) v7
- **Testing**: 
  - Unit tests: [Vitest](https://vitest.dev/) with browser mode
  - E2E tests: [Playwright](https://playwright.dev/)
- **Linting/Formatting**: ESLint + Prettier

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── ImageCropper.svelte    # Interactive image cropping component
│   ├── utils/
│   │   ├── canvasDrawing.ts       # Grid, labels, and overlay drawing functions
│   │   ├── colorUtils.ts          # Color manipulation (hex/rgb, luminance, contrast)
│   │   ├── geometryUtils.ts       # Point math (lerp, bilinear blend, distance)
│   │   └── imageUtils.ts          # Image canvas creation and color sampling
│   ├── stores.ts                  # Svelte store for project state management
│   └── index.ts                   # Library exports
├── routes/
│   ├── +layout.svelte             # Root layout with Tailwind CSS
│   ├── +page.svelte               # Home page - project list
│   └── project/
│       └── [uuid]/
│           └── +page.svelte       # Project detail/editor page
└── app.html                       # HTML template
```

## Data Model

### Project
```typescript
interface Project {
  uuid: string;           // Unique identifier
  name: string;           // Display name
  createdAt: number;      // Unix timestamp
  image?: string;         // Base64 encoded image data
  cropPoints?: Point[];   // 4 normalized corner points (0-1)
  rows?: number;          // Grid row count
  cols?: number;          // Grid column count
  gridColor?: string;     // Hex color for grid lines
  gridThickness?: number; // Grid line width in pixels
  colors?: ColorEntry[];  // Color palette
}

interface ColorEntry {
  hex: string;           // Hex color code
  char: string;          // Character label for chart
  textColor?: string;    // Contrasting text color
}

interface Point {
  x: number;  // Normalized 0-1
  y: number;  // Normalized 0-1
}
```

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm

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
# Start the development server
npm run dev

# Start with browser auto-open
npm run dev -- --open
```

### Testing

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run unit tests in watch mode
npm run test:unit

# Run E2E tests
npm run test:e2e
```

### Type Checking

```bash
# One-time check
npm run check

# Watch mode
npm run check:watch
```

### Linting & Formatting

```bash
# Check formatting and lint
npm run lint

# Auto-format code
npm run format
```

### Building for Production

```bash
# Build static site
npm run build

# Preview production build
npm run preview
```

## How It Works

### Image Cropper Component
The `ImageCropper` component is the heart of the application:

1. **Canvas Rendering**: Uses HTML5 Canvas to draw the image and overlays
2. **Point Selection**: Click to add up to 4 corner points defining the crop region
3. **Drag Interaction**: Pointer events enable dragging control points
4. **Grid Drawing**: Uses linear interpolation (`lerp`) for grid lines between corners
5. **Color Sampling**: Bilinear interpolation (`blend`) maps grid cells to image pixels

### Color Extraction
The auto-add colors feature:
1. Iterates through each grid cell (row × column)
2. Samples the center pixel color using bilinear interpolation
3. Averages a small area (configurable sample size) for noise reduction
4. Deduplicates colors within the specified threshold using Euclidean distance in RGB space
5. Assigns sequential character labels (A, B, C, ...)

### Persistence
Projects are automatically saved to `localStorage` under the key `projects`. The store subscribes to changes and persists data on every update.

## Contributing

1. Make code changes
2. Run `npm run check` to validate TypeScript/Svelte
3. Run `npm run test:unit -- --run` to ensure tests pass
4. Format with `npm run format`

## License

This project is private and not licensed for public distribution.
