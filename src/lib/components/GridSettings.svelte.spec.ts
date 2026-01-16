import { describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import GridSettings from './GridSettings.svelte';

describe('GridSettings', () => {
	it('renders grid settings inputs', () => {
		const { getByLabelText } = render(GridSettings, {
			props: {
				rows: 10,
				cols: 10,
				gridColor: '#000000',
				gridThickness: 2,
				onGridChange: () => {},
			},
		});
		expect(getByLabelText('Rows')).toBeTruthy();
		expect(getByLabelText('Cols')).toBeTruthy();
	});

	});
