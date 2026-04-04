# PenPressureData - Architecture

## System Diagram

```
+-------------------+       +---------------------+       +-------------------+
|   DrawTabData     |       |   SvelteKit App     |       |   GitHub Pages    |
|   (git submodule) | ----> |   (app/)            | ----> |   (static site)   |
|                   |       |                     |       |                   |
|  data-repo/data/  |       |  Vite build imports |       |  app/build/       |
|  pressure-response|       |  JSON at build time |       |  deployed via     |
|  brands, pens,    |       |  and bundles into   |       |  GitHub Actions   |
|  tablets, etc.    |       |  static HTML/JS     |       |                   |
+-------------------+       +---------------------+       +-------------------+
```

## Major Components

### 1. Data Layer: DrawTabData Submodule (`data-repo/`)

The data lives in a separate repository ([DrawTabData](https://github.com/TheSevenPens/DrawTabData)) included as a git submodule. This decouples data management from the web app.

**Key data directories:**

| Path | Content |
|------|---------|
| `data/pressure-response/` | 124 JSON measurement session files (the core dataset) |
| `data/brands/` | Brand metadata |
| `data/pens/` | Pen model definitions |
| `data/tablets/` | Tablet model definitions |
| `data/pen-families/` | Pen family groupings |
| `data/tablet-families/` | Tablet family groupings |
| `data/pen-compat/` | Pen-tablet compatibility maps |
| `data/inventory/` | Physical unit inventory records |
| `data/drivers/` | Driver metadata |

**Pressure response file format:**
```json
{
  "PressureResponse": [
    {
      "Brand": "WACOM",
      "PenEntityId": "WACOM.PEN.KP501E",
      "InventoryId": "WAP.0030",
      "Date": "2025-03-25",
      "TabletEntityId": "WACOM.TABLET.DTH134",
      "Records": [[3.1, 0.14], [4.5, 2.46], ...]
    }
  ]
}
```

Each `Records` entry is a pair: `[physical_force_gf, logical_pressure_pct]`.

### 2. Data Processing (`app/src/lib/`)

Two core modules handle data loading and computation:

#### `data.js` - Loading and Indexing

1. **Vite glob import** loads all `*-pressure-response.json` files at build time
2. **Field mapping** converts DrawTabData field names to app-internal names
3. **P-value calculation** computes 17 percentile marks (P00, P01, P05, P10...P95, P99, P100) for each session using interpolation
4. **Hierarchical indexing** organizes sessions into a nested structure:

```
byBrand
  └── [brand]
       └── byModel
            └── [model]
                 └── byInventoryId
                      └── [inventoryId]
                           └── allSessions[]
```

5. **Exports** reactive lists: `allBrands`, `allModels`, `allInventoryIds`, `allSessions`

#### `interpolate.js` - Pressure Estimation

- **`interpolatePhysical(records, targetLogical)`** - Linear interpolation to find the physical force for a given logical pressure percentage
- **`estimateP00(records)`** - Estimates Initial Activation Force using a spring-decay model that extrapolates backward from the first measured point
- **`estimateP100(records)`** - Estimates maximum force using the same spring-decay model extrapolating forward to 100%

These estimates allow meaningful P00/P100 values even when the raw data doesn't include measurements at exactly 0% or 100%.

### 3. UI Components (`app/src/lib/components/`)

The app uses Svelte 5 with runes (`$state`, `$derived`, `$props`, `$bindable`) for reactivity.

| Component | Role |
|-----------|------|
| **PressureChart** | Chart.js scatter plot with zoom modes, extrapolation lines, and 4 export methods (PNG copy/download, HTML table copy/download) |
| **ChartLegendTable** | Interactive legend with checkboxes to toggle session visibility; displays P-value statistics |
| **ModelStats** | Aggregated statistics table showing min/median/max across sessions for key P-values |
| **BrandFilter** | Pill-button bar for selecting brands |
| **ModelFilter** | Pill-button bar for selecting pen models (filtered by active brand) |
| **PillList** | Reusable button group with an "All" option |
| **BreadcrumbBar** | Hierarchical breadcrumb navigation with item counts |
| **NavStrip** | Previous/next navigation between models |
| **ZoomSelect** | Chart zoom mode selector: normal / IAF detail / max pressure detail |
| **EstimatesSelect** | Data mode selector: raw / estimates (P00/P100) / standardized |
| **RecordsTable** | Raw measurement data table |

### 4. Routing (`app/src/routes/`)

SvelteKit file-based routing provides the page hierarchy:

```
/                              Sessions listing (all sessions, filterable)
/models                        Pen models overview
/pens                          Individual pen units overview
/details/[brand]/[model]       All sessions for a pen model (chart + stats)
/details/[brand]/[model]/[inventoryid]          Sessions for a specific pen unit
/details/[brand]/[model]/[inventoryid]/[date]   Single measurement session
```

The layout component (`+layout.svelte`) provides consistent header navigation and detects route depth for active tab highlighting.

### 5. Build and Deployment

**Build chain:**
```
npm run build (in app/)
  -> Vite processes SvelteKit routes
  -> Glob imports resolve JSON data files at build time
  -> adapter-static outputs complete static site to app/build/
```

**Deployment (`.github/workflows/deploy.yml`):**
- Triggered on push to `main` or manual dispatch
- Checks out repo with submodules (recursive)
- Installs Node 20 dependencies
- Builds with `BASE_PATH=/PenPressureData`
- Deploys to GitHub Pages via `actions/deploy-pages`

**Development:**
```bash
node start-dev.mjs    # Launches Vite dev server on port 5999
```

## Key Design Decisions

- **Static site generation** -- All data is bundled at build time. No runtime API calls or database. This keeps hosting simple (GitHub Pages) and makes the site fast.
- **Git submodule for data** -- Separates the dataset (DrawTabData) from the visualization app, allowing the data to be versioned, shared, and updated independently.
- **Build-time data loading via Vite glob** -- JSON files are imported at build time rather than fetched at runtime, eliminating loading states and API complexity.
- **Hierarchical data model** -- Brand > Model > InventoryId > Session mirrors how users think about pen pressure data and enables drill-down navigation.
- **Outlier tagging** -- Sessions tagged as `["outlier"]` are hidden by default but can be toggled on, keeping charts clean without discarding data.

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@sveltejs/kit` | ^2.0.0 | Application framework |
| `@sveltejs/adapter-static` | ^3.0.0 | Static site output |
| `svelte` | ^5.0.0 | Component runtime |
| `vite` | ^6.0.0 | Build tool and dev server |
| `chart.js` | ^4.5.1 | Pressure response chart rendering |
