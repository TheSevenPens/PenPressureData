<script>
	import { allSessions } from '$lib/data.js';

	// Group sessions by inventoryid → one row per pen
	const pens = (() => {
		const map = {};
		for (const s of allSessions) {
			if (!map[s.inventoryid]) {
				map[s.inventoryid] = { brand: s.brand, model: s.pen, inventoryid: s.inventoryid, count: 0 };
			}
			map[s.inventoryid].count++;
		}
		// Sort: brand → model → inventoryid
		return Object.values(map).sort((a, b) =>
			a.brand.localeCompare(b.brand) ||
			a.model.localeCompare(b.model) ||
			a.inventoryid.localeCompare(b.inventoryid)
		);
	})();
</script>

<div class="pens-page">
	<p class="summary">{pens.length} pens</p>

	<table class="pens-table">
		<thead>
			<tr>
				<th>Brand</th>
				<th>Model</th>
				<th>Inventory ID</th>
				<th class="num">Sessions</th>
			</tr>
		</thead>
		<tbody>
			{#each pens as pen}
				<tr>
					<td>{pen.brand}</td>
					<td>{pen.model}</td>
					<td class="mono">{pen.inventoryid}</td>
					<td class="num">{pen.count}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.pens-page {
		max-width: 800px;
	}

	.summary {
		font-size: 0.875rem;
		color: #888;
		margin: 0 0 1rem;
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

	.num {
		text-align: right;
	}

	.mono {
		font-family: monospace;
	}
</style>
