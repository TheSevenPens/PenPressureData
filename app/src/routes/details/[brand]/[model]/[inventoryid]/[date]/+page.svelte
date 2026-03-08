<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import PressureChart from "$lib/components/PressureChart.svelte";
	import RecordsTable from "$lib/components/RecordsTable.svelte";
	import BreadcrumbBar from "$lib/components/BreadcrumbBar.svelte";
	import NavStrip from "$lib/components/NavStrip.svelte";
	import ZoomSelect from "$lib/components/ZoomSelect.svelte";
	import EstimatesSelect from "$lib/components/EstimatesSelect.svelte";
	import ChartLegendTable from "$lib/components/ChartLegendTable.svelte";
	import { fmtP } from "$lib/interpolate.js";

	let { data } = $props();
	let session = $derived(
		allSessions.find(
			(s) => s.inventoryid === data.inventoryid && s.date === data.date,
		),
	);

	const COLOR = "#4a6fa5";

	let hiddenLabels = $state(new Set());
	let showEstimates = $state("estimates");
	let zoom = $state("normal");
	let chartRef = $state(null);

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

	// --- Session navigation ---
	let sessionIndex = $derived(
		allSessions.findIndex(
			(s) => s.inventoryid === data.inventoryid && s.date === data.date,
		),
	);
	let prevSession = $derived(
		sessionIndex > 0 ? allSessions[sessionIndex - 1] : null,
	);
	let nextSession = $derived(
		sessionIndex < allSessions.length - 1
			? allSessions[sessionIndex + 1]
			: null,
	);

	let chartSeries = $derived(
		session
			? [
					{
						label: `${session.inventoryid} ${session.date}`,
						records: session.records,
						color: COLOR,
						inventoryid: session.inventoryid,
						date: session.date,
						...session.pValues,
					},
				]
			: [],
	);

	let visibleSeries = $derived(
		chartSeries
			.filter((s) => !hiddenLabels.has(s.label))
			.map((s) => {
				if (showEstimates === "standardized") {
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

{#if session}
	<div class="session-page">
		<div class="page-header">
			<BreadcrumbBar
				brand={session.brand}
				model={session.pen}
				detail={[
					session.inventoryid,
					session.date,
					...(session.notes ? [session.notes] : []),
				]}
			/>
			<NavStrip
				index={sessionIndex}
				total={allSessions.length}
				prevHref={prevSession
					? `${base}/details/${encodeURIComponent(prevSession.brand)}/${encodeURIComponent(prevSession.pen)}/${prevSession.inventoryid}/${prevSession.date}`
					: null}
				prevLabel={prevSession
					? `${prevSession.inventoryid} · ${prevSession.date}`
					: ""}
				nextHref={nextSession
					? `${base}/details/${encodeURIComponent(nextSession.brand)}/${encodeURIComponent(nextSession.pen)}/${nextSession.inventoryid}/${nextSession.date}`
					: null}
				nextLabel={nextSession
					? `${nextSession.inventoryid} · ${nextSession.date}`
					: ""}
			/>
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
				<RecordsTable
					records={session.records}
					pValues={session.pValues}
				/>
			</div>

			<div class="chart-section">
				<div class="chart-header">
					<h2>Pressure Response</h2>
					<ZoomSelect bind:value={zoom} />
					<EstimatesSelect bind:value={showEstimates} />
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
					title="Pressure response for {session.brand} / {session.pen} / {session.inventoryid} / {session.date}"
				/>

				<div class="legend-container">
					<ChartLegendTable
						series={chartSeries}
						{hiddenLabels}
						{showEstimates}
						brand={session.brand}
						model={session.pen}
						showInventoryId={false}
						onToggleSeries={toggleSeries}
					/>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="not-found">
		<p>Session <code>{data.inventoryid} {data.date}</code> not found.</p>
		<a href="{base}/">← Back to sessions</a>
	</div>
{/if}

<style>
	.session-page {
		max-width: 100%;
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

	.body-layout {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 2rem;
		align-items: start;
	}

	.chart-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.records-section h2,
	.chart-header h2 {
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #888;
		margin: 0;
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

	.chart-section {
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.chart-section :global(.chart-wrap) {
		height: 480px;
		margin-bottom: 1.5rem;
	}

	.legend-container {
		width: 100%;
		overflow-x: auto;
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
