<script>
	import { onMount } from "svelte";
	import { base } from "$app/paths";
	import { allSessions, penFamilies, familyInfoMap, allKnownTags } from "$lib/data.js";
	import { resolveGroupSessions, findOverlaps } from "$lib/compare.svelte.js";
	import PressureChart from "$lib/components/PressureChart.svelte";
	import ZoomSelect from "$lib/components/ZoomSelect.svelte";
	import EstimatesSelect from "$lib/components/EstimatesSelect.svelte";
	import ChartLegendTable from "$lib/components/ChartLegendTable.svelte";
	import ModelStats from "$lib/components/ModelStats.svelte";

	const COLORS = ["#4a6fa5","#e94560","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e74c3c","#3498db","#e67e22","#8e44ad"];

	const penOpts = (() => { const s = new Set(); return allSessions.filter(x => { if (s.has(x.inventoryid)) return false; s.add(x.inventoryid); return true; }).map(x => ({ v: x.inventoryid, l: `${x.inventoryid} (${x.brand} / ${x.pen})` })).sort((a,b) => a.v.localeCompare(b.v)); })();
	const modelOpts = (() => { const s = new Set(); return allSessions.filter(x => { const k = `${x.brand}||${x.pen}`; if (s.has(k)) return false; s.add(k); return true; }).map(x => ({ v: `${x.brand}||${x.pen}`, l: `${x.brand} / ${x.pen}` })).sort((a,b) => a.l.localeCompare(b.l)); })();
	const famOpts = penFamilies.map(f => ({ v: f.familyId, l: f.familyName }));
	const tagOpts = allKnownTags.map(t => ({ v: t, l: t }));
	function optsFor(type) { return type === "pen" ? penOpts : type === "model" ? modelOpts : type === "family" ? famOpts : type === "tag" ? tagOpts : []; }
	function fmtItem(item) { if (item.type === "model") { const p = item.value.split("||"); return `${p[0]} / ${p[1]}`; } if (item.type === "family") return familyInfoMap[item.value]?.familyName || item.value; return item.value; }

	// Groups include transient _addType/_addValue for the add-item form
	let groups = $state([]);
	let showEstimates = $state("estimates");
	let zoom = $state("normal");
	let envelopeRange = $state("minmax");
	let chartRef = $state(null);
	let hiddenLabels = $state(new Set());
	let defaultsApplied = $state(false);

	const SK = "compareGroups";
	const SK_SAVED = "compareSavedViews"; // { [name]: groups[] }
	let savedViews = $state({}); // name -> groups[]

	onMount(() => {
		try { const r = localStorage.getItem(SK); if (r) { const parsed = JSON.parse(r); groups = parsed.map(g => ({ ...g, _addType: "model", _addValue: "" })); } } catch {}
		try { const r = localStorage.getItem(SK_SAVED); if (r) savedViews = JSON.parse(r); } catch {}
	});
	function persist() { if (typeof window !== "undefined") localStorage.setItem(SK, JSON.stringify(groups.map(({ _addType, _addValue, ...rest }) => rest))); }
	function persistSaved() { if (typeof window !== "undefined") localStorage.setItem(SK_SAVED, JSON.stringify(savedViews)); }

	function saveCurrentView() {
		const name = (typeof window !== "undefined" ? window.prompt("Name this comparison view:", "") : null);
		if (!name) return;
		const trimmed = name.trim();
		if (!trimmed) return;
		if (savedViews[trimmed] && !window.confirm(`Overwrite existing saved view "${trimmed}"?`)) return;
		// Snapshot current groups (strip transient UI state)
		const snapshot = groups.map(({ _addType, _addValue, ...rest }) => ({ ...rest, items: [...rest.items] }));
		savedViews = { ...savedViews, [trimmed]: snapshot };
		persistSaved();
	}

	function loadSavedView(name) {
		const snap = savedViews[name];
		if (!snap) return;
		groups = snap.map(g => ({ ...g, items: [...g.items], _addType: "model", _addValue: "" }));
		persist();
	}

	function deleteSavedView(name) {
		if (!window.confirm(`Delete saved view "${name}"?`)) return;
		const next = { ...savedViews };
		delete next[name];
		savedViews = next;
		persistSaved();
	}

	let savedViewNames = $derived(Object.keys(savedViews).sort((a, b) => a.localeCompare(b)));

	function addGroup() { groups = [...groups, { id: `g_${Date.now()}`, name: `Group ${groups.length + 1}`, items: [], _addType: "model", _addValue: "" }]; persist(); }
	function rmGroup(id) { groups = groups.filter(g => g.id !== id); persist(); }
	function renGroup(id, n) { groups = groups.map(g => g.id === id ? { ...g, name: n } : g); persist(); }
	function addItem(gi) {
		const g = groups[gi];
		if (!g._addValue) return;
		if (g.items.some(i => i.type === g._addType && i.value === g._addValue)) return;
		groups[gi] = { ...g, items: [...g.items, { type: g._addType, value: g._addValue }], _addValue: "" };
		groups = [...groups];
		persist();
	}
	function rmItem(gi, type, value) {
		const g = groups[gi];
		groups[gi] = { ...g, items: g.items.filter(i => !(i.type === type && i.value === value)) };
		groups = [...groups];
		persist();
	}
	function clearAll() { groups = []; persist(); }

	let gSess = $derived(groups.map(g => ({ g, ss: resolveGroupSessions(g, allSessions) })));
	let allMatch = $derived((() => { const seen = new Set(), r = []; for (const { ss } of gSess) for (const s of ss) if (!seen.has(s.sessionId)) { seen.add(s.sessionId); r.push(s); } return r; })());
	let overlaps = $derived(findOverlaps(groups, allSessions));

	let allSeries = $derived((() => {
		const r = [];
		for (let i = 0; i < gSess.length; i++) {
			const { g, ss } = gSess[i]; const c = COLORS[i % COLORS.length];
			for (const s of ss) r.push({ label: `${g.name}: ${s.brand} / ${s.pen} / ${s.inventoryid} ${s.date}`, records: s.records, color: c, inventoryid: s.inventoryid, date: s.date, brand: s.brand, model: s.pen, penfamily: s.penfamily, defects: s.defects, isDefective: s.isDefective, _groupId: g.id, ...s.pValues });
		}
		return r;
	})());

	let envGroups = $derived(showEstimates === "envelope" && groups.length > 0 ? groups.map((g, i) => ({ key: g.id, field: "_groupId", label: g.name, color: COLORS[i % COLORS.length] })) : null);

	// Hide defective sessions by default on chart (still listed in legend with ⚠)
	$effect(() => {
		if (defaultsApplied || allSeries.length === 0) return;
		hiddenLabels = new Set(allSeries.filter((s) => s.isDefective).map((s) => s.label));
		defaultsApplied = true;
	});

	function doExport(a) { if (a === "copy-chart") chartRef?.copyChart(); else if (a === "export-png") chartRef?.exportPng(); else if (a === "copy-data") chartRef?.copyData(); else if (a === "export-data") chartRef?.exportData(); }
	function toggleS(l) { const n = new Set(hiddenLabels); if (n.has(l)) n.delete(l); else n.add(l); hiddenLabels = n; }
	function stdRec(s) { return [[s.p00,0],[s.p01,1],[s.p05,5],[s.p10,10],[s.p20,20],[s.p25,25],[s.p30,30],[s.p40,40],[s.p50,50],[s.p60,60],[s.p70,70],[s.p75,75],[s.p80,80],[s.p90,90],[s.p95,95],[s.p99,99],[s.p100,100]].filter(([x]) => x != null); }
	let visSeries = $derived(allSeries.filter(s => !hiddenLabels.has(s.label)).map(s => {
		if (showEstimates === "standardized" || showEstimates === "envelope") return { ...s, records: stdRec(s), p00: null, p100: null };
		return { ...s, p00: showEstimates === "estimates" ? s.p00 : null, p100: showEstimates === "estimates" ? s.p100 : null };
	}));
</script>

<div class="cp">
	<div class="hdr">
		<h2>Compare</h2>
		<div class="acts">
			<button class="abtn" onclick={addGroup}>+ Add group</button>
			{#if groups.length > 0}
				<button class="sbtn" onclick={saveCurrentView}>Save as…</button>
			{/if}
			{#if savedViewNames.length > 0}
				<select class="lsel" onchange={(e) => { const v = e.currentTarget.value; e.currentTarget.value = ""; if (v) loadSavedView(v); }}>
					<option value="">Load saved view…</option>
					{#each savedViewNames as name}
						<option value={name}>{name}</option>
					{/each}
				</select>
				<select class="lsel" onchange={(e) => { const v = e.currentTarget.value; e.currentTarget.value = ""; if (v) deleteSavedView(v); }}>
					<option value="">Delete saved view…</option>
					{#each savedViewNames as name}
						<option value={name}>{name}</option>
					{/each}
				</select>
			{/if}
			{#if groups.length > 0}<button class="cbtn" onclick={clearAll}>Clear all</button>{/if}
		</div>
	</div>

	{#if overlaps.length > 0}
		<div class="warn">Overlap: {overlaps.map(o => `${o.inventoryid} (in ${o.groupNames.join(", ")})`).join("; ")}</div>
	{/if}

	{#if groups.length > 0}
		<div class="cards">
			{#each groups as group, gi (group.id)}
				<div class="card" style="border-left-color:{COLORS[gi % COLORS.length]}">
					<div class="chdr">
						<span class="dot" style="background:{COLORS[gi % COLORS.length]}"></span>
						<input class="nin" type="text" value={group.name} onchange={e => renGroup(group.id, e.currentTarget.value)} />
						<span class="scnt">{gSess[gi]?.ss.length || 0} sessions</span>
						<button class="xb" onclick={() => rmGroup(group.id)}>&times;</button>
					</div>
					{#if group.items.length > 0}
						<div class="pills">
							{#each group.items as item}
								<span class="pill"><span class="pty">{item.type}</span>{fmtItem(item)}<button class="prm" onclick={() => rmItem(gi, item.type, item.value)}>&times;</button></span>
							{/each}
						</div>
					{/if}
					<div class="arow">
						<select bind:value={groups[gi]._addType} onchange={() => { groups[gi]._addValue = ""; }}>
							<option value="pen">Pen</option><option value="model">Model</option><option value="family">Family</option><option value="tag">Tag</option>
						</select>
						<select class="aval" bind:value={groups[gi]._addValue}>
							<option value="">Select...</option>
							{#each optsFor(groups[gi]._addType) as o}<option value={o.v}>{o.l}</option>{/each}
						</select>
						<button class="addb" onclick={() => addItem(gi)} disabled={!groups[gi]._addValue}>Add</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if allMatch.length > 0}
		<ModelStats sessions={allMatch} />
		<div class="chart-area">
			<div class="chdr2">
				<h2>Pressure Response</h2>
				<ZoomSelect bind:value={zoom} />
				<EstimatesSelect bind:value={showEstimates} />
				{#if showEstimates === "envelope"}
					<select class="rsel" bind:value={envelopeRange}>
						<option value="minmax">Range: Min/Max</option><option value="p05p95">Range: P05/P95</option><option value="p25p75">Range: P25/P75</option>
					</select>
				{/if}
				<select class="esel" onchange={e => { doExport(e.currentTarget.value); e.currentTarget.value = ""; }}>
					<option value="">Export &#x25BE;</option><option value="copy-chart">Copy chart</option><option value="export-png">Export chart as PNG</option><option value="copy-data">Copy data</option><option value="export-data">Export chart data</option>
				</select>
			</div>
			<PressureChart bind:this={chartRef} series={visSeries} zoomMode={zoom} envelopeMode={showEstimates === "envelope"} envelopeGroups={envGroups} {envelopeRange} title="Compare" />
		</div>
		<ChartLegendTable series={allSeries} {hiddenLabels} {showEstimates} showBrand={true} showInventoryId={true} onToggleSeries={toggleS} />
	{:else if groups.length > 0}
		<p class="emsg">Add items to your groups to see pressure response data.</p>
	{:else}
		<div class="empty"><p>Create groups and add pens, models, families, or tags to compare.</p><p>Click <strong>+ Add group</strong> to get started.</p></div>
	{/if}
</div>

<style>
	.cp { max-width: 100%; }
	.hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
	.hdr h2 { font-size: 1.1rem; font-weight: 600; margin: 0; color: #1a1a2e; }
	.acts { display: flex; gap: 0.5rem; }
	.abtn { font-size: 0.8rem; color: #fff; background: #4a6fa5; border: none; border-radius: 4px; padding: 0.35rem 0.75rem; cursor: pointer; }
	.abtn:hover { background: #3a5f95; }
	.cbtn { font-size: 0.8rem; color: #e94560; background: none; border: 1px solid #e94560; border-radius: 4px; padding: 0.3rem 0.75rem; cursor: pointer; }
	.cbtn:hover { background: #e94560; color: #fff; }
	.sbtn { font-size: 0.8rem; color: #4a6fa5; background: #fff; border: 1px solid #4a6fa5; border-radius: 4px; padding: 0.3rem 0.75rem; cursor: pointer; }
	.sbtn:hover { background: #4a6fa5; color: #fff; }
	.lsel { font-size: 0.8rem; color: #444; border: 1px solid #ccc; border-radius: 4px; padding: 0.3rem 0.5rem; cursor: pointer; }
	.warn { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 0.5rem 0.75rem; font-size: 0.8rem; color: #856404; margin-bottom: 1rem; }
	.cards { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
	.card { flex: 1; min-width: 280px; max-width: 450px; border: 1px solid #ddd; border-left: 4px solid; border-radius: 6px; padding: 0.75rem; background: #fcfcfc; }
	.chdr { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
	.dot { width: 12px; height: 12px; border-radius: 2px; flex-shrink: 0; }
	.nin { flex: 1; font-size: 0.9rem; font-weight: 600; border: 1px solid transparent; border-radius: 3px; padding: 0.15rem 0.3rem; background: transparent; color: #1a1a2e; }
	.nin:hover, .nin:focus { border-color: #ccc; background: #fff; outline: none; }
	.scnt { font-size: 0.75rem; color: #888; white-space: nowrap; }
	.xb { background: none; border: none; color: #999; cursor: pointer; font-size: 1.1rem; line-height: 1; }
	.xb:hover { color: #e94560; }
	.pills { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.5rem; }
	.pill { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; background: #f0f0f0; border: 1px solid #ddd; border-radius: 10px; padding: 0.1rem 0.4rem; }
	.pty { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: #fff; background: #888; border-radius: 3px; padding: 0 0.25rem; }
	.prm { background: none; border: none; color: #999; cursor: pointer; font-size: 0.8rem; line-height: 1; padding: 0; }
	.prm:hover { color: #e94560; }
	.arow { display: flex; gap: 0.3rem; align-items: center; }
	.arow select { font-size: 0.75rem; padding: 0.2rem 0.3rem; border: 1px solid #ccc; border-radius: 3px; }
	.aval { flex: 1; min-width: 0; }
	.addb { font-size: 0.75rem; padding: 0.2rem 0.5rem; border: 1px solid #4a6fa5; border-radius: 3px; background: #4a6fa5; color: #fff; cursor: pointer; }
	.addb:disabled { opacity: 0.4; cursor: default; }
	.addb:hover:not(:disabled) { background: #3a5f95; }
	.chart-area { height: 480px; display: flex; flex-direction: column; margin-bottom: 1.5rem; }
	.chart-area :global(.chart-wrap) { flex: 1; }
	.chdr2 { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
	.chdr2 h2 { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin: 0; }
	.rsel, .esel { font-size: 0.8rem; color: #444; border: 1px solid #ccc; border-radius: 4px; padding: 0.2rem 0.4rem; cursor: pointer; }
	.esel { margin-left: auto; }
	.empty { text-align: center; padding: 3rem 1rem; color: #666; }
	.emsg { color: #666; font-size: 0.9rem; text-align: center; padding: 2rem 0; }
</style>
