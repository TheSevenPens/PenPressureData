<script>
	import { base } from "$app/paths";
	import { allSessions } from "$lib/data.js";
	import BrandFilter from "$lib/components/BrandFilter.svelte";
	import ModelFilter from "$lib/components/ModelFilter.svelte";
	import FlagButton from "$lib/components/FlagButton.svelte";
	import { penFamilies, inventoryIdToDefects } from "$lib/data.js";

	const allPens = (() => {
		const map = {};
		for (const s of allSessions) {
			if (!map[s.inventoryid]) {
				map[s.inventoryid] = {
					brand: s.brand,
					model: s.pen,
					penfamily: s.penfamily,
					inventoryid: s.inventoryid,
					defects: inventoryIdToDefects[s.inventoryid] || [],
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
	let selectedFamily = $state("");

	let sortBy = $state("brand");
	let sortDesc = $state(false);

	function toggleSort(col) {
		if (sortBy === col) {
			sortDesc = !sortDesc;
		} else {
			sortBy = col;
			sortDesc = col === "sessions";
		}
	}

	function onBrandChange() {
		selectedModel = "";
		selectedFamily = "";
	}

	let availableFamilies = $derived(
		penFamilies.filter((f) => !selectedBrand || f.brand === selectedBrand),
	);

	let filteredPens = $derived(
		allPens
			.filter(
				(p) =>
					(!selectedBrand || p.brand === selectedBrand) &&
					(!selectedModel || p.model === selectedModel) &&
					(!selectedFamily || p.penfamily === selectedFamily),
			)
			.sort((a, b) => {
				let diff = 0;
				if (sortBy === "sessions") {
					diff = a.count - b.count;
				} else if (sortBy === "inventoryid") {
					diff = a.inventoryid.localeCompare(b.inventoryid);
				} else if (sortBy === "model") {
					diff =
						a.model.localeCompare(b.model) ||
						a.brand.localeCompare(b.brand) ||
						a.inventoryid.localeCompare(b.inventoryid);
				} else {
					diff =
						a.brand.localeCompare(b.brand) ||
						a.model.localeCompare(b.model) ||
						a.inventoryid.localeCompare(b.inventoryid);
				}
				return sortDesc ? -diff : diff;
			}),
	);
</script>

<div class="pens-page">
	<div class="layout-grid">
		<div class="sidebar">
			<div class="filter-box">
				<h3>Brand</h3>
				<BrandFilter bind:selectedBrand onchange={onBrandChange} />
			</div>
			{#if availableFamilies.length > 0}
				<div class="filter-box">
					<h3>Pen Family</h3>
					<select class="family-select" bind:value={selectedFamily}>
						<option value="">All</option>
						{#each availableFamilies as f}
							<option value={f.familyId}>{f.familyName}</option>
						{/each}
					</select>
				</div>
			{/if}
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
						<th
							class="sortable"
							onclick={() => toggleSort("brand")}
						>
							Brand {#if sortBy === "brand"}{sortDesc
									? "▼"
									: "▲"}{/if}
						</th>
						<th
							class="sortable"
							onclick={() => toggleSort("model")}
						>
							Model {#if sortBy === "model"}{sortDesc
									? "▼"
									: "▲"}{/if}
						</th>
						<th
							class="sortable"
							onclick={() => toggleSort("inventoryid")}
						>
							Inventory ID {#if sortBy === "inventoryid"}{sortDesc
									? "▼"
									: "▲"}{/if}
						</th>
						<th
							class="num sortable"
							onclick={() => toggleSort("sessions")}
						>
							Sessions {#if sortBy === "sessions"}{sortDesc
									? "▼"
									: "▲"}{/if}
						</th>
						<th class="defect-col" title="Defect">&#9888;</th>
						<th class="flag-col"></th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPens as pen}
						<tr>
							<td>{pen.brand}</td>
							<td>
								<a
									href="{base}/details/{encodeURIComponent(
										pen.brand,
									)}/{encodeURIComponent(pen.model)}"
									>{pen.model}</a
								>
							</td>
							<td class="mono">
								<a
									href="{base}/details/{encodeURIComponent(
										pen.brand,
									)}/{encodeURIComponent(
										pen.model,
									)}/{pen.inventoryid}">{pen.inventoryid}</a
								>
							</td>
							<td class="num">{pen.count}</td>
							<td class="defect-col">
								{#if pen.defects.length > 0}
									<span class="defect-icon" title={pen.defects.map(d => d.Notes ? `${d.Kind}: ${d.Notes}` : d.Kind).join(" | ")}>&#9888;</span>
								{/if}
							</td>
							<td class="flag-col"><FlagButton type="pen" inventoryid={pen.inventoryid} /></td>
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

	.sortable {
		cursor: pointer;
		user-select: none;
	}

	.sortable:hover {
		background: #e8e8e8;
	}

	.pens-table thead th.num {
		text-align: right;
	}

	.pens-table tbody td {
		padding: 0.25rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.num {
		text-align: right;
	}

	.mono {
		font-family: monospace;
	}

	.family-select {
		width: 100%;
		font-size: 0.85rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}

	.flag-col {
		width: 2rem;
		text-align: center;
		padding: 0.25rem 0.5rem;
	}

	.defect-col {
		width: 2rem;
		text-align: center;
		padding: 0.25rem 0.5rem;
	}

	.defect-icon {
		color: #c0922a;
		cursor: help;
		font-size: 1rem;
	}
</style>
