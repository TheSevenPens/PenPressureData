<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import {
		getFlaggedPens,
		getFlaggedModels,
		modelKey,
		togglePen,
		toggleModel,
		clearAll,
	} from "$lib/flagged.svelte.js";
	import PressureChart from "$lib/components/PressureChart.svelte";
	import ZoomSelect from "$lib/components/ZoomSelect.svelte";
	import EstimatesSelect from "$lib/components/EstimatesSelect.svelte";
	import ChartLegendTable from "$lib/components/ChartLegendTable.svelte";
	import ModelStats from "$lib/components/ModelStats.svelte";
	import { fmtP } from "$lib/interpolate.js";

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

	function isOutlierSession(session) {
		return session.tags?.some(
			(tag) => String(tag).trim().toLowerCase() === "outlier",
		);
	}

	let flaggedPens = $derived(getFlaggedPens());
	let flaggedModels = $derived(getFlaggedModels());

	// Parse flagged model keys back to {brand, model}
	let flaggedModelList = $derived(
		[...flaggedModels].map((key) => {
			const [brand, model] = key.split("||");
			return { brand, model };
		}),
	);

	// Collect matching sessions, deduplicated by sessionId
	let matchingSessions = $derived(
		(() => {
			const seen = new Set();
			const result = [];
			for (const s of allSessions) {
				if (seen.has(s.sessionId)) continue;
				if (
					flaggedPens.has(s.inventoryid) ||
					flaggedModels.has(modelKey(s.brand, s.pen))
				) {
					seen.add(s.sessionId);
					result.push(s);
				}
			}
			return result;
		})(),
	);

	// Build series with colors per model
	let allSeries = $derived(
		(() => {
			const colorMap = {};
			let colorIndex = 0;
			for (const s of matchingSessions) {
				const mk = modelKey(s.brand, s.pen);
				if (!(mk in colorMap)) {
					colorMap[mk] = COLORS[colorIndex++ % COLORS.length];
				}
			}
			return matchingSessions.map((s) => ({
				label: `${s.brand} / ${s.pen} / ${s.inventoryid} ${s.date}`,
				records: s.records,
				color: colorMap[modelKey(s.brand, s.pen)],
				show: !isOutlierSession(s),
				inventoryid: s.inventoryid,
				date: s.date,
				brand: s.brand,
				model: s.pen,
				...s.pValues,
			}));
		})(),
	);

	let hiddenLabels = $state(new Set());
	let defaultsApplied = $state(false);
	let showEstimates = $state("estimates");
	let zoom = $state("normal");
	let chartRef = $state(null);
	let groupByModel = $state(false);
	let envelopeRange = $state("minmax");

	// Unique models in current series for envelope grouping
	let envelopeGroups = $derived(
		(() => {
			if (!groupByModel || showEstimates !== "envelope") return null;
			const seen = new Map();
			let colorIndex = 0;
			for (const s of allSeries) {
				const key = `${s.brand}||${s.model}`;
				if (!seen.has(key)) {
					seen.set(key, {
						key,
						label: `${s.brand} / ${s.model}`,
						color: COLORS[colorIndex++ % COLORS.length],
					});
				}
			}
			return [...seen.values()];
		})(),
	);

	$effect(() => {
		if (defaultsApplied || allSeries.length === 0) return;
		const defaultHidden = allSeries
			.filter((s) => s.show === false)
			.map((s) => s.label);
		hiddenLabels = new Set(defaultHidden);
		defaultsApplied = true;
	});

	function handleExport(action) {
		if (action === "copy-chart") chartRef?.copyChart();
		else if (action === "export-png") chartRef?.exportPng();
		else if (action === "copy-data") chartRef?.copyData();
		else if (action === "export-data") chartRef?.exportData();
	}

	function toggleSeries(label) {
		const next = new Set(hiddenLabels);
		if (next.has(label)) next.delete(label);
		else next.add(label);
		hiddenLabels = next;
	}

	function standardSampleRecords(s) {
		return [
			[s.p00, 0],
			[s.p01, 1],
			[s.p05, 5],
			[s.p10, 10],
			[s.p20, 20],
			[s.p25, 25],
			[s.p30, 30],
			[s.p40, 40],
			[s.p50, 50],
			[s.p60, 60],
			[s.p70, 70],
			[s.p75, 75],
			[s.p80, 80],
			[s.p90, 90],
			[s.p95, 95],
			[s.p99, 99],
			[s.p100, 100],
		].filter(([x]) => x != null);
	}

	let visibleSeries = $derived(
		allSeries
			.filter((s) => !hiddenLabels.has(s.label))
			.map((s) => {
				if (showEstimates === "standardized" || showEstimates === "envelope") {
					return {
						...s,
						records: standardSampleRecords(s),
						p00: null,
						p100: null,
					};
				}
				return {
					...s,
					p00: showEstimates === "estimates" ? s.p00 : null,
					p100: showEstimates === "estimates" ? s.p100 : null,
				};
			}),
	);
</script>

{#if matchingSessions.length > 0}
	<div class="flagged-page">
		<div class="page-header">
			<div>
				<h2>Flagged Comparison</h2>
				<span class="count">{matchingSessions.length} session{matchingSessions.length !== 1 ? "s" : ""}</span>
			</div>
			<button class="clear-btn" onclick={clearAll}>Clear all</button>
		</div>

		<div class="flagged-items">
			{#if flaggedModelList.length > 0}
				<div class="flagged-group">
					<span class="group-label">Models:</span>
					{#each flaggedModelList as m}
						<span class="flagged-pill">
							<a href="{base}/details/{encodeURIComponent(m.brand)}/{encodeURIComponent(m.model)}">{m.brand} / {m.model}</a>
							<button class="remove-btn" onclick={() => toggleModel(m.brand, m.model)} title="Remove">&times;</button>
						</span>
					{/each}
				</div>
			{/if}
			{#if flaggedPens.size > 0}
				<div class="flagged-group">
					<span class="group-label">Pens:</span>
					{#each [...flaggedPens] as penId}
						<span class="flagged-pill">
							{penId}
							<button class="remove-btn" onclick={() => togglePen(penId)} title="Remove">&times;</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<ModelStats sessions={matchingSessions} />

		<div class="chart-area">
			<div class="chart-header">
				<h2>Pressure Response</h2>
				<ZoomSelect bind:value={zoom} />
				<EstimatesSelect bind:value={showEstimates} />
				{#if showEstimates === "envelope"}
					<select class="range-select" bind:value={envelopeRange}>
						<option value="minmax">Range: Min/Max</option>
						<option value="p05p95">Range: P05/P95</option>
					</select>
					<label class="group-toggle">
						<input type="checkbox" bind:checked={groupByModel} />
						Group by model
					</label>
				{/if}
				<select
					class="export-select"
					onchange={(e) => {
						handleExport(e.currentTarget.value);
						e.currentTarget.value = "";
					}}
				>
					<option value="">Export &#x25BE;</option>
					<option value="copy-chart">Copy chart</option>
					<option value="export-png">Export chart as PNG</option>
					<option value="copy-data">Copy data</option>
					<option value="export-data">Export chart data</option>
				</select>
			</div>
			<PressureChart
				bind:this={chartRef}
				series={visibleSeries}
				zoomMode={zoom}
				envelopeMode={showEstimates === "envelope"}
				{envelopeGroups}
				{envelopeRange}
				title="Flagged comparison"
			/>
		</div>

		<ChartLegendTable
			series={allSeries}
			{hiddenLabels}
			{showEstimates}
			showBrand={true}
			showInventoryId={true}
			onToggleSeries={toggleSeries}
		/>
	</div>
{:else}
	<div class="empty-state">
		<h2>Flagged Comparison</h2>
		<p>No pens or models have been flagged yet.</p>
		<p>
			Use the flag button
			<span class="flag-icon">&#9873;</span>
			on the
			<a href="{base}/models">Pen Models</a> or
			<a href="{base}/pens">Pens</a> pages to add items for comparison.
		</p>
	</div>
{/if}

<style>
	.flagged-page {
		max-width: 100%;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.page-header h2 {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0;
		color: #1a1a2e;
	}

	.count {
		font-size: 0.85rem;
		color: #666;
	}

	.clear-btn {
		font-size: 0.8rem;
		color: #e94560;
		background: none;
		border: 1px solid #e94560;
		border-radius: 4px;
		padding: 0.3rem 0.75rem;
		cursor: pointer;
	}
	.clear-btn:hover {
		background: #e94560;
		color: #fff;
	}

	.flagged-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.flagged-group {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.group-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #555;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-right: 0.25rem;
	}

	.flagged-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8rem;
		background: #f0f0f0;
		border: 1px solid #ddd;
		border-radius: 12px;
		padding: 0.15rem 0.5rem;
	}
	.flagged-pill a {
		color: #4a6fa5;
		text-decoration: none;
	}
	.flagged-pill a:hover {
		text-decoration: underline;
	}

	.remove-btn {
		background: none;
		border: none;
		color: #999;
		cursor: pointer;
		font-size: 0.9rem;
		line-height: 1;
		padding: 0;
	}
	.remove-btn:hover {
		color: #e94560;
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

	.range-select {
		font-size: 0.8rem;
		color: #444;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		cursor: pointer;
	}

	.group-toggle {
		font-size: 0.8rem;
		color: #444;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: pointer;
		white-space: nowrap;
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

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: #666;
	}
	.empty-state h2 {
		font-size: 1.1rem;
		color: #1a1a2e;
		margin-bottom: 1rem;
	}
	.empty-state p {
		margin: 0.5rem 0;
	}
	.empty-state a {
		color: #4a6fa5;
	}
	.flag-icon {
		display: inline-block;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0 0.25rem;
		font-size: 0.85rem;
		color: #999;
	}
</style>
