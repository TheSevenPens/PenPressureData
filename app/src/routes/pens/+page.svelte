<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import BrandFilter from "$lib/components/BrandFilter.svelte";
	import ModelFilter from "$lib/components/ModelFilter.svelte";

	const allPens = (() => {
		const map = {};
		for (const s of allSessions) {
			if (!map[s.inventoryid]) {
				map[s.inventoryid] = {
					brand: s.brand,
					model: s.pen,
					inventoryid: s.inventoryid,
					count: 0,
				};
			}
			map[s.inventoryid].count++;
		}
		return Object.values(map).sort(
			(a, b) =>
				a.brand.localeCompare(b.brand) ||
				a.model.localeCompare(b.model) ||
				a.inventoryid.localeCompare(b.inventoryid),
		);
	})();

	let selectedBrand = $state("");
	let selectedModel = $state("");

	function onBrandChange() {
		selectedModel = "";
	}

	let filteredPens = $derived(
		allPens.filter(
			(p) =>
				(!selectedBrand || p.brand === selectedBrand) &&
				(!selectedModel || p.model === selectedModel),
		),
	);
</script>

<div class="pens-page">
	<div class="layout-grid">
		<div class="sidebar">
			<div class="filter-box">
				<h3>Brand</h3>
				<BrandFilter bind:selectedBrand onchange={onBrandChange} />
			</div>
			<div class="filter-box">
				<h3>Model</h3>
				<ModelFilter bind:selectedModel {selectedBrand} />
			</div>
		</div>

		<div class="main-column">
			<div class="controls">
				<span class="count"
					>{filteredPens.length} pen{filteredPens.length !== 1
						? "s"
						: ""}</span
				>
			</div>

			<table class="pens-table">
				<thead>
					<tr>
						<th></th>
						<th>Brand</th>
						<th>Model</th>
						<th>Inventory ID</th>
						<th class="num">Sessions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPens as pen}
						<tr>
							<td class="btn-cell">
								<a
									href="{base}/details/{encodeURIComponent(
										pen.brand,
									)}/{encodeURIComponent(
										pen.model,
									)}/{pen.inventoryid}"
									class="view-btn">View</a
								>
							</td>
							<td>{pen.brand}</td>
							<td>{pen.model}</td>
							<td class="mono">{pen.inventoryid}</td>
							<td class="num">{pen.count}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.pens-page {
		max-width: 800px;
	}

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

	.controls {
		display: flex;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.count {
		font-size: 0.85rem;
		color: #666;
	}

	.pens-table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.875rem;
	}

	.pens-table thead th {
		background: #f0f0f0;
		padding: 0.4rem 1rem;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	.pens-table thead th.num {
		text-align: right;
	}

	.pens-table tbody td {
		padding: 0.25rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.btn-cell {
		padding: 0.25rem 0.5rem;
	}

	.view-btn {
		display: inline-block;
		padding: 0.15rem 0.6rem;
		font-size: 0.75rem;
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

	.num {
		text-align: right;
	}

	.mono {
		font-family: monospace;
	}
</style>
