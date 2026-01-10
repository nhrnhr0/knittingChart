#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const LINE_COUNT_THRESHOLD = 250;

let filesAboveThreshold = 0;

function countLines(content) {
	return content.split('\n').length;
}

function checkFilesRecursive(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.relative(projectRoot, fullPath);

		if (entry.isDirectory()) {
			// Skip node_modules and other directories
			if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
				checkFilesRecursive(fullPath);
			}
		} else if (entry.isFile()) {
			// Check TypeScript, JavaScript, and Svelte files
			if (/\.(ts|tsx|js|jsx|svelte)$/.test(entry.name)) {
				try {
					const content = fs.readFileSync(fullPath, 'utf-8');
					const lineCount = countLines(content);

					if (lineCount > LINE_COUNT_THRESHOLD) {
						console.warn(
							`⚠️  ${relativePath}: ${lineCount} lines (exceeds ${LINE_COUNT_THRESHOLD})`
						);
						filesAboveThreshold++;
					}
				} catch (err) {
					console.error(`Error reading ${relativePath}: ${err.message}`);
				}
			}
		}
	}
}

console.log(`📊 Checking line counts in src/ (threshold: ${LINE_COUNT_THRESHOLD} lines)...\n`);

checkFilesRecursive(srcDir);

console.log('');
if (filesAboveThreshold === 0) {
	console.log('✅ All files are within the line count threshold.');
	process.exit(0);
} else {
	console.log(
		`⚠️  Found ${filesAboveThreshold} file(s) exceeding ${LINE_COUNT_THRESHOLD} lines.`
	);
	console.log('Consider breaking large files into smaller, more focused modules.');
	process.exit(0); // Exit with 0 so it doesn't fail the check
}
