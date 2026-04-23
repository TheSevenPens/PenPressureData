export function load({ params }) {
	// URL lowercases; data stores sessionId as "{UPPERCASE_ID}_YYYY-MM-DD".
	// Rebuild the canonical casing: split on last underscore, uppercase the
	// inventory-id portion, and reassemble.
	const raw = decodeURIComponent(params.sessionId);
	const underscoreIdx = raw.lastIndexOf("_");
	if (underscoreIdx < 0) return { sessionId: raw, inventoryid: "", date: "" };
	const invRaw = raw.slice(0, underscoreIdx);
	const date = raw.slice(underscoreIdx + 1);
	const inventoryid = invRaw.toUpperCase();
	return { sessionId: `${inventoryid}_${date}`, inventoryid, date };
}
