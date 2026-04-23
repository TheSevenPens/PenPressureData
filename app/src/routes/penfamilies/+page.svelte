<script>
	import { base } from "$app/paths";
	import { allSessions, penFamilies, familyInfoMap, brands } from "$lib/data.js";
	import FlagButton from "$lib/components/FlagButton.svelte";

	const allFamilyRows = (() => {
		const map = {};
		for (const s of allSessions) {
			if (!s.penfamily) continue;
			if (!map[s.penfamily]) {
				const info = familyInfoMap[s.penfamily];
				map[s.penfamily] = {
					familyId: s.penfamily,
					entityId: info?.entityId || "",
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
				modelNames: [...models].sort(),
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
	<div class="top-bar">
		<label class="filter-label">
			Brand:
			<select class="filter-select" bind:value={selectedBrand}>
				<option value="">All</option>
				{#each brands as b}
					<option value={b}>{b}</option>
				{/each}
			</select>
		</label>
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
							<th>Pen Models</th>
							<th class="num sortable" onclick={() => toggleSort("pens")}>
								Pens {#if sortBy === "pens"}{sortDesc ? "▼" : "▲"}{/if}
							</th>
							<th class="num sortable" onclick={() => toggleSort("sessions")}>
								Sessions {#if sortBy === "sessions"}{sortDesc ? "▼" : "▲"}{/if}
							</th>
							<th class="flag-col"></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredFamilies as f}
							<tr>
								<td>{f.brand}</td>
								<td class="family-name">
									<a href="{base}/penfamily/{encodeURIComponent(f.entityId)}">{f.familyName}</a>
								</td>
								<td class="model-list">{f.modelNames.join(", ")}</td>
								<td class="num">{f.pens}</td>
								<td class="num">{f.sessions}</td>
								<td class="flag-col"><FlagButton type="family" entityId={f.entityId} /></td>
							</tr>
						{/each}
					</tbody>
				</table>
		{:else}
			<p class="empty">No pen families with pressure response data{selectedBrand ? ` for ${selectedBrand}` : ""}.</p>
		{/if}
</div>

<style>
	.families-page {
		max-width: 100%;
	}

	.top-bar {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	.filter-label {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: #555;
	}

	.filter-select {
		font-size: 0.85rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		background: #fff;
	}

	.count {
		font-size: 0.85rem;
		color: #666;
		white-space: nowrap;
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
		white-space: nowrap;
	}

	.model-list {
		white-space: normal;
		word-break: break-all;
		font-size: 0.8rem;
		color: #555;
		max-width: 300px;
	}

	.num {
		text-align: right;
	}

	.flag-col {
		width: 2rem;
		text-align: center;
		padding: 0.25rem 0.5rem;
	}

	.empty {
		color: #666;
		font-size: 0.9rem;
	}
</style>
