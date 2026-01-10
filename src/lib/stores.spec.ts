import { describe, it, expect, vi, afterEach } from 'vitest';

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
	});

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

	it('recovers gracefully from invalid localStorage JSON', async () => {
		const storage = setupDomWithStorage('not json');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		await import('./stores');
		errorSpy.mockRestore();

		const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
		expect(saved).toEqual([]);
	});
});
