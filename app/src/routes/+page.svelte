<script>
	import { base } from "$app/paths";
	import { allSessions, brands } from "$lib/data.js";

	let selectedBrand = $state("");
	let selectedModel = $state("");
	let expandedSessionId = $state(null);

	let filteredSessions = $derived(
		allSessions.filter((s) => {
			if (selectedBrand && s.brand !== selectedBrand) return false;
			if (selectedModel && s.pen !== selectedModel) return false;
			return true;
		}),
	);

	// Unique model names visible in the current brand filter, sorted alphabetically.
	let availableModels = $derived(
		(() => {
			const seen = new Set();
			for (const s of allSessions) {
				if (!selectedBrand || s.brand === selectedBrand) seen.add(s.pen);
			}
			return [...seen].sort();
		})(),
	);

	function onBrandChange() {
		selectedModel = "";
		expandedSessionId = null;
	}

	function onModelChange() {
		expandedSessionId = null;
	}

	function toggleSession(id) {
		expandedSessionId = expandedSessionId === id ? null : id;
	}
</script>

<div class="layout-grid">
	<div class="sidebar">
		<div class="filter-box">
			<h3>Brand</h3>
			<select
				class="filter-select"
				bind:value={selectedBrand}
				onchange={onBrandChange}
			>
				<option value="">All</option>
				{#each brands as b}
					<option value={b}>{b}</option>
				{/each}
			</select>
		</div>
		{#if availableModels.length > 0}
			<div class="filter-box">
				<h3>Model</h3>
				<select
					class="filter-select"
					bind:value={selectedModel}
					onchange={onModelChange}
				>
					<option value="">All</option>
					{#each availableModels as m}
						<option value={m}>{m}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<div class="main-column">
		<div class="controls">
			<span class="count"
				>{filteredSessions.length} session{filteredSessions.length !== 1
					? "s"
					: ""}</span
			>
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
						<th class="num">Records</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredSessions as session (session.sessionId)}
						<tr
							class="session-row"
							class:expanded={expandedSessionId ===
								session.sessionId}
							onclick={() => toggleSession(session.sessionId)}
						>
							<td>{session.brand}</td>
							<td class="model-cell">
								<a
									href="{base}/penmodel/{encodeURIComponent(session.penEntityId)}"
									onclick={(e) => e.stopPropagation()}
								>
									{session.fullName}
								</a>
							</td>
							<td class="mono">
								<a
									href="{base}/inventorypen/{encodeURIComponent(session.inventoryid.toLowerCase())}"
									onclick={(e) => e.stopPropagation()}
									>{session.inventoryid}</a
								>
							</td>
							<td class="mono">
								<a
									href="{base}/session/{encodeURIComponent(session.sessionId.toLowerCase())}"
									onclick={(e) => e.stopPropagation()}
									>{session.date}</a
								>
							</td>
							<td>{session.tabletFullName}</td>
							<td>{session.driver}</td>
							<td class="num">{session.records.length}</td>
						</tr>

						{#if expandedSessionId === session.sessionId}
							<tr class="records-row">
								<td colspan="7">
									<div class="records-wrap">
										<table class="records-table">
											<thead>
												<tr>
													<th class="num">#</th>
													<th class="num"
														>Physical (gf)</th
													>
													<th class="num"
														>Logical (%)</th
													>
												</tr>
											</thead>
											<tbody>
												{#each session.records as [gf, pct], i}
													<tr>
														<td class="num dim"
															>{i + 1}</td
														>
														<td class="num">{gf}</td
														>
														<td class="num"
															>{pct}</td
														>
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
	</div>
</div>

<style>
	.layout-grid {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		align-items: start;
	}

	@media (max-width: 900px) {
		.layout-grid {
			grid-template-columns: 1fr;
		}
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.filter-box {
		background: #fcfcfc;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		padding: 1rem;
	}

	.filter-box h3 {
		margin: 0 0 0.75rem 0;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #555;
	}

	.filter-select {
		width: 100%;
		font-size: 0.85rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		background: #fff;
	}

	.controls {
		display: flex;
		align-items: center;
		margin-bottom: 0.75rem;
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

	tbody td.model-cell {
		white-space: nowrap;
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
