import { describe, it, expect } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import WorkingPanel from './WorkingPanel.svelte';

describe('WorkingPanel', () => {
	it('renders row and column navigators', () => {
		const { getByText } = render(WorkingPanel, {
			props: {
				displayRowNumber: 1,
				totalRows: 10,
				currentCol: 1,
				cols: 10,
				startCol: 0,
				currentStitchType: 'K',
				currentDirection: 'LTR',
				currentRowRLE: 'AABB',
				onIncrementRow: () => {},
				onDecrementRow: () => {},
				onIncrementCol: () => {},
				onDecrementCol: () => {},
			},
		});
		expect(getByText(/R 1/)).toBeTruthy();
		expect(getByText(/Knit/)).toBeTruthy();
	});

	});
