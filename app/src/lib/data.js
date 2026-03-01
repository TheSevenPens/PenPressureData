// Load all JSON session files from the data directory.
// Glob path is relative to this file: app/src/lib/data.js
// Three levels up reaches the repo root, then into datafiles/
const modules = import.meta.glob(
	'../../../datafiles/pressure-response/**/*.json',
	{ eager: true }
);

function buildData() {
	const allSessions = [];

	for (const [path, module] of Object.entries(modules)) {
		const filename = path.split('/').pop(); // e.g. "HUP.0001_2024-09-23.json"
		const sessionId = filename.replace('.json', ''); // "HUP.0001_2024-09-23"
		const raw = module.default ?? module;
		allSessions.push({ ...raw, sessionId });
	}

	// Sort: brand → model → inventoryid → date
	allSessions.sort((a, b) =>
		a.brand.localeCompare(b.brand) ||
		a.pen.localeCompare(b.pen) ||
		a.inventoryid.localeCompare(b.inventoryid) ||
		a.date.localeCompare(b.date)
	);

	// Build hierarchy: brand → model → inventoryId → sessions[]
	const byBrand = {};
	const sessionById = {};

	for (const session of allSessions) {
		sessionById[session.sessionId] = session;

		if (!byBrand[session.brand]) {
			byBrand[session.brand] = { byModel: {} };
		}
		const brandEntry = byBrand[session.brand];

		if (!brandEntry.byModel[session.pen]) {
			brandEntry.byModel[session.pen] = { byInventoryId: {}, allSessions: [] };
		}
		const modelEntry = brandEntry.byModel[session.pen];

		if (!modelEntry.byInventoryId[session.inventoryid]) {
			modelEntry.byInventoryId[session.inventoryid] = [];
		}
		modelEntry.byInventoryId[session.inventoryid].push(session);
		modelEntry.allSessions.push(session);
	}

	return { allSessions, byBrand, sessionById };
}

export const { allSessions, byBrand, sessionById } = buildData();
export const brands = Object.keys(byBrand).sort();
