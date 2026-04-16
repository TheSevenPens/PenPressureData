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

### 2. Data Ingestion (`app/src/lib/data.js`)

Responsible for loading raw data from the DrawTabData submodule and converting it into the app's internal format:

1. **Vite glob imports** load all relevant JSON files at build time:
   - `*-pressure-response.json` — session measurements
   - `*-pens.json` — pen model definitions (for family and tag lookup)
   - `*-pen-families.json` — pen family definitions
   - `inventory/*-pens.json` — physical unit inventory (for defects)
   - `reference/defect-kinds.json` — controlled defect vocabulary
2. **Field mapping** converts DrawTabData field names (e.g. `PenEntityId`, `InventoryId`, `TabletEntityId`) to app-internal names (e.g. `pen`, `inventoryid`, `tablet`)
3. **Tag parsing** normalizes the `tags` field from CSV strings or arrays into a consistent array format
4. **Defect attachment** looks up each session's inventory unit and attaches `defects` (array of `{Kind, Notes}`) and `isDefective` (boolean) to the session

The ingestion layer isolates the rest of the app from changes in the DrawTabData schema -- if field names change upstream, only the mapping in `data.js` needs updating.

### 3. Data Analysis (`app/src/lib/`)

Operates on the ingested session data to compute derived values and organize sessions for the UI:

#### P-value Computation (`data.js` + `interpolate.js`)

- **P-value calculation** computes 17 percentile marks (P00, P01, P05, P10...P95, P99, P100) for each session
- **P00 estimation** (`estimateP00`) uses a spring-decay model that extrapolates backward from the first measured point to estimate Initial Activation Force
- **P100 estimation** (`estimateP100`) uses the same spring-decay model extrapolating forward to estimate the force needed for 100% pressure
- **Interior interpolation** fills any null P-values between non-null neighbors (e.g. if raw data doesn't reach 99% logical pressure, P99 is interpolated between P95 and P100)
- **`interpolatePhysical(records, targetLogical)`** performs linear interpolation between adjacent data points to find the physical force for a given logical pressure percentage

These estimates allow meaningful P00/P100 values even when the raw data doesn't include measurements at exactly 0% or 100%.

> **Note:** The interpolation and P-value estimation logic currently lives in this app (`interpolate.js`), but is expected to migrate into the DrawTabData submodule's shared libraries in the future, since it is useful for all consumers of that dataset.

#### Defects System (`data.js`)

Physical pen units can be marked defective in DrawTabData's inventory files with a structured `Defects[]` array (controlled vocabulary from `data/reference/defect-kinds.json`). The app:

- Builds `inventoryIdToDefects` and `defectKindInfo` lookup maps
- Attaches `defects` and `isDefective` to every session
- Parent pages auto-hide defective sessions on the chart by default (via `hiddenLabels` populated from `isDefective`) so their outlier values don't distort the visualization
- Defective sessions remain listed in the chart legend (dimmed, with a ⚠ icon and tooltip) so the user can click the checkbox to include them on demand
- `ModelStats` and `PressureChart` envelope computation **exclude** defective sessions from aggregate calculations
- Exclusion is made explicit via a warning note listing which pens were excluded and why

Exports: `inventoryIdToDefects`, `defectKindInfo`

#### Hierarchical Indexing (`data.js`)

Sessions are organized into a nested structure for navigation:

```
byBrand
  └── [brand]
       └── byModel
            └── [model]
                 └── byInventoryId
                      └── [inventoryId]
                           └── allSessions[]
```

Exports: `allSessions`, `byBrand`, `sessionById`, `brands`

### 4. UI Components (`app/src/lib/components/`)

The app uses Svelte 5 with runes (`$state`, `$derived`, `$props`, `$bindable`) for reactivity.

| Component | Role |
|-----------|------|
| **PressureChart** | Chart.js scatter plot with zoom modes, extrapolation lines, envelope mode (min/max area + median), and 4 export methods (PNG copy/download, HTML table copy/download) |
| **FlagButton** | Toggle button for flagging pens or models for comparison |
| **ChartLegendTable** | Interactive legend with checkboxes to toggle session visibility; displays P-value statistics |
| **ModelStats** | Aggregated statistics table showing min/median/max across sessions for key P-values |
| **BrandFilter** | Pill-button bar for selecting brands |
| **ModelFilter** | Pill-button bar for selecting pen models (filtered by active brand) |
| **PillList** | Reusable button group with an "All" option |
| **BreadcrumbBar** | Hierarchical breadcrumb navigation with item counts |
| **NavStrip** | Previous/next navigation between models |
| **ZoomSelect** | Chart zoom mode selector: normal / IAF detail / max pressure detail |
| **EstimatesSelect** | Data mode selector: raw / estimates (P00/P100) / standardized / envelope |
| **RecordsTable** | Raw measurement data table |

### 5. Routing (`app/src/routes/`)

SvelteKit file-based routing provides the page hierarchy:

```
/                              Sessions listing (all sessions, filterable)
/models                        Pen models overview
/pens                          Individual pen units overview
/flagged                       Flagged pens/models comparison view
/details/[brand]/[model]       All sessions for a pen model (chart + stats)
/details/[brand]/[model]/[inventoryid]          Sessions for a specific pen unit
/details/[brand]/[model]/[inventoryid]/[date]   Single measurement session
```

The layout component (`+layout.svelte`) provides consistent header navigation with a badge count on the Flagged tab and detects route depth for active tab highlighting.

### 6. Flagging System (`app/src/lib/flagged.svelte.js`)

A reactive store using Svelte 5 runes that manages two sets of flagged items:

- **Flagged pens** -- individual inventory IDs (e.g. `"WAP.0004"`)
- **Flagged models** -- brand+model compound keys (e.g. `"WACOM||KP504E"`)

Flagging a model includes all current and future sessions for that brand+model. Flagging a pen includes all sessions for that specific inventory ID. Both sets are persisted to localStorage.

Flag buttons appear on the Models and Pens listing pages (as a column in each table row) and on model/pen detail page headers.

### 7. Build and Deployment

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
