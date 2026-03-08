<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import BrandFilter from "$lib/components/BrandFilter.svelte";
	import ModelFilter from "$lib/components/ModelFilter.svelte";

	const allModels = (() => {
		const map = {};
		for (const s of allSessions) {
			const key = `${s.brand}||${s.pen}`;
			if (!map[key]) {
				map[key] = {
					brand: s.brand,
					model: s.pen,
					pens: new Set(),
					sessions: 0,
				};
			}
			map[key].pens.add(s.inventoryid);
			map[key].sessions++;
		}
		return Object.values(map)
			.map(({ pens, ...rest }) => ({ ...rest, pens: pens.size }))
			.sort(
				(a, b) =>
					a.brand.localeCompare(b.brand) ||
					a.model.localeCompare(b.model),
			);
	})();

	let selectedBrand = $state("");
	let selectedModel = $state("");

	function onBrandChange() {
		selectedModel = "";
	}

	let filteredModels = $derived(
		allModels.filter(
			(m) =>
				(!selectedBrand || m.brand === selectedBrand) &&
				(!selectedModel || m.model === selectedModel),
		),
	);
</script>

<div class="models-page">
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
					>{filteredModels.length} model{filteredModels.length !== 1
						? "s"
						: ""}</span
				>
			</div>

			<table class="models-table">
				<thead>
					<tr>
						<th></th>
						<th>Brand</th>
						<th>Model</th>
						<th class="num">Pens</th>
						<th class="num">Sessions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredModels as m}
						<tr>
							<td class="btn-cell">
								<a
									href="{base}/details/{encodeURIComponent(
										m.brand,
									)}/{encodeURIComponent(m.model)}"
									class="view-btn">View</a
								>
							</td>
							<td>{m.brand}</td>
							<td>{m.model}</td>
							<td class="num">{m.pens}</td>
							<td class="num">{m.sessions}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.models-page {
		max-width: 700px;
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

	.models-table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.875rem;
	}

	.models-table thead th {
		background: #f0f0f0;
		padding: 0.4rem 1rem;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	.models-table thead th.num {
		text-align: right;
	}

	.models-table tbody td {
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
</style>
