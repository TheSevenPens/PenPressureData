<script>
	import { onMount } from "svelte";
	import { base } from "$app/paths";
	import { allSessions, penFamilies, familyInfoMap, allKnownTags } from "$lib/data.js";
	import { resolveGroupSessions, findOverlaps } from "$lib/compare.svelte.js";
	import { getFlaggedPens, getFlaggedModels, getFlaggedFamilies } from "$lib/flagged.svelte.js";
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

	// ---- Empty-state accelerators ----

	// Count of flagged items (drives banner visibility)
	let flaggedCount = $derived(
		getFlaggedPens().size + getFlaggedModels().size + getFlaggedFamilies().size,
	);

	function importFlagged() {
		const newGroups = [];

		// Each flagged family → its own group
		for (const familyId of getFlaggedFamilies()) {
			const info = familyInfoMap[familyId];
			newGroups.push({
				id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
				name: info?.familyName || familyId,
				items: [{ type: "family", value: familyId }],
				_addType: "model",
				_addValue: "",
			});
		}

		// Each flagged model → its own group
		for (const key of getFlaggedModels()) {
			const [brand, model] = key.split("||");
			newGroups.push({
				id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
				name: `${brand} / ${model}`,
				items: [{ type: "model", value: key }],
				_addType: "model",
				_addValue: "",
			});
		}

		// All flagged individual pens → single group
		const pens = [...getFlaggedPens()];
		if (pens.length > 0) {
			newGroups.push({
				id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
				name: "Individual pens",
				items: pens.map((p) => ({ type: "pen", value: p })),
				_addType: "model",
				_addValue: "",
			});
		}

		groups = [...groups, ...newGroups];
		persist();
	}

	// Quick-start presets: each entry is { id, title, description, groups[] }
	// groups[] entries omit IDs/transient state — filled in by applyQuickStart.
	const quickStarts = [
		{
			id: "wacom-one-gens",
			title: "Wacom One: Gen1 vs Gen2",
			description: "Compare the two generations of Wacom One pens.",
			groups: [
				{ name: "Wacom One Gen1", items: [{ type: "family", value: "Wacom_OneGen1" }] },
				{ name: "Wacom One Gen2", items: [{ type: "family", value: "Wacom_OneGen2" }] },
			],
		},
		{
			id: "wacom-kp-gens",
			title: "Wacom KP generations",
			description: "Trace the evolution of the Wacom KP pen series across three generations.",
			groups: [
				{ name: "KP GEN1", items: [{ type: "family", value: "Wacom_KPGEN1" }] },
				{ name: "KP GEN2", items: [{ type: "family", value: "Wacom_KPGEN2" }] },
				{ name: "KP GEN3", items: [{ type: "family", value: "Wacom_KPGEN3" }] },
			],
		},
		{
			id: "udemr-brands",
			title: "UD-EMR pens across brands",
			description: "Compare pens using the UD-EMR standard (Wacom One, Samsung S Pen, etc.), one group per brand.",
			groups: [
				{ name: "Wacom (UD-EMR)", items: [
					{ type: "model", value: "WACOM||CP-913" },
					{ type: "model", value: "WACOM||CP-923" },
				]},
				{ name: "Samsung (UD-EMR)", items: [
					{ type: "model", value: "SAMSUNG||SPEN" },
					{ type: "model", value: "SAMSUNG||SPENCREATOR" },
				]},
			],
		},
		{
			id: "flagship-brands",
			title: "Flagships: Wacom KP GEN2 vs Huion PW600 vs XP-Pen X3 Pro",
			description: "Compare three top-tier pen series across Wacom, Huion, and XP-Pen.",
			groups: [
				{ name: "Wacom KP GEN2", items: [{ type: "family", value: "Wacom_KPGEN2" }] },
				{ name: "Huion PW600 series", items: [{ type: "family", value: "Huion_PW600" }] },
				{ name: "XP-Pen X3 Pro series", items: [{ type: "family", value: "XPPen_X3Pro" }] },
			],
		},
		{
			id: "xppen-x3pro-vs-elite",
			title: "XP-Pen X3 Pro series vs X3 Elite",
			description: "Compare the X3 Pro family against the standalone X3 Elite model.",
			groups: [
				{ name: "X3 Pro series", items: [{ type: "family", value: "XPPen_X3Pro" }] },
				{ name: "X3 Elite", items: [{ type: "model", value: "XPPEN||X3ELITE" }] },
			],
		},
		{
			id: "huion-pw517-vs-pw550",
			title: "Huion PW517 vs PW550 series",
			description: "Compare the Huion PW517 model against the PW550 family.",
			groups: [
				{ name: "PW517", items: [{ type: "model", value: "HUION||PW517" }] },
				{ name: "PW550 series", items: [{ type: "family", value: "Huion_PW550" }] },
			],
		},
		{
			id: "huion-pw600-vs-pw550",
			title: "Huion PW600 series vs PW550 series",
			description: "Compare the two recent Huion pen series head-to-head.",
			groups: [
				{ name: "PW600 series", items: [{ type: "family", value: "Huion_PW600" }] },
				{ name: "PW550 series", items: [{ type: "family", value: "Huion_PW550" }] },
			],
		},
		{
			id: "xencelabs-v2-vs-x3pro",
			title: "Xencelabs V2 series vs XP-Pen X3 Pro series",
			description: "Compare Xencelabs V2 pens (3-Button V2 and Thin V2) against the XP-Pen X3 Pro family.",
			groups: [
				{ name: "Xencelabs V2 series", items: [
					{ type: "model", value: "XENCELABS||3BUTTONV2" },
					{ type: "model", value: "XENCELABS||THINV2" },
				]},
				{ name: "XP-Pen X3 Pro series", items: [{ type: "family", value: "XPPen_X3Pro" }] },
			],
		},
	];

	function applyQuickStart(qs) {
		const newGroups = qs.groups.map((g, i) => ({
			id: `g_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
			name: g.name,
			items: [...g.items],
			_addType: "model",
			_addValue: "",
		}));
		groups = [...groups, ...newGroups];
		persist();
	}

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
		<div class="stats-row">
			{#each gSess as gs, gi (gs.g.id)}
				{#if gs.ss.length > 0}
					<ModelStats sessions={gs.ss} title={gs.g.name} color={COLORS[gi % COLORS.length]} />
				{/if}
			{/each}
		</div>
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
		<div class="empty">
			<p class="eheading">Nothing to compare yet.</p>

			{#if flaggedCount > 0}
				<div class="flagged-banner">
					<div>
						<strong>You have {flaggedCount} flagged item{flaggedCount === 1 ? "" : "s"}.</strong>
						<span class="sub">Import them as groups to get started.</span>
					</div>
					<button class="impbtn" onclick={importFlagged}>Import my flagged items →</button>
				</div>
			{/if}

			<p class="qs-heading">{flaggedCount > 0 ? "Or try" : "Try"} a quick start:</p>
			<ul class="qs-list">
				{#each quickStarts as qs}
					<li>
						<button class="qs-btn" onclick={() => applyQuickStart(qs)}>
							<span class="qs-title">{qs.title}</span>
							<span class="qs-desc">{qs.description}</span>
						</button>
					</li>
				{/each}
			</ul>

			<p class="hint">You can also click <strong>+ Add group</strong> above to build a comparison from scratch.</p>
		</div>
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
	.stats-row { display: flex; flex-wrap: wrap; gap: 1.5rem 2rem; margin-bottom: 1.5rem; }
	.stats-row :global(.stats-container) { margin-bottom: 0; }
	.chart-area { height: 480px; display: flex; flex-direction: column; margin-bottom: 1.5rem; }
	.chart-area :global(.chart-wrap) { flex: 1; }
	.chdr2 { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
	.chdr2 h2 { font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin: 0; }
	.rsel, .esel { font-size: 0.8rem; color: #444; border: 1px solid #ccc; border-radius: 4px; padding: 0.2rem 0.4rem; cursor: pointer; }
	.esel { margin-left: auto; }
	.empty { padding: 2rem 1rem; color: #555; max-width: 680px; margin: 0 auto; }
	.eheading { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin: 0 0 1rem 0; text-align: center; }

	.flagged-banner {
		display: flex; align-items: center; justify-content: space-between; gap: 1rem;
		background: #eef4ff; border: 1px solid #b9c9e8; border-radius: 6px;
		padding: 0.9rem 1rem; margin-bottom: 1.5rem; font-size: 0.9rem;
	}
	.flagged-banner .sub { color: #666; margin-left: 0.4rem; }
	.impbtn {
		font-size: 0.85rem; color: #fff; background: #4a6fa5; border: none;
		border-radius: 4px; padding: 0.45rem 0.9rem; cursor: pointer; white-space: nowrap;
	}
	.impbtn:hover { background: #3a5f95; }

	.qs-heading { font-size: 0.85rem; color: #666; margin: 1rem 0 0.5rem 0; text-transform: uppercase; letter-spacing: 0.5px; }
	.qs-list { list-style: none; padding: 0; margin: 0 0 1.5rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
	.qs-btn {
		width: 100%; text-align: left; padding: 0.75rem 1rem;
		background: #fcfcfc; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;
		display: flex; flex-direction: column; gap: 0.2rem;
	}
	.qs-btn:hover { background: #f5f5f5; border-color: #4a6fa5; }
	.qs-title { font-size: 0.9rem; font-weight: 600; color: #1a1a2e; }
	.qs-desc { font-size: 0.8rem; color: #666; }

	.hint { font-size: 0.8rem; color: #888; text-align: center; margin: 1rem 0 0 0; }
	.emsg { color: #666; font-size: 0.9rem; text-align: center; padding: 2rem 0; }
</style>
