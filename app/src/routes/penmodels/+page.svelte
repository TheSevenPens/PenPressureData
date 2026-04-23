<script>
	import { base } from "$app/paths";
	import { allSessions, penFamilies, familyInfoMap, brands } from "$lib/data.js";
	import FlagButton from "$lib/components/FlagButton.svelte";

	const allModels = (() => {
		const map = {};
		for (const s of allSessions) {
			const key = s.penEntityId || `${s.brand}||${s.pen}`;
			if (!map[key]) {
				map[key] = {
					brand: s.brand,
					model: s.pen,
					penName: s.penName,
					fullName: s.fullName,
					penEntityId: s.penEntityId,
					penfamily: s.penfamily,
					pens: new Set(),
					sessions: 0,
				};
			}
			map[key].pens.add(s.inventoryid);
			map[key].sessions++;
		}
		return Object.values(map)
			.map(({ pens, ...rest }) => {
				const info = familyInfoMap[rest.penfamily];
				return {
					...rest,
					pens: pens.size,
					familyName: info?.familyName || "",
					familyEntityId: info?.entityId || "",
				};
			})
			.sort(
				(a, b) =>
					a.brand.localeCompare(b.brand) ||
					a.model.localeCompare(b.model),
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
			sortDesc = col === "sessions" || col === "pens";
		}
	}

	function onBrandChange() {
		selectedModel = "";
		selectedFamily = "";
	}

	let availableFamilies = $derived(
		penFamilies.filter((f) => !selectedBrand || f.brand === selectedBrand),
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

	let filteredModels = $derived(
		allModels
			.filter(
				(m) =>
					(!selectedBrand || m.brand === selectedBrand) &&
					(!selectedModel || m.model === selectedModel) &&
					(!selectedFamily || m.penfamily === selectedFamily),
			)
			.sort((a, b) => {
				let diff = 0;
				if (sortBy === "sessions") {
					diff = a.sessions - b.sessions;
				} else if (sortBy === "pens") {
					diff = a.pens - b.pens;
				} else if (sortBy === "model") {
					diff =
						a.model.localeCompare(b.model) ||
						a.brand.localeCompare(b.brand);
				} else if (sortBy === "family") {
					diff =
						a.familyName.localeCompare(b.familyName) ||
						a.brand.localeCompare(b.brand) ||
						a.model.localeCompare(b.model);
				} else {
					diff =
						a.brand.localeCompare(b.brand) ||
						a.model.localeCompare(b.model);
				}
				return sortDesc ? -diff : diff;
			}),
	);
</script>

<div class="models-page">
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
			{#if availableFamilies.length > 0}
				<div class="filter-box">
					<h3>Pen Family</h3>
					<select class="filter-select" bind:value={selectedFamily}>
						<option value="">All</option>
						{#each availableFamilies as f}
							<option value={f.familyId}>{f.familyName}</option>
						{/each}
					</select>
				</div>
			{/if}
			{#if availableModels.length > 0}
				<div class="filter-box">
					<h3>Model</h3>
					<select class="filter-select" bind:value={selectedModel}>
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
					>{filteredModels.length} model{filteredModels.length !== 1
						? "s"
						: ""}</span
				>
			</div>

			<table class="models-table">
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
							onclick={() => toggleSort("family")}
						>
							Family {#if sortBy === "family"}{sortDesc
									? "▼"
									: "▲"}{/if}
						</th>
						<th
							class="num sortable"
							onclick={() => toggleSort("pens")}
						>
							Pens {#if sortBy === "pens"}{sortDesc
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
						<th class="flag-col"></th>
					</tr>
				</thead>
				<tbody>
					{#each filteredModels as m}
						<tr>
							<td>{m.brand}</td>
							<td class="model-cell">
								<a
									href="{base}/penmodel/{encodeURIComponent(m.penEntityId)}"
									>{m.fullName}</a
								>
							</td>
							<td class="family-cell">
								{#if m.familyEntityId}
									<a
										href="{base}/penfamily/{encodeURIComponent(m.familyEntityId)}"
										>{m.familyName}</a
									>
								{/if}
							</td>
							<td class="num">{m.pens}</td>
							<td class="num">{m.sessions}</td>
							<td class="flag-col"><FlagButton type="model" entityId={m.penEntityId} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.models-page {
		max-width: 1050px;
	}

	.models-table tbody td.model-cell,
	.models-table tbody td.family-cell {
		white-space: nowrap;
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

	.sortable {
		cursor: pointer;
		user-select: none;
	}

	.sortable:hover {
		background: #e8e8e8;
	}

	.models-table thead th.num {
		text-align: right;
	}

	.models-table tbody td {
		padding: 0.25rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.num {
		text-align: right;
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

	.flag-col {
		width: 2rem;
		text-align: center;
		padding: 0.25rem 0.5rem;
	}
</style>
