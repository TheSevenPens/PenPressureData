# PenPressureData

> ## ⚠ Mostly superseded by [DrawTabDataExplorer](https://github.com/TheSevenPens/DrawTabDataExplorer)
>
> The pressure-response features of this project have been folded into **[DrawTabDataExplorer](https://thesevenpens.github.io/DrawTabDataExplorer/pressure-response)**, under the **Pens ▸ Pressure Response** sub-tab. The Explorer now has feature parity for:
>
> - Sessions list with brand / pen filters
> - Per-session chart with zoom modes (normal / IAF / max-pressure), view modes (raw / raw+estimates / standardized / envelope with Min-Max / P05-P95 / P25-P75 ranges), and PNG / HTML export
> - Per-session detail page at `/entity/<brand>.session.<id>`
> - Pen-model / pen-family detail pages with overlaid sessions, P-value spread table (P00 through P100), and aggregate stats
> - Three-tier flagging (pen units, models, families) with a Flagged sub-tab and overlay chart
> - Pressure-specific data-quality checks (non-monotonic sessions, missing low-end, single-session, stale, recommended for re-measurement)
> - Defects-aware behaviour (auto-hides defective sessions on charts, excludes from aggregates with explicit "Excluding N" note)
> - Multi-session overlay on the Sessions list (row checkboxes)
>
> What this site still does that the Explorer doesn't:
>
> - **Compare with named groups** — build named comparison groups containing any mix of pens / models / families / tags, with per-group color, overlap warnings, and saved views. This is the deepest feature in this site and was intentionally deferred from the Explorer port. If you don't need named groups, the Explorer's Flagged sub-tab + Sessions-list multi-select cover the cross-pen comparison workflow.
>
> Migration tracked in [DrawTabDataExplorer/docs/WORKSTREAMS.md](https://github.com/TheSevenPens/DrawTabDataExplorer/blob/main/docs/WORKSTREAMS.md#merge-consumer-project-penpressuredata).

---

## What this project is

A SvelteKit static site that visualizes and analyzes pen pressure response data for EMR / AES / MPP styluses across multiple brands. It answers: how does physical force on a pen tip translate into the logical pressure value reported to the computer?

**Scale:** 124 measurement sessions across 29+ pen models and 5 brands.

See [`docs/OVERVIEW.md`](docs/OVERVIEW.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full description.
