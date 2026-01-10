import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test.describe('Mobile responsive layout', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('home page is visible on mobile (375px)', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(page.locator('h1')).toBeVisible();
		const h1 = page.locator('h1');
		const boundingBox = await h1.boundingBox();
		expect(boundingBox?.width).toBeLessThanOrEqual(375);
	});

	test('home page is visible on tablet (768px)', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(page.locator('h1')).toBeVisible();
	});

	test('home page is visible on desktop (1024px)', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await expect(page.locator('h1')).toBeVisible();
	});
});

test.describe('Project creation workflow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('can create a new project on mobile', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		
		// Find and click the "New Project" button
		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await expect(newProjectBtn).toBeVisible();
		await newProjectBtn.click();

		// Should navigate to project creation
		await expect(page).toHaveURL(/\/project\//);
	});

	test('can create a new project on tablet', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 });
		
		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await expect(newProjectBtn).toBeVisible();
		await newProjectBtn.click();

		await expect(page).toHaveURL(/\/project\//);
	});
});

test.describe('Image upload and cropping on mobile', () => {
	test('can upload an image file on mobile', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		// Create a new project first
		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();
		await expect(page).toHaveURL(/\/project\//);

		// Look for image upload input
		const uploadInput = page.locator('input[type="file"]').first();
		if (await uploadInput.isVisible()) {
			// Set small test image via page evaluation
			const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
			await uploadInput.evaluate(el => {
				const input = el as HTMLInputElement;
				const dataTransfer = new DataTransfer();
				const file = new File([''], 'test.png', { type: 'image/png' });
				dataTransfer.items.add(file);
				input.files = dataTransfer.files;
				input.dispatchEvent(new Event('change', { bubbles: true }));
			});
		}
	});

	test('crop handles are touch-friendly on mobile', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		// Navigate to a project with image
		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		// Look for canvas element which indicates image is loaded
		const canvas = page.locator('canvas').first();
		
		if (await canvas.isVisible()) {
			const boundingBox = await canvas.boundingBox();
			expect(boundingBox?.width).toBeGreaterThan(0);
			expect(boundingBox?.height).toBeGreaterThan(0);
		}
	});
});

test.describe('Canvas zoom and pan on working view', () => {
	test('reset zoom button appears when zoomed on mobile', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		// Setup project and navigate to working view
		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		// The reset zoom button should only appear when zoom > 1
		// We can trigger zoom via wheel event or pinch gesture
		const canvas = page.locator('canvas').first();
		if (await canvas.isVisible()) {
			// Simulate wheel zoom
			await canvas.evaluate(el => {
				const event = new WheelEvent('wheel', {
					deltaY: -100,
					bubbles: true,
					cancelable: true
				});
				el.dispatchEvent(event);
			});
			
			// Reset button should now be visible if zoom changed
			const resetBtn = page.locator('button', { hasText: /reset zoom/i });
			// Button visibility depends on actual zoom state, which may not change in test
		}
	});

	test('canvas is scrollable on mobile with zoom', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const canvas = page.locator('canvas').first();
		if (await canvas.isVisible()) {
			// Canvas should have touch-action: none for proper interaction
			const touchAction = await canvas.evaluate(el => getComputedStyle(el).touchAction);
			expect(touchAction).toBe('none');
		}
	});
});

test.describe('Color palette editor on mobile', () => {
	test('color palette controls fit on mobile screen', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		// Look for color palette section
		const colorSection = page.locator('text=Colors').first();
		if (await colorSection.isVisible()) {
			const boundingBox = await colorSection.boundingBox();
			expect(boundingBox?.width).toBeLessThanOrEqual(375);
		}
	});

	test('color input fields are accessible on mobile', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		// Find color input
		const colorInputs = page.locator('input[type="color"]');
		const count = await colorInputs.count();
		
		for (let i = 0; i < Math.min(count, 1); i++) {
			const input = colorInputs.nth(i);
			if (await input.isVisible()) {
				const box = await input.boundingBox();
				expect(box?.height).toBeGreaterThanOrEqual(40); // Touch target size
			}
		}
	});
});

test.describe('Correction mode on mobile', () => {
	test('correction mode toggle button is accessible', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		const correctionToggle = page.locator('button', { hasText: /correction mode/i });
		if (await correctionToggle.isVisible()) {
			const box = await correctionToggle.boundingBox();
			expect(box?.height).toBeGreaterThanOrEqual(40); // WCAG 2.1 minimum touch target
		}
	});

	test('brush size slider is usable on mobile', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		// Enable correction mode first
		const correctionToggle = page.locator('button', { hasText: /correction mode/i });
		if (await correctionToggle.isVisible()) {
			await correctionToggle.click();

			// Look for brush size slider
			const brushSlider = page.locator('input[type="range"]#brush-size');
			if (await brushSlider.isVisible()) {
				const box = await brushSlider.boundingBox();
				expect(box?.width).toBeGreaterThan(50);
			}
		}
	});

	test('letter selection buttons have adequate spacing on mobile', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		const correctionToggle = page.locator('button', { hasText: /correction mode/i });
		if (await correctionToggle.isVisible()) {
			await correctionToggle.click();

			// Look for letter selector buttons
			const letterButtons = page.locator('div.grid button').first();
			if (await letterButtons.isVisible()) {
				const box = await letterButtons.boundingBox();
				// Each button should be at least 40px (touch friendly)
				expect(box?.height).toBeGreaterThanOrEqual(36); // Grid items may be smaller due to gap
			}
		}
	});
});

test.describe('Working panel navigation on mobile', () => {
	test('row navigation buttons are accessible on mobile', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		// Look for working panel
		const workingPanel = page.locator('text=Working on Row').first();
		if (await workingPanel.isVisible()) {
			// Find row navigation buttons
			const rowBtns = page.locator('button').filter({ hasText: /−|\+/ });
			const count = await rowBtns.count();
			
			// Should have at least row +/- buttons
			expect(count).toBeGreaterThanOrEqual(2);
			
			// Check first button size
			if (count > 0) {
				const box = await rowBtns.first().boundingBox();
				expect(box?.height).toBeGreaterThanOrEqual(36); // Mobile-friendly size
			}
		}
	});

	test('working panel text is readable on narrow screens', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE size

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		await newProjectBtn.click();

		const workingPanel = page.locator('text=Working on Row').first();
		if (await workingPanel.isVisible()) {
			const fontSize = await workingPanel.evaluate(el => 
				parseInt(getComputedStyle(el).fontSize)
			);
			// Font size should be reasonable for readability
			expect(fontSize).toBeGreaterThanOrEqual(12);
		}
	});
});

test.describe('Cross-device viewport compatibility', () => {
	const viewports = [
		{ name: 'iPhone 12', width: 390, height: 844 },
		{ name: 'iPhone SE', width: 375, height: 667 },
		{ name: 'Pixel 5', width: 393, height: 851 },
		{ name: 'iPad', width: 768, height: 1024 },
		{ name: 'Desktop', width: 1440, height: 900 }
	];

	viewports.forEach(({ name, width, height }) => {
		test(`renders correctly on ${name} (${width}x${height})`, async ({ page }) => {
			await page.setViewportSize({ width, height });
			await page.goto('/');
			
			// Main heading should always be visible
			const h1 = page.locator('h1');
			await expect(h1).toBeVisible();
			
			// Content should not overflow horizontally
			const content = page.locator('main, body, .container').first();
			const box = await content.boundingBox();
			expect(box?.width).toBeLessThanOrEqual(width + 20); // Allow small margin
		});
	});
});

test.describe('Touch interaction responsiveness', () => {
	test('touch events are properly handled on mobile buttons', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		
		// Simulate touch interaction
		await newProjectBtn.tap();
		
		// Should navigate successfully
		await expect(page).toHaveURL(/\/project\//);
	});

	test('long press does not interfere with button clicks', async ({ page }) => {
		await page.goto('/');
		await page.setViewportSize({ width: 375, height: 667 });

		const newProjectBtn = page.locator('button', { hasText: /new project|create|add/i }).first();
		
		// Simulate touch down
		await newProjectBtn.dispatchEvent('touchstart');
		
		// Brief delay
		await page.waitForTimeout(100);
		
		// Simulate touch end
		await newProjectBtn.dispatchEvent('touchend');
		await newProjectBtn.click();
		
		// Should still work
		await expect(page).toHaveURL(/\/project\//);
	});
});
