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
 * Compute all consecutive slopes (dy/dx) from a records array.
 * @param {Array<[number, number]>} records
 * @returns {number[]}
 */
function computeSlopes(records) {
	const slopes = [];
	for (let i = 0; i < records.length - 1; i++) {
		const [x0, y0] = records[i];
		const [x1, y1] = records[i + 1];
		if (x1 > x0) slopes.push((y1 - y0) / (x1 - x0));
	}
	return slopes;
}

/**
 * Compute an exponentially recency-weighted average of a slope array.
 * The LAST element is treated as most recent and receives the highest weight
 * (weight = 2^i where i=0 is oldest, i=N-1 is newest).
 *
 * @param {number[]} slopes  ordered oldest → newest
 * @returns {number|null}
 */
function weightedVelocity(slopes) {
	if (slopes.length === 0) return null;
	const weights = slopes.map((_, i) => Math.pow(2, i));
	const sumW = weights.reduce((a, b) => a + b, 0);
	return slopes.reduce((sum, v, i) => sum + v * weights[i], 0) / sumW;
}

// Number of consecutive slopes to include in the inertia average.
const N_SLOPES = 4;

// Threshold for P00/P100: treat as reached when remaining gap ≤ 0.5%.
const THRESHOLD = 0.5;

/**
 * Estimate the physical pressure at which logical pressure first rises from 0%
 * (i.e. the Initial Activation Force / P00).
 *
 * Uses a spring model: imagining a ball rolling backward from the first measured
 * point, its deceleration is proportional to its remaining distance from 0%
 * (the gap y itself). This gives exponential decay of y as x decreases:
 *
 *   y(x) = y_first · exp(k · (x − x_first))   for x < x_first
 *
 * where k = v_eff / y_first and v_eff is the inertia-weighted velocity at the
 * start of the data (earliest slopes weighted most heavily, since they are most
 * "recent" for a ball moving in the backward direction).
 *
 * P00 is defined as x where y drops to 0.5%.
 *
 * @param {Array<[number, number]>} records
 * @returns {number|null}
 */
export function estimateP00(records) {
	if (records[0][1] <= 0) return records[0][0];
	if (records.length < 2) return null;

	const allSlopes = computeSlopes(records);
	if (allSlopes.length === 0) return null;

	// Take the first N slopes. For the backward-moving ball the earliest slope
	// is most "recent", so reverse before weighting (weightedVelocity treats
	// the last element as newest/highest-weight).
	const firstSlopes = allSlopes.slice(0, N_SLOPES).reverse();
	const vEff = weightedVelocity(firstSlopes);
	if (vEff === null || vEff <= 0) return null;

	const [xFirst, yFirst] = records[0];
	if (yFirst <= THRESHOLD) return xFirst;

	// Spring constant: k = vEff / yFirst
	const k = vEff / yFirst;

	// Solve y(x) = THRESHOLD → x = xFirst + ln(THRESHOLD / yFirst) / k
	const p00 = xFirst + Math.log(THRESHOLD / yFirst) / k;

	if (p00 < 0) return 0;
	if (p00 >= xFirst) return xFirst;
	return p00;
}

/**
 * Estimate the physical pressure at which logical pressure reaches 100% (P100).
 *
 * Uses a spring model: the remaining gap r = 100 − y decays proportionally to
 * itself as x increases — like a ball approaching 100% that decelerates the
 * closer it gets. This gives:
 *
 *   r(x) = r_last · exp(−k · (x − x_last))
 *
 * where k = v_eff / r_last and v_eff is the inertia-weighted velocity at the
 * end of the data (most recent slopes weighted most heavily).
 *
 * P100 is defined as x where remaining drops to 0.5% (i.e. y = 99.5%).
 *
 * @param {Array<[number, number]>} records
 * @returns {number|null}
 */
export function estimateP100(records) {
	for (const [x, y] of records) {
		if (y >= 100) return x;
	}
	if (records.length < 2) return null;

	const allSlopes = computeSlopes(records);
	if (allSlopes.length === 0) return null;

	// Take last N slopes, most recent last — weightedVelocity gives it highest weight.
	const lastSlopes = allSlopes.slice(-N_SLOPES);
	const vEff = weightedVelocity(lastSlopes);
	if (vEff === null || vEff <= 0) return null;

	const [xLast, yLast] = records[records.length - 1];
	const rLast = 100 - yLast;

	if (rLast <= 0) return xLast;
	if (rLast <= THRESHOLD) return xLast;

	// Spring constant: k = vEff / rLast
	const k = vEff / rLast;

	// Solve r(x) = THRESHOLD → x = xLast + ln(rLast / THRESHOLD) / k
	const p100 = xLast + Math.log(rLast / THRESHOLD) / k;

	if (p100 <= xLast) return xLast;
	if (p100 > xLast * 4) return null;
	return p100;
}

/**
 * Format an interpolated physical value for display (1 decimal place), or "—" if null.
 * @param {number|null} val
 * @returns {string}
 */
export function fmtP(val) {
	return val === null ? '—' : val.toFixed(1);
}
