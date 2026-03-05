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
		Title,
	} from "chart.js";

	Chart.register(
		ScatterController,
		LinearScale,
		PointElement,
		LineElement,
		Tooltip,
		Legend,
		Title,
	);

	/** @type {{ series: Array<{ label: string, records: Array<[number, number]>, color: string, p00?: number|null, p100?: number|null }>, zoomMode?: string, title?: string|null }} */
	let { series, zoomMode = "normal", title = null } = $props();

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
				backgroundColor: s.color,
				borderWidth: 2,
				pointRadius: 2,
				pointHoverRadius: 4,
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
					title: {
						display: title != null,
						text: title ?? "",
						color: "#888",
						font: {
							family: "'Google Sans Flex', sans-serif",
							size: 15,
							weight: "normal",
						},
						padding: { top: 8, bottom: 2 },
					},
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

	// --- Export helpers ---

	function getExportCanvas() {
		const off = document.createElement("canvas");
		off.width = canvas.width;
		off.height = canvas.height;
		const ctx = off.getContext("2d");
		ctx.fillStyle = "#f7f7f7";
		ctx.fillRect(0, 0, off.width, off.height);
		ctx.drawImage(canvas, 0, 0);
		return off;
	}

	function getFilename() {
		if (!title) return "pressure-data";
		return title
			.replace(/^Pressure response for /i, "")
			.replace(/ \/ /g, "-");
	}

	function escHtml(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	function buildOneTable(s) {
		const headerRow = [
			"    <tr>",
			"      <th>Physical (gf)</th>",
			"      <th>Logical (%)</th>",
			"    </tr>",
		].join("\n");

		const dataRows = s.records.map(([gf, pct]) =>
			[
				"    <tr>",
				`      <td>${gf}</td>`,
				`      <td>${pct}</td>`,
				"    </tr>",
			].join("\n"),
		);

		return [
			"<table>",
			"  <thead>",
			headerRow,
			"  </thead>",
			"  <tbody>",
			dataRows.join("\n"),
			"  </tbody>",
			"</table>",
		].join("\n");
	}

	function buildTableHtml() {
		if (series.length === 1) {
			return buildOneTable(series[0]);
		}
		return series
			.map((s) => `<h3>${escHtml(s.label)}</h3>\n${buildOneTable(s)}`)
			.join("\n\n");
	}

	function buildHtmlDoc() {
		const t = title ?? "Pressure Response Data";
		const indentedTable = buildTableHtml()
			.split("\n")
			.map((line) => "    " + line)
			.join("\n");
		return [
			"<!DOCTYPE html>",
			"<html>",
			"  <head>",
			'    <meta charset="UTF-8">',
			`    <title>${escHtml(t)}</title>`,
			"  </head>",
			"  <body>",
			`    <h2>${escHtml(t)}</h2>`,
			indentedTable,
			"  </body>",
			"</html>",
		].join("\n");
	}

	export async function copyChart() {
		if (!canvas) return;
		try {
			const blob = await new Promise((res) =>
				getExportCanvas().toBlob(res),
			);
			await navigator.clipboard.write([
				new ClipboardItem({ "image/png": blob }),
			]);
		} catch (e) {
			console.error("Copy chart failed:", e);
		}
	}

	export function exportPng() {
		if (!canvas) return;
		const link = document.createElement("a");
		link.download = `${getFilename()}.png`;
		link.href = getExportCanvas().toDataURL("image/png");
		link.click();
	}

	export async function copyData() {
		try {
			const html = buildTableHtml();
			await navigator.clipboard.write([
				new ClipboardItem({
					"text/html": new Blob([html], { type: "text/html" }),
				}),
			]);
		} catch (e) {
			console.error("Copy data failed:", e);
		}
	}

	export function exportData() {
		const html = buildHtmlDoc();
		const url = URL.createObjectURL(
			new Blob([html], { type: "text/html" }),
		);
		const link = document.createElement("a");
		link.download = `${getFilename()}.html`;
		link.href = url;
		link.click();
		URL.revokeObjectURL(url);
	}

	onMount(() => buildChart());
	onDestroy(() => {
		if (chart) chart.destroy();
	});

	$effect(() => {
		series;
		zoomMode;
		title;
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
		background: #f7f7f7;
	}
</style>
