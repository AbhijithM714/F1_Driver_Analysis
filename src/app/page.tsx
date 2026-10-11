"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Gauge,
  Flame,
  Cpu,
  Database,
  ChevronRight,
  Layers,
  Award,
  CheckCircle2,
  MapPin,
  Trophy,
  Play,
  GitCompare,
  Heart,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { useDatasetStore } from "@/lib/datasetStore";

const MODULE_CARDS = [
  {
    title: "Telemetry & Race Dashboard",
    href: "/dashboard",
    tag: "OVERVIEW",
    desc: "Season standings, latest Grand Prix podiums, fastest laps, weather conditions, and pit stop benchmarks.",
  },
  {
    title: "Driver Career & Season Analytics",
    href: "/drivers",
    tag: "DRIVERS",
    desc: "859 official drivers (1950–2024), 5-axis performance radar, era filters, head-to-head comparison, and PDF dossiers.",
  },
  {
    title: "Constructor Engineering Profiles",
    href: "/constructors",
    tag: "TEAMS",
    desc: "211 historic & active constructors, mechanical reliability index, 1-2 finishes, and pit crew stationary benchmarks.",
  },
  {
    title: "Constructor Head-to-Head Matrix",
    href: "/constructor-comparison",
    tag: "COMPARISON",
    desc: "Direct comparison between any two constructors across wins, podiums, points, titles, and mechanical reliability.",
  },
  {
    title: "World Championship Circuits",
    href: "/circuits",
    tag: "CIRCUITS",
    desc: "77 Grand Prix circuits with 2D satellite GeoJSON maps, track length, turns, lap records, and historical winners.",
  },
  {
    title: "Grand Prix Race Analytics",
    href: "/race-analytics",
    tag: "RACE PACE",
    desc: "Full finishing classification, grid-to-flag position changes, lap-by-lap progression charts, and pit stop execution.",
  },
  {
    title: "2D Track Race Replay Simulator",
    href: "/race-replay",
    tag: "SIMULATOR",
    desc: "Interactive lap & 8-section track progression simulator placing all 20 drivers on authentic 2D circuit layouts.",
  },
  {
    title: "Qualifying Shootout & Deltas",
    href: "/qualifying",
    tag: "QUALIFYING",
    desc: "Q1, Q2, and Q3 knockout progression, pole position gaps, and front-row conversion ratios.",
  },
  {
    title: "Championship Standings & Clinch Math",
    href: "/championship",
    tag: "STANDINGS",
    desc: "Round-by-round points trajectories and mathematical title clinching scenarios across 75 Formula 1 seasons.",
  },
  {
    title: "Pirelli Tyre Strategy & Degradation",
    href: "/tyres",
    tag: "STRATEGY",
    desc: "Compound stint Gantt timelines, linear regression degradation slopes (ms/lap), and undercut/overcut pit windows.",
  },
  {
    title: "Synchronized Dual-Car Telemetry",
    href: "/telemetry",
    tag: "100HZ ECU",
    desc: "Speed, Throttle, Brake, Gear, RPM, and DRS traces synchronized by track distance with 2D apex overlay.",
  },
  {
    title: "All-Time Historical Records",
    href: "/records",
    tag: "RECORDS",
    desc: "Dynamically computed leaderboards for career wins, poles, podiums, winning streaks, and fastest pit stops.",
  },
];

export default function HomePage() {
  const { isClient, loadedCount, totalCount } = useDatasetStore();

  return (
    <div className="relative min-h-screen bg-[#080808] overflow-hidden">
      {/* Animated Background Mesh & Speedlines */}
      <div className="absolute inset-0 speed-lines opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-radial from-red-600/15 via-red-950/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-radial from-cyan-600/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 md:pt-20 md:pb-24">
        {/* Top Tag */}
        <div className="flex items-center justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 backdrop-blur-md shadow-xl text-xs font-mono text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>PRODUCTION RELEASE v1.0.0</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400 font-semibold">FACULTY & PORTFOLIO DEMONSTRATION EDITION</span>
          </div>
        </div>

        {/* Headline & Subheading */}
        <div className="text-center mt-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white uppercase">
            Formula One <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-red-600 bg-clip-text text-transparent">
              Race Analytics Platform
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-xl text-zinc-400 font-sans max-w-3xl mx-auto leading-relaxed">
            A full-stack motorsport telemetry and historical race engineering platform computing career statistics, tyre degradation curves, qualifying deltas, 2D circuit replays, and 100Hz car telemetry directly from verified Formula 1 datasets.
          </p>
        </div>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-glow-red transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Launch Telemetry Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/race-replay"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-zinc-100 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>2D Track Replay Simulator</span>
          </Link>
          <Link
            href="/drivers"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all transform hover:-translate-y-0.5"
          >
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>Driver Career Analytics</span>
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-zinc-300 bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800/80 transition-all"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Architecture & Documentation</span>
          </Link>
        </div>

        {/* Real Data Governance Notice Banner */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl p-5 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-red-500 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wider">
                      Authentic Data Governance · Zero Synthetic Data Policy
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold">
                      100% DATASET-DRIVEN
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isClient && loadedCount > 0
                      ? `${loadedCount} of ${totalCount} official telemetry & historical datasets active (1,125 Grands Prix, 26,760 race classifications, 589,000+ lap records).`
                      : "Every statistic is dynamically computed from official Ergast, Jolpica, and FastF1 CSV/JSON datasets."}
                  </p>
                </div>
              </div>
              <Link
                href="/data-manager"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors"
              >
                <span>Inspect Datasets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty & Recruiter 2-Minute Executive Briefing */}
      <section
        aria-labelledby="executive-briefing-heading"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-zinc-900"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#E10600] font-bold block">
              Academic & Technical Evaluation Overview
            </span>
            <h2
              id="executive-briefing-heading"
              className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1"
            >
              2-Minute Project Briefing
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-400 max-w-md">
            Designed for rapid evaluation by university faculty, technical interviewers, and motorsport engineering reviewers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem Statement */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#E10600]" />
              <span>1. Problem Statement</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Bridging Raw Motorsport Logs & Pit-Wall Analytics
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Modern Formula 1 cars generate hundreds of megabytes of telemetry and timing data per race weekend, while historical archives span over 1,125 Grands Prix since 1950. Existing consumer dashboards either rely on hardcoded summaries, lack multi-variable engineering correlation (such as tyre compound degradation slopes vs. pit windows), or fabricate placeholder numbers when sensor feeds are absent.
            </p>
          </div>

          {/* Project Objective */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>2. Project Objective</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Real-Time Dynamic Aggregation with Zero Synthetic Data
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              To engineer a modular, production-grade full-stack analytics platform that ingests raw CSV and GeoJSON datasets, indexes over 589,000 lap records in memory using typed arrays, and dynamically computes driver career radars, constructor reliability metrics, championship clinching mathematics, and 2D circuit replays without a single hardcoded statistic.
            </p>
          </div>
        </div>

        {/* 5-Stage Data Pipeline & Architecture */}
        <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/90 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>3. Five-Stage Engineering Architecture & Data Flow</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              CSV / GeoJSON → DataStore → Analytics Engine → REST APIs → ECharts & 2D SVG UI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-[#E10600] font-bold uppercase block">Stage 01</span>
              <strong className="text-white text-sm block mt-0.5">CSV & GeoJSON Datasets</strong>
              <p className="text-[11px] text-zinc-400 font-sans mt-1.5">
                16 Ergast & FastF1 tables (`drivers`, `results`, `lap_times`, `pit_stops`, `telemetry`, `track_maps`).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">Stage 02</span>
              <strong className="text-white text-sm block mt-0.5">In-Memory DataStore</strong>
              <p className="text-[11px] text-zinc-400 font-sans mt-1.5">
                `mtime`-aware memoization cache & `Int32Array` lap indexer parsing 589k+ laps in milliseconds.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Stage 03</span>
              <strong className="text-white text-sm block mt-0.5">Analytics Engine</strong>
              <p className="text-[11px] text-zinc-400 font-sans mt-1.5">
                8 dedicated TypeScript domain services computing radars, degradation slopes, streaks, and clinch math.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Stage 04</span>
              <strong className="text-white text-sm block mt-0.5">REST API Layer</strong>
              <p className="text-[11px] text-zinc-400 font-sans mt-1.5">
                19 Next.js App Router API endpoints with parameter validation and structured JSON responses.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-purple-400 font-bold uppercase block">Stage 05</span>
              <strong className="text-white text-sm block mt-0.5">Interactive Visualization</strong>
              <p className="text-[11px] text-zinc-400 font-sans mt-1.5">
                Apache ECharts telemetry traces, 2D SVG track replay, global `⌘K` search, and PDF/CSV/PNG export.
              </p>
            </div>
          </div>
        </div>

        {/* Datasets & Tech Stack Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              <Database className="w-4 h-4" />
              <span>4. Verified Datasets Ingested</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 font-mono pt-1">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 1,125 Grands Prix (1950–2024)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 26,760 Race Classifications</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 589,000+ Lap Time Records</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 859 Drivers & 211 Constructors</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 10,300+ Pit Stop Durations</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> 40 Satellite GeoJSON Circuits</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>5. Production Technology Stack</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "Next.js 14 (App Router)",
                "React 18",
                "TypeScript 5 (Strict)",
                "Tailwind CSS 3",
                "Apache ECharts 5",
                "PapaParse CSV Engine",
                "jsPDF Vector Reports",
                "Framer Motion",
                "Lucide Engineering Icons",
                "Docker / Vercel Ready",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Complete Interactive Feature Directory */}
      <section
        aria-labelledby="feature-modules-heading"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-zinc-900"
      >
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold">
            Complete Engineering Suite
          </span>
          <h2
            id="feature-modules-heading"
            className="text-2xl sm:text-3xl font-bold text-white mt-2 uppercase tracking-tight"
          >
            12 Interactive Analytics Modules
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
            Select any module below during live demonstration to inspect real-time calculations, interactive charts, and exportable engineering tables.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULE_CARDS.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="group rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-6 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-[#E10600] uppercase tracking-wider">
                    {mod.tag}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300">
                <span>Route: {mod.href}</span>
                <span>Open Module →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
