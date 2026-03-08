<script>
	import {
		interpolatePhysical,
		estimateP00,
		estimateP100,
		fmtP,
	} from "../interpolate.js";

	/** @type {{ records: Array<[number, number]> }} */
	let { records } = $props();

	const estimatedPercents = [
		0, 1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99, 100,
	];
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
		{#each estimatedPercents as pxx}
			{@const est =
				pxx === 0
					? estimateP00(records)
					: pxx === 100
						? estimateP100(records)
						: interpolatePhysical(records, pxx)}
			{#if est !== null}
				<tr class="estimate-row">
					<td class="num dim">P{pxx < 10 ? "0" + pxx : pxx}</td>
					<td class="num estimate">{fmtP(est)}</td>
					<td class="num estimate">{pxx.toFixed(4)}</td>
				</tr>
			{/if}
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

	.estimate {
		color: #285c96;
		font-style: italic;
	}

	.estimate-row td {
		background: #f4f8fc;
	}
</style>
