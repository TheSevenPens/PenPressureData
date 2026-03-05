<script>
	import { base } from "$app/paths";
	import { allSessions, sessionById } from "$lib/data.js";
	import PressureChart from "$lib/components/PressureChart.svelte";
	import RecordsTable from "$lib/components/RecordsTable.svelte";
	import BreadcrumbBar from "$lib/components/BreadcrumbBar.svelte";

	let { data } = $props();
	let session = $derived(sessionById[data.id]);

	const COLOR = "#4a6fa5";

	let zoom = $state('normal');

	// --- Session navigation ---
	let sessionIndex = $derived(
		allSessions.findIndex(s => s.sessionId === data.id)
	);
	let prevSession = $derived(sessionIndex > 0 ? allSessions[sessionIndex - 1] : null);
	let nextSession = $derived(sessionIndex < allSessions.length - 1 ? allSessions[sessionIndex + 1] : null);

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
		<div class="page-header">
			<BreadcrumbBar
				brand={session.brand}
				model={session.pen}
				detail={[session.inventoryid, session.date, ...(session.notes ? [session.notes] : [])]}
			/>
			<div class="nav-strip">
				{#if prevSession}
					<a href="{base}/sessions/{prevSession.sessionId}" class="nav-btn">
						← {prevSession.inventoryid} · {prevSession.date}
					</a>
				{:else}
					<span class="nav-btn faded">← First</span>
				{/if}
				<span class="nav-counter">{sessionIndex + 1} / {allSessions.length}</span>
				{#if nextSession}
					<a href="{base}/sessions/{nextSession.sessionId}" class="nav-btn">
						{nextSession.inventoryid} · {nextSession.date} →
					</a>
				{:else}
					<span class="nav-btn faded">Last →</span>
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
				<RecordsTable records={session.records} />
			</div>

			<div class="chart-section">
				<div class="chart-header">
					<h2>Pressure Response</h2>
					<select class="zoom-select" bind:value={zoom}>
						<option value="normal">Normal zoom</option>
						<option value="iaf">Zoom to IAF</option>
						<option value="maxpressure">Zoom to max pressure</option>
					</select>
				</div>
				<PressureChart series={chartSeries} zoomMode={zoom} />
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

	.nav-strip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
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
	.nav-btn:hover { background: #eef2f8; border-color: #b0c4de; }
	.nav-btn.faded { color: #ccc; pointer-events: none; }

	.nav-counter {
		font-size: 0.75rem;
		color: #aaa;
		white-space: nowrap;
		flex-shrink: 0;
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

	.zoom-select {
		font-size: 0.8rem;
		color: #444;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.4rem;
		cursor: pointer;
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

	.not-found {
		color: #666;
	}

	.not-found code {
		background: #f0f0f0;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}
</style>
