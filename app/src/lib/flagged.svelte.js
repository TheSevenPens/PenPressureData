const PENS_KEY = "flaggedPens";
const MODELS_KEY = "flaggedModels";
const FAMILIES_KEY = "flaggedFamilies";

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

export function modelKey(brand, model) {
	return `${brand}||${model}`;
}

export function togglePen(inventoryid) {
	const next = new Set(flaggedPens);
	if (next.has(inventoryid)) next.delete(inventoryid);
	else next.add(inventoryid);
	flaggedPens = next;
	saveSet(PENS_KEY, flaggedPens);
}

export function toggleModel(brand, model) {
	const key = modelKey(brand, model);
	const next = new Set(flaggedModels);
	if (next.has(key)) next.delete(key);
	else next.add(key);
	flaggedModels = next;
	saveSet(MODELS_KEY, flaggedModels);
}

export function toggleFamily(familyId) {
	const next = new Set(flaggedFamilies);
	if (next.has(familyId)) next.delete(familyId);
	else next.add(familyId);
	flaggedFamilies = next;
	saveSet(FAMILIES_KEY, flaggedFamilies);
}

export function isPenFlagged(inventoryid) {
	return flaggedPens.has(inventoryid);
}

export function isModelFlagged(brand, model) {
	return flaggedModels.has(modelKey(brand, model));
}

export function isFamilyFlagged(familyId) {
	return flaggedFamilies.has(familyId);
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
