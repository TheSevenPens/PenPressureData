<script>
	import { base } from '$app/paths';
	import { allSessions } from '$lib/data.js';
	import PressureChart from '$lib/components/PressureChart.svelte';

	const COLORS = [
		'#4a6fa5', '#e94560', '#2ecc71', '#f39c12', '#9b59b6',
		'#1abc9c', '#e74c3c', '#3498db', '#e67e22', '#8e44ad',
	];

	let { data } = $props();

	let sessions = $derived(
		allSessions.filter(s => s.inventoryid === data.inventoryid)
	);

	let pen = $derived(sessions[0] ?? null);

	let allSeries = $derived(
		sessions.map((s, i) => ({
			label: s.date,
			records: s.records,
			color: COLORS[i % COLORS.length],
			date: s.date,
		}))
	);

	let hiddenLabels = $state(new Set());

	function toggleSeries(label) {
		const next = new Set(hiddenLabels);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		hiddenLabels = next;
	}

	let visibleSeries = $derived(allSeries.filter(s => !hiddenLabels.has(s.label)));

	let zoomIAF = $state(false);
</script>

{#if pen}
	<div class="pen-page">
		<a href="{base}/pens" class="back-link">← Back to pens</a>

		<div class="pen-header">
			<div class="pen-title">
				<span class="brand">{pen.brand}</span>
				<span class="sep">/</span>
				<span class="model">{pen.pen}</span>
			</div>
			<div class="pen-meta-line">
				<span class="meta-chip">{pen.inventoryid}</span>
				<span class="meta-chip sessions-chip">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}</span>
			</div>
		</div>

		<div class="chart-area">
			<div class="chart-header">
				<h2>Pressure Response</h2>
				<label class="zoom-label">
					<input type="checkbox" bind:checked={zoomIAF} />
					Zoom to IAF
				</label>
			</div>
			<PressureChart series={visibleSeries} {zoomIAF} />
		</div>

		{#if allSeries.length > 1}
			<table class="legend-table">
				<thead>
					<tr>
						<th></th>
						<th>Date</th>
						<th class="centered">Show</th>
					</tr>
				</thead>
				<tbody>
					{#each allSeries as s}
						<tr class:dimmed={hiddenLabels.has(s.label)}>
							<td><span class="swatch" style="background: {s.color}"></span></td>
							<td class="mono">{s.date}</td>
							<td class="centered">
								<input
									type="checkbox"
									checked={!hiddenLabels.has(s.label)}
									onchange={() => toggleSeries(s.label)}
								/>
							</td>
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
		margin-bottom: 1.25rem;
		font-size: 0.875rem;
		color: #4a6fa5;
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
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

	.brand { color: #333; }
	.sep   { color: #aaa; }
	.model { color: #4a6fa5; }

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

	.zoom-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		color: #666;
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
	}

	.zoom-label input {
		cursor: pointer;
	}

	/* Legend table */
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

	.not-found {
		color: #666;
	}

	.not-found code {
		background: #f0f0f0;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}
</style>
