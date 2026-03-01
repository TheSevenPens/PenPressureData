<script>
	import { onMount, onDestroy } from "svelte";
	import {
		Chart,
		ScatterController,
		LinearScale,
		PointElement,
		LineElement,
		Tooltip,
		Legend,
	} from "chart.js";

	Chart.register(
		ScatterController,
		LinearScale,
		PointElement,
		LineElement,
		Tooltip,
		Legend,
	);

	/** @type {{ series: Array<{ label: string, records: Array<[number, number]>, color: string }> }} */
	let { series } = $props();

	let canvas;
	let chart;

	function buildChart() {
		if (chart) chart.destroy();

		chart = new Chart(canvas, {
			type: "scatter",
			data: {
				datasets: series.map((s) => ({
					label: s.label,
					data: s.records.map(([x, y]) => ({ x, y })),
					showLine: true,
					tension: 0,
					borderColor: s.color,
					backgroundColor: s.color + "33",
					borderWidth: 2,
					pointRadius: 3,
					pointHoverRadius: 5,
				})),
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						type: "linear",
						min: 0,
						max: 1000,
						title: {
							display: true,
							text: "PHYSICAL (gf)",
							font: {
								family: "'Google Sans Flex', sans-serif",
								size: 12,
							},
						},
						ticks: { font: { family: "monospace" } },
						grid: { color: "#e8e8e8" },
					},
					y: {
						type: "linear",
						min: 0,
						max: 100,
						title: {
							display: true,
							text: "LOGICAL (%)",
							font: {
								family: "'Google Sans Flex', sans-serif",
								size: 12,
							},
						},
						ticks: { font: { family: "monospace" } },
						grid: { color: "#e8e8e8" },
					},
				},
				plugins: {
					legend: {
						display: series.length > 1,
						labels: {
							font: { family: "'Google Sans Flex', sans-serif" },
						},
					},
					tooltip: {
						callbacks: {
							label: (ctx) =>
								`${ctx.dataset.label}: ${ctx.parsed.x} gf → ${Number(ctx.parsed.y).toFixed(4)}%`,
						},
					},
				},
			},
		});
	}

	onMount(() => buildChart());
	onDestroy(() => {
		if (chart) chart.destroy();
	});

	$effect(() => {
		// Rebuild when series data changes
		series;
		if (canvas) buildChart();
	});
</script>

<div class="chart-wrap">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-wrap {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 320px;
	}
</style>
