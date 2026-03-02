/**
 * Given an array of [physical, logical] records (sorted by physical ascending),
 * estimate the physical pressure that would yield the target logical percentage,
 * using linear interpolation between adjacent data points.
 * Returns null if the target is outside the range of the data.
 *
 * @param {Array<[number, number]>} records
 * @param {number} targetLogical
 * @returns {number|null}
 */
export function interpolatePhysical(records, targetLogical) {
	for (let i = 0; i < records.length - 1; i++) {
		const [x0, y0] = records[i];
		const [x1, y1] = records[i + 1];
		if (y0 <= targetLogical && targetLogical <= y1) {
			if (y1 === y0) return x0;
			return x0 + (targetLogical - y0) * (x1 - x0) / (y1 - y0);
		}
	}
	return null;
}

/**
 * Format an interpolated physical value for display (1 decimal place), or "—" if null.
 * @param {number|null} val
 * @returns {string}
 */
export function fmtP(val) {
	return val === null ? '—' : val.toFixed(1);
}
