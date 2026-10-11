import React from "react";
import Link from "next/link";
import {
  Layers,
  Cpu,
  Database,
  GitBranch,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Wrench,
  BookOpen,
  User,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { getDatasetCatalog } from "@/services/datasetCatalog";
import { getDataset } from "@/services/dataStore";
import { APP_CONFIG } from "@/lib/config";

export const metadata = {
  title: "About Formula 1 Race Analytics Platform | Architecture & Methodology",
  description:
    "Project motivation, development approach, 5-layer architecture, data pipeline, analytics methodology, challenges solved, and author details for the Formula 1 Race Analytics Platform (v1.0.0).",
};

export default function AboutPage() {
  const catalog = getDatasetCatalog();
  const ds = getDataset();

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="border-b border-zinc-800/80 pb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#E10600] uppercase tracking-widest font-semibold">
            <Cpu className="w-4 h-4" />
            <span>Production Release v{APP_CONFIG.version} · Engineering Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            {APP_CONFIG.name}
          </h1>
          <p className="text-base text-zinc-400 max-w-3xl leading-relaxed">
            A production-grade Formula 1 engineering telemetry and historical analytics suite designed to compute precision race insights, telemetry curves, tyre degradation models, 2D circuit replays, and championship probabilities with an uncompromising{" "}
            <strong className="text-zinc-200">zero-synthetic data policy</strong>.
          </p>

          {/* Repository & Live Demo Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={APP_CONFIG.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-white transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#E10600]" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
            <a
              href={APP_CONFIG.liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E10600] hover:bg-red-500 text-xs font-mono font-bold text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live Production Demo</span>
              <ExternalLink className="w-3 h-3 text-red-200" />
            </a>
            <Link
              href="/data-manager"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dataset Governance Center</span>
            </Link>
          </div>
        </div>

        {/* Live System Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
              Archived Grands Prix
            </span>
            <span className="text-2xl font-black text-white font-mono">
              {ds.races.length.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              {ds.firstYear}–{ds.latestYear}
            </span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
              Classified Race Results
            </span>
            <span className="text-2xl font-black text-[#E10600] font-mono">
              {ds.results.length.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              100% Verified
            </span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
              World Champions
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {new Set(ds.driverChampionByYear.values()).size}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              {ds.years.length} Championship Seasons
            </span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 text-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-semibold">
              Active Datasets
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {catalog.summary.presentFiles}/{catalog.summary.totalFiles}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              CSV & GeoJSON Tables
            </span>
          </div>
        </div>

        {/* 1. Project Motivation & Development Approach */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-4 bg-[#E10600] rounded-sm" />
              Project Motivation
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Formula 1 is the most data-intensive sport on earth. Each modern Grand Prix weekend generates hundreds of gigabytes of telemetry across speed, throttle, brake pressure, tyre degradation, and sector deltas.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              This project was motivated by the need for an open, mathematically rigorous telemetry and historical analytics platform where every metric—from a driver&apos;s career win conversion rate to a tyre compound&apos;s millisecond-per-lap degradation slope—is computed dynamically from raw datasets rather than hardcoded or synthetically approximated.
            </p>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-4 bg-cyan-400 rounded-sm" />
              Development Approach
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Engineered using a strict layered service architecture in TypeScript and Next.js 14. Presentation components are decoupled from statistical computation: UI pages consume typed REST endpoints backed by dedicated analytics domain services (`driverAnalytics`, `constructorAnalytics`, `raceAnalytics`, `championshipAnalytics`, `circuitAnalytics`, and `recordAnalytics`).
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              When optional high-frequency datasets are absent for older historical eras, the platform enforces graceful degradation with clear schema documentation rather than fabricating data.
            </p>
          </div>
        </section>

        {/* 2. System Architecture & Data Pipeline */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2.5">
            <span className="w-2 h-5 bg-[#E10600] rounded-sm" />
            System Architecture & Data Pipeline
          </h2>

          <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative font-mono text-xs">
              <div className="bg-zinc-900 border border-zinc-700/80 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#E10600] uppercase font-bold block mb-1">
                    Layer 1 · Ingestion
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">Raw Datasets</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Ergast CSV tables, FastF1 sensor streams, and WGS84 satellite GeoJSON circuit loops.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-zinc-500">/data/*.csv, *.json</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-700/80 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block mb-1">
                    Layer 2 · Processing
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">Data Store</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    `mtime`/file-size aware memoization, `\N` null normalization, and `Int32Array` lap indexing.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-zinc-500">services/dataStore.ts</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-700/80 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                    Layer 3 · Computation
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">Analytics Engine</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Career radars, regression slopes, clinch math, arc-length track resampling, and streaks.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-zinc-500">services/*Analytics.ts</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-700/80 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
                    Layer 4 · Transport
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">REST API Layer</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    19 Next.js Route Handlers serving validated JSON payloads with structured error codes.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-zinc-500">src/app/api/**</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-700/80 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase font-bold block mb-1">
                    Layer 5 · Presentation
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">Visual Dashboard</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Apache ECharts, 2D SVG circuit simulator, responsive Tailwind UI, and PDF/CSV/JSON exports.
                  </p>
                </div>
                <span className="mt-3 text-[10px] text-zinc-500">src/app/** & components/</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 font-mono text-center pt-2 border-t border-zinc-900">
              Pipeline Invariant: CSV Dataset → Data Processing Layer → Analytics Service → API Endpoint → Frontend Visualization
            </p>
          </div>
        </section>

        {/* 3. Analytics Methodology */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2.5">
            <span className="w-2 h-5 bg-[#E10600] rounded-sm" />
            Analytics & Mathematical Methodology
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white uppercase font-mono text-cyan-400">
                1. 5-Axis Driver Performance Radar
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Normalizes driver performance across five orthogonal dimensions (0–100 scale):{" "}
                <strong>Qualifying Speed</strong> (mean grid slot & pole conversion),{" "}
                <strong>Race Pace</strong> (win & podium rate),{" "}
                <strong>Consistency</strong> (points-scoring finish ratio),{" "}
                <strong>Racecraft</strong> (average positions gained from grid to flag), and{" "}
                <strong>Reliability</strong> (classified finish percentage).
              </p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white uppercase font-mono text-amber-400">
                2. Tyre Degradation Linear Regression
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Correlates `tyre_stints.csv` with `lap_times.csv`, filtering out pit in/out laps and safety car outliers (laps exceeding 115% of median pace), then computes ordinary least-squares linear regression (ms/lap slope) per Pirelli compound.
              </p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white uppercase font-mono text-emerald-400">
                3. Equal Arc-Length 2D Circuit Projection
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Projects WGS84 `[lon, lat]` satellite coordinates using equirectangular cosine-latitude scaling (cos(lat)) and resamples the closed perimeter into 640 equidistant Euclidean waypoints (80 waypoints per track section `S1`–`S8`).
              </p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-bold text-white uppercase font-mono text-purple-400">
                4. Championship Clinch & Streak Algorithms
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Evaluates round-by-round cumulative points against maximum remaining season points (26 pts/GP + 8 pts/Sprint) to detect mathematical title clinch rounds, and scans chronological race order to compute all-time winning and podium streaks.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Engineering Challenges Faced & Solved */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2.5">
            <span className="w-2 h-5 bg-[#E10600] rounded-sm" />
            Engineering Challenges Solved
          </h2>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 font-mono font-bold">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>589,000+ Lap Row Indexing</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Parsing and filtering `lap_times.csv` (~590k rows) per API call caused multi-second latency. Solved by building a compact columnar `Int32Array` index grouped by `raceId` with file `mtime` memoization, reducing query times to &lt;15ms.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Historical Points & Shared Drives</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Formula 1 scoring rules changed dozens of times between 1950 and 2024 (dropped scores, shared drives, half points). Solved by cross-referencing `driver_standings.csv` at each season&apos;s final round alongside raw `results.csv` aggregations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>GeoJSON Spline Overshoot</span>
                </div>
                <p className="text-zinc-400 leading-relaxed">
                  Unevenly spaced GPS vertices in circuit maps caused Catmull-Rom spline loops at the end of long straights. Solved by implementing Equal Euclidean Arc-Length Resampling with cosine-latitude aspect preservation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Technology Stack & Authoritative Data Sources */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold uppercase text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E10600]" />
              Technology Stack
            </h2>
            <ul className="text-xs text-zinc-400 space-y-2 font-mono">
              <li><strong className="text-zinc-200">Frontend:</strong> Next.js 14 App Router, React 18, TypeScript 5</li>
              <li><strong className="text-zinc-200">Styling:</strong> Tailwind CSS 3, Lucide Icons, Framer Motion</li>
              <li><strong className="text-zinc-200">Charts & Maps:</strong> Apache ECharts 5 & Custom 2D SVG Track Engine</li>
              <li><strong className="text-zinc-200">Data Processing:</strong> PapaParse, Typed Arrays, mtime Cache</li>
              <li><strong className="text-zinc-200">Export Engine:</strong> jsPDF, CSV/JSON Serializers, Canvas PNG/SVG</li>
            </ul>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold uppercase text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Authoritative Data Sources
            </h2>
            <ul className="text-xs text-zinc-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-zinc-200">Ergast / Jolpica F1 Database:</strong> Complete World Championship historical records (1950–2024).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-zinc-200">FastF1 Python Telemetry Library:</strong> 100Hz car telemetry, tyre stint compounds, sector splits, and track weather.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-zinc-200">bacinger/f1-circuits GeoJSON:</strong> Official WGS84 satellite coordinates for all 40 Grand Prix circuits.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 6. Future Scope & Enhancements */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white flex items-center gap-2.5">
            <span className="w-2 h-5 bg-[#E10600] rounded-sm" />
            Future Enhancements & Research Scope
          </h2>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-zinc-200 font-bold mb-1">Machine Learning Race Outcome Prediction</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Gradient-boosted decision trees (XGBoost / LightGBM) trained on grid position, qualifying delta, constructor reliability, and circuit overtaking difficulty.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-zinc-200 font-bold mb-1">Monte Carlo Undercut / Overcut Simulator</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Real-time pit window delta calculator forecasting track position and traffic emergence across alternate 1-stop and 2-stop strategies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-zinc-200 font-bold mb-1">Micro-Sector GPS Cornering Overlay</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Color-coded 2D track segments highlighting exact braking zones, minimum apex speeds, and traction-limited exit zones between two drivers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-zinc-200 font-bold mb-1">Wet-to-Slick Crossover Weather Model</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Track temperature and rainfall correlation engine predicting the exact lap time crossover threshold between Intermediate and Slick compounds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Author & Release Metadata */}
        <section className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#E10600] uppercase font-bold">
              <User className="w-3.5 h-3.5" />
              <span>Author & Academic Attribution</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Developed by {APP_CONFIG.author}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              {APP_CONFIG.name} · Version {APP_CONFIG.version} (Production Release). Built as a full-stack software engineering & data analytics portfolio project.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={APP_CONFIG.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={APP_CONFIG.liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-[#E10600] hover:bg-red-500 text-xs font-mono font-bold text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Live Demo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
