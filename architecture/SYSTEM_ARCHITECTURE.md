# System Architecture & Engineering Specification

**Project**: Formula 1 Race Analytics Platform  
**Version**: 1.0.0 (Production Release)

---

## 1. Architectural Overview

The platform follows a strict **5-Layer Unidirectional Data Architecture** that separates raw dataset storage from analytical computation and frontend presentation:

```
CSV / GeoJSON Datasets (data/)
      ↓
Data Processing & Memoization Layer (src/services/dataStore.ts)
      ↓
Domain Analytics Services (src/services/*Analytics.ts)
      ↓
Next.js REST API Route Handlers (src/app/api/**)
      ↓
Interactive Client Visualizations (src/app/** & src/components/**)
```

---

## 2. Layer-by-Layer Breakdown

### Layer 1: Raw Dataset Layer (`data/`)
Stores 16 verified CSV and JSON tables sourced from Ergast/Jolpica, FastF1, and `bacinger/f1-circuits`:
- **Core Historical Tables**: `drivers.csv`, `constructors.csv`, `circuits.csv`, `races.csv`, `results.csv`, `qualifying.csv`, `driver_standings.csv`, `constructor_standings.csv`, `pit_stops.csv`, `lap_times.csv`, `status.csv`, `seasons.csv`, `sprint_results.csv`.
- **High-Frequency & Strategy Tables**: `telemetry.csv` (100Hz ECU streams), `tyre_stints.csv` (Pirelli stint compounds), `weather.csv`, `sector_times.csv`, `safety_car_events.csv`, `penalties.csv`, `drs_usage.csv`.
- **Spatial Geometry**: `track_maps.json` (40 official WGS84 satellite circuit coordinate loops).

### Layer 2: Data Processing & Indexing (`src/services/dataStore.ts`)
- **`mtime` + File Size Memoization**: Every parsed table and computed index is cached in `globalThis.__f1Cache` keyed by file modification timestamp and byte size. Updating a CSV file in `data/` automatically invalidates stale caches without restarting the server.
- **Columnar Typed Array Lap Index**: `lap_times.csv` (~589,000 rows) is indexed into contiguous `Int32Array` buffers (`driverId`, `lap`, `position`, `ms`) partitioned by `raceId`, enabling sub-15ms lap progression and race replay queries.
- **Path Traversal Guard**: `safeDataPath()` enforces strict directory confinement inside `DATA_DIRECTORY`.

### Layer 3: Domain Analytics Services (`src/services/`)
- `driverAnalytics.ts`: Computes career starts, wins, podiums, poles, points, average finish, championship titles, 5-axis normalized radar scores, season breakdowns, and head-to-head comparisons.
- `constructorAnalytics.ts`: Computes constructor wins, podiums, 1-2 finishes, points, championships, mechanical reliability index, and team-vs-team comparisons.
- `circuitAnalytics.ts`: Computes circuit profiles, historical winners, constructor dominance, and official lap records.
- `raceAnalytics.ts`: Computes Grand Prix classification summaries, lap-by-lap position curves, pit stop strategy windows, compound degradation linear regressions, and 2D circuit replay frames.
- `championshipAnalytics.ts`: Computes round-by-round points accumulation and mathematical championship clinching scenarios.
- `recordAnalytics.ts`: Computes all-time historical leaderboards and consecutive winning/podium streaks.
- `searchService.ts`: Unified multi-category fuzzy search index across drivers, constructors, circuits, and Grands Prix.

### Layer 4: REST API Endpoints (`src/app/api/`)
19 stateless Next.js App Router endpoints returning consistent `{ success, data, error }` envelopes with HTTP 400/404/500 status semantics.

### Layer 5: Frontend Visualization (`src/app/`, `src/components/`)
- **Apache ECharts (`InteractiveChart.tsx`)**: Hardware-accelerated charts with built-in PNG and SVG vector export.
- **2D SVG Circuit Replay (`RaceTrackReplayMap.tsx`)**: Equirectangular cosine-latitude projection and 640-waypoint Equal Euclidean Arc-Length Resampling across 8 discrete track sections (`S1`–`S8`).
- **Resilience & Accessibility**: Reusable `LoadingState`, `ErrorState`, `EmptyState`, custom 404/500 pages, keyboard navigation (`⌘K`), and ARIA landmarks.

