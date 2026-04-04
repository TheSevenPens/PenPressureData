<script>
	import { base } from "$app/paths";
	import { allSessions, penFamilies, familyInfoMap } from "$lib/data.js";
	import BrandFilter from "$lib/components/BrandFilter.svelte";

	const allFamilyRows = (() => {
		const map = {};
		for (const s of allSessions) {
			if (!s.penfamily) continue;
			if (!map[s.penfamily]) {
				const info = familyInfoMap[s.penfamily];
				map[s.penfamily] = {
					familyId: s.penfamily,
					familyName: info?.familyName || s.penfamily,
					brand: info?.brand || s.brand,
					models: new Set(),
					pens: new Set(),
					sessions: 0,
				};
			}
			map[s.penfamily].models.add(s.pen);
			map[s.penfamily].pens.add(s.inventoryid);
			map[s.penfamily].sessions++;
		}
		return Object.values(map)
			.map(({ models, pens, ...rest }) => ({
				...rest,
				models: models.size,
				pens: pens.size,
			}))
			.sort((a, b) =>
				a.brand.localeCompare(b.brand) || a.familyName.localeCompare(b.familyName),
			);
	})();

	let selectedBrand = $state("");

	let sortBy = $state("brand");
	let sortDesc = $state(false);

	function toggleSort(col) {
		if (sortBy === col) {
			sortDesc = !sortDesc;
		} else {
			sortBy = col;
			sortDesc = col === "sessions" || col === "pens" || col === "models";
		}
	}

	let filteredFamilies = $derived(
		allFamilyRows
			.filter((f) => !selectedBrand || f.brand === selectedBrand)
			.sort((a, b) => {
				let diff = 0;
				if (sortBy === "sessions") diff = a.sessions - b.sessions;
				else if (sortBy === "pens") diff = a.pens - b.pens;
				else if (sortBy === "models") diff = a.models - b.models;
				else if (sortBy === "family") diff = a.familyName.localeCompare(b.familyName) || a.brand.localeCompare(b.brand);
				else diff = a.brand.localeCompare(b.brand) || a.familyName.localeCompare(b.familyName);
				return sortDesc ? -diff : diff;
			}),
	);
</script>

<div class="families-page">
	<div class="layout-grid">
		<div class="sidebar">
			<div class="filter-box">
				<h3>Brand</h3>
				<BrandFilter bind:selectedBrand />
			</div>
		</div>

		<div class="main-column">
			<div class="controls">
				<span class="count"
					>{filteredFamilies.length} famil{filteredFamilies.length !== 1 ? "ies" : "y"}</span
				>
			</div>

			{#if filteredFamilies.length > 0}
				<table class="families-table">
					<thead>
						<tr>
							<th class="sortable" onclick={() => toggleSort("brand")}>
								Brand {#if sortBy === "brand"}{sortDesc ? "▼" : "▲"}{/if}
							</th>
							<th class="sortable" onclick={() => toggleSort("family")}>
								Family {#if sortBy === "family"}{sortDesc ? "▼" : "▲"}{/if}
							</th>
							<th class="num sortable" onclick={() => toggleSort("models")}>
								Models {#if sortBy === "models"}{sortDesc ? "▼" : "▲"}{/if}
							</th>
							<th class="num sortable" onclick={() => toggleSort("pens")}>
								Pens {#if sortBy === "pens"}{sortDesc ? "▼" : "▲"}{/if}
							</th>
							<th class="num sortable" onclick={() => toggleSort("sessions")}>
								Sessions {#if sortBy === "sessions"}{sortDesc ? "▼" : "▲"}{/if}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredFamilies as f}
							<tr>
								<td>{f.brand}</td>
								<td>
									<a href="{base}/families/{encodeURIComponent(f.familyId)}">{f.familyName}</a>
								</td>
								<td class="num">{f.models}</td>
								<td class="num">{f.pens}</td>
								<td class="num">{f.sessions}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<p class="empty">No pen families with pressure response data{selectedBrand ? ` for ${selectedBrand}` : ""}.</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.families-page {
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

	.families-table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.875rem;
	}

	.families-table thead th {
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

	.families-table thead th.num {
		text-align: right;
	}

	.families-table tbody td {
		padding: 0.25rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.num {
		text-align: right;
	}

	.empty {
		color: #666;
		font-size: 0.9rem;
	}
</style>
