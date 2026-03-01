<script>
	import { base } from "$app/paths";
	import { sessionById } from "$lib/data.js";
	import PressureChart from "$lib/components/PressureChart.svelte";

	let { data } = $props();
	let session = $derived(sessionById[data.id]);

	const COLOR = "#4a6fa5";

	let chartSeries = $derived(
		session
			? [
					{
						label: `${session.inventoryid} ${session.date}`,
						records: session.records,
						color: COLOR,
					},
				]
			: [],
	);
</script>

{#if session}
	<div class="session-page">
		<a href="{base}/" class="back-link">← Back to sessions</a>

		<div class="session-header">
			<div class="session-title">
				<span class="brand">{session.brand}</span>
				<span class="sep">/</span>
				<span class="model">{session.pen}</span>
			</div>
			<div class="session-meta-line">
				<span class="meta-chip">{session.inventoryid}</span>
				<span class="meta-chip">{session.date}</span>
				{#if session.notes}
					<span class="meta-chip note">{session.notes}</span>
				{/if}
			</div>
		</div>

		<div class="meta-grid">
			<div class="meta-item">
				<span class="meta-label">Tablet</span>
				<span class="meta-value">{session.tablet}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Driver</span>
				<span class="meta-value">{session.driver}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">OS</span>
				<span class="meta-value">{session.os}</span>
			</div>
			<div class="meta-item">
				<span class="meta-label">Records</span>
				<span class="meta-value">{session.records.length}</span>
			</div>
		</div>

		<div class="body-layout">
			<div class="records-section">
				<h2>Data</h2>
				<table class="records-table">
					<thead>
						<tr>
							<th class="num">#</th>
							<th class="num">Physical (gf)</th>
							<th class="num">Logical (%)</th>
						</tr>
					</thead>
					<tbody>
						{#each session.records as [gf, pct], i}
							<tr>
								<td class="num dim">{i + 1}</td>
								<td class="num">{gf}</td>
								<td class="num">{Number(pct).toFixed(4)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="chart-section">
				<h2>Pressure Response</h2>
				<PressureChart series={chartSeries} />
			</div>
		</div>
	</div>
{:else}
	<div class="not-found">
		<p>Session <code>{data.id}</code> not found.</p>
		<a href="{base}/">← Back to sessions</a>
	</div>
{/if}

<style>
	.session-page {
		max-width: 1200px;
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

	.session-header {
		margin-bottom: 1.25rem;
	}

	.session-title {
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

	.session-meta-line {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
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

	.meta-chip.note {
		background: #fff8e1;
		color: #7a5a00;
		font-family: inherit;
	}

	.meta-grid {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding: 0.875rem 1rem;
		background: #f8f8f8;
		border-radius: 6px;
		border: 1px solid #eee;
		margin-bottom: 1.5rem;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.meta-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #999;
	}

	.meta-value {
		font-size: 0.875rem;
		color: #333;
	}

	/* Side-by-side layout */
	.body-layout {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 2rem;
		align-items: start;
	}

	.records-section h2,
	.chart-section h2 {
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #888;
		margin: 0 0 0.75rem;
	}

	.chart-section {
		min-width: 0;
		height: 420px;
		display: flex;
		flex-direction: column;
	}

	.chart-section :global(.chart-wrap) {
		flex: 1;
	}

	.records-table {
		border-collapse: collapse;
		width: auto;
		font-size: 0.875rem;
	}

	.records-table thead th {
		background: #f0f0f0;
		padding: 0.2rem 1rem;
		text-align: right;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	.records-table tbody td {
		padding: 0.1rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.num {
		text-align: right;
		font-family: monospace;
	}

	.dim {
		color: #bbb;
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
