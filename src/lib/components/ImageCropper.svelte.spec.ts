import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ImageCropper from './ImageCropper.svelte';

type Pt = { x: number; y: number };

const tinyPng =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wwAAn8B9pE3lB8AAAAASUVORK5CYII=';

// A different tiny red 1x1 PNG for testing image updates
const tinyRedPng =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

describe('ImageCropper', () => {
	it('emits a change event when a new point is added', async () => {
		let lastPoints: Pt[] | undefined;
		render(ImageCropper, {
			props: {
				src: tinyPng,
				points: [{ x: 0, y: 0 } as Pt],
				maxPoints: 3
			},
			events: {
				change: (event) => {
					lastPoints = event.detail.points as Pt[] | undefined;
				}
			}
		});

		const canvas = await waitForCanvas();
		const rect = canvas.getBoundingClientRect();
		canvas.dispatchEvent(
			new MouseEvent('click', {
				clientX: rect.left + 5,
				clientY: rect.top + 5,
				bubbles: true
			})
		);

		await waitFor(() => (lastPoints?.length ?? 0) === 2);
		expect(lastPoints?.length).toBe(2);
	});

	it('updates the canvas when src prop changes', async () => {
		const { rerender } = render(ImageCropper, {
			props: {
				src: tinyPng,
				points: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
					{ x: 1, y: 1 },
					{ x: 0, y: 1 }
				] as Pt[]
			}
		});

		const canvas = await waitForCanvas();
		const initialWidth = canvas.width;
		const initialHeight = canvas.height;

		// Change the src prop to a different image
		await rerender({
			src: tinyRedPng,
			points: [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
				{ x: 1, y: 1 },
				{ x: 0, y: 1 }
			] as Pt[]
		});

		// Wait for canvas to be redrawn (it should still have valid dimensions)
		await waitFor(() => canvas.width > 0 && canvas.height > 0);

		// Canvas should still be properly sized after image change
		expect(canvas.width).toBeGreaterThan(0);
		expect(canvas.height).toBeGreaterThan(0);
		// Since both images are 1x1, dimensions should remain the same
		expect(canvas.width).toBe(initialWidth);
		expect(canvas.height).toBe(initialHeight);
	});
});

function waitForCanvas() {
	return new Promise<HTMLCanvasElement>((resolve, reject) => {
		const start = performance.now();
		const tick = () => {
			const c = document.querySelector('canvas') as HTMLCanvasElement | null;
			if (c && c.width > 0 && c.height > 0) {
				resolve(c);
				return;
			}
			if (performance.now() - start > 1000) {
				reject(new Error('Canvas did not become ready in time'));
				return;
			}
			requestAnimationFrame(tick);
		};
		tick();
	});
}

function waitFor(check: () => boolean, timeout = 1000) {
	return new Promise<void>((resolve, reject) => {
		const start = performance.now();
		const tick = () => {
			if (check()) {
				resolve();
				return;
			}
			if (performance.now() - start > timeout) {
				reject(new Error('Condition not met within timeout'));
				return;
			}
			requestAnimationFrame(tick);
		};
		tick();
	});
}
