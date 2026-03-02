<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import PressureChart from "$lib/components/PressureChart.svelte";
	import {
		interpolatePhysical,
		estimateP00,
		estimateP100,
		fmtP,
	} from "$lib/interpolate.js";

	const COLORS = [
		"#4a6fa5",
		"#e94560",
		"#2ecc71",
		"#f39c12",
		"#9b59b6",
		"#1abc9c",
		"#e74c3c",
		"#3498db",
		"#e67e22",
		"#8e44ad",
	];

	let { data } = $props();

	// --- Pen navigation ---
	const allPens = (() => {
		const seen = new Set();
		const pens = [];
		for (const s of allSessions) {
			if (!seen.has(s.inventoryid)) {
				seen.add(s.inventoryid);
				pens.push({
					inventoryid: s.inventoryid,
					brand: s.brand,
					pen: s.pen,
				});
			}
		}
		return pens;
	})();

	let penIndex = $derived(
		allPens.findIndex((p) => p.inventoryid === data.inventoryid),
	);
	let prevPen = $derived(penIndex > 0 ? allPens[penIndex - 1] : null);
	let nextPen = $derived(
		penIndex < allPens.length - 1 ? allPens[penIndex + 1] : null,
	);

	// --- Page data ---
	let sessions = $derived(
		allSessions.filter((s) => s.inventoryid === data.inventoryid),
	);

	let pen = $derived(sessions[0] ?? null);

	let allSeries = $derived(
		sessions.map((s, i) => ({
			label: s.date,
			records: s.records,
			color: COLORS[i % COLORS.length],
			date: s.date,
			p00: estimateP00(s.records),
			p05: interpolatePhysical(s.records, 5),
			p10: interpolatePhysical(s.records, 10),
			p25: interpolatePhysical(s.records, 25),
			p50: interpolatePhysical(s.records, 50),
			p75: interpolatePhysical(s.records, 75),
			p95: interpolatePhysical(s.records, 95),
			p99: interpolatePhysical(s.records, 99),
			p100: estimateP100(s.records),
		})),
	);

	let hiddenLabels = $state(new Set());
	let showEstimates = $state(true);
	let zoom = $state("normal");

	function toggleSeries(label) {
		const next = new Set(hiddenLabels);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		hiddenLabels = next;
	}

	let visibleSeries = $derived(
		allSeries
			.filter((s) => !hiddenLabels.has(s.label))
			.map((s) => ({
				...s,
				p00: showEstimates ? s.p00 : null,
				p100: showEstimates ? s.p100 : null,
			})),
	);
</script>

{#if pen}
	<div class="pen-page">
		<a href="{base}/pens" class="back-link">← Back to pens</a>

		<div class="nav-strip">
			{#if prevPen}
				<a href="{base}/pens/{prevPen.inventoryid}" class="nav-btn">
					← {prevPen.inventoryid}
				</a>
			{:else}
				<span class="nav-btn faded">← First</span>
			{/if}
			<span class="nav-counter">{penIndex + 1} / {allPens.length}</span>
			{#if nextPen}
				<a href="{base}/pens/{nextPen.inventoryid}" class="nav-btn">
					{nextPen.inventoryid} →
				</a>
			{:else}
				<span class="nav-btn faded">Last →</span>
			{/if}
		</div>

		<div class="pen-header">
			<div class="pen-title">
				<span class="brand">{pen.brand}</span>
				<span class="sep">/</span>
				<span class="model">{pen.pen}</span>
			</div>
			<div class="pen-meta-line">
				<span class="meta-chip">{pen.inventoryid}</span>
				<span class="meta-chip sessions-chip"
					>{sessions.length}
					{sessions.length === 1 ? "session" : "sessions"}</span
				>
			</div>
		</div>

		<div class="chart-area">
			<div class="chart-header">
				<h2>Pressure Response</h2>
				<select class="zoom-select" bind:value={zoom}>
					<option value="normal">Normal zoom</option>
					<option value="iaf">Zoom to IAF</option>
					<option value="maxpressure">Zoom to max pressure</option>
				</select>
				<label class="estimates-toggle">
					<input type="checkbox" bind:checked={showEstimates} />
					Show P00 & P100 estimates
				</label>
			</div>
			<PressureChart series={visibleSeries} zoomMode={zoom} />
		</div>

		{#if allSeries.length > 1}
			<table class="legend-table">
				<thead>
					<tr>
						<th class="centered">Show</th>
						<th></th>
						<th>Date</th>
						{#if showEstimates}<th class="right">P00 (gf)</th>{/if}
						<th class="right">P05 (gf)</th>
						<th class="right">P10 (gf)</th>
						<th class="right">P25 (gf)</th>
						<th class="right">P50 (gf)</th>
						<th class="right">P75 (gf)</th>
						<th class="right">P95 (gf)</th>
						<th class="right">P99 (gf)</th>
						{#if showEstimates}<th class="right">P100 (gf)</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each allSeries as s}
						<tr class:dimmed={hiddenLabels.has(s.label)}>
							<td class="centered">
								<input
									type="checkbox"
									checked={!hiddenLabels.has(s.label)}
									onchange={() => toggleSeries(s.label)}
								/>
							</td>
							<td
								><span
									class="swatch"
									style="background: {s.color}"
								></span></td
							>
							<td class="mono">{s.date}</td>
							{#if showEstimates}<td class="mono right"
									>{fmtP(s.p00)}</td
								>{/if}
							<td class="mono right">{fmtP(s.p05)}</td>
							<td class="mono right">{fmtP(s.p10)}</td>
							<td class="mono right">{fmtP(s.p25)}</td>
							<td class="mono right">{fmtP(s.p50)}</td>
							<td class="mono right">{fmtP(s.p75)}</td>
							<td class="mono right">{fmtP(s.p95)}</td>
							<td class="mono right">{fmtP(s.p99)}</td>
							{#if showEstimates}<td class="mono right"
									>{fmtP(s.p100)}</td
								>{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{:else}
	<div class="not-found">
		<p>Pen <code>{data.inventoryid}</code> not found.</p>
		<a href="{base}/pens">← Back to pens</a>
	</div>
{/if}

<style>
	.pen-page {
		max-width: 1000px;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 0.6rem;
		font-size: 0.875rem;
		color: #4a6fa5;
		text-decoration: none;
	}
	.back-link:hover {
		text-decoration: underline;
	}

	.nav-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
		gap: 0.5rem;
	}

	.nav-btn {
		display: inline-block;
		font-size: 0.8rem;
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
		border: 1px solid #ddd;
		background: #f8f8f8;
		color: #4a6fa5;
		text-decoration: none;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 280px;
	}
	.nav-btn:hover {
		background: #eef2f8;
		border-color: #b0c4de;
	}
	.nav-btn.faded {
		color: #ccc;
		pointer-events: none;
	}

	.nav-counter {
		font-size: 0.75rem;
		color: #aaa;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.pen-header {
		margin-bottom: 1.5rem;
	}

	.pen-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	.brand {
		color: #333;
	}
	.sep {
		color: #aaa;
	}
	.model {
		color: #4a6fa5;
	}

	.pen-meta-line {
		display: flex;
		gap: 0.5rem;
	}

	.meta-chip {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		background: #f0f0f0;
		border-radius: 4px;
		font-size: 0.8rem;
		font-family: monospace;
		color: #444;
	}
	.sessions-chip {
		font-family: inherit;
	}

	.chart-area {
		height: 480px;
		display: flex;
		flex-direction: column;
		margin-bottom: 1.5rem;
	}
	.chart-area :global(.chart-wrap) {
		flex: 1;
	}

	.chart-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	.chart-header h2 {
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #888;
		margin: 0;
	}

	.zoom-select {
		font-size: 0.8rem;
		color: #444;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		cursor: pointer;
	}

	.estimates-toggle {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #555;
		cursor: pointer;
		user-select: none;
	}

	.legend-table {
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.legend-table thead th {
		background: #f0f0f0;
		padding: 0.2rem 0.75rem;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}
	.legend-table thead th.centered {
		text-align: center;
	}
	.legend-table thead th.right {
		text-align: right;
	}

	.legend-table tbody td {
		padding: 0.15rem 0.75rem;
		border-bottom: 1px solid #eee;
	}
	.legend-table tbody tr.dimmed td {
		opacity: 0.4;
	}

	.swatch {
		display: inline-block;
		width: 14px;
		height: 14px;
		border-radius: 2px;
		vertical-align: middle;
	}

	.mono {
		font-family: monospace;
	}
	.centered {
		text-align: center;
	}
	.right {
		text-align: right;
	}

	.not-found {
		color: #666;
	}
	.not-found code {
		background: #f0f0f0;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}
</style>
