<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import {
		findNonMonotonicSessions,
		findMissingLowEnd,
		findSingleSessionPens,
		findStaleMeasurements,
		findRecommendedForRemeasurement,
	} from "$lib/dataQuality.js";

	const nonMonotonic = findNonMonotonicSessions(allSessions);
	const missingLowEnd = findMissingLowEnd(allSessions);
	const singleSession = findSingleSessionPens(allSessions);
	const stale = findStaleMeasurements(allSessions);
	const recommended = findRecommendedForRemeasurement(allSessions);

	function modelHref(brand, model) {
		return `${base}/details/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`;
	}
	function penHref(brand, model, inventoryid) {
		return `${base}/details/${encodeURIComponent(brand)}/${encodeURIComponent(model)}/${inventoryid}`;
	}
	function sessionHref(brand, model, inventoryid, date) {
		return `${base}/details/${encodeURIComponent(brand)}/${encodeURIComponent(model)}/${inventoryid}/${date}`;
	}
</script>

<div class="dq-page">
	<h2>Data Quality</h2>
	<p class="intro">
		Automated checks over the pressure response dataset. Each section surfaces
		items that warrant a closer look or a fresh measurement.
	</p>

	<!-- Recommended for re-measurement (summary of pen-level issues) -->
	<section>
		<h3>Recommended for re-measurement <span class="count">({recommended.length})</span></h3>
		<p class="desc">
			Pens appearing in any of the pen-level checks below (missing low-end
			logical values, only one measurement, or not measured in over a year).
		</p>
		{#if recommended.length === 0}
			<p class="empty">No pens flagged — all checks pass.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Brand</th>
						<th>Model</th>
						<th>Inventory ID</th>
						<th>Reasons</th>
					</tr>
				</thead>
				<tbody>
					{#each recommended as r}
						<tr>
							<td>{r.brand}</td>
							<td><a href={modelHref(r.brand, r.model)}>{r.model}</a></td>
							<td class="mono"><a href={penHref(r.brand, r.model, r.inventoryid)}>{r.inventoryid}</a></td>
							<td>
								{#each r.reasons as reason, i}
									<span class="reason">{reason}</span>{#if i < r.reasons.length - 1}, {/if}
								{/each}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<!-- Non-monotonic sessions (#4) -->
	<section>
		<h3>Non-monotonic sessions <span class="count">({nonMonotonic.length})</span></h3>
		<p class="desc">
			Valid pressure response data should be monotonically non-decreasing: as
			physical force increases, logical pressure should never drop. Sessions
			where it does may indicate measurement errors.
		</p>
		{#if nonMonotonic.length === 0}
			<p class="empty">All sessions are monotonically non-decreasing.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Brand</th>
						<th>Model</th>
						<th>Inventory ID</th>
						<th>Date</th>
						<th>First drop</th>
					</tr>
				</thead>
				<tbody>
					{#each nonMonotonic as s}
						<tr>
							<td>{s.brand}</td>
							<td><a href={modelHref(s.brand, s.pen)}>{s.pen}</a></td>
							<td class="mono"><a href={penHref(s.brand, s.pen, s.inventoryid)}>{s.inventoryid}</a></td>
							<td class="mono"><a href={sessionHref(s.brand, s.pen, s.inventoryid, s.date)}>{s.date}</a></td>
							<td class="mono">{s.firstDrop.from.toFixed(2)}% → {s.firstDrop.to.toFixed(2)}%</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<!-- Missing low-end measurements (#3) -->
	<section>
		<h3>Missing low-end logical measurements <span class="count">({missingLowEnd.length})</span></h3>
		<p class="desc">
			Pens whose lowest observed logical value across all sessions is still
			above 0.5%. Missing low-end data makes the P00 (Initial Activation Force)
			estimate less reliable.
		</p>
		{#if missingLowEnd.length === 0}
			<p class="empty">All pens have low-end measurements below 0.5%.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Brand</th>
						<th>Model</th>
						<th>Inventory ID</th>
						<th class="num">Lowest logical (%)</th>
						<th class="num">Sessions</th>
					</tr>
				</thead>
				<tbody>
					{#each missingLowEnd as p}
						<tr>
							<td>{p.brand}</td>
							<td><a href={modelHref(p.brand, p.model)}>{p.model}</a></td>
							<td class="mono"><a href={penHref(p.brand, p.model, p.inventoryid)}>{p.inventoryid}</a></td>
							<td class="num mono">{p.lowestLogical.toFixed(2)}</td>
							<td class="num mono">{p.sessionCount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<!-- Single session pens (#5) -->
	<section>
		<h3>Pens with only one session <span class="count">({singleSession.length})</span></h3>
		<p class="desc">
			A single session provides no basis for assessing consistency or
			measurement variance. These pens should be measured again.
		</p>
		{#if singleSession.length === 0}
			<p class="empty">Every pen has multiple sessions.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Brand</th>
						<th>Model</th>
						<th>Inventory ID</th>
						<th>Only session</th>
					</tr>
				</thead>
				<tbody>
					{#each singleSession as p}
						<tr>
							<td>{p.brand}</td>
							<td><a href={modelHref(p.brand, p.model)}>{p.model}</a></td>
							<td class="mono"><a href={penHref(p.brand, p.model, p.inventoryid)}>{p.inventoryid}</a></td>
							<td class="mono"><a href={sessionHref(p.brand, p.model, p.inventoryid, p.date)}>{p.date}</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<!-- Stale pens (#6) -->
	<section>
		<h3>Not measured in over a year <span class="count">({stale.length})</span></h3>
		<p class="desc">
			Pens whose most recent session is more than 365 days old. Candidates for
			fresh measurements to confirm no drift or to capture updated
			driver/tablet behavior.
		</p>
		{#if stale.length === 0}
			<p class="empty">All pens have been measured within the last year.</p>
		{:else}
			<table>
				<thead>
					<tr>
						<th>Brand</th>
						<th>Model</th>
						<th>Inventory ID</th>
						<th>Last measured</th>
						<th class="num">Days ago</th>
					</tr>
				</thead>
				<tbody>
					{#each stale as p}
						<tr>
							<td>{p.brand}</td>
							<td><a href={modelHref(p.brand, p.model)}>{p.model}</a></td>
							<td class="mono"><a href={penHref(p.brand, p.model, p.inventoryid)}>{p.inventoryid}</a></td>
							<td class="mono">{p.lastDate}</td>
							<td class="num mono">{p.daysAgo}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</div>

<style>
	.dq-page {
		max-width: 100%;
		line-height: 1.5;
	}

	h2 {
		font-size: 1.3rem;
		color: #1a1a2e;
		margin: 0 0 0.5rem 0;
	}

	.intro {
		color: #555;
		font-size: 0.9rem;
		margin: 0 0 1.5rem 0;
	}

	section {
		margin-bottom: 2.5rem;
	}

	h3 {
		font-size: 1rem;
		color: #1a1a2e;
		margin: 0 0 0.5rem 0;
	}

	.count {
		color: #888;
		font-weight: normal;
		margin-left: 0.25rem;
	}

	.desc {
		color: #666;
		font-size: 0.85rem;
		margin: 0 0 0.75rem 0;
	}

	.empty {
		color: #2ecc71;
		font-size: 0.85rem;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 4px;
		padding: 0.5rem 0.75rem;
		margin: 0;
	}

	table {
		border-collapse: collapse;
		font-size: 0.85rem;
	}

	thead th {
		background: #f0f0f0;
		padding: 0.4rem 1rem;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	tbody td {
		padding: 0.25rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.num {
		text-align: right;
	}

	.mono {
		font-family: monospace;
	}

	.reason {
		display: inline-block;
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 3px;
		padding: 0 0.35rem;
		font-size: 0.75rem;
		color: #856404;
		font-family: monospace;
	}

	a {
		color: #4a6fa5;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
