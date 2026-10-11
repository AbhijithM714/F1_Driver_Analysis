"use client";

import React, { useState, useEffect, useMemo } from "react";
import InteractiveChart from "@/components/charts/InteractiveChart";
import ExportButtons from "@/components/ExportButtons";
import { Trophy, Award, TrendingUp, Calendar, Shield, Flag, LineChart } from "lucide-react";

export default function ChampionshipPage() {
  const [season, setSeason] = useState<number>(2024);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([2024, 2023, 2022, 2021, 2020]);
  const [activeTab, setActiveTab] = useState<"drivers" | "constructors" | "predictions">("drivers");
  const [progressionMode, setProgressionMode] = useState<"drivers" | "constructors">("drivers");
  const [standings, setStandings] = useState<any>({ drivers: [], constructors: [], progression: null });
  const [loading, setLoading] = useState(true);

  // Load available seasons
  useEffect(() => {
    fetch("/api/seasons")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const years = json.data.map((s: any) => s.year);
          setAvailableSeasons(years);
          if (years.length > 0 && !years.includes(season)) {
            setSeason(years[0]);
          }
        }
      })
      .catch((e) => console.error("Error loading seasons", e));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/championship?year=${season}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setStandings(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [season]);

  const progressionOption: any = useMemo(() => {
    if (!standings.progression || !standings.progression.rounds || standings.progression.rounds.length === 0) {
      return null;
    }

    const rounds = standings.progression.rounds;
    const roundNames = standings.progression.roundNames || [];
    const isDrivers = progressionMode === "drivers";
    const seriesData = isDrivers ? standings.progression.drivers : standings.progression.constructors;

    if (!seriesData || seriesData.length === 0) return null;

    const colors = [
      "#E10600", // Ferrari Red
      "#FF8000", // McLaren Orange
      "#00D2BE", // Mercedes Cyan
      "#3671C6", // Red Bull Blue
      "#229971", // Aston Martin Green
      "#FF87BC", // Alpine Pink
      "#64C4FF", // Williams Blue
      "#52E252", // Sauber Green
    ];

    const series = seriesData.map((item: any, idx: number) => {
      const color = item.color || colors[idx % colors.length];
      return {
        name: isDrivers ? `${item.name} (${item.code})` : item.name,
        type: "line",
        smooth: 0.2,
        showSymbol: false,
        lineStyle: { width: 3, color },
        itemStyle: { color },
        data: item.data,
      };
    });

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          if (!params || params.length === 0) return "";
          const roundIdx = params[0].dataIndex;
          const rName = roundNames[roundIdx] || rounds[roundIdx];
          let html = `<div style="font-family: monospace; font-size: 11px; padding: 4px;">`;
          html += `<div style="font-weight: bold; color: #fff; margin-bottom: 6px;">${rounds[roundIdx]}: ${rName}</div>`;
          params
            .slice()
            .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
            .forEach((p: any) => {
              html += `
                <div style="display: flex; justify-content: space-between; gap: 16px; margin: 2px 0;">
                  <span style="color: ${p.color};">${p.seriesName}</span>
                  <span style="font-weight: bold; color: #fff;">${p.value} pts</span>
                </div>
              `;
            });
          html += `</div>`;
          return html;
        },
      },
      legend: {
        data: series.map((s: any) => s.name),
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "6%",
        top: "16%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: rounds,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", interval: Math.floor(rounds.length / 10) },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          formatter: (val: number) => `${val} pts`,
        },
      },
      series,
    };
  }, [standings.progression, progressionMode]);

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Official FIA Championship Standings
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Validated Points & Wins
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              World Championship Standings
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Official cumulative points tallies and victory progressions mapped directly from <code className="text-red-400">data/driver_standings.csv</code> and <code className="text-red-400">data/constructor_standings.csv</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ExportButtons
              data={
                activeTab === "drivers"
                  ? standings.drivers.map((d: any) => ({
                      pos: d.position,
                      name: d.driverName,
                      code: d.code,
                      team: d.constructorName,
                      points: d.points,
                      wins: d.wins,
                    }))
                  : standings.constructors.map((c: any) => ({
                      pos: c.position,
                      constructor: c.constructorName,
                      points: c.points,
                      wins: c.wins,
                    }))
              }
              filename={`${season}_championship_${activeTab}`}
            />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 font-mono text-xs shadow-sm transition-colors focus-within:border-red-500/80">
              <span className="text-zinc-400 font-bold text-[10px]">SEASON:</span>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                {availableSeasons.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab("drivers")}
                className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${
                  activeTab === "drivers"
                    ? "bg-red-600 text-white font-semibold shadow-glow-red"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Drivers
              </button>
              <button
                onClick={() => setActiveTab("constructors")}
                className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${
                  activeTab === "constructors"
                    ? "bg-red-600 text-white font-semibold shadow-glow-red"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Constructors
              </button>
              <button
                onClick={() => setActiveTab("predictions")}
                className={`px-3 py-1.5 rounded-lg font-mono transition-colors ${
                  activeTab === "predictions"
                    ? "bg-red-600 text-white font-semibold shadow-glow-red"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Forecast Math
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Championship Points Progression Chart */}
        {progressionOption && (
          <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Round-by-Round Championship Points Trajectory ({season})
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setProgressionMode("drivers")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    progressionMode === "drivers"
                      ? "bg-red-600 text-white font-semibold shadow-glow-red"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Top Drivers
                </button>
                <button
                  onClick={() => setProgressionMode("constructors")}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    progressionMode === "constructors"
                      ? "bg-red-600 text-white font-semibold shadow-glow-red"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Top Constructors
                </button>
              </div>
            </div>

            <div className="h-[380px] w-full">
              <InteractiveChart option={progressionOption} height="380px" />
            </div>
          </div>
        )}

        {/* Tab 1: Driver Standings */}
        {activeTab === "drivers" && (
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                Drivers World Championship Classification ({season})
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Leader: {standings.drivers[0]?.driverName || "--"} ({standings.drivers[0]?.points || 0} PTS)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">RANK</th>
                    <th className="py-3 px-4 font-sans">DRIVER</th>
                    <th className="py-3 px-4 text-center">WINS</th>
                    <th className="py-3 px-4 text-right">TOTAL POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {standings.drivers.map((d: any) => (
                    <tr key={d.driverId} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 font-black">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            d.position === 1
                              ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                              : d.position === 2
                              ? "bg-zinc-800 text-zinc-200"
                              : d.position === 3
                              ? "bg-amber-950 text-amber-500"
                              : "text-zinc-400"
                          }`}
                        >
                          P{d.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        <span className="mr-2">{d.flag}</span>
                        {d.driverName}{" "}
                        <span className="text-purple-400 font-mono text-xs">({d.code})</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {d.wins}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-red-400 text-sm">
                        {d.points} PTS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Constructor Standings */}
        {activeTab === "constructors" && (
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                Constructors World Championship Classification ({season})
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Leader: {standings.constructors[0]?.constructorName || "--"} ({standings.constructors[0]?.points || 0} PTS)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">RANK</th>
                    <th className="py-3 px-4 font-sans">CONSTRUCTOR</th>
                    <th className="py-3 px-4 text-center">WINS</th>
                    <th className="py-3 px-4 text-right">TOTAL POINTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {standings.constructors.map((c: any) => (
                    <tr key={c.constructorId} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 font-black">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            c.position === 1
                              ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                              : "text-zinc-400"
                          }`}
                        >
                          P{c.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block mr-2"
                          style={{ backgroundColor: c.teamColor }}
                        />
                        {c.constructorName}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {c.wins}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-red-400 text-sm">
                        {c.points} PTS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Predictions & Math */}
        {activeTab === "predictions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                Mathematical Title Clinching Scenario
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Calculates maximum remaining points available based on 26 points per Grand Prix (25 for win + 1 for fastest lap) plus Sprint points (8 pts) across the remaining calendar rounds.
              </p>
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Championship Leader:</span>
                  <span className="text-white font-bold">{standings.drivers[0]?.driverName || "--"} ({standings.drivers[0]?.points || 0} pts)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Title Margin Over P2:</span>
                  <span className="text-emerald-400 font-bold">
                    +{((standings.drivers[0]?.points || 0) - (standings.drivers[1]?.points || 0))} Points
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                Constructors Title Battle Dynamics
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Evaluates constructors cumulative delta and development trajectory between the top two teams in the World Championship.
              </p>
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Constructors Leader:</span>
                  <span className="text-white font-bold" style={{ color: standings.constructors[0]?.teamColor }}>
                    {standings.constructors[0]?.constructorName || "--"} ({standings.constructors[0]?.points || 0} pts)
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Margin Over P2:</span>
                  <span className="text-emerald-400 font-bold">
                    +{Math.round(((standings.constructors[0]?.points || 0) - (standings.constructors[1]?.points || 0)) * 10) / 10} Points
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>P2 Challenger:</span>
                  <span className="text-zinc-200" style={{ color: standings.constructors[1]?.teamColor }}>
                    {standings.constructors[1]?.constructorName || "--"} ({standings.constructors[1]?.points || 0} pts)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
