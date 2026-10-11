"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { F1_TEAMS } from "@/lib/f1Themes";
import InteractiveChart from "@/components/charts/InteractiveChart";
import FavoriteButton from "@/components/FavoriteButton";
import ExportButtons from "@/components/ExportButtons";
import {
  Shield,
  Search,
  Trophy,
  Award,
  Zap,
  Activity,
  ChevronRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  X,
  Gauge,
  BarChart2,
  Timer,
  Wind,
  ArrowRightLeft,
} from "lucide-react";

interface ConstructorRecord {
  constructorId: number;
  constructorRef: string;
  name: string;
  nationality: string;
  flag: string;
  url: string;
  color: string;
  accentColor: string;
  totalWins: number;
  totalPodiums: number;
  totalPoints: number;
  totalStarts: number;
  totalDnfs: number;
  reliabilityScore: number;
  isCurrentGrid: boolean;
}

export default function ConstructorsPage() {
  const [constructors, setConstructors] = useState<ConstructorRecord[]>([]);
  const [drsSpeeds, setDrsSpeeds] = useState<any[]>([]);
  const [pitStops, setPitStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"current" | "all">("current");
  const [chartMetric, setChartMetric] = useState<"wins" | "podiums">("wins");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConstructor, setSelectedConstructor] = useState<ConstructorRecord | null>(null);

  const constructorChartOption: any = useMemo(() => {
    if (constructors.length === 0) return null;

    const sorted = [...constructors]
      .filter((c) => (chartMetric === "wins" ? c.totalWins > 0 : c.totalPodiums > 0))
      .sort((a, b) =>
        chartMetric === "wins"
          ? b.totalWins - a.totalWins
          : b.totalPodiums - a.totalPodiums
      )
      .slice(0, 10);

    const names = sorted.map((c) => c.name);
    const values = sorted.map((c) => ({
      value: chartMetric === "wins" ? c.totalWins : c.totalPodiums,
      itemStyle: { color: c.color },
      name: c.name,
      starts: c.totalStarts,
      winRate: c.totalStarts > 0 ? ((c.totalWins / c.totalStarts) * 100).toFixed(1) : "0.0",
    }));

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const item = params[0]?.data;
          if (!item) return "";
          return `
            <div style="font-family: monospace; font-size: 12px; padding: 4px;">
              <div style="font-weight: bold; color: #fff;">${item.name}</div>
              <div style="color: #a1a1aa; font-size: 11px;">Starts: ${item.starts} GPs</div>
              <div style="color: #f87171; font-weight: bold; margin-top: 4px;">
                ${chartMetric === "wins" ? "Grand Prix Victories" : "Total Podiums"}: ${item.value}
              </div>
              <div style="color: #38bdf8; font-size: 11px;">Win Rate: ${item.winRate}%</div>
            </div>
          `;
        },
      },
      grid: {
        left: "3%",
        right: "5%",
        bottom: "10%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: names,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: {
          color: "#d4d4d8",
          interval: 0,
          rotate: 15,
          fontSize: 11,
        },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a" },
      },
      series: [
        {
          name: chartMetric === "wins" ? "Victories" : "Podiums",
          type: "bar",
          barWidth: "40%",
          data: values,
          label: {
            show: true,
            position: "top",
            color: "#a1a1aa",
            fontSize: 10,
            fontFamily: "monospace",
          },
        },
      ],
    };
  }, [constructors, chartMetric]);

  const reliabilityChartOption: any = useMemo(() => {
    const currentTeams = constructors.filter((c) => c.isCurrentGrid);
    if (currentTeams.length === 0) return null;

    const names = currentTeams.map((c) => c.name);
    const values = currentTeams.map((c) => ({
      value: c.reliabilityScore,
      itemStyle: { color: c.color },
    }));

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
        formatter: (params: any) => {
          const item = params[0];
          return `<div class="font-mono text-xs">
            <span class="font-bold text-white">${item.name}</span>:
            <span class="text-emerald-400 font-bold ml-1">${item.value}% Reliability</span>
          </div>`;
        },
      },
      grid: { top: 25, right: 20, bottom: 45, left: 45 },
      xAxis: {
        type: "category",
        data: names,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#d4d4d8", fontSize: 10, rotate: 20, interval: 0 },
      },
      yAxis: {
        type: "value",
        min: 60,
        max: 100,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace", formatter: "{value}%" },
      },
      series: [
        {
          name: "Reliability",
          type: "bar",
          barWidth: "40%",
          data: values,
        },
      ],
    };
  }, [constructors]);

  const aeroSpeedTrapOption: any = useMemo(() => {
    if (!drsSpeeds || drsSpeeds.length === 0) return null;

    const drivers = drsSpeeds.slice(0, 8);
    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
      },
      grid: { top: 25, right: 20, bottom: 30, left: 50 },
      xAxis: {
        type: "category",
        data: drivers.map((d) => d.driverCode),
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#f4f4f5", fontSize: 11, fontFamily: "monospace", fontWeight: "bold" },
      },
      yAxis: {
        type: "value",
        min: 310,
        max: 335,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace", formatter: "{value} km/h" },
      },
      series: [
        {
          name: "DRS Top Speed",
          type: "bar",
          barWidth: "40%",
          data: drivers.map((d) => Number(d.drsTopSpeedKmh)),
          itemStyle: {
            color: "#EF4444",
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [drsSpeeds]);

  useEffect(() => {
    async function loadConstructors() {
      try {
        setLoading(true);
        const res = await fetch("/api/constructors");
        const json = await res.json();
        if (json.success) {
          setConstructors(json.data);
          // Set default selected team (e.g. Ferrari or Red Bull)
          const ferrari = json.data.find((c: any) => c.constructorRef === "ferrari") || json.data[0];
          setSelectedConstructor(ferrari);
        }
      } catch (err) {
        console.error("Failed to load constructors:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConstructors();

    fetch(`/api/races/1121/drs`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setDrsSpeeds(j.data);
      })
      .catch(console.error);

    fetch(`/api/races/1121`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.pitStops) setPitStops(j.data.pitStops);
      })
      .catch(console.error);
  }, []);

  const filteredConstructors = useMemo(() => {
    return constructors.filter((c) => {
      if (activeTab === "current" && !c.isCurrentGrid) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRef = c.constructorRef.toLowerCase().includes(q);
        const matchesNat = c.nationality.toLowerCase().includes(q);
        if (!matchesName && !matchesRef && !matchesNat) return false;
      }
      return true;
    });
  }, [constructors, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Official Ergast Constructors Dataset
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {constructors.length} Constructors Recorded (1950 – 2024)
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Formula 1 Constructor Intelligence
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Explore official constructor records, all-time victories, historical podiums, points progression, and mechanical reliability mapped directly from <code className="text-red-400">data/constructors.csv</code> and <code className="text-red-400">data/results.csv</code>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButtons
              data={filteredConstructors.map((c) => ({
                constructorId: c.constructorId,
                name: c.name,
                nationality: c.nationality,
                isActive: c.isCurrentGrid ? "YES" : "NO",
                totalWins: c.totalWins,
                totalPodiums: c.totalPodiums,
                totalPoints: c.totalPoints,
                totalStarts: c.totalStarts,
                reliabilityScore: `${c.reliabilityScore}%`,
              }))}
              filename="f1_constructors_catalog"
            />

            <Link
              href="/constructor-comparison"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-colors shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <span>Compare Teams</span>
            </Link>
          </div>
        </div>

        {/* Selected Constructor Spotlight Panel */}
        {selectedConstructor && (
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden p-6 sm:p-8 shadow-panel">
            <div
              className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: selectedConstructor.color }}
            />
            <div
              className="h-1.5 absolute top-0 left-0 right-0"
              style={{ backgroundColor: selectedConstructor.color }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedConstructor.color }} />
                    {selectedConstructor.constructorRef.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <span>{selectedConstructor.flag}</span>
                    <span>{selectedConstructor.nationality}</span>
                  </span>
                  {selectedConstructor.isCurrentGrid && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-red-950/80 text-red-400 border border-red-800">
                      ACTIVE 2024 CONSTRUCTOR
                    </span>
                  )}
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  {selectedConstructor.name}
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Official ID #{selectedConstructor.constructorId} • Total Starts: {selectedConstructor.totalStarts} Grand Prix
                </p>
              </div>

              {/* Spotlight KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[110px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Wins</span>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    {selectedConstructor.totalWins}
                  </div>
                  <span className="text-[10px] text-zinc-400">Grand Prix Wins</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[110px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Podiums</span>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                    {selectedConstructor.totalPodiums}
                  </div>
                  <span className="text-[10px] text-zinc-400">Top 3 Finishes</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[110px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Points</span>
                  <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
                    {selectedConstructor.totalPoints}
                  </div>
                  <span className="text-[10px] text-zinc-400">Total Points</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[110px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Reliability</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                    {selectedConstructor.reliabilityScore}%
                  </div>
                  <span className="text-[10px] text-zinc-400">Finished Rate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All-Time Constructor Records Interactive Chart */}
        {constructorChartOption && (
          <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Formula 1 All-Time Constructor Dominance
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setChartMetric("wins")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    chartMetric === "wins"
                      ? "bg-red-600 text-white font-semibold shadow-glow-red"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Grand Prix Victories
                </button>
                <button
                  onClick={() => setChartMetric("podiums")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    chartMetric === "podiums"
                      ? "bg-red-600 text-white font-semibold shadow-glow-red"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Total Podiums
                </button>
              </div>
            </div>

            <div className="h-[360px] w-full">
              <InteractiveChart option={constructorChartOption} height="360px" />
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab("current")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "current"
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              2024 Current Constructors ({constructors.filter((c) => c.isCurrentGrid).length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Historic ({constructors.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search constructor, nation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>

        {/* Constructors Grid */}
        {loading ? (
          <div className="p-16 text-center text-zinc-500 font-mono text-sm">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping mx-auto mb-3" />
            COMPUTING CONSTRUCTOR STATISTICS...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredConstructors.map((c) => {
              const isSelected = selectedConstructor?.constructorId === c.constructorId;
              return (
                <div
                  key={c.constructorId}
                  onClick={() => setSelectedConstructor(c)}
                  className={`group relative rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-panel ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-600 ring-1 ring-zinc-500"
                      : "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950"
                  }`}
                >
                  <div className="h-1 absolute top-0 left-0 right-0" style={{ backgroundColor: c.color }} />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold tracking-wider" style={{ color: c.color }}>
                        {c.constructorRef.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <FavoriteButton
                          type="constructor"
                          id={c.constructorRef}
                          name={c.name}
                          subtitle={`${c.nationality} Team`}
                          color={c.color}
                          size="sm"
                        />
                        <span className="text-[10px] font-mono text-zinc-500">
                          #{c.constructorId}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 font-sans">
                        <span className="text-sm">{c.flag}</span>
                        <span>{c.nationality}</span>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900 text-center font-mono text-xs">
                      <div className="p-1.5 rounded bg-zinc-900">
                        <span className="text-[10px] text-zinc-500 block">WINS</span>
                        <span className="text-white font-bold">{c.totalWins}</span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900">
                        <span className="text-[10px] text-zinc-500 block">PODIUM</span>
                        <span className="text-cyan-400 font-bold">{c.totalPodiums}</span>
                      </div>
                      <div className="p-1.5 rounded bg-zinc-900">
                        <span className="text-[10px] text-zinc-500 block">PTS</span>
                        <span className="text-purple-400 font-bold">{Math.round(c.totalPoints)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Reliability: {c.reliabilityScore}%</span>
                    <Link
                      href={`/constructors/${c.constructorRef}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#E10600] hover:text-[#ff3833] font-sans font-semibold text-xs flex items-center gap-0.5"
                    >
                      Profile ➔
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Authentic Constructor Telemetry & Subsystems */}
        <div className="space-y-4 pt-6 border-t border-zinc-900">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Sub-System Telemetry & Engineering Modules
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Chassis Reliability Index */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Chassis Mechanical Reliability Index (%)
                  </h4>
                </div>
                <span className="text-xs font-mono text-zinc-500">2024 Current Grid</span>
              </div>
              <p className="text-xs text-zinc-400">
                Finishing reliability percentage calculated from mechanical classifications versus race retirements.
              </p>
              {reliabilityChartOption ? (
                <InteractiveChart option={reliabilityChartOption} height="280px" />
              ) : (
                <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                  Loading reliability metrics...
                </div>
              )}
            </div>

            {/* 2. Straight-Line Aero Efficiency & DRS Speed Ceiling */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-red-500" />
                  <h4 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Aero Efficiency & DRS Speed Ceiling (km/h)
                  </h4>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">Max 330.4 km/h</span>
              </div>
              <p className="text-xs text-zinc-400">
                Peak velocity radar readings clocked down main straight DRS activation zones.
              </p>
              {aeroSpeedTrapOption ? (
                <InteractiveChart option={aeroSpeedTrapOption} height="280px" />
              ) : (
                <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                  Loading aero speed trap radar records...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
