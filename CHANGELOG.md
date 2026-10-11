# Changelog

All notable changes to the **Formula 1 Race Analytics Platform** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-12 (Production Release)

### Added
- **Dynamic Data Processing & Analytics Service Layer (`src/services/`)**:
  - `dataStore.ts`: `mtime`/file-size aware memoization cache and `Int32Array` columnar lap time indexer supporting 589,000+ lap records.
  - `driverAnalytics.ts`: Career and season statistics, 5-axis performance radar, era/team/nationality filters, and head-to-head driver comparison.
  - `constructorAnalytics.ts`: Historical constructor performance, mechanical reliability index, 1-2 finishes, and constructor head-to-head comparison (`/constructor-comparison`).
  - `circuitAnalytics.ts`: Complete catalog of 77 World Championship circuits (`/circuits`, `/circuits/[id]`) with historical driver/constructor leaderboards and lap records.
  - `raceAnalytics.ts`: Grand Prix classifications, lap progression, pit stop strategy windows, Pirelli tyre compound degradation slopes, and 2D circuit replay frames.
  - `championshipAnalytics.ts`: Round-by-round points trajectories and mathematical championship clinching calculations (1950–2024).
  - `recordAnalytics.ts`: Dynamically computed all-time historical records (most wins, poles, podiums, consecutive streaks, fastest pit stops).
  - `searchService.ts`: Unified multi-category fuzzy search (`⌘K`) across drivers, constructors, circuits, and Grands Prix with keyboard navigation and recent search history.
- **Interactive 2D Track Race Replay Simulator (`/race-replay`)**:
  - Real WGS84 satellite GeoJSON layouts for 40 Grand Prix circuits resampled via Equal Euclidean Arc-Length Resampling into 640 equidistant waypoints across 8 discrete track sections (`S1`–`S8`).
- **Favorites & Multi-Format Data Export**:
  - Browser-persisted Favorites manager (`/favorites`) for drivers, constructors, and circuits.
  - One-click PNG/SVG chart exports, CSV/JSON table exports, and vector PDF driver career dossiers (`jspdf`).
- **Faculty Demonstration Mode & Production Hardening**:
  - 2-minute Executive Briefing on the Home page (`/`), expanded technical methodology on `/about`, custom 404 (`not-found.tsx`) and 500 (`error.tsx`) boundaries, WCAG accessibility enhancements, CSV formula-injection sanitization, and Docker/Vercel/Netlify deployment configurations.

### Fixed
- Resolved GPS coordinate aspect-ratio scaling and eliminated spline overshoot loops in 2D circuit maps by implementing cosine-latitude projection and equal arc-length resampling.
- Synchronized dataset status counts across the Data Governance Center (`/data-manager`), Navbar, and Dashboard.

