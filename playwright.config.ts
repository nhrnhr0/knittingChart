import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'npm run build && npm run preview', port: 4173 },
	testDir: 'e2e',
	use: {
		baseURL: 'http://localhost:4173',
	},
	projects: [
		{
			name: 'Desktop Chrome',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'Mobile Safari',
			use: { ...devices['iPhone 13'] },
		},
		{
			name: 'Mobile Chrome',
			use: { ...devices['Pixel 5'] },
		},
		{
			name: 'Tablet iPad',
			use: { ...devices['iPad (gen 7)'] },
		},
	],
});
