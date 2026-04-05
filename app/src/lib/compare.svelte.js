const STORAGE_KEY = "compareGroups";

function load() {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function save(groups) {
	if (typeof window !== "undefined") {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
	}
}

class CompareStore {
	groups = $state(load());

	addGroup(name) {
		const id = `g_${Date.now()}`;
		this.groups = [...this.groups, { id, name, items: [] }];
		save(this.groups);
		return id;
	}

	removeGroup(id) {
		this.groups = this.groups.filter((g) => g.id !== id);
		save(this.groups);
	}

	renameGroup(id, name) {
		this.groups = this.groups.map((g) => (g.id === id ? { ...g, name } : g));
		save(this.groups);
	}

	addItem(groupId, type, value) {
		this.groups = this.groups.map((g) => {
			if (g.id !== groupId) return g;
			if (g.items.some((i) => i.type === type && i.value === value)) return g;
			return { ...g, items: [...g.items, { type, value }] };
		});
		save(this.groups);
	}

	removeItem(groupId, type, value) {
		this.groups = this.groups.map((g) => {
			if (g.id !== groupId) return g;
			return {
				...g,
				items: g.items.filter((i) => !(i.type === type && i.value === value)),
			};
		});
		save(this.groups);
	}

	clearAll() {
		this.groups = [];
		save(this.groups);
	}
}

export const compareStore = new CompareStore();

/**
 * Resolve a group's items to a set of matching sessions.
 */
export function resolveGroupSessions(group, allSessions) {
	const seen = new Set();
	const result = [];
	for (const s of allSessions) {
		if (seen.has(s.sessionId)) continue;
		for (const item of group.items) {
			let match = false;
			if (item.type === "pen") {
				match = s.inventoryid === item.value;
			} else if (item.type === "model") {
				match = `${s.brand}||${s.pen}` === item.value;
			} else if (item.type === "family") {
				match = s.penfamily === item.value;
			} else if (item.type === "tag") {
				match =
					s.tags.includes(item.value) ||
					s.penDefTags.includes(item.value);
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
