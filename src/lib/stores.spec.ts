import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Project, ColorEntry } from './stores';

type StorageShape = Record<string, string>;

class MockStorage {
	private store: StorageShape = {};
	getItem(key: string) {
		return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
	}
	setItem(key: string, value: string) {
		this.store[key] = String(value);
	}
	removeItem(key: string) {
		delete this.store[key];
	}
	clear() {
		this.store = {};
	}
}

const STORAGE_KEY = 'projects';

function setupDomWithStorage(initial?: string) {
	const storage = new MockStorage();
	if (typeof initial === 'string') {
		storage.setItem(STORAGE_KEY, initial);
	}
	(globalThis as any).localStorage = storage;
	(globalThis as any).window = { localStorage: storage } as unknown as Window;
	return storage;
}

afterEach(() => {
	delete (globalThis as any).window;
	delete (globalThis as any).localStorage;
	vi.resetModules();
});

describe('projects store', () => {
	describe('addProject', () => {
		it('adds a project and persists to localStorage', async () => {
			const storage = setupDomWithStorage();
			const { projects } = await import('./stores');
			const project = {
				uuid: 'abc',
				name: 'demo',
				createdAt: 123,
				rows: 1,
				cols: 2,
				gridColor: '#111111',
				gridThickness: 2,
				colors: []
			};

			projects.addProject(project);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved).toEqual([project]);
		}, 20000);

		it('adds multiple projects in order', async () => {
			const storage = setupDomWithStorage();
			const { projects } = await import('./stores');
			const p1 = { uuid: 'p1', name: 'first', createdAt: 1, colors: [] };
			const p2 = { uuid: 'p2', name: 'second', createdAt: 2, colors: [] };

			projects.addProject(p1);
			projects.addProject(p2);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved).toHaveLength(2);
			expect(saved[0].uuid).toBe('p1');
			expect(saved[1].uuid).toBe('p2');
		});
	});

	describe('deleteProject', () => {
		it('removes a project by UUID', async () => {
			const storage = setupDomWithStorage(
				JSON.stringify([
					{ uuid: 'p1', name: 'keep', createdAt: 1, colors: [] },
					{ uuid: 'p2', name: 'delete', createdAt: 2, colors: [] }
				])
			);
			const { projects } = await import('./stores');

			projects.deleteProject('p2');

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved).toHaveLength(1);
			expect(saved[0].uuid).toBe('p1');
		});

		it('does nothing if UUID not found', async () => {
			const storage = setupDomWithStorage(
				JSON.stringify([{ uuid: 'p1', name: 'test', createdAt: 1, colors: [] }])
			);
			const { projects } = await import('./stores');

			projects.deleteProject('nonexistent');

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved).toHaveLength(1);
		});
	});

	describe('updateProject', () => {
		it('updates project name without touching other fields', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'old',
				createdAt: 1,
				rows: 1,
				cols: 2,
				gridColor: '#222222',
				gridThickness: 3
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.updateProject('p1', 'new');

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0]).toMatchObject({
				uuid: 'p1',
				name: 'new',
				rows: 1,
				cols: 2,
				gridColor: '#222222',
				gridThickness: 3
			});
		});

		it('does not affect other projects', async () => {
			const storage = setupDomWithStorage(
				JSON.stringify([
					{ uuid: 'p1', name: 'first', createdAt: 1, colors: [] },
					{ uuid: 'p2', name: 'second', createdAt: 2, colors: [] }
				])
			);
			const { projects } = await import('./stores');

			projects.updateProject('p1', 'updated');

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].name).toBe('updated');
			expect(saved[1].name).toBe('second');
		});
	});

	describe('updateProjectImage', () => {
		it('updates image and persists', async () => {
			const baseProject = { uuid: 'p1', name: 'test', createdAt: 1, colors: [] };
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			const imageData = 'data:image/png;base64,abc123';
			projects.updateProjectImage('p1', imageData);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].image).toBe(imageData);
		});

		it('can set image to undefined', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'test',
				createdAt: 1,
				image: 'data:...',
				colors: []
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.updateProjectImage('p1', undefined);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].image).toBeUndefined();
		});
	});

	describe('updateProjectCrop', () => {
		it('updates crop points', async () => {
			const baseProject = { uuid: 'p1', name: 'test', createdAt: 1, colors: [] };
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			const points = [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
				{ x: 1, y: 1 },
				{ x: 0, y: 1 }
			];
			projects.updateProjectCrop('p1', points);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].cropPoints).toEqual(points);
		});

		it('can clear crop points', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'test',
				createdAt: 1,
				cropPoints: [{ x: 0, y: 0 }],
				colors: []
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.updateProjectCrop('p1', undefined);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].cropPoints).toBeUndefined();
		});
	});

	describe('updateProjectGrid', () => {
		it('updates grid while keeping existing color settings when not provided', async () => {
			const baseProject = {
				uuid: 'p2',
				name: 'grid',
				createdAt: 2,
				rows: 1,
				cols: 1,
				gridColor: '#333333',
				gridThickness: 1
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.updateProjectGrid('p2', 5, 6);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0]).toMatchObject({
				rows: 5,
				cols: 6,
				gridColor: '#333333',
				gridThickness: 1
			});
		});

		it('updates grid color and thickness when provided', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'test',
				createdAt: 1,
				rows: 10,
				cols: 10
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.updateProjectGrid('p1', 20, 20, '#ff0000', 3);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0]).toMatchObject({
				rows: 20,
				cols: 20,
				gridColor: '#ff0000',
				gridThickness: 3
			});
		});
	});

	describe('updateProjectColors', () => {
		it('stores colors using a cloned array', async () => {
			const baseProject = { uuid: 'p3', name: 'colors', createdAt: 3 };
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			const incoming = [{ hex: '#111111', char: 'A' }];
			projects.updateProjectColors('p3', incoming as any);
			incoming.push({ hex: '#222222', char: 'B' });

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].colors).toEqual([{ hex: '#111111', char: 'A' }]);
		});

		it('handles empty color array', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'test',
				createdAt: 1,
				colors: [{ hex: '#fff', char: 'A' }]
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.updateProjectColors('p1', []);

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].colors).toEqual([]);
		});
	});

	describe('paintCell', () => {
		it('adds a cell correction to undo stack', async () => {
			const baseProject = { uuid: 'p1', name: 'test', createdAt: 1, colors: [] };
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.paintCell('p1', 5, 'A');

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].correctedLetters?.[5]).toBe('A');
		});

		it('clears redo stack when painting new cell', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'test',
				createdAt: 1,
				colors: [],
				correctedLetters: { 1: 'A' }
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.paintCell('p1', 5, 'B');
			projects.undoCorrection('p1'); // Undo paint
			projects.paintCell('p1', 10, 'C'); // New paint clears redo

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			// RedoStack should be empty
			expect(saved[0].__redoStack || []).toHaveLength(0);
		});
	});

	describe('undoCorrection', () => {
		it('restores previous state from undo stack', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'test',
				createdAt: 1,
				colors: [],
				correctedLetters: { 1: 'B' }
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.paintCell('p1', 5, 'A');
			projects.undoCorrection('p1');

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			// Should go back to previous state
			expect(saved[0].correctedLetters?.[5]).toBeUndefined();
		});
	});

	describe('redoCorrection', () => {
		it('restores state from redo stack', async () => {
			const baseProject = {
				uuid: 'p1',
				name: 'test',
				createdAt: 1,
				colors: [],
				correctedLetters: {}
			};
			const storage = setupDomWithStorage(JSON.stringify([baseProject]));
			const { projects } = await import('./stores');

			projects.paintCell('p1', 5, 'A');
			projects.undoCorrection('p1');
			projects.redoCorrection('p1');

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved[0].correctedLetters?.[5]).toBe('A');
		});
	});

	describe('persistence', () => {
		it('loads projects from localStorage on init', async () => {
			const initial = JSON.stringify([
				{ uuid: 'p1', name: 'saved', createdAt: 1, colors: [] }
			]);
			const storage = setupDomWithStorage(initial);
			const { projects } = await import('./stores');

			let loaded: Project[] = [];
			projects.subscribe((p) => {
				loaded = p;
			});

			expect(loaded).toHaveLength(1);
			expect(loaded[0].name).toBe('saved');
		});

		it('recovers gracefully from invalid localStorage JSON', async () => {
			const storage = setupDomWithStorage('not json');
			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			await import('./stores');
			errorSpy.mockRestore();

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved).toEqual([]);
		});

		it('syncs all changes to localStorage', async () => {
			const storage = setupDomWithStorage();
			const { projects } = await import('./stores');

			projects.addProject({
				uuid: 'p1',
				name: 'test1',
				createdAt: 1,
				colors: []
			});

			projects.updateProject('p1', 'updated');
			projects.addProject({
				uuid: 'p2',
				name: 'test2',
				createdAt: 2,
				colors: []
			});

			const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
			expect(saved).toHaveLength(2);
			expect(saved[0].name).toBe('updated');
		});
	});
});

