// V2 format: item values use lowercase inventory IDs (pen) or entity IDs (model/family).
// Tag values are unchanged. Old V1 keys (compareGroups / compareSavedViews) are ignored —
// users get a fresh slate after the URL/entity-ID refactor.

import { familyEntityIdToFamilyId } from './data.js';

/**
 * Resolve a group's items to a set of matching sessions, deduplicated by sessionId.
 *
 *   { type: "pen",    value: "wap.0004" }                       — lowercase inventory id
 *   { type: "model",  value: "wacom.pen.kp504e" }               — pen EntityId
 *   { type: "family", value: "wacom.penfamily.wacom_kpgen2" }   — family EntityId
 *   { type: "tag",    value: "UDEMR" }                          — tag string (case-sensitive)
 */
export function resolveGroupSessions(group, allSessions) {
	const seen = new Set();
	const result = [];
	for (const s of allSessions) {
		if (seen.has(s.sessionId)) continue;
		for (const item of group.items) {
			let match = false;
			if (item.type === "pen") {
				match = s.inventoryid && s.inventoryid.toLowerCase() === item.value;
			} else if (item.type === "model") {
				match = s.penEntityId === item.value;
			} else if (item.type === "family") {
				const familyId = familyEntityIdToFamilyId[item.value];
				match = !!familyId && s.penfamily === familyId;
			} else if (item.type === "tag") {
				match = s.tags.includes(item.value) || s.penDefTags.includes(item.value);
			}
			if (match) {
				seen.add(s.sessionId);
				result.push(s);
				break;
			}
		}
	}
	return result;
}

/**
 * Find sessions that appear in 2+ groups.
 */
export function findOverlaps(groups, allSessions) {
	const sessionToGroups = new Map();
	for (const group of groups) {
		const sessions = resolveGroupSessions(group, allSessions);
		for (const s of sessions) {
			if (!sessionToGroups.has(s.sessionId)) {
				sessionToGroups.set(s.sessionId, {
					inventoryid: s.inventoryid,
					groupNames: [],
				});
			}
			sessionToGroups.get(s.sessionId).groupNames.push(group.name);
		}
	}
	const seenIds = new Set();
	const overlaps = [];
	for (const entry of sessionToGroups.values()) {
		if (entry.groupNames.length >= 2 && !seenIds.has(entry.inventoryid)) {
			seenIds.add(entry.inventoryid);
			overlaps.push(entry);
		}
	}
	return overlaps;
}
