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

	/** @type {{ series: Array<{ label: string, records: Array<[number, number]>, color: string, p00?: number|null, p100?: number|null }>, zoomMode?: string }} */
	let { series, zoomMode = "normal" } = $props();

	let canvas;
	let chart;

	function getAxisLimits() {
		if (zoomMode === "iaf") {
			return { xMin: 0, xMax: 20, yMin: 0, yMax: 5 };
		}
		if (zoomMode === "maxpressure") {
			const allRecords = series.flatMap((s) => s.records);
			const maxX = Math.max(...allRecords.map(([x]) => x));
			const highPressureX = allRecords
				.filter(([, y]) => y >= 95)
				.map(([x]) => x);
			const minHighX =
				highPressureX.length > 0 ? Math.min(...highPressureX) : 0;
			const p100Values = series
				.map((s) => s.p100)
				.filter((v) => v != null);
			const maxP100 = p100Values.length > 0 ? Math.max(...p100Values) : 0;
			const xMax = Math.max(maxX + 100, maxP100 + 50);
			return {
				xMin: Math.max(0, minHighX - 20),
				xMax,
				yMin: 95,
				yMax: 100,
			};
		}
		// normal
		return { xMin: 0, xMax: 1000, yMin: 0, yMax: 100 };
	}

	function buildChart() {
		if (chart) chart.destroy();

		const { xMin, xMax, yMin, yMax } = getAxisLimits();
		const isIAF = zoomMode === "iaf";

		const datasets = [];

		for (const s of series) {
			// Main measured data line
			datasets.push({
				label: s.label,
				data: s.records.map(([x, y]) => ({ x, y })),
				showLine: true,
				tension: 0,
				borderColor: s.color,
				backgroundColor: s.color + "33",
				borderWidth: 2,
				pointRadius: 3,
				pointHoverRadius: 5,
			});

			// Dotted extrapolation line from P00 (y=0) to first measured point
			if (s.p00 != null && s.records.length > 0) {
				const [firstX, firstY] = s.records[0];
				datasets.push({
					label: `${s.label}_p00_extrap`,
					data: [
						{ x: s.p00, y: 0 },
						{ x: firstX, y: firstY },
					],
					showLine: true,
					tension: 0,
					borderColor: s.color,
					backgroundColor: "transparent",
					borderWidth: 1.5,
					borderDash: [2, 4],
					pointRadius: [4, 0],
					pointHoverRadius: [5, 0],
					pointStyle: ["crossRot", ""],
					pointBorderColor: s.color,
					pointBackgroundColor: "white",
				});
			}

			// Dotted extrapolation line from last measured point to P100 (y=100)
			if (s.p100 != null && s.records.length > 0) {
				const [lastX, lastY] = s.records[s.records.length - 1];
				datasets.push({
					label: `${s.label}_p100_extrap`,
					data: [
						{ x: lastX, y: lastY },
						{ x: s.p100, y: 100 },
					],
					showLine: true,
					tension: 0,
					borderColor: s.color,
					backgroundColor: "transparent",
					borderWidth: 1.5,
					borderDash: [2, 4],
					pointRadius: [0, 4],
					pointHoverRadius: [0, 5],
					pointStyle: ["", "crossRot"],
					pointBorderColor: s.color,
					pointBackgroundColor: "white",
				});
			}
		}

		chart = new Chart(canvas, {
			type: "scatter",
			data: { datasets },
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
						filter: (item) =>
							!item.dataset.label.includes("_extrap"),
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
