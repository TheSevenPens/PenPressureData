import { estimateP00, estimateP100, interpolatePhysical } from './interpolate.js';

// Load pressure response brand files from DrawTabData submodule
const brandModules = import.meta.glob(
	'../../../data-repo/data/pressure-response/*-pressure-response.json',
	{ eager: true }
);

// Load pen definition files to look up PenFamily by PenEntityId
const penModules = import.meta.glob(
	'../../../data-repo/data/pens/*-pens.json',
	{ eager: true }
);

// Load pen family definition files
const penFamilyModules = import.meta.glob(
	'../../../data-repo/data/pen-families/*-pen-families.json',
	{ eager: true }
);

// Load inventory files to look up Defects by InventoryId
const inventoryModules = import.meta.glob(
	'../../../data-repo/data/inventory/*-pens.json',
	{ eager: true }
);

// Load defect kinds reference (controlled vocabulary)
const defectKindsModule = import.meta.glob(
	'../../../data-repo/data/reference/defect-kinds.json',
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

// Build pen entity → family and tags lookups from pen definition files
function buildPenLookups() {
	const penEntityToFamily = {};
	const penEntityToTags = {};
	for (const [, module] of Object.entries(penModules)) {
		const data = module.default ?? module;
		const pens = data.Pens ?? [];
		for (const pen of pens) {
			if (pen.EntityId && pen.PenFamily) {
				penEntityToFamily[pen.EntityId] = pen.PenFamily;
			}
			if (pen.EntityId && pen.Tags && pen.Tags.length > 0) {
				penEntityToTags[pen.EntityId] = pen.Tags;
			}
		}
	}

	const familyInfoMap = {};
	for (const [, module] of Object.entries(penFamilyModules)) {
		const data = module.default ?? module;
		const families = data.PenFamilies ?? [];
		for (const fam of families) {
			familyInfoMap[fam.FamilyId] = {
				familyId: fam.FamilyId,
				familyName: fam.FamilyName,
				brand: fam.Brand,
			};
		}
	}

	return { penEntityToFamily, penEntityToTags, familyInfoMap };
}

const { penEntityToFamily, penEntityToTags, familyInfoMap } = buildPenLookups();

// Build inventory defects lookup: InventoryId → Defects[]
function buildDefectsLookup() {
	const inventoryIdToDefects = {};
	for (const [, module] of Object.entries(inventoryModules)) {
		const data = module.default ?? module;
		const items = data.InventoryPens ?? [];
		for (const item of items) {
			if (item.InventoryId && Array.isArray(item.Defects) && item.Defects.length > 0) {
				inventoryIdToDefects[item.InventoryId] = item.Defects;
			}
		}
	}

	const defectKindInfo = {};
	for (const [, module] of Object.entries(defectKindsModule)) {
		const data = module.default ?? module;
		const kinds = data.DefectKinds ?? data.defectKinds ?? [];
		for (const k of kinds) {
			defectKindInfo[k.Kind] = {
				kind: k.Kind,
				description: k.Description || '',
				appliesTo: k.AppliesTo || [],
			};
		}
	}

	return { inventoryIdToDefects, defectKindInfo };
}

const { inventoryIdToDefects, defectKindInfo } = buildDefectsLookup();

function buildData() {
	const allSessions = [];

	for (const [path, module] of Object.entries(brandModules)) {
		const data = module.default ?? module;
		const sessions = data.PressureResponse ?? [];

		for (const raw of sessions) {
			const sessionId = `${raw.InventoryId}_${raw.Date}`;

			// Look up pen family from pen definitions
			const familyId = (raw.PenEntityId && penEntityToFamily[raw.PenEntityId]) || '';

			// Look up defects from inventory
			const defects = inventoryIdToDefects[raw.InventoryId] || [];

			// Map DrawTabData field names to the format the app expects
			const mapped = {
				brand: raw.Brand,
				pen: raw.PenEntityId ? raw.PenEntityId.split('.').pop() : '',
				penEntityId: raw.PenEntityId || '',
				penfamily: familyId,
				inventoryid: raw.InventoryId,
				date: raw.Date,
				user: raw.User || '',
				tablet: raw.TabletEntityId || '',
				driver: raw.Driver || '',
				os: raw.OS || '',
				notes: raw.Notes || '',
				tags: parseTags(raw.tags),
				penDefTags: (raw.PenEntityId && penEntityToTags[raw.PenEntityId]) || [],
				defects,
				isDefective: defects.length > 0,
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

			// Fill interior nulls by interpolating between neighboring non-null P-values.
			const pKeys = ['p00','p01','p05','p10','p20','p25','p30','p40','p50','p60','p70','p75','p80','p90','p95','p99','p100'];
			const pLevels = [0, 1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99, 100];
			for (let i = 1; i < pKeys.length - 1; i++) {
				if (pValues[pKeys[i]] != null) continue;
				// Find previous non-null
				let lo = i - 1;
				while (lo >= 0 && pValues[pKeys[lo]] == null) lo--;
				// Find next non-null
				let hi = i + 1;
				while (hi < pKeys.length && pValues[pKeys[hi]] == null) hi++;
				if (lo < 0 || hi >= pKeys.length) continue;
				const loVal = pValues[pKeys[lo]];
				const hiVal = pValues[pKeys[hi]];
				const t = (pLevels[i] - pLevels[lo]) / (pLevels[hi] - pLevels[lo]);
				pValues[pKeys[i]] = loVal + t * (hiVal - loVal);
			}

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
export { familyInfoMap, penEntityToTags, inventoryIdToDefects, defectKindInfo };

// Collect all unique tags from both pen definitions and session data
export const allKnownTags = (() => {
	const tags = new Set();
	for (const s of allSessions) {
		for (const t of s.tags) tags.add(t);
		for (const t of s.penDefTags) tags.add(t);
	}
	// Also include tags from pen defs that may not have sessions
	for (const tagList of Object.values(penEntityToTags)) {
		for (const t of tagList) tags.add(t);
	}
	return [...tags].sort();
})();

// Build list of pen families that have pressure response data
export const penFamilies = (() => {
	const familiesWithData = new Set();
	for (const s of allSessions) {
		if (s.penfamily) familiesWithData.add(s.penfamily);
	}
	return [...familiesWithData]
		.map((id) => familyInfoMap[id] || { familyId: id, familyName: id, brand: '' })
		.sort((a, b) => a.brand.localeCompare(b.brand) || a.familyName.localeCompare(b.familyName));
})();
