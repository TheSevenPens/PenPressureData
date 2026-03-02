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

	/** @type {{ series: Array<{ label: string, records: Array<[number, number]>, color: string }>, zoomMode?: string }} */
	let { series, zoomMode = 'normal' } = $props();

	let canvas;
	let chart;

	function getAxisLimits() {
		if (zoomMode === 'iaf') {
			return { xMin: 0, xMax: 20, yMin: 0, yMax: 10 };
		}
		if (zoomMode === 'maxpressure') {
			const allRecords = series.flatMap(s => s.records);
			const maxX = Math.max(...allRecords.map(([x]) => x));
			// Start x-axis where data first enters the 90%+ y-range (minus a small buffer)
			const highPressureX = allRecords.filter(([, y]) => y >= 90).map(([x]) => x);
			const minHighX = highPressureX.length > 0 ? Math.min(...highPressureX) : 0;
			return { xMin: Math.max(0, minHighX - 20), xMax: maxX + 100, yMin: 90, yMax: 100 };
		}
		// normal
		return { xMin: 0, xMax: 1000, yMin: 0, yMax: 100 };
	}

	function buildChart() {
		if (chart) chart.destroy();

		const { xMin, xMax, yMin, yMax } = getAxisLimits();
		const isIAF = zoomMode === 'iaf';

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
						min: xMin,
						max: xMax,
						title: {
							display: true,
							text: "PHYSICAL (gf)",
							font: {
								family: "'Google Sans Flex', sans-serif",
								size: 12,
							},
						},
						ticks: {
							font: { family: "monospace" },
							stepSize: isIAF ? 1 : undefined,
							autoSkip: !isIAF,
						},
						grid: { color: "#e8e8e8" },
					},
					y: {
						type: "linear",
						min: yMin,
						max: yMax,
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
					legend: { display: false },
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
		series;
		zoomMode;
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
