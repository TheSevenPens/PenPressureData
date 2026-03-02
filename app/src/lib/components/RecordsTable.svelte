<script>
	/** @type {{ records: Array<[number, number]> }} */
	let { records } = $props();
</script>

<table class="records-table">
	<thead>
		<tr>
			<th class="num">#</th>
			<th class="num">Phys (gf)</th>
			<th class="num">Log (%)</th>
		</tr>
	</thead>
	<tbody>
		{#each records as [gf, pct], i}
			<tr>
				<td class="num dim">{i + 1}</td>
				<td class="num">{gf}</td>
				<td class="num">{Number(pct).toFixed(4)}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.records-table {
		border-collapse: collapse;
		width: auto;
		font-size: 0.875rem;
	}

	.records-table thead th {
		background: #f0f0f0;
		padding: 0.2rem 1rem;
		text-align: right;
		font-weight: 600;
		border-bottom: 2px solid #ddd;
		white-space: nowrap;
	}

	.records-table tbody td {
		padding: 0.1rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.num {
		text-align: right;
		font-family: monospace;
	}

	.dim {
		color: #bbb;
	}
</style>
