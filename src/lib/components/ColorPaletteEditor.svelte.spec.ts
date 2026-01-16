import { describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import ColorPaletteEditor from './ColorPaletteEditor.svelte';

describe('ColorPaletteEditor', () => {
	it('renders without crashing', () => {
		const { getByText } = render(ColorPaletteEditor, {
			props: {
				colors: [],
				colorThreshold: 75,
				onColorsChange: () => {},
				onAutoAdd: () => {},
				onThresholdChange: () => {},
			},
		});
		expect(getByText('Colors')).toBeTruthy();
	});

	});
