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
		Filler,
	} from "chart.js";

	Chart.register(
		ScatterController,
		LinearScale,
		PointElement,
		LineElement,
		Tooltip,
		Legend,
		Title,
		Filler,
	);

	/** @type {{ series: Array<{ label: string, records: Array<[number, number]>, color: string, p00?: number|null, p100?: number|null, brand?: string, model?: string }>, zoomMode?: string, title?: string|null, envelopeMode?: boolean, envelopeGroups?: Array<{ key: string, label: string, color: string }> | null, envelopeRange?: string, chartLegend?: Array<{ label: string, color: string }> | null }} */
	let { series, zoomMode = "normal", title = null, envelopeMode = false, envelopeGroups = null, envelopeRange = "minmax", chartLegend = null } = $props();

	// Custom Chart.js plugin that draws a legend box inside the plot area
	// (bottom-right by default — pen data curves don't reach there).
	// Registered once below; its items come from options.plugins.groupLegend.items
	// set at buildChart time.
	const groupLegendPlugin = {
		id: "groupLegend",
		afterDatasetsDraw(chart) {
			const opts = chart.options.plugins && chart.options.plugins.groupLegend;
			if (!opts || !opts.items || opts.items.length === 0) return;
			const items = opts.items;
			const ctx = chart.ctx;
			const { right, bottom } = chart.chartArea;

			const padding = 10;
			const rowH = 18;
			const swatch = 12;
			const gap = 6;

			ctx.save();
			ctx.font = "12px 'Google Sans Flex', Arial, sans-serif";

			let maxW = 0;
			for (const it of items) {
				const w = ctx.measureText(it.label).width;
				if (w > maxW) maxW = w;
			}
			const boxW = padding * 2 + swatch + gap + maxW;
			const boxH = padding * 2 + items.length * rowH - (items.length > 0 ? (rowH - swatch) : 0);

			const boxX = right - boxW - 12;
			const boxY = bottom - boxH - 12;
			const r = 4;

			// Rounded background
			ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
			ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(boxX + r, boxY);
			ctx.lineTo(boxX + boxW - r, boxY);
			ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
			ctx.lineTo(boxX + boxW, boxY + boxH - r);
			ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
			ctx.lineTo(boxX + r, boxY + boxH);
			ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
			ctx.lineTo(boxX, boxY + r);
			ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();

			// Legend items
			ctx.textBaseline = "middle";
			for (let i = 0; i < items.length; i++) {
				const it = items[i];
				const y = boxY + padding + i * rowH + rowH / 2 - rowH / 2 + swatch / 2;
				const swatchY = boxY + padding + i * rowH;
				ctx.fillStyle = it.color;
				ctx.fillRect(boxX + padding, swatchY, swatch, swatch);
				ctx.strokeStyle = "rgba(0,0,0,0.15)";
				ctx.strokeRect(boxX + padding, swatchY, swatch, swatch);
				ctx.fillStyle = "#1a1a2e";
				ctx.fillText(it.label, boxX + padding + swatch + gap, swatchY + swatch / 2);
			}
			ctx.restore();
		},
	};

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

	function computeMedian(values) {
		const sorted = [...values].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 !== 0
			? sorted[mid]
			: (sorted[mid - 1] + sorted[mid]) / 2;
	}

	function hexToRgba(hex, alpha) {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r},${g},${b},${alpha})`;
	}

	function computePercentile(sorted, p) {
		const index = (p / 100) * (sorted.length - 1);
		const lo = Math.floor(index);
		const hi = Math.ceil(index);
		if (lo === hi) return sorted[lo];
		return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
	}

	function computeEnvelope(seriesSubset) {
		const LEVELS = [0, 1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99, 100];
		const lower = [];
		const upper = [];
		const median = [];
		const useP05P95 = envelopeRange === "p05p95";
		const useP25P75 = envelopeRange === "p25p75";

		// Exclude defective sessions from envelope computation
		const activeSubset = seriesSubset.filter((s) => !s.isDefective);

		for (const y of LEVELS) {
			const xs = [];
			for (const s of activeSubset) {
				for (const [rx, ry] of s.records) {
					if (Math.abs(ry - y) < 0.01) {
						xs.push(rx);
					}
				}
			}
			if (xs.length === 0) continue;
			const sorted = [...xs].sort((a, b) => a - b);
			if (useP25P75 && sorted.length >= 3) {
				lower.push({ x: computePercentile(sorted, 25), y });
				upper.push({ x: computePercentile(sorted, 75), y });
			} else if (useP05P95 && sorted.length >= 3) {
				lower.push({ x: computePercentile(sorted, 5), y });
				upper.push({ x: computePercentile(sorted, 95), y });
			} else {
				lower.push({ x: sorted[0], y });
				upper.push({ x: sorted[sorted.length - 1], y });
			}
			median.push({ x: computeMedian(xs), y });
		}

		// Enforce monotonically non-decreasing X for both boundaries.
		// Missing data at certain Y levels (e.g. no P99) can cause the
		// boundary to dip backwards; carry forward the previous max/min.
		for (let i = 1; i < upper.length; i++) {
			if (upper[i].x < upper[i - 1].x) {
				upper[i] = { x: upper[i - 1].x, y: upper[i].y };
			}
		}
		for (let i = 1; i < lower.length; i++) {
			if (lower[i].x < lower[i - 1].x) {
				lower[i] = { x: lower[i - 1].x, y: lower[i].y };
			}
		}

		// Close the gaps at Y=0 and Y=100 so the fill covers the full area.
		// Both arrays must stay the same length for fill: '+1' index alignment.
		if (lower.length > 0 && upper.length > 0) {
			const firstLower = lower[0];
			const firstUpper = upper[0];
			if (firstLower.y === 0 && firstUpper.y === 0 && firstLower.x < firstUpper.x) {
				upper.unshift({ x: firstLower.x, y: 0 });
				lower.unshift({ x: firstLower.x, y: 0 });
			}
			const lastLower = lower[lower.length - 1];
			const lastUpper = upper[upper.length - 1];
			if (lastLower.y === 100 && lastUpper.y === 100 && lastUpper.x > lastLower.x) {
				lower.push({ x: lastUpper.x, y: 100 });
				upper.push({ x: lastUpper.x, y: 100 });
			}
		}

		return { lower, upper, median };
	}

	function envelopeDatasetsForColor(lower, upper, median, color, labelPrefix) {
		return [
			{
				label: `${labelPrefix} Min`,
				data: lower,
				showLine: true,
				tension: 0,
				borderColor: hexToRgba(color, 0.3),
				backgroundColor: hexToRgba(color, 0.12),
				borderWidth: 1,
				pointRadius: 0,
				fill: "+1",
				order: 2,
			},
			{
				label: `${labelPrefix} Max`,
				data: upper,
				showLine: true,
				tension: 0,
				borderColor: hexToRgba(color, 0.3),
				backgroundColor: "transparent",
				borderWidth: 1,
				pointRadius: 0,
				fill: false,
				order: 2,
			},
			{
				label: `${labelPrefix} Median`,
				data: median,
				showLine: true,
				tension: 0,
				borderColor: color,
				backgroundColor: color,
				borderWidth: 2.5,
				pointRadius: 0,
				pointHoverRadius: 4,
				fill: false,
				order: 1,
			},
		];
	}

	function buildEnvelopeDatasets() {
		if (envelopeGroups && envelopeGroups.length > 0) {
			const datasets = [];
			for (const group of envelopeGroups) {
				const subset = series.filter((s) => {
					if (group.field === "_groupId") return s._groupId === group.key;
					if (group.field === "penfamily") return s.penfamily === group.key;
					return `${s.brand}||${s.model}` === group.key;
				});
				if (subset.length === 0) continue;
				const { lower, upper, median } = computeEnvelope(subset);
				datasets.push(
					...envelopeDatasetsForColor(lower, upper, median, group.color, group.label),
				);
			}
			return datasets;
		}

		// Single envelope (ungrouped)
		const { lower, upper, median } = computeEnvelope(series);
		return envelopeDatasetsForColor(lower, upper, median, "#4a6fa5", "");
	}

	function buildChart() {
		if (chart) chart.destroy();

		const { xMin, xMax, yMin, yMax } = getAxisLimits();
		const isIAF = zoomMode === "iaf";

		const datasets = [];

		if (envelopeMode && series.length > 0) {
			datasets.push(...buildEnvelopeDatasets());
		} else {
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
					pointRadius: 0,
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
		}

		chart = new Chart(canvas, {
			type: "scatter",
			data: { datasets },
			plugins: [groupLegendPlugin],
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
					groupLegend: {
						items: chartLegend || [],
					},
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
		envelopeMode;
		envelopeGroups;
		envelopeRange;
		chartLegend;
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
