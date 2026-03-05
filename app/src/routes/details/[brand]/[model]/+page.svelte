<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import PressureChart from "$lib/components/PressureChart.svelte";
	import BreadcrumbBar from "$lib/components/BreadcrumbBar.svelte";
	import NavStrip from "$lib/components/NavStrip.svelte";
	import EstimatesSelect from "$lib/components/EstimatesSelect.svelte";
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

	// --- Model navigation ---
	const allModels = (() => {
		const seen = new Set();
		const models = [];
		for (const s of allSessions) {
			const key = `${s.brand}|||${s.pen}`;
			if (!seen.has(key)) {
				seen.add(key);
				models.push({ brand: s.brand, model: s.pen });
			}
		}
		return models;
	})();

	let modelIndex = $derived(
		allModels.findIndex(
			(m) => m.brand === data.brand && m.model === data.model,
		),
	);
	let prevModel = $derived(modelIndex > 0 ? allModels[modelIndex - 1] : null);
	let nextModel = $derived(
		modelIndex < allModels.length - 1 ? allModels[modelIndex + 1] : null,
	);

	// --- Page data ---
	let sessions = $derived(
		allSessions.filter(
			(s) => s.brand === data.brand && s.pen === data.model,
		),
	);

	let allSeries = $derived(
		(() => {
			const colorMap = {};
			let colorIndex = 0;
			for (const s of sessions) {
				if (!(s.inventoryid in colorMap)) {
					colorMap[s.inventoryid] =
						COLORS[colorIndex++ % COLORS.length];
				}
			}
			return sessions.map((s) => ({
				label: `${s.inventoryid} ${s.date}`,
				records: s.records,
				color: colorMap[s.inventoryid],
				inventoryid: s.inventoryid,
				date: s.date,
				p00: estimateP00(s.records),
				p01: interpolatePhysical(s.records, 1),
				p05: interpolatePhysical(s.records, 5),
				p10: interpolatePhysical(s.records, 10),
				p25: interpolatePhysical(s.records, 25),
				p50: interpolatePhysical(s.records, 50),
				p75: interpolatePhysical(s.records, 75),
				p95: interpolatePhysical(s.records, 95),
				p99: interpolatePhysical(s.records, 99),
				p100: estimateP100(s.records),
			}));
		})(),
	);

	let hiddenLabels = $state(new Set());
	let showEstimates = $state('estimates');
	let zoom = $state("normal");
	let chartRef;

	function handleExport(action) {
		if (action === 'copy-chart') chartRef?.copyChart();
		else if (action === 'export-png') chartRef?.exportPng();
		else if (action === 'copy-data') chartRef?.copyData();
		else if (action === 'export-data') chartRef?.exportData();
	}

	function toggleSeries(label) {
		const next = new Set(hiddenLabels);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		hiddenLabels = next;
	}

	function standardSampleRecords(s) {
		return [
			[s.p00, 0], [s.p01, 1], [s.p05, 5], [s.p10, 10], [s.p25, 25], [s.p50, 50],
			[s.p75, 75], [s.p95, 95], [s.p99, 99], [s.p100, 100],
		].filter(([x]) => x != null);
	}

	let visibleSeries = $derived(
		allSeries
			.filter((s) => !hiddenLabels.has(s.label))
			.map((s) => {
				if (showEstimates === 'standardized') {
					return { ...s, records: standardSampleRecords(s), p00: null, p100: null };
				}
				return {
					...s,
					p00: showEstimates === 'estimates' ? s.p00 : null,
					p100: showEstimates === 'estimates' ? s.p100 : null,
				};
			}),
	);
</script>

{#if sessions.length > 0}
	<div class="model-page">
		<div class="page-header">
			<BreadcrumbBar
				brand={data.brand}
				model={data.model}
				detail={[
					`${new Set(sessions.map((s) => s.inventoryid)).size} pens`,
					`${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`
				]}
			/>
			<NavStrip
				index={modelIndex}
				total={allModels.length}
				prevHref={prevModel ? `${base}/details/${encodeURIComponent(prevModel.brand)}/${encodeURIComponent(prevModel.model)}` : null}
				prevLabel={prevModel ? `${prevModel.brand} / ${prevModel.model}` : ''}
				nextHref={nextModel ? `${base}/details/${encodeURIComponent(nextModel.brand)}/${encodeURIComponent(nextModel.model)}` : null}
				nextLabel={nextModel ? `${nextModel.brand} / ${nextModel.model}` : ''}
			/>
		</div>

		<div class="chart-area">
			<div class="chart-header">
				<h2>Pressure Response</h2>
				<select class="zoom-select" bind:value={zoom}>
					<option value="normal">Normal zoom</option>
					<option value="iaf">Zoom to IAF</option>
					<option value="maxpressure">Zoom to max pressure</option>
				</select>
				<EstimatesSelect bind:value={showEstimates} />
				<select class="export-select" onchange={(e) => { handleExport(e.currentTarget.value); e.currentTarget.value = ''; }}>
					<option value="">Export ▾</option>
					<option value="copy-chart">Copy chart</option>
					<option value="export-png">Export chart as PNG</option>
					<option value="copy-data">Copy data</option>
					<option value="export-data">Export chart data</option>
				</select>
			</div>
			<PressureChart bind:this={chartRef} series={visibleSeries} zoomMode={zoom} title="Pressure response for {data.brand} / {data.model}" />
		</div>

		<table class="legend-table">
			<thead>
				<tr>
					<th class="centered">Show</th>
					<th></th>
					<th></th>
					<th>Inventory ID</th>
					<th>Date</th>
					{#if showEstimates !== 'raw'}<th class="right">P00</th>{/if}
					<th class="right">P01</th>
					<th class="right">P05</th>
					<th class="right">P10</th>
					<th class="right">P25</th>
					<th class="right">P50</th>
					<th class="right">P75</th>
					<th class="right">P95</th>
					<th class="right">P99</th>
					{#if showEstimates !== 'raw'}<th class="right">P100</th>{/if}
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
							><span class="swatch" style="background: {s.color}"
							></span></td
						>
						<td class="btn-cell">
							<a
								href="{base}/details/{encodeURIComponent(data.brand)}/{encodeURIComponent(data.model)}/{s.inventoryid}/{s.date}"
								class="view-btn"
							>View</a>
						</td>
						<td class="mono">{s.inventoryid}</td>
						<td class="mono">{s.date}</td>
						{#if showEstimates !== 'raw'}<td class="mono right"
								>{fmtP(s.p00)}</td
							>{/if}
						<td class="mono right">{fmtP(s.p01)}</td>
						<td class="mono right">{fmtP(s.p05)}</td>
						<td class="mono right">{fmtP(s.p10)}</td>
						<td class="mono right">{fmtP(s.p25)}</td>
						<td class="mono right">{fmtP(s.p50)}</td>
						<td class="mono right">{fmtP(s.p75)}</td>
						<td class="mono right">{fmtP(s.p95)}</td>
						<td class="mono right">{fmtP(s.p99)}</td>
						{#if showEstimates !== 'raw'}<td class="mono right"
								>{fmtP(s.p100)}</td
							>{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="not-found">
		<p>No sessions found for <code>{data.brand} {data.model}</code>.</p>
		<a href="{base}/models">← Back to pen models</a>
	</div>
{/if}

<style>
	.model-page {
		max-width: 1000px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		gap: 1.5rem;
	}
	.page-header :global(.breadcrumb-bar) {
		margin-bottom: 0;
		flex: 1;
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


	.export-select {
		font-size: 0.8rem;
		color: #444;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		cursor: pointer;
		margin-left: auto;
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

	.btn-cell {
		padding: 0.15rem 0.35rem;
	}

	.view-btn {
		display: inline-block;
		padding: 0.1rem 0.5rem;
		font-size: 0.72rem;
		border: 1px solid #4a6fa5;
		border-radius: 3px;
		color: #4a6fa5;
		text-decoration: none;
		white-space: nowrap;
	}

	.view-btn:hover {
		background: #4a6fa5;
		color: #fff;
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
