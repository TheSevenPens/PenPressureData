<script>
	import { allSessions } from '$lib/data.js';

	// Group sessions by brand+model → one row per unique model
	const models = (() => {
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
</script>

<div class="models-page">
	<p class="summary">{models.length} pen models</p>

	<table class="models-table">
		<thead>
			<tr>
				<th>Brand</th>
				<th>Model</th>
				<th class="num">Pens</th>
				<th class="num">Sessions</th>
			</tr>
		</thead>
		<tbody>
			{#each models as m}
				<tr>
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

	.summary {
		font-size: 0.875rem;
		color: #888;
		margin: 0 0 1rem;
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

	.num {
		text-align: right;
	}
</style>
