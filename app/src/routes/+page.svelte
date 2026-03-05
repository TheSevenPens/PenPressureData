<script>
	import { base } from '$app/paths';
	import { allSessions } from '$lib/data.js';
	import BrandFilter from '$lib/components/BrandFilter.svelte';
	import ModelFilter from '$lib/components/ModelFilter.svelte';

	let selectedBrand = $state('');
	let selectedModel = $state('');
	let expandedSessionId = $state(null);

	let filteredSessions = $derived(
		allSessions.filter((s) => {
			if (selectedBrand && s.brand !== selectedBrand) return false;
			if (selectedModel && s.pen !== selectedModel) return false;
			return true;
		})
	);

	function onBrandChange() {
		selectedModel = '';
		expandedSessionId = null;
	}

	function onModelChange() {
		expandedSessionId = null;
	}

	function toggleSession(id) {
		expandedSessionId = expandedSessionId === id ? null : id;
	}
</script>

<div class="controls">
	<div class="filter-row">
		<BrandFilter bind:selectedBrand onchange={onBrandChange} />
		<span class="count">{filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}</span>
	</div>
	<ModelFilter bind:selectedModel selectedBrand={selectedBrand} onchange={onModelChange} />
</div>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th></th>
				<th>Brand</th>
				<th>Model</th>
				<th>Inventory ID</th>
				<th>Date</th>
				<th>Tablet</th>
				<th>Driver</th>
				<th>OS</th>
				<th class="num">Records</th>
				<th>Notes</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredSessions as session (session.sessionId)}
				<tr
					class="session-row"
					class:expanded={expandedSessionId === session.sessionId}
					onclick={() => toggleSession(session.sessionId)}
				>
					<td class="view-cell">
						<a
							href="{base}/details/{encodeURIComponent(session.brand)}/{encodeURIComponent(session.pen)}/{session.inventoryid}/{session.date}"
							class="view-btn"
							onclick={(e) => e.stopPropagation()}
						>View</a>
					</td>
					<td>{session.brand}</td>
					<td>{session.pen}</td>
					<td class="mono">{session.inventoryid}</td>
					<td class="mono">{session.date}</td>
					<td>{session.tablet}</td>
					<td>{session.driver}</td>
					<td>{session.os}</td>
					<td class="num">{session.records.length}</td>
					<td>{session.notes}</td>
				</tr>

				{#if expandedSessionId === session.sessionId}
					<tr class="records-row">
						<td colspan="10">
							<div class="records-wrap">
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
												<td class="num">{pct}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</td>
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<style>
	.controls {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.filter-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.count {
		font-size: 0.85rem;
		color: #666;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	thead th {
		background: #f0f0f0;
		padding: 0.5rem 0.75rem;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	thead th.num {
		text-align: right;
	}

	tbody td {
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid #eee;
		vertical-align: top;
	}

	.session-row {
		cursor: pointer;
	}

	.session-row:hover {
		background: #f7f7ff;
	}

	.session-row.expanded {
		background: #eef0ff;
		font-weight: 500;
	}

	.records-row td {
		padding: 0;
		border-bottom: 2px solid #ddd;
		background: #fafafa;
	}

	.records-wrap {
		padding: 0.75rem 1rem;
	}

	.records-table {
		width: auto;
		min-width: 280px;
	}

	.records-table thead th {
		background: #e8e8e8;
		font-size: 0.8rem;
	}

	.records-table tbody td {
		font-size: 0.8rem;
		padding: 0.25rem 0.75rem;
	}

	.view-cell {
		width: 1px;
		white-space: nowrap;
	}

	.view-btn {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		font-size: 0.78rem;
		font-weight: 500;
		color: #4a6fa5;
		border: 1px solid #c0cfe8;
		border-radius: 4px;
		text-decoration: none;
		background: #f0f5ff;
		white-space: nowrap;
	}

	.view-btn:hover {
		background: #4a6fa5;
		color: #fff;
		border-color: #4a6fa5;
	}

	.mono {
		font-family: monospace;
	}

	.num {
		text-align: right;
	}

	.dim {
		color: #999;
	}
</style>
