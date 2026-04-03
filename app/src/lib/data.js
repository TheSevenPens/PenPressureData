import { estimateP00, estimateP100, interpolatePhysical } from './interpolate.js';

// Load pressure response brand files from DrawTabData submodule
const brandModules = import.meta.glob(
	'../../../data-repo/data/pressure-response/*-pressure-response.json',
	{ eager: true }
);

function parseTags(tags) {
	if (Array.isArray(tags)) {
		return tags
			.map((tag) => String(tag).trim())
			.filter(Boolean);
	}

	if (typeof tags !== 'string') return [];

	return tags
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);
}

function buildData() {
	const allSessions = [];

	for (const [path, module] of Object.entries(brandModules)) {
		const data = module.default ?? module;
		const sessions = data.PressureResponse ?? [];

		for (const raw of sessions) {
			const sessionId = `${raw.InventoryId}_${raw.Date}`;

			// Map DrawTabData field names to the format the app expects
			const mapped = {
				brand: raw.Brand,
				pen: raw.PenEntityId ? raw.PenEntityId.split('.').pop() : '',
				penfamily: raw.PenFamily || '',
				inventoryid: raw.InventoryId,
				date: raw.Date,
				user: raw.User || '',
				tablet: raw.TabletEntityId || '',
				driver: raw.Driver || '',
				os: raw.OS || '',
				notes: raw.Notes || '',
				tags: parseTags(raw.tags),
				records: raw.Records || [],
			};

			const pValues = {
				p00: estimateP00(mapped.records),
				p01: interpolatePhysical(mapped.records, 1),
				p05: interpolatePhysical(mapped.records, 5),
				p10: interpolatePhysical(mapped.records, 10),
				p20: interpolatePhysical(mapped.records, 20),
				p25: interpolatePhysical(mapped.records, 25),
				p30: interpolatePhysical(mapped.records, 30),
				p40: interpolatePhysical(mapped.records, 40),
				p50: interpolatePhysical(mapped.records, 50),
				p60: interpolatePhysical(mapped.records, 60),
				p70: interpolatePhysical(mapped.records, 70),
				p75: interpolatePhysical(mapped.records, 75),
				p80: interpolatePhysical(mapped.records, 80),
				p90: interpolatePhysical(mapped.records, 90),
				p95: interpolatePhysical(mapped.records, 95),
				p99: interpolatePhysical(mapped.records, 99),
				p100: estimateP100(mapped.records)
			};

			allSessions.push({ ...mapped, sessionId, pValues });
		}
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
