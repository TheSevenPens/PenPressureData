# PenPressureData - Project Overview

## What This Project Is

PenPressureData is a web application that visualizes and analyzes pen pressure response data for EMR (Electromagnetic Resonance) styluses across multiple brands and models. It answers the question: **how does physical force on a pen tip translate into logical pressure values reported to the computer?**

The live site is published at: `https://thesevenpens.github.io/PenPressureData`

## Why It Exists

Every stylus has a pressure response curve -- the relationship between how hard you press (measured in grams-force) and the logical pressure value (0-100%) reported to drawing software. This curve varies significantly between brands, pen models, and even individual pen units. Artists and reviewers need this data to understand how pens actually behave, but no standardized, publicly available dataset existed before this project.

PenPressureData fills that gap by:

- Collecting empirical pressure measurements across many pen models
- Providing interactive charts to visualize and compare pressure curves
- Calculating key statistics like Initial Activation Force (IAF) and maximum pressure
- Making data browsable by brand, model, individual pen unit, and measurement session

## What It Covers

**Brands:** HUION, SAMSUNG, WACOM, XENCELABS, XPPEN

**Scale:** 124 measurement sessions across 29+ pen models and 5 brands

**Key data points per session:**
- Raw measurement pairs: physical force (gf) vs. logical pressure (%)
- Calculated P-value marks at 17 percentile points (P00 through P100)
- P00 = Initial Activation Force (IAF) -- the minimum force to register input
- P100 = Maximum Force -- the force needed to reach 100% pressure

## How Data Is Collected

Each measurement session records a series of (force, pressure) pairs for a specific pen, used on a specific tablet, with a specific driver and OS. Measurements are taken by gradually increasing force on the pen tip and recording the corresponding logical pressure values.

Sessions are identified by inventory ID (a unique physical pen unit) and date, allowing multiple sessions per pen to track consistency and variation over time.

## How the App Presents Data

The app provides four main views for navigating the data:

| View | What It Shows |
|------|--------------|
| **Sessions** | Every measurement session, filterable by brand and model |
| **Models** | Pen models with counts of pens tested and sessions recorded |
| **Pens** | Individual pen units (inventory IDs) with their session history |
| **Flagged** | User-selected pens and models for ad-hoc comparison |

Drilling into any entry leads to detail pages with interactive pressure response charts, statistical summaries, and raw data tables.

### Flagging and Comparison

Users can flag individual pens or entire pen models from any listing or detail page. Flagged items appear together on the Flagged tab, allowing pressure response comparison across arbitrary combinations of pens and models -- even across different brands. Flags persist in the browser via localStorage.

### Chart Features

- Line plots of force vs. pressure
- Zoom modes: normal range (0-1000 gf), IAF detail (0-20 gf), max pressure detail (95-100%)
- P00/P100 extrapolation lines showing estimated activation and saturation points
- Overlay of multiple sessions for the same pen or model
- Export as PNG image or HTML data table

### Data View Modes

The estimates dropdown controls how data is presented on charts:

| Mode | Description |
|------|-------------|
| **Raw data** | Only the measured data points |
| **Raw + P00 & P100 estimates** | Measured data plus extrapolated activation and saturation lines |
| **Standardized data** | Curves resampled at 17 standard percentile levels for consistent comparison |
| **Envelope** | Replaces individual lines with a shaded min/max area and a single median line |

### Envelope View

The envelope view aggregates multiple sessions into a single visualization showing the range and central tendency of pressure response. Options include:

- **Range selection**: Min/Max, P05/P95, or P25/P75 -- controls how wide the shaded area is
- **Group by model**: On the Flagged page, shows a separate colored envelope per model for visual comparison

### Defective Pens

Some individual pen units are marked as defective in the DrawTabData inventory (e.g. a pen with unusually low maximum pressure). The app:

- Shows a ⚠ indicator for defective pens in the Pens listing, chart legend, and pen detail page
- Displays the defect kind and notes when you hover the indicator or visit the pen detail page
- **Hides** defective sessions by default on pressure charts so outliers don't distort the view -- they remain listed in the chart legend (dimmed, with the ⚠) and can be toggled back on with the checkbox
- **Excludes** defective pens from aggregated statistics (min/median/max) and envelope curves, with an explicit "Excluding N defective pens" note shown next to the stats

## Current Version

Version 0.13 -- under active development.
