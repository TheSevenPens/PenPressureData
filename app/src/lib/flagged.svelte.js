// V2 format: stores lowercase inventory IDs / entity IDs.
// Old V1 keys (flaggedPens / flaggedModels / flaggedFamilies) are ignored —
// users get a fresh slate after the URL/entity-ID refactor.
const PENS_KEY = "flaggedPensV2";
const MODELS_KEY = "flaggedModelsV2";
const FAMILIES_KEY = "flaggedFamiliesV2";

function loadSet(key) {
	if (typeof window === "undefined") return new Set();
	try {
		const raw = localStorage.getItem(key);
		return new Set(raw ? JSON.parse(raw) : []);
	} catch {
		return new Set();
	}
}

function saveSet(key, set) {
	if (typeof window !== "undefined") {
		localStorage.setItem(key, JSON.stringify([...set]));
	}
}

let flaggedPens = $state(loadSet(PENS_KEY));
let flaggedModels = $state(loadSet(MODELS_KEY));
let flaggedFamilies = $state(loadSet(FAMILIES_KEY));

// Pen flagging uses lowercase inventory IDs (the data stores uppercase like "WAP.0004",
// but URLs use lowercase; normalize at the store boundary).
export function togglePen(inventoryid) {
	const id = String(inventoryid || "").toLowerCase();
	if (!id) return;
	const next = new Set(flaggedPens);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	flaggedPens = next;
	saveSet(PENS_KEY, flaggedPens);
}

export function isPenFlagged(inventoryid) {
	return flaggedPens.has(String(inventoryid || "").toLowerCase());
}

// Model flagging uses the pen's lowercase EntityId (e.g. "wacom.pen.kp504e").
export function toggleModel(entityId) {
	const id = String(entityId || "").toLowerCase();
	if (!id) return;
	const next = new Set(flaggedModels);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	flaggedModels = next;
	saveSet(MODELS_KEY, flaggedModels);
}

export function isModelFlagged(entityId) {
	return flaggedModels.has(String(entityId || "").toLowerCase());
}

// Family flagging uses the family's lowercase EntityId
// (e.g. "wacom.penfamily.wacom_kpgen2").
export function toggleFamily(entityId) {
	const id = String(entityId || "").toLowerCase();
	if (!id) return;
	const next = new Set(flaggedFamilies);
	if (next.has(id)) next.delete(id);
	else next.add(id);
	flaggedFamilies = next;
	saveSet(FAMILIES_KEY, flaggedFamilies);
}

export function isFamilyFlagged(entityId) {
	return flaggedFamilies.has(String(entityId || "").toLowerCase());
}

export function clearAll() {
	flaggedPens = new Set();
	flaggedModels = new Set();
	flaggedFamilies = new Set();
	saveSet(PENS_KEY, flaggedPens);
	saveSet(MODELS_KEY, flaggedModels);
	saveSet(FAMILIES_KEY, flaggedFamilies);
}

export function getFlaggedPens() {
	return flaggedPens;
}

export function getFlaggedModels() {
	return flaggedModels;
}

export function getFlaggedFamilies() {
	return flaggedFamilies;
}

export function getFlaggedCount() {
	return flaggedPens.size + flaggedModels.size + flaggedFamilies.size;
}
