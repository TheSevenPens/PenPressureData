<script>
    import { base } from "$app/paths";
    import { fmtP } from "$lib/interpolate.js";

    /**
     * @typedef {Object} SeriesData
     * @property {string} label
     * @property {string} color
     * @property {string} date
     * @property {string} [inventoryid]
     * @property {number|null} [p00]
     * @property {number|null} [p01]
     * @property {number|null} [p05]
     * @property {number|null} [p10]
     * @property {number|null} [p20]
     * @property {number|null} [p25]
     * @property {number|null} [p30]
     * @property {number|null} [p40]
     * @property {number|null} [p50]
     * @property {number|null} [p60]
     * @property {number|null} [p70]
     * @property {number|null} [p75]
     * @property {number|null} [p80]
     * @property {number|null} [p90]
     * @property {number|null} [p95]
     * @property {number|null} [p99]
     * @property {number|null} [p100]
     */

    /**
     * @type {{
     *   series: SeriesData[],
     *   hiddenLabels: Set<string>,
     *   showEstimates: string,
     *   brand: string,
     *   model: string,
     *   showInventoryId?: boolean,
     *   onToggleSeries: (label: string) => void
     * }}
     */
    let {
        series,
        hiddenLabels,
        showEstimates,
        brand = "",
        model = "",
        showInventoryId = false,
        showBrand = false,
        onToggleSeries,
    } = $props();

    // Whether any series has defects — used to decide if a defects column is rendered
    let anyDefects = $derived(series.some((s) => s.defects?.length > 0));

    function defectTitle(s) {
        if (!s.defects?.length) return "";
        return s.defects.map((d) => d.Notes ? `${d.Kind}: ${d.Notes}` : d.Kind).join(" | ");
    }
</script>

<table class="legend-table">
    <thead>
        <tr>
            <th class="centered">Show</th>
            <th></th>
            {#if anyDefects}<th class="centered" title="Defect">&#9888;</th>{/if}
            {#if showBrand}
                <th>Brand</th>
                <th>Model</th>
            {/if}
            {#if showInventoryId || showBrand}
                <th>Inventory ID</th>
            {/if}
            <th>Date</th>
            {#if showEstimates !== "raw"}<th class="right">P00</th>{/if}
            <th class="right">P01</th>
            <th class="right">P05</th>
            <th class="right">P10</th>
            <th class="right">P20</th>
            <th class="right">P25</th>
            <th class="right">P30</th>
            <th class="right">P40</th>
            <th class="right">P50</th>
            <th class="right">P60</th>
            <th class="right">P70</th>
            <th class="right">P75</th>
            <th class="right">P80</th>
            <th class="right">P90</th>
            <th class="right">P95</th>
            <th class="right">P99</th>
            {#if showEstimates !== "raw"}<th class="right">P100</th>{/if}
        </tr>
    </thead>
    <tbody>
        {#each series as s}
            <tr class:dimmed={hiddenLabels.has(s.label)}>
                <td class="centered">
                    <input
                        type="checkbox"
                        checked={!hiddenLabels.has(s.label)}
                        onchange={() => onToggleSeries(s.label)}
                    />
                </td>
                <td>
                    <span class="swatch" style="background: {s.color}"></span>
                </td>
                {#if anyDefects}
                    <td class="centered">
                        {#if s.defects?.length}
                            <span class="defect-icon" title={defectTitle(s)}>&#9888;</span>
                        {/if}
                    </td>
                {/if}
                {#if showBrand}
                    <td>{s.brand}</td>
                    <td>
                        <a
                            href="{base}/details/{encodeURIComponent(
                                s.brand,
                            )}/{encodeURIComponent(s.model)}"
                            >{s.model}</a
                        >
                    </td>
                    <td class="mono">
                        <a
                            href="{base}/details/{encodeURIComponent(
                                s.brand,
                            )}/{encodeURIComponent(s.model)}/{s.inventoryid}"
                            >{s.inventoryid}</a
                        >
                    </td>
                {:else if showInventoryId}
                    <td class="mono">
                        <a
                            href="{base}/details/{encodeURIComponent(
                                brand,
                            )}/{encodeURIComponent(model)}/{s.inventoryid}"
                            >{s.inventoryid}</a
                        >
                    </td>
                {/if}
                <td class="mono">
                    <a
                        href="{base}/details/{encodeURIComponent(
                            showBrand ? s.brand : brand,
                        )}/{encodeURIComponent(showBrand ? s.model : model)}/{showInventoryId || showBrand
                            ? s.inventoryid
                            : s.label.split(' ')[0]}/{s.date}">{s.date}</a
                    >
                </td>
                {#if showEstimates !== "raw"}<td class="mono right"
                        >{fmtP(s.p00)}</td
                    >{/if}
                <td class="mono right">{fmtP(s.p01)}</td>
                <td class="mono right">{fmtP(s.p05)}</td>
                <td class="mono right">{fmtP(s.p10)}</td>
                <td class="mono right">{fmtP(s.p20)}</td>
                <td class="mono right">{fmtP(s.p25)}</td>
                <td class="mono right">{fmtP(s.p30)}</td>
                <td class="mono right">{fmtP(s.p40)}</td>
                <td class="mono right">{fmtP(s.p50)}</td>
                <td class="mono right">{fmtP(s.p60)}</td>
                <td class="mono right">{fmtP(s.p70)}</td>
                <td class="mono right">{fmtP(s.p75)}</td>
                <td class="mono right">{fmtP(s.p80)}</td>
                <td class="mono right">{fmtP(s.p90)}</td>
                <td class="mono right">{fmtP(s.p95)}</td>
                <td class="mono right">{fmtP(s.p99)}</td>
                {#if showEstimates !== "raw"}<td class="mono right"
                        >{fmtP(s.p100)}</td
                    >{/if}
            </tr>
        {/each}
    </tbody>
</table>

<style>
    .legend-table {
        border-collapse: collapse;
        font-size: 0.8rem;
        width: 100%;
    }

    .legend-table thead th {
        background: #f0f0f0;
        padding: 0.2rem 0.4rem;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
        white-space: nowrap;
    }
    .legend-table thead th.centered {
        text-align: center;
    }
    .legend-table thead th.right {
        text-align: right;
    }

    .legend-table tbody td {
        padding: 0.15rem 0.4rem;
        border-bottom: 1px solid #eee;
    }
    .legend-table tbody tr.dimmed td {
        opacity: 0.4;
    }

    .swatch {
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 2px;
        vertical-align: middle;
    }

    .mono {
        font-family: monospace;
    }
    .centered {
        text-align: center;
    }
    .right {
        text-align: right;
    }

    .defect-icon {
        color: #c0922a;
        cursor: help;
        font-size: 1rem;
    }
</style>
