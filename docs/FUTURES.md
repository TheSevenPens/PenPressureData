# PenPressureData - Futures

Known issues, planned work, and ideas for future development.

## Open Issues (from GitHub)

### #7 - Add Comparison: Pens and Groups of Pens
**Label:** enhancement

Add the ability to compare pressure response curves across different pen models side-by-side. Currently the app shows all sessions for a single model or inventory ID overlaid on one chart, but there is no way to select arbitrary pens or groups and compare them on one view. This is tracked on the `WIP-Comparison` branch.

### #6 - Flag Pens Without a Measurement Update in Over a Year
Identify pen models or inventory IDs whose most recent measurement session is more than a year old. These are candidates for re-measurement to confirm that their pressure response hasn't drifted or to capture data with updated drivers/tablets.

### #5 - Flag Pens With Only 1 Measurement Session
A single session provides no basis for assessing consistency or variation. Pens with only one measurement should be flagged so they can be prioritized for additional sessions.

### #4 - Flag Sessions That Don't Monotonically Increase
Valid pressure response data should be monotonically increasing -- more physical force should always produce equal or higher logical pressure. Sessions that violate this constraint may indicate measurement errors or unusual pen behavior and should be flagged for review.

### #3 - Flag Pens That Don't Have Logical Measurements Below -0.5%
Related to data quality validation. Pens missing low-end measurements (near 0% logical pressure) may have incomplete data that affects IAF estimation accuracy.

### #2 - List Pens Recommended for Re-measuring
A summary view that combines multiple quality signals (age of data, session count, data anomalies) to produce a prioritized list of pens that would benefit from fresh measurements.

### #1 - IAF Disclaimer
The Initial Activation Force (P00) values are estimates derived from extrapolation, not direct measurements. The app should display a clear disclaimer explaining this limitation, so users understand the uncertainty involved.

## Data Quality and Validation

- **Automated validation pipeline** -- Run checks on data files before they enter the dataset: monotonicity, completeness, reasonable force ranges, consistent metadata.
- **Data quality dashboard** -- A dedicated view showing the health of the dataset: which pens need re-measurement, which sessions have anomalies, overall coverage gaps.
- **Outlier detection refinement** -- Currently outliers are manually tagged. Automated detection based on statistical deviation from a pen model's typical curve could supplement manual tagging.

## Comparison and Analysis Features

- **Cross-model comparison** -- Select 2+ pen models and overlay their curves on a single chart (issue #7, in progress on `WIP-Comparison` branch).
- **Cross-brand comparison** -- Compare typical pressure curves across brands to show brand-level tendencies.
- **Pressure curve clustering** -- Group pens with similar response characteristics regardless of brand, helping users find pens that "feel" similar.
- **Statistical confidence bands** -- For models with multiple sessions, show confidence intervals rather than just individual curves.

## User Experience

- **Permalink/sharing** -- URL-encoded state so users can share a specific chart view (zoom level, visible sessions, comparison set).
- **Dark mode** -- The app currently has a light theme only.
- **Mobile optimization** -- The responsive breakpoint at 900px handles basic mobile layouts, but chart interaction on touch devices could be improved.
- **Search** -- Text search across pen models, brands, and inventory IDs for faster navigation in a growing dataset.

## Data Expansion

- **More brands** -- ASUS inventory items exist in DrawTabData but no pressure response data yet. Other brands (GAOMON, UGEE, etc.) could be added.
- **Driver/OS variation** -- Measuring the same pen with different drivers or operating systems to quantify driver-level differences in pressure response.
- **Tilt response data** -- Extending the measurement methodology to capture tilt angle response curves alongside pressure.
- **Temporal tracking** -- Repeated measurements of the same pen over months/years to detect pressure response drift from wear.

## Technical Improvements

- **TypeScript migration** -- The app uses plain JavaScript. TypeScript would add type safety, especially for the data processing pipeline where field mapping between DrawTabData and app formats is error-prone.
- **Testing** -- No test suite currently exists. Unit tests for `interpolate.js` (P00/P100 estimation) and `data.js` (field mapping, hierarchy building) would catch regressions in the core data pipeline.
- **Chart library evaluation** -- Chart.js works well but alternatives (Observable Plot, D3, uPlot) could offer better performance with large overlaid datasets or more flexible interaction patterns.
