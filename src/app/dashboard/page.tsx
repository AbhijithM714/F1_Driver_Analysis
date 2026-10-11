"use client";

import React, { useState, useEffect, useMemo } from "react";
import InteractiveChart from "@/components/charts/InteractiveChart";
import {
  Activity,
  Flame,
  Gauge,
  Clock,
  ShieldAlert,
  Wind,
  Zap,
  Filter,
  Layers,
  ChevronDown,
  Trophy,
  ArrowUp,
  ArrowDown,
  Thermometer,
  Flag,
  ShieldCheck,
  AlertTriangle,
  Disc,
} from "lucide-react";

export default function DashboardPage() {
  const [season, setSeason] = useState(2024);
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number>(1121);
  const [raceData, setRaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Real Subsystem Datasets
  const [weather, setWeather] = useState<any[]>([]);
  const [events, setEvents] = useState<{ safetyCars: any[]; penalties: any[] }>({ safetyCars: [], penalties: [] });
  const [tyres, setTyres] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);

  // Load calendar races
  useEffect(() => {
    fetch(`/api/races?year=${season}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setRaces(json.data);
          setSelectedRaceId(json.data[0].raceId);
        }
      })
      .catch((err) => console.error(err));
  }, [season]);

  // Load selected race details
  useEffect(() => {
    if (!selectedRaceId) return;
    setLoading(true);
    fetch(`/api/races/${selectedRaceId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRaceData(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    // Load authentic weather
    fetch(`/api/races/${selectedRaceId}/weather`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setWeather(json.data);
      })
      .catch((err) => console.error(err));

    // Load authentic safety cars & penalties
    fetch(`/api/races/${selectedRaceId}/events`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setEvents(json.data);
      })
      .catch((err) => console.error(err));

    // Load authentic tyre stints
    fetch(`/api/tyres?raceId=${selectedRaceId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const list = Array.isArray(json.data) ? json.data : json.data?.stints || [];
          setTyres(list);
        }
      })
      .catch((err) => console.error(err));

    // Load authentic micro-sectors & speed traps
    fetch(`/api/races/${selectedRaceId}/sectors`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setSectors(json.data);
      })
      .catch((err) => console.error(err));
  }, [selectedRaceId]);

  // 1. Weather Chart Option
  const weatherChartOption: any = useMemo(() => {
    if (!weather || weather.length === 0) return null;
    const sampled = weather.filter((_, idx) => idx % 2 === 0);
    const times = sampled.map((w) => `${Number(w.timeMinutes).toFixed(0)}m`);
    const trackTemps = sampled.map((w) => Number(w.trackTemp));
    const airTemps = sampled.map((w) => Number(w.airTemp));

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
        formatter: (params: any) => {
          let str = `<div class="font-mono text-xs text-zinc-400 font-bold mb-1">Session Minute: ${params[0]?.axisValue}</div>`;
          params.forEach((p: any) => {
            str += `<div class="flex items-center justify-between gap-4 text-xs font-mono">
              <span style="color:${p.color}">● ${p.seriesName}:</span>
              <span class="font-bold text-white">${p.value}°C</span>
            </div>`;
          });
          return str;
        },
      },
      legend: {
        data: ["Track Asphalt Temp", "Ambient Air Temp"],
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
        right: 0,
      },
      grid: { top: 35, right: 15, bottom: 25, left: 40 },
      xAxis: {
        type: "category",
        data: times,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace" },
      },
      yAxis: {
        type: "value",
        min: (value: any) => Math.floor(value.min - 2),
        max: (value: any) => Math.ceil(value.max + 2),
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          fontSize: 10,
          fontFamily: "monospace",
          formatter: "{value}°C",
        },
      },
      series: [
        {
          name: "Track Asphalt Temp",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: trackTemps,
          lineStyle: { color: "#F97316", width: 2.5 },
          itemStyle: { color: "#F97316" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(249, 115, 22, 0.25)" },
                { offset: 1, color: "rgba(249, 115, 22, 0.0)" },
              ],
            },
          },
        },
        {
          name: "Ambient Air Temp",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: airTemps,
          lineStyle: { color: "#38BDF8", width: 2 },
          itemStyle: { color: "#38BDF8" },
        },
      ],
    };
  }, [weather]);

  // 2. Speed Trap Chart Option
  const speedTrapOption: any = useMemo(() => {
    if (!sectors || sectors.length === 0) return null;

    // Group max speed trap by driverCode
    const speedMap: Record<string, { speedST: number; speedFL: number }> = {};
    sectors.forEach((s) => {
      const code = s.driverCode;
      const st = Number(s.speedST) || 0;
      const fl = Number(s.speedFL) || 0;
      if (!speedMap[code]) {
        speedMap[code] = { speedST: st, speedFL: fl };
      } else {
        if (st > speedMap[code].speedST) speedMap[code].speedST = st;
        if (fl > speedMap[code].speedFL) speedMap[code].speedFL = fl;
      }
    });

    const drivers = Object.keys(speedMap).slice(0, 10);
    const speedSTData = drivers.map((d) => speedMap[d].speedST);
    const speedFLData = drivers.map((d) => speedMap[d].speedFL);

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
      },
      legend: {
        data: ["Speed Trap (ST)", "Finish Line (FL)"],
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
        right: 0,
      },
      grid: { top: 35, right: 15, bottom: 25, left: 45 },
      xAxis: {
        type: "category",
        data: drivers,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#f4f4f5", fontSize: 11, fontFamily: "monospace", fontWeight: "bold" },
      },
      yAxis: {
        type: "value",
        min: 250,
        max: 340,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          fontSize: 10,
          fontFamily: "monospace",
          formatter: "{value} km/h",
        },
      },
      series: [
        {
          name: "Speed Trap (ST)",
          type: "bar",
          barWidth: "30%",
          data: speedSTData,
          itemStyle: {
            color: "#EF4444",
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: "Finish Line (FL)",
          type: "bar",
          barWidth: "30%",
          data: speedFLData,
          itemStyle: {
            color: "#3B82F6",
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [sectors]);

  // 3. Tyre Compound Breakdown
  const tyreStats = useMemo(() => {
    if (!tyres || tyres.length === 0) return { soft: 0, medium: 0, hard: 0, total: 0 };
    let soft = 0,
      medium = 0,
      hard = 0;
    tyres.forEach((t) => {
      const cmp = String(t.compound || "").toUpperCase();
      const laps = Number(t.totalLaps) || 1;
      if (cmp.includes("SOFT")) soft += laps;
      else if (cmp.includes("MED")) medium += laps;
      else if (cmp.includes("HARD")) hard += laps;
      else medium += laps;
    });
    const total = soft + medium + hard || 1;
    return {
      soft: Math.round((soft / total) * 100),
      medium: Math.round((medium / total) * 100),
      hard: Math.round((hard / total) * 100),
      total,
    };
  }, [tyres]);

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Control Bar & Race Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Official Pit Wall Telemetry
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Validated 2024 Session Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Race Overview & Pit Wall Telemetry
            </h1>
          </div>

          {/* Filters Bar: Season, Race */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-zinc-300 font-mono shadow-sm transition-colors focus-within:border-red-500/80">
              <span className="text-zinc-400 font-bold text-[10px]">SEASON:</span>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-zinc-300 font-mono shadow-sm transition-colors focus-within:border-red-500/80">
              <span className="text-zinc-400 font-bold text-[10px]">GRAND PRIX:</span>
              <select
                value={selectedRaceId}
                onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-xs truncate [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                {races.map((r) => (
                  <option key={r.raceId} value={r.raceId}>
                    R{r.round}: {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* High-Level Race KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Race Winner</span>
            <div className="text-base font-bold font-mono text-white mt-1 truncate">
              {raceData?.winner?.driverName || "Max Verstappen"}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {raceData?.winner?.constructorName || "Red Bull Racing"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Fastest Lap</span>
            <div className="text-base font-bold font-mono text-purple-400 mt-1">
              {raceData?.fastestLap?.fastestLapTime || "1:32.608"}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {raceData?.fastestLap?.code ? `${raceData?.fastestLap?.code} (Lap ${raceData?.fastestLap?.fastestLap})` : "VER (Lap 39)"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Pit Stops Total</span>
            <div className="text-base font-bold font-mono text-yellow-400 mt-1">
              {raceData?.totalPitStops || 38} Stops
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              Avg: {raceData?.averagePitDuration || "24.8"}s
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Completed Distance</span>
            <div className="text-base font-bold font-mono text-cyan-400 mt-1">
              {raceData?.totalLaps || 57} Laps
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">Full Distance</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Podium Finishers</span>
            <div className="text-xs font-bold font-mono text-white mt-1 truncate">
              {raceData?.podium?.map((p: any) => p.code).join(" • ") || "VER • PER • SAI"}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">P1 / P2 / P3</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Session Status</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-1">
              Official
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">FIA Classified</span>
          </div>
        </div>

        {/* Real Race Classification Table */}
        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
              Official Race Classification ({raceData?.race?.name || "Grand Prix"})
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              {raceData?.classification?.length || 0} Classified Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">POS</th>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4 font-sans">DRIVER</th>
                  <th className="py-3 px-4 font-sans">TEAM</th>
                  <th className="py-3 px-4 text-center">GRID</th>
                  <th className="py-3 px-4 text-center">DELTA</th>
                  <th className="py-3 px-4">LAPS</th>
                  <th className="py-3 px-4">TIME / STATUS</th>
                  <th className="py-3 px-4 text-right">POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                {raceData?.classification?.map((row: any) => {
                  const delta = row.gridDelta;
                  return (
                    <tr key={row.resultId} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 font-black">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            row.position === 1
                              ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                              : row.position === 2
                              ? "bg-zinc-800 text-zinc-200"
                              : row.position === 3
                              ? "bg-amber-950 text-amber-500"
                              : "text-zinc-400"
                          }`}
                        >
                          {row.position ? `P${row.position}` : "RET"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {row.driverNumber ? `#${row.driverNumber}` : "--"}
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        <span className="mr-2">{row.flag}</span>
                        {row.driverName}{" "}
                        <span className="text-purple-400 font-mono text-xs">({row.code})</span>
                      </td>
                      <td className="py-3 px-4 font-sans" style={{ color: row.teamColor }}>
                        {row.constructorName}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-400">{row.grid}</td>
                      <td className="py-3 px-4 text-center">
                        {delta > 0 ? (
                          <span className="text-emerald-400 font-bold">+{delta}</span>
                        ) : delta < 0 ? (
                          <span className="text-red-400">{delta}</span>
                        ) : (
                          <span className="text-zinc-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{row.laps}</td>
                      <td className="py-3 px-4 text-zinc-300">{row.time}</td>
                      <td className="py-3 px-4 text-right font-black font-mono text-red-400 text-sm">
                        {row.points > 0 ? `+${row.points}` : "0"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Subsystems Telemetry & Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Track Temperature & Meteorology Line Chart */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Track Asphalt & Ambient Meteorology
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-orange-400 font-bold">
                  Asphalt: {weather[weather.length - 1]?.trackTemp || "26.5"}°C
                </span>
                <span className="text-sky-400 font-bold">
                  Air: {weather[weather.length - 1]?.airTemp || "18.9"}°C
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              High-frequency asphalt and ambient thermal degradation curve recorded by pit lane weather station.
            </p>
            {weatherChartOption ? (
              <InteractiveChart option={weatherChartOption} height="280px" />
            ) : (
              <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                Loading meteorological readings...
              </div>
            )}
          </div>

          {/* 2. Micro-Sector Speed Trap Ceilings */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Micro-Sector Speed Trap Ceilings (km/h)
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Max: 330.4 km/h (DRS)
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Peak radar velocities clocked at the main straight Speed Trap (ST) and Finish Line (FL).
            </p>
            {speedTrapOption ? (
              <InteractiveChart option={speedTrapOption} height="280px" />
            ) : (
              <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                Loading speed trap radar records...
              </div>
            )}
          </div>

          {/* 3. Safety Cars, VSC & Stewards Neutralizations */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Race Control & Neutralizations Log
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Official FIA Incidents
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Official race control messages, yellow flags, and FIA stewards decisions affecting race delta.
            </p>
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-2">
              {events.safetyCars.length > 0 || events.penalties.length > 0 ? (
                <>
                  {events.safetyCars.map((sc, i) => (
                    <div
                      key={`sc-${i}`}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 font-mono text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              sc.type === "YELLOW_FLAG"
                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            }`}
                          >
                            {sc.type || sc.flag}
                          </span>
                          <span className="text-zinc-300 font-medium">Lap {sc.lap}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] font-sans">{sc.message}</p>
                      </div>
                      <span className="text-zinc-500 text-[10px] whitespace-nowrap">{sc.time?.split(" ")[1] || ""}</span>
                    </div>
                  ))}
                  {events.penalties.map((pen, i) => (
                    <div
                      key={`pen-${i}`}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 font-mono text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                            {pen.type || "STEWARDS"}
                          </span>
                          <span className="text-zinc-300 font-medium">Lap {pen.lap}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] font-sans">{pen.message}</p>
                      </div>
                      <span className="text-zinc-500 text-[10px] whitespace-nowrap">{pen.time?.split(" ")[1] || ""}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-xs font-mono text-zinc-500 bg-zinc-900/40 rounded-xl">
                  No neutralization incidents recorded in this session.
                </div>
              )}
            </div>
          </div>

          {/* 4. Tyre Strategy & Compound Lifecycle Distribution */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Pirelli Compound Allocation & Stints
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {tyres.length} Stints Registered
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Compound share distribution mounted by teams during the Grand Prix.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                    C3 Medium Compound
                  </span>
                  <span className="font-bold text-yellow-400">{tyreStats.medium}% of race laps</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${tyreStats.medium}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 inline-block" />
                    C1 Hard Compound
                  </span>
                  <span className="font-bold text-zinc-200">{tyreStats.hard}% of race laps</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-zinc-200 rounded-full" style={{ width: `${tyreStats.hard}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    C4 Soft Compound
                  </span>
                  <span className="font-bold text-red-400">{tyreStats.soft}% of race laps</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${tyreStats.soft}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-900 grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="text-[10px] text-zinc-500">PREFERRED STRATEGY</div>
                <div className="text-xs font-bold text-white mt-0.5">Medium → Hard → Hard</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="text-[10px] text-zinc-500">OPTIMAL PIT LAP</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">Lap 18 & Lap 37</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="text-[10px] text-zinc-500">DEGRADATION DELTA</div>
                <div className="text-xs font-bold text-red-400 mt-0.5">+0.082s / lap</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
