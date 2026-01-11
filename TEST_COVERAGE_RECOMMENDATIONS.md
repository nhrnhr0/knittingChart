# Test Coverage Recommendations

## Current Test Status

Your project has tests for:
- ✅ **stores.spec.ts** - Project CRUD, grid updates, color storage (5 tests)
- ✅ **canvasDrawing.spec.ts** - Color utilities (rgbToHex, hexToRgb, colorDistance, etc.)
- ✅ **ImageCropper.svelte.spec.ts** - Component unit test
- ✅ **page.svelte.spec.ts** - Route component test
- ✅ **demo.spec.ts** - Basic demo test
- ✅ **e2e/demo.test.ts** - End-to-end tests

---

## Recommended Tests to Add

### 1. **Store Tests - Correction/Painting Feature** ⚠️ HIGH PRIORITY
**Currently**: Not tested
**Why**: Core feature for pattern editing

Tests needed for `projects` store:
- `paintCell()` - Adds cell to correctedLetters and pushes to undo stack
- `undoCorrection()` - Pops from undo stack, pushes to redo stack
- `redoCorrection()` - Pops from redo stack, pushes to undo stack  
- `clearCorrections()` - Clears correctedLetters and both stacks
- `toggleCorrectionMode()` - Toggles correctionModeActive flag
- `setCorrectionLetter()` - Updates selectedLetter
- `setBrushSize()` - Sets brush size (clamped 1-5)
- `updateViewportState()` - Updates zoom and pan (defaults provided)
- Multiple paint operations → verify undo/redo chain works
- Paint same cell twice → should overwrite correctly
- Undo/redo boundary conditions (empty stacks)

**Suggested file**: `src/lib/stores.spec.ts` (extend existing)

---

### 2. **Working Utils Tests** ⚠️ CRITICAL
**Currently**: Not tested
**Why**: Core knitting pattern logic

Tests needed in new file `src/lib/utils/workingUtils.spec.ts`:
- `getStitchType()` - Knit/Purl alternation based on startStitch and row
- `getRowDirection()` - Returns correct direction for stitch type
- `getGridRowFromWorking()` - Converts working row to grid row (with startFromBottom flag)
- `getWorkingRowFromGrid()` - Inverse conversion
- `getDisplayRowNumber()` - Returns 1-indexed for display
- `getRowRLE()` - Run-length encoding with:
  - RTL vs LTR direction
  - Color to character mapping
  - Corrected letters override
  - Missing colors (?) handling
  - Empty rows
  - Single row scenarios
- `findClosestColorEntry()` - Exact match vs closest by distance

**Example test cases**:
```typescript
// Row direction
getRowDirection('K', 'RTL', 'LTR') → 'RTL'
getRowDirection('P', 'RTL', 'LTR') → 'LTR'

// Grid conversion (startFromBottom=true, 10 rows)
getGridRowFromWorking(0, true, 10) → 9
getGridRowFromWorking(9, true, 10) → 0

// RLE encoding
getRowRLE(['#fff', '#000'], 0, 2, [{hex:'#fff',char:'W'}, {hex:'#000',char:'B'}], 'LTR') 
  → "1W 1B"

// RLE with correction
getRowRLE([...], 0, 2, [...], 'LTR', {0: 'X'}) 
  → "1X 1B"  (corrected overrides)
```

---

### 3. **Canvas Drawing Tests** ⚠️ HIGH PRIORITY
**Currently**: Only color utilities tested
**Why**: Visual rendering is critical

Tests needed in `src/lib/utils/canvasDrawing.spec.ts` (extend existing):
- `drawGrid()` - Grid is drawn with correct line count
  - Horizontal lines: `rows - 1`
  - Vertical lines: `cols - 1`
  - Lines positioned correctly (bilinear interpolation)
  - Canvas context methods called
- `drawColorLabels()` - Labels positioned and colored correctly
  - Each cell gets correct color label
  - Corrected letters override colors
  - Circle radius scales with cell size
  - Font size scales appropriately
  - Text color respects `textColor` property
- Edge cases:
  - Grid with 0 rows/cols
  - Grid with 1 row/col
  - Missing colorLabels array
  - Invalid points array

**Test approach**: Mock canvas context and verify method calls

---

### 4. **Image Utils Tests** ⚠️ MEDIUM PRIORITY
**Currently**: Not tested
**Why**: Image processing is core feature

Tests needed in new file `src/lib/utils/imageUtils.spec.ts`:
- Image loading from file
- Image cropping/transformation
- Color sampling from image
- Scaling/resizing operations

---

### 5. **Geometry Utils Tests** ⚠️ MEDIUM PRIORITY
**Currently**: Not tested
**Why**: Perspective math is critical

Tests needed in new file `src/lib/utils/geometryUtils.spec.ts`:
- `distancePx()` - Distance calculation between points
- `lerp()` - Linear interpolation
- `blend()` - Bilinear interpolation
  - Corner cases (u=0/1, v=0/1)
  - Center point (u=0.5, v=0.5)
  - Proper 4-point interpolation

**Example**:
```typescript
// Lerp
lerp({x:0, y:0}, {x:10, y:10}, 0.5) → {x:5, y:5}

// Bilinear blend at center
blend(0.5, 0.5, 
  {x:0,y:0}, {x:1,y:0}, 
  {x:0,y:1}, {x:1,y:1})
→ {x:0.5, y:0.5}
```

---

### 6. **Component Tests - WorkingPanel & ModeToggle** 🔲 MEDIUM PRIORITY
**Currently**: Partial
**Why**: UI for working row navigation and mode switching

Tests for `src/lib/components/WorkingPanel.svelte`:
- Row navigation (prev/next row)
- Current row display
- Direction indicators (LTR/RTL)
- Stitch type display (K/P)

Tests for `src/lib/components/ModeToggle.svelte`:
- Toggle between modes
- Visual state reflects mode
- Emit correct events

---

### 7. **E2E Tests - Correction Workflow** 🔲 HIGH PRIORITY
**Currently**: Basic demo test
**Why**: Full user journey for correction feature

E2E tests in `e2e/demo.test.ts` or new file:
- Upload image → create grid → paint cells → verify changes persisted
- Undo/redo operations work across page reload
- Brush size affects paint radius
- Mode toggle switches between modes
- LocalStorage persistence verified

---

## Test Priority Order

### Tier 1 (Critical - Do First)
1. **workingUtils.spec.ts** - All functions
2. **stores.spec.ts** - Extend with correction methods
3. **E2E correction workflow** - Full user journey

### Tier 2 (Important - Do Next)
4. **canvasDrawing.spec.ts** - Grid and label drawing
5. **geometryUtils.spec.ts** - Math functions
6. **WorkingPanel/ModeToggle tests** - Component UX

### Tier 3 (Nice to Have)
7. **imageUtils.spec.ts** - Image processing
8. Additional E2E scenarios

---

## Test Statistics

**Current**: ~40+ tests
**Recommended additions**: ~80-100 new tests

| Module | Current | Recommended | Coverage |
|--------|---------|------------|----------|
| stores.ts | 5 | +15 | 60% → 95% |
| workingUtils.ts | 0 | 20 | 0% → 90% |
| canvasDrawing.ts | 10 | +10 | 70% → 95% |
| colorUtils.ts | 10 | 0 | 95% → 95% |
| geometryUtils.ts | 0 | 8 | 0% → 90% |
| imageUtils.ts | 0 | 10 | 0% → 80% |
| **TOTAL** | **40+** | **+63** | **~70% → 90%** |

---

## How to Start

1. Copy this file as a checklist
2. Create `src/lib/utils/workingUtils.spec.ts` (Tier 1)
3. Extend `src/lib/stores.spec.ts` with correction methods
4. Add `src/lib/utils/geometryUtils.spec.ts`
5. Track progress and update this document
