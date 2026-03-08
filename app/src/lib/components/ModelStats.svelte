<script>
    import { fmtP } from "$lib/interpolate.js";

    /**
     * @type {{
     *   sessions: Array<{ pValues: Record<string, number|null> }>
     * }}
     */
    let { sessions } = $props();

    function calcStats(pKey) {
        // Extract all non-null values for this P mark across all sessions
        const values = sessions
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
    <h2>Aggregated Stats</h2>
    <table class="stats-table">
        <thead>
            <tr>
                <th class="label-col">Mark</th>
                <th class="num">Min (gf)</th>
                <th class="num">Median (gf)</th>
                <th class="num">Max (gf)</th>
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
</div>

<style>
    .stats-container {
        margin-bottom: 2rem;
    }

    .stats-container h2 {
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #888;
        margin: 0 0 0.75rem 0;
    }

    .stats-table {
        border-collapse: collapse;
        width: auto;
        min-width: 400px;
        font-size: 0.875rem;
    }

    .stats-table thead th {
        background: #f0f0f0;
        padding: 0.4rem 1rem;
        text-align: right;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
        white-space: nowrap;
    }

    .stats-table thead th.label-col {
        text-align: left;
    }

    .stats-table tbody td {
        padding: 0.35rem 1rem;
        border-bottom: 1px solid #eee;
    }

    .stats-table tbody td.label-col {
        text-align: left;
        color: #666;
    }

    .num {
        text-align: right;
        font-family: monospace;
    }

    .mono {
        font-family: monospace;
    }
</style>
