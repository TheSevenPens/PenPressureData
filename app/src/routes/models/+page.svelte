<script>
	import { base } from '$app/paths';
	import { allSessions } from '$lib/data.js';
	import BrandFilter from '$lib/components/BrandFilter.svelte';
	import ModelFilter from '$lib/components/ModelFilter.svelte';

	const allModels = (() => {
		const map = {};
		for (const s of allSessions) {
			const key = `${s.brand}||${s.pen}`;
			if (!map[key]) {
				map[key] = { brand: s.brand, model: s.pen, pens: new Set(), sessions: 0 };
			}
			map[key].pens.add(s.inventoryid);
			map[key].sessions++;
		}
		return Object.values(map)
			.map(({ pens, ...rest }) => ({ ...rest, pens: pens.size }))
			.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
	})();

	let selectedBrand = $state('');
	let selectedModel = $state('');

	function onBrandChange() {
		selectedModel = '';
	}

	let filteredModels = $derived(
		allModels.filter(m =>
			(!selectedBrand || m.brand === selectedBrand) &&
			(!selectedModel || m.model === selectedModel)
		)
	);
</script>

<div class="models-page">
	<div class="controls">
		<div class="filter-row">
			<BrandFilter bind:selectedBrand onchange={onBrandChange} />
			<span class="count">{filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''}</span>
		</div>
		<ModelFilter bind:selectedModel selectedBrand={selectedBrand} />
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
						<a href="{base}/models/{m.brand}/{m.model}" class="view-btn">View</a>
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

<style>
	.models-page {
		max-width: 700px;
	}

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
