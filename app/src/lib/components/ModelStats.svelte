<script>
    import { fmtP } from "$lib/interpolate.js";

    /**
     * @type {{
     *   sessions: Array<{ pValues: Record<string, number|null>, defects?: Array<{Kind: string, Notes: string}>, isDefective?: boolean, inventoryid?: string }>,
     *   title?: string,
     *   color?: string | null
     * }}
     */
    let { sessions, title = "Aggregated Stats", color = null } = $props();

    // Split into included (non-defective) and excluded (defective)
    let includedSessions = $derived(sessions.filter((s) => !s.isDefective));
    let excludedSessions = $derived(sessions.filter((s) => s.isDefective));

    // Deduplicate excluded pens by inventoryid (a pen might have multiple sessions)
    let excludedPens = $derived(
        (() => {
            const seen = new Map();
            for (const s of excludedSessions) {
                if (!seen.has(s.inventoryid)) {
                    seen.set(s.inventoryid, {
                        inventoryid: s.inventoryid,
                        kinds: (s.defects || []).map((d) => d.Kind),
                    });
                }
            }
            return [...seen.values()];
        })(),
    );

    function calcStats(pKey) {
        const values = includedSessions
            .map((s) => (s.pValues ? s.pValues[pKey] : null))
            .filter((v) => v !== null)
            .sort((a, b) => a - b);

        if (values.length === 0) {
            return { min: null, max: null, median: null };
        }

        const min = values[0];
        const max = values[values.length - 1];

        const mid = Math.floor(values.length / 2);
        const median =
            values.length % 2 === 0
                ? (values[mid - 1] + values[mid]) / 2
                : values[mid];

        return { min, max, median };
    }

    const marksToCalculate = [
        { label: "P00", key: "p00" },
        { label: "P25", key: "p25" },
        { label: "P50", key: "p50" },
        { label: "P75", key: "p75" },
        { label: "P100", key: "p100" },
    ];

    let stats = $derived(
        marksToCalculate.map((m) => ({
            label: m.label,
            ...calcStats(m.key),
        })),
    );
</script>

<div class="stats-container">
    <h2>
        {#if color}<span class="group-dot" style="background: {color}"></span>{/if}
        {title}
    </h2>
    <table class="stats-table">
        <thead>
            <tr>
                <th class="label-col">Mark</th>
                <th class="num">Min<br /><span class="unit">(gf)</span></th>
                <th class="num">Median<br /><span class="unit">(gf)</span></th>
                <th class="num">Max<br /><span class="unit">(gf)</span></th>
            </tr>
        </thead>
        <tbody>
            {#each stats as stat}
                <tr>
                    <td class="label-col mono"><strong>{stat.label}</strong></td
                    >
                    <td class="num">{fmtP(stat.min)}</td>
                    <td class="num">{fmtP(stat.median)}</td>
                    <td class="num">{fmtP(stat.max)}</td>
                </tr>
            {/each}
        </tbody>
    </table>

    {#if excludedPens.length > 0}
        <p class="excluded-note">
            <span class="warn-icon">&#9888;</span>
            Excluding {excludedPens.length} defective pen{excludedPens.length !== 1 ? "s" : ""}:
            {#each excludedPens as p, i}
                <span class="excluded-pen">
                    {p.inventoryid} ({p.kinds.join(", ")})
                </span>{#if i < excludedPens.length - 1}, {/if}
            {/each}
        </p>
    {/if}
</div>

<style>
    .stats-container {
        margin-bottom: 2rem;
        max-width: 280px;
    }

    .stats-container h2 {
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #888;
        margin: 0 0 0.75rem 0;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .group-dot {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 2px;
        flex-shrink: 0;
    }

    .stats-table {
        border-collapse: collapse;
        width: auto;
        font-size: 0.875rem;
    }

    .stats-table thead th {
        background: #f0f0f0;
        padding: 0.3rem 0.5rem;
        text-align: right;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
        white-space: nowrap;
        line-height: 1.15;
    }

    .stats-table thead th.label-col {
        text-align: left;
    }

    .stats-table .unit {
        font-weight: 400;
        font-size: 0.7rem;
        color: #999;
    }

    .stats-table tbody td {
        padding: 0.3rem 0.5rem;
        border-bottom: 1px solid #eee;
    }

    .stats-table tbody td.label-col {
        text-align: left;
        color: #666;
        padding-right: 0.75rem;
    }

    .num {
        text-align: right;
        font-family: monospace;
    }

    .mono {
        font-family: monospace;
    }

    .excluded-note {
        font-size: 0.75rem;
        color: #856404;
        background: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 4px;
        padding: 0.4rem 0.6rem;
        margin: 0.6rem 0 0 0;
    }

    .warn-icon {
        margin-right: 0.35rem;
    }

    .excluded-pen {
        font-family: monospace;
        font-size: 0.75rem;
    }
</style>
