/**
 * Data quality checks over sessions.
 *
 * All functions are pure: they take an array of sessions (from data.js)
 * and return plain arrays of flagged items. No side effects.
 */

/**
 * Sessions where logical pressure (the y-axis of records) drops at any point
 * as physical pressure increases. Valid sessions must be monotonically
 * non-decreasing on the logical axis.
 *
 * @param {Array} allSessions
 * @returns {Array} session objects, each augmented with `firstDrop` info
 */
export function findNonMonotonicSessions(allSessions) {
	const out = [];
	for (const s of allSessions) {
		const records = s.records || [];
		let maxSeen = -Infinity;
		let dropIndex = -1;
		let dropFrom = null;
		let dropTo = null;
		for (let i = 0; i < records.length; i++) {
			const y = records[i][1];
			if (y < maxSeen) {
				dropIndex = i;
				dropFrom = maxSeen;
				dropTo = y;
				break;
			}
			if (y > maxSeen) maxSeen = y;
		}
		if (dropIndex >= 0) {
			out.push({ ...s, firstDrop: { index: dropIndex, from: dropFrom, to: dropTo } });
		}
	}
	return out;
}

/**
 * Pens whose lowest observed logical % is still above a threshold.
 * Such pens may have missed the activation threshold, making P00 estimates
 * unreliable. Aggregates by inventoryid across all of that pen's sessions.
 *
 * @param {Array} allSessions
 * @param {number} threshold default 0.5
 * @returns {Array<{brand, model, inventoryid, lowestLogical, sessionCount}>}
 */
export function findMissingLowEnd(allSessions, threshold = 0.5) {
	const byPen = new Map();
	for (const s of allSessions) {
		if (!byPen.has(s.inventoryid)) {
			byPen.set(s.inventoryid, {
				brand: s.brand,
				model: s.pen,
				penEntityId: s.penEntityId,
				inventoryid: s.inventoryid,
				lowestLogical: Infinity,
				sessionCount: 0,
			});
		}
		const entry = byPen.get(s.inventoryid);
		entry.sessionCount++;
		for (const [, y] of (s.records || [])) {
			if (y < entry.lowestLogical) entry.lowestLogical = y;
		}
	}
	const out = [];
	for (const entry of byPen.values()) {
		if (entry.lowestLogical === Infinity) continue;
		if (entry.lowestLogical > threshold) out.push(entry);
	}
	return out.sort((a, b) => b.lowestLogical - a.lowestLogical);
}

/**
 * Pens with only one pressure response session.
 * @param {Array} allSessions
 * @returns {Array<{brand, model, inventoryid, date}>}
 */
export function findSingleSessionPens(allSessions) {
	const byPen = new Map();
	for (const s of allSessions) {
		if (!byPen.has(s.inventoryid)) byPen.set(s.inventoryid, []);
		byPen.get(s.inventoryid).push(s);
	}
	const out = [];
	for (const [id, sessions] of byPen) {
		if (sessions.length === 1) {
			const s = sessions[0];
			out.push({
				brand: s.brand,
				model: s.pen,
				penEntityId: s.penEntityId,
				inventoryid: id,
				date: s.date,
				sessionId: s.sessionId,
			});
		}
	}
	return out.sort((a, b) =>
		a.brand.localeCompare(b.brand) ||
		a.model.localeCompare(b.model) ||
		a.inventoryid.localeCompare(b.inventoryid),
	);
}

/**
 * Pens whose most recent session is older than `days` days ago.
 * @param {Array} allSessions
 * @param {number} days default 365
 * @param {Date} now for testability; defaults to current time
 * @returns {Array<{brand, model, inventoryid, lastDate, daysAgo}>}
 */
export function findStaleMeasurements(allSessions, days = 365, now = new Date()) {
	const byPen = new Map();
	for (const s of allSessions) {
		const existing = byPen.get(s.inventoryid);
		if (!existing || s.date > existing.date) {
			byPen.set(s.inventoryid, {
				brand: s.brand,
				model: s.pen,
				penEntityId: s.penEntityId,
				inventoryid: s.inventoryid,
				date: s.date,
			});
		}
	}
	const out = [];
	for (const entry of byPen.values()) {
		const last = new Date(entry.date);
		if (isNaN(last.getTime())) continue;
		const daysAgo = Math.floor((now - last) / (1000 * 60 * 60 * 24));
		if (daysAgo > days) {
			out.push({
				brand: entry.brand,
				model: entry.model,
				penEntityId: entry.penEntityId,
				inventoryid: entry.inventoryid,
				lastDate: entry.date,
				daysAgo,
			});
		}
	}
	return out.sort((a, b) => b.daysAgo - a.daysAgo);
}

/**
 * Pens recommended for re-measurement: union of findMissingLowEnd,
 * findSingleSessionPens, and findStaleMeasurements.
 * Each entry lists which reasons apply.
 *
 * @param {Array} allSessions
 * @returns {Array<{brand, model, inventoryid, reasons: string[]}>}
 */
export function findRecommendedForRemeasurement(allSessions) {
	const reasons = new Map(); // inventoryid -> { brand, model, inventoryid, reasons: Set }

	function tag(item, reason) {
		if (!reasons.has(item.inventoryid)) {
			reasons.set(item.inventoryid, {
				brand: item.brand,
				model: item.model,
				penEntityId: item.penEntityId,
				inventoryid: item.inventoryid,
				reasons: new Set(),
			});
		}
		reasons.get(item.inventoryid).reasons.add(reason);
	}

	for (const item of findMissingLowEnd(allSessions)) tag(item, "missing-low-end");
	for (const item of findSingleSessionPens(allSessions)) tag(item, "single-session");
	for (const item of findStaleMeasurements(allSessions)) tag(item, "stale");

	return [...reasons.values()]
		.map((r) => ({ ...r, reasons: [...r.reasons].sort() }))
		.sort((a, b) =>
			b.reasons.length - a.reasons.length ||
			a.brand.localeCompare(b.brand) ||
			a.model.localeCompare(b.model) ||
			a.inventoryid.localeCompare(b.inventoryid),
		);
}
