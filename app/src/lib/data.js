import { estimateP00, estimateP100, interpolatePhysical } from './interpolate.js';

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

		const pValues = {
			p00: estimateP00(raw.records),
			p01: interpolatePhysical(raw.records, 1),
			p05: interpolatePhysical(raw.records, 5),
			p10: interpolatePhysical(raw.records, 10),
			p20: interpolatePhysical(raw.records, 20),
			p25: interpolatePhysical(raw.records, 25),
			p30: interpolatePhysical(raw.records, 30),
			p40: interpolatePhysical(raw.records, 40),
			p50: interpolatePhysical(raw.records, 50),
			p60: interpolatePhysical(raw.records, 60),
			p70: interpolatePhysical(raw.records, 70),
			p75: interpolatePhysical(raw.records, 75),
			p80: interpolatePhysical(raw.records, 80),
			p90: interpolatePhysical(raw.records, 90),
			p95: interpolatePhysical(raw.records, 95),
			p99: interpolatePhysical(raw.records, 99),
			p100: estimateP100(raw.records)
		};

		allSessions.push({ ...raw, sessionId, pValues });
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
