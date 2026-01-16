import { describe, it, expect } from 'vitest';

type Pt = { x: number; y: number };

import { render } from '@testing-library/svelte';
import ImageCropper from './ImageCropper.svelte';

describe('ImageCropper', () => {
	it('renders canvas element', () => {
		const { container } = render(ImageCropper, {
			props: { src: '', points: [] },
		});
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeTruthy();
	});
});
