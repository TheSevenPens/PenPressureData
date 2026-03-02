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
 * Estimate the physical pressure at which logical pressure first rises from 0%
 * (i.e. the Initial Activation Force / P00).
 *
 * Uses a simple linear extrapolation from the first two measured data points
 * back to y = 0. This is appropriate because P00 physically cannot be far
 * from the first measured pressure — a complex model would over-extrapolate.
 *
 * Returns 0 if the result is negative, or the first measured x if the
 * extrapolation overshoots in the wrong direction.
 *
 * @param {Array<[number, number]>} records
 * @returns {number|null}
 */
export function estimateP00(records) {
	// If the first point is already at y=0, return it directly.
	if (records[0][1] <= 0) return records[0][0];
	if (records.length < 2) return null;

	const [x0, y0] = records[0];
	const [x1, y1] = records[1];

	// Need a positive slope to extrapolate back to zero.
	const slope = (y1 - y0) / (x1 - x0);
	if (slope <= 0) return null;

	// Linear extrapolation to y = 0: x = x0 - y0 / slope
	const p00 = x0 - y0 / slope;

	// Clamp: activation force can't be negative, and can't exceed first measured x.
	if (p00 < 0) return 0;
	if (p00 >= x0) return x0;

	return p00;
}

/**
 * Estimate the physical pressure at which logical pressure reaches 100%,
 * by fitting an exponential decay to the "remaining" logical pressure (100 - y)
 * using only the last 5 data points. This captures the LOCAL curvature at the
 * top of the curve rather than the average behaviour across the full top quarter,
 * which would produce a shallower (too slow) decay and an overly high estimate.
 *
 * Model: ln(100 - y) = a + b·x  (b must be negative — curve converges)
 * P100 is defined as x where remaining drops to 0.5% (i.e. y = 99.5%).
 *
 * Returns null if the fit is unreliable or extrapolation is excessive.
 *
 * @param {Array<[number, number]>} records
 * @returns {number|null}
 */
export function estimateP100(records) {
	// If any measurement already hits 100%, return that x.
	for (const [x, y] of records) {
		if (y >= 100) return x;
	}

	// Use only the last 5 points — local behaviour is what matters for extrapolation.
	const top = records.slice(-5);
	if (top.length < 2) return null;

	// Build (x, ln(100 - y)) pairs; skip any points where remaining ≤ 0.
	const pts = [];
	for (const [x, y] of top) {
		const rem = 100 - y;
		if (rem <= 0) continue;
		pts.push([x, Math.log(rem)]);
	}
	if (pts.length < 2) return null;

	// Least-squares fit: ln(rem) = a + b·x
	const n = pts.length;
	const sumX  = pts.reduce((s, [x])    => s + x,     0);
	const sumZ  = pts.reduce((s, [, z])  => s + z,     0);
	const sumXZ = pts.reduce((s, [x, z]) => s + x * z, 0);
	const sumX2 = pts.reduce((s, [x])    => s + x * x, 0);

	const denom = n * sumX2 - sumX * sumX;
	if (Math.abs(denom) < 1e-10) return null;

	const b = (n * sumXZ - sumX * sumZ) / denom;
	const a = (sumZ - b * sumX) / n;

	// b must be negative for the model to converge toward 100%.
	if (b >= 0) return null;

	// Solve for x where remaining = 0.5% (y = 99.5%).
	const THRESHOLD = 0.5;
	const p100 = (Math.log(THRESHOLD) - a) / b;

	const maxMeasuredX = records[records.length - 1][0];

	// If the last measured point already exceeds the threshold, cap at that x.
	if (p100 <= maxMeasuredX) return maxMeasuredX;

	// Reject if extrapolation is implausibly large (> 4× max measured pressure).
	if (p100 > maxMeasuredX * 4) return null;

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
