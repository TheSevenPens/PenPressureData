<script>
	import { allSessions, byBrand, brands } from '$lib/data.js';

	let selectedBrand = $state('');
	let selectedModel = $state('');
	let expandedSessionId = $state(null);

	let availableModels = $derived(
		selectedBrand
			? Object.keys(byBrand[selectedBrand]?.byModel ?? {}).sort()
			: []
	);

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
	<label>
		Brand
		<select bind:value={selectedBrand} onchange={onBrandChange}>
			<option value="">All brands</option>
			{#each brands as brand}
				<option value={brand}>{brand}</option>
			{/each}
		</select>
	</label>

	<label>
		Model
		<select bind:value={selectedModel} onchange={onModelChange} disabled={!selectedBrand}>
			<option value="">All models</option>
			{#each availableModels as model}
				<option value={model}>{model}</option>
			{/each}
		</select>
	</label>

	<span class="count">{filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}</span>
</div>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
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
						<td colspan="9">
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
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.controls label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.controls select {
		padding: 0.3rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.9rem;
		background: #fff;
		min-width: 140px;
	}

	.controls select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
