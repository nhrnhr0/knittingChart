# Cell Correction Feature Guide

## Overview

The **Cell Correction** feature allows you to manually fix individual cells when the automatic color detection misses or misidentifies the correct letter/color. This is perfect for the knitting pattern designer when the AI color matching needs manual adjustments.

## How to Use

### 1. **Enter Working Mode**
- Click the **"Mode Toggle"** button to switch to Working Mode
- This enables the correction panel and displays the knitting pattern

### 2. **Enable Correction Mode**
- In the correction panel, click **"✏️ Correction Mode ON"** to activate painting mode
- The button will turn blue to indicate correction mode is active

### 3. **Select a Letter**
- The correction panel displays all available letters/colors as colored buttons
- Click the letter you want to paint with
- The selected letter shows a blue border and is highlighted
- **Tip**: On mobile, tap the letter color buttons to select

### 4. **Paint Cells**
- Click on any cell in the grid to paint it with the selected letter
- The cell color will immediately update to the selected letter's color
- **Visual Feedback**: Corrected cells show a **blue dashed border** around them to indicate they've been manually fixed
- The RLE pattern updates automatically to reflect your corrections

### 5. **Undo/Redo Corrections**
- Use the **↶ Undo** button to revert the last correction
- Use the **↷ Redo** button to restore undone corrections
- Both buttons are disabled when there's nothing to undo/redo
- Click **🗑️ Clear All** to remove all corrections at once

## Mobile-Friendly Features

✅ **Touch-optimized buttons** (44px+ minimum size)  
✅ **Responsive grid layout** (adapts to screen size)  
✅ **Large letter selector** with clear visual feedback  
✅ **Easy cell tapping** with improved hit detection  
✅ **One-handed friendly** controls and layout  

## How Corrections Work

### Data Storage
- Corrections are stored in `project.workingState.correctedLetters` as a map: `cellIndex → letter`
- Each project has its own undo/redo stacks for corrections
- All changes persist automatically to localStorage

### RLE Pattern Generation
When the RLE pattern is generated for a row, it:
1. Checks if each cell has a manual correction first
2. Uses the corrected letter if available
3. Falls back to auto-detected color if no correction
4. Encodes the pattern as usual (e.g., "4K 3P")

### Visual Indication
- **Blue dashed border** around corrected cells in the grid
- Makes it easy to see at a glance which cells have been manually fixed

## Example Workflow

```
1. Upload image → Define crop → Set grid (10 rows × 15 cols)
2. Enter Working Mode
3. Enable Correction Mode
4. Select letter "K" (Knit)
5. Click on cell at row 2, col 5 to paint it as "K"
   → Cell now shows "K" with blue dashed border
   → RLE pattern updates immediately
6. Select letter "P" (Purl)
7. Paint a few more cells with "P"
8. If you make a mistake, click "Undo" to revert
9. Exit Correction Mode when done
10. Continue with regular working mode navigation
```

## Tips for Best Results

- **One letter at a time**: Select a letter, paint all cells with it, then select the next letter
- **Fix common patterns first**: Correct systematic errors before individual mistakes
- **Check the RLE**: After corrections, verify the RLE pattern looks correct before knitting
- **Use undo generously**: Undo is instant, so experiment without worry
- **Mobile typing**: On mobile, select letters by tapping the colored buttons clearly

## Design Benefits

### Good Code Architecture
- ✅ Separation of concerns: UI layer, state management, and rendering
- ✅ Immutable undo/redo stacks for predictable state changes
- ✅ Reactive updates: Changes automatically propagate to RLE generation
- ✅ No complex diffing: Simple Record<index, letter> map

### Comfortable UI/UX
- ✅ Non-intrusive: Optional correction mode doesn't clutter normal workflow
- ✅ Visual feedback: Blue borders show what's been corrected
- ✅ Reversible: Full undo/redo support for confidence
- ✅ Mobile-first: Touch-friendly buttons and responsive layout
- ✅ Fast: Instant updates without network calls

## Files Modified

- `src/lib/stores.ts` - Added correction state and actions
- `src/lib/components/CorrectionMode.svelte` - New UI component
- `src/lib/utils/workingUtils.ts` - Updated RLE generation
- `src/lib/utils/canvasDrawing.ts` - Visual feedback for corrections
- `src/lib/components/ImageCropper.svelte` - Cell click detection
- `src/routes/project/[uuid]/+page.svelte` - Integration

## Keyboard Shortcuts (Optional Future Enhancement)

Currently mouse/touch only. Could add:
- `U` = Undo
- `R` = Redo
- `C` = Toggle Correction Mode
- `1-9` = Quick select letter 1-9
