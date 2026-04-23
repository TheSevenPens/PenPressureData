<script>
	import { base } from "$app/paths";
	import {
		allSessions,
		familyInfoMap,
		familyEntityIdToFamilyId,
		penFamilies,
	} from "$lib/data.js";
	import PressureChart from "$lib/components/PressureChart.svelte";
	import NavStrip from "$lib/components/NavStrip.svelte";
	import ZoomSelect from "$lib/components/ZoomSelect.svelte";
	import EstimatesSelect from "$lib/components/EstimatesSelect.svelte";
	import ChartLegendTable from "$lib/components/ChartLegendTable.svelte";
	import ModelStats from "$lib/components/ModelStats.svelte";
	import FlagButton from "$lib/components/FlagButton.svelte";

	const COLORS = [
		"#4a6fa5", "#e94560", "#2ecc71", "#f39c12", "#9b59b6",
		"#1abc9c", "#e74c3c", "#3498db", "#e67e22", "#8e44ad",
	];

	let { data } = $props();

	// Resolve entity ID → FamilyId, then look up family info
	let familyId = $derived(familyEntityIdToFamilyId[data.entityId] || "");
	let familyInfo = $derived(
		familyInfoMap[familyId] || { familyId, familyName: data.entityId, brand: "", entityId: data.entityId },
	);

	// --- Family navigation: iterate penFamilies (families that have data) ---
	let familyIndex = $derived(
		penFamilies.findIndex((f) => f.familyId === familyId),
	);
	let prevFamily = $derived(familyIndex > 0 ? penFamilies[familyIndex - 1] : null);
	let nextFamily = $derived(
		familyIndex >= 0 && familyIndex < penFamilies.length - 1
			? penFamilies[familyIndex + 1]
			: null,
	);

	// --- Page data ---
	let sessions = $derived(
		familyId ? allSessions.filter((s) => s.penfamily === familyId) : [],
	);

	let allSeries = $derived(
		(() => {
			const colorMap = {};
			let colorIndex = 0;
			for (const s of sessions) {
				if (!(s.pen in colorMap)) {
					colorMap[s.pen] = COLORS[colorIndex++ % COLORS.length];
				}
			}
			return sessions.map((s) => ({
				label: `${s.pen} / ${s.inventoryid} ${s.date}`,
				records: s.records,
				color: colorMap[s.pen],
				inventoryid: s.inventoryid,
				date: s.date,
				brand: s.brand,
				model: s.pen,
				penEntityId: s.penEntityId,
				penfamily: s.penfamily,
				sessionId: s.sessionId,
				defects: s.defects,
				isDefective: s.isDefective,
				...s.pValues,
			}));
		})(),
	);

	let hiddenLabels = $state(new Set());
	let defaultsApplied = $state(false);
	let showEstimates = $state("estimates");
	let zoom = $state("normal");
	let chartRef = $state(null);
	let envelopeRange = $state("minmax");

	$effect(() => {
		if (defaultsApplied || allSeries.length === 0) return;
		const defaultHidden = allSeries
			.filter((s) => s.isDefective)
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
			[s.p00, 0], [s.p01, 1], [s.p05, 5], [s.p10, 10], [s.p20, 20],
			[s.p25, 25], [s.p30, 30], [s.p40, 40], [s.p50, 50], [s.p60, 60],
			[s.p70, 70], [s.p75, 75], [s.p80, 80], [s.p90, 90], [s.p95, 95],
			[s.p99, 99], [s.p100, 100],
		].filter(([x]) => x != null);
	}

	// Envelope grouping by model
	let groupByModel = $state(false);
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
						field: "model",
						label: s.model,
						color: COLORS[colorIndex++ % COLORS.length],
					});
				}
			}
			return [...seen.values()];
		})(),
	);

	let visibleSeries = $derived(
		allSeries
			.filter((s) => !hiddenLabels.has(s.label))
			.map((s) => {
				if (showEstimates === "standardized" || showEstimates === "envelope") {
					return { ...s, records: standardSampleRecords(s), p00: null, p100: null };
				}
				return {
					...s,
					p00: showEstimates === "estimates" ? s.p00 : null,
					p100: showEstimates === "estimates" ? s.p100 : null,
				};
			}),
	);
</script>

{#if sessions.length > 0}
	<div class="family-page">
		<div class="page-header">
			<div class="family-title">
				<h2>{familyInfo.brand} / {familyInfo.familyName}</h2>
				<FlagButton type="family" entityId={data.entityId} />
				<span class="detail-counts">
					{new Set(sessions.map((s) => s.pen)).size} models
					/ {new Set(sessions.map((s) => s.inventoryid)).size} pens
					/ {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
				</span>
			</div>
			<NavStrip
				index={familyIndex}
				total={penFamilies.length}
				prevHref={prevFamily && prevFamily.entityId
					? `${base}/penfamily/${encodeURIComponent(prevFamily.entityId)}`
					: null}
				prevLabel={prevFamily ? prevFamily.familyName : ""}
				nextHref={nextFamily && nextFamily.entityId
					? `${base}/penfamily/${encodeURIComponent(nextFamily.entityId)}`
					: null}
				nextLabel={nextFamily ? nextFamily.familyName : ""}
			/>
		</div>

		<ModelStats {sessions} />

		<div class="chart-area">
			<div class="chart-header">
				<h2>Pressure Response</h2>
				<ZoomSelect bind:value={zoom} />
				<EstimatesSelect bind:value={showEstimates} />
				{#if showEstimates === "envelope"}
					<select class="range-select" bind:value={envelopeRange}>
						<option value="minmax">Range: Min/Max</option>
						<option value="p05p95">Range: P05/P95</option>
						<option value="p25p75">Range: P25/P75</option>
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
					<option value="">Export ▾</option>
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
				title="Pressure response for {familyInfo.familyName}"
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
	<div class="not-found">
		<p>No sessions found for family <code>{data.entityId}</code>.</p>
		<a href="{base}/penfamilies">← Back to pen families</a>
	</div>
{/if}

<style>
	.family-page { max-width: 100%; }

	.page-header {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: 1.5rem; gap: 1.5rem;
	}

	.family-title {
		display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
	}
	.family-title h2 {
		font-size: 1.1rem; font-weight: 600; margin: 0; color: #1a1a2e;
	}

	.detail-counts { font-size: 0.85rem; color: #666; }

	.chart-area { height: 480px; display: flex; flex-direction: column; margin-bottom: 1.5rem; }
	.chart-area :global(.chart-wrap) { flex: 1; }

	.chart-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
	.chart-header h2 {
		font-size: 0.9rem; font-weight: 600; text-transform: uppercase;
		letter-spacing: 0.5px; color: #888; margin: 0;
	}

	.range-select {
		font-size: 0.8rem; color: #444; border: 1px solid #ccc;
		border-radius: 4px; padding: 0.2rem 0.4rem; cursor: pointer;
	}
	.group-toggle {
		font-size: 0.8rem; color: #444; display: flex;
		align-items: center; gap: 0.3rem; cursor: pointer; white-space: nowrap;
	}
	.export-select {
		font-size: 0.8rem; color: #444; border: 1px solid #ccc;
		border-radius: 4px; padding: 0.2rem 0.4rem; cursor: pointer; margin-left: auto;
	}

	.not-found { color: #666; }
	.not-found code { background: #f0f0f0; padding: 0.1rem 0.4rem; border-radius: 3px; }
</style>
