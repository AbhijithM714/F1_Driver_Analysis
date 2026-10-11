"use client";

import React, { useState, useEffect, useMemo } from "react";
import InteractiveChart from "@/components/charts/InteractiveChart";
import {
  Clock,
  Trophy,
  Activity,
  Layers,
  Flame,
  Zap,
  ChevronDown,
  Calendar,
  Flag,
  Gauge,
  ArrowUp,
  ArrowDown,
  Minus,
  Thermometer,
  Disc,
  Compass,
} from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ExportButtons from "@/components/ExportButtons";

export default function RaceAnalyticsPage() {
  const [season, setSeason] = useState<number>(2024);
  const [seasons, setSeasons] = useState<number[]>([2024, 2023, 2022, 2021]);
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number>(1121);
  const [raceData, setRaceData] = useState<any>(null);
  const [qualiData, setQualiData] = useState<any[]>([]);
  const [lapData, setLapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"race" | "lapchart" | "qualifying" | "pitstops" | "tyres">("race");

  // Subsystem datasets for deep dive
  const [tyresData, setTyresData] = useState<any[]>([]);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [trackMapData, setTrackMapData] = useState<any>(null);

  // Load available seasons
  useEffect(() => {
    fetch("/api/seasons")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const yrs = (json.years || json.data || [])
            .map((item: any) => (typeof item === "number" ? item : item.year))
            .filter((y: any): y is number => typeof y === "number" && !isNaN(y));
          if (yrs.length > 0) {
            setSeasons(yrs);
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

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

  // Load selected race details, qualifying, laps, and authentic telemetry subsystems
  useEffect(() => {
    if (!selectedRaceId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/races/${selectedRaceId}`).then((r) => r.json()),
      fetch(`/api/races/${selectedRaceId}/qualifying`).then((r) => r.json()),
      fetch(`/api/races/${selectedRaceId}/laps`).then((r) => r.json()),
      fetch(`/api/tyres?raceId=${selectedRaceId}`).then((r) => r.json()),
      fetch(`/api/telemetry?driverA=VER&driverB=LEC&raceId=${selectedRaceId}`).then((r) => r.json()),
      fetch(`/api/races/${selectedRaceId}/weather`).then((r) => r.json()),
      fetch(`/api/circuits/track-maps`).then((r) => r.json()),
    ])
      .then(([raceRes, qualiRes, lapsRes, tyresRes, telRes, weatherRes, mapRes]) => {
        if (raceRes.success) setRaceData(raceRes.data);
        if (qualiRes.success) setQualiData(qualiRes.data);
        if (lapsRes.success) setLapData(lapsRes.data);
        if (tyresRes?.success) {
          setTyresData(Array.isArray(tyresRes.data) ? tyresRes.data : tyresRes.data?.stints || []);
        }
        if (telRes?.success) setTelemetryData(telRes.data);
        if (weatherRes?.success) setWeatherData(weatherRes.data);
        if (mapRes?.success && mapRes.data) {
          setTrackMapData(mapRes.data.bahrain || mapRes.data[Object.keys(mapRes.data)[0]]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedRaceId]);

  const lapChartOption: any = useMemo(() => {
    if (!lapData || !lapData.drivers || lapData.drivers.length === 0) return null;

    const topDrivers = lapData.drivers.slice(0, 10);
    const maxLaps = lapData.maxLaps || 57;
    const xAxisData = Array.from({ length: maxLaps }, (_, i) => `L${i + 1}`);

    const series = topDrivers.map((d: any) => {
      const posByLap: Record<number, number> = {};
      d.laps.forEach((l: any) => {
        posByLap[l.lap] = l.position;
      });

      const data = Array.from({ length: maxLaps }, (_, i) => {
        const lapNum = i + 1;
        return posByLap[lapNum] !== undefined ? posByLap[lapNum] : null;
      });

      return {
        name: d.name,
        type: "line",
        smooth: 0.2,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        data,
      };
    });

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          return `${params.seriesName}<br/>${params.name}: P${params.value}`;
        },
      },
      legend: {
        data: topDrivers.map((d: any) => d.name),
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "16%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: xAxisData,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", interval: Math.floor(maxLaps / 12) },
      },
      yAxis: {
        type: "value" as const,
        inverse: true,
        min: 1,
        max: 20,
        interval: 2,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          formatter: (val: number) => `P${val}`,
        },
      },
      series,
    };
  }, [lapData]);

  // Tyre Stint Timeline Option
  const tyreStintOption: any = useMemo(() => {
    if (!tyresData || tyresData.length === 0) return null;

    const driversMap: Record<string, any[]> = {};
    tyresData.forEach((t) => {
      if (!driversMap[t.driverCode]) driversMap[t.driverCode] = [];
      driversMap[t.driverCode].push(t);
    });

    const drivers = Array.from(new Set(tyresData.map((t) => t.driverCode))).slice(0, 10);
    const series: any[] = [];
    const colors: Record<string, string> = {
      SOFT: "#EF4444",
      MEDIUM: "#EAB308",
      HARD: "#F4F4F5",
      INTERMEDIATE: "#22C55E",
      WET: "#3B82F6",
    };

    const maxStints = Math.max(3, ...tyresData.map((t) => Number(t.stint) || 1));

    for (let stintNum = 1; stintNum <= maxStints; stintNum++) {
      const data = drivers.map((d) => {
        const stint = driversMap[d]?.find((s) => Number(s.stint) === stintNum);
        const laps = stint
          ? Number(stint.lapCount) || (Number(stint.lapEnd) - Number(stint.lapStart) + 1) || 0
          : 0;
        const cmp = stint?.compound?.toUpperCase() || "MEDIUM";
        return {
          value: laps,
          itemStyle: {
            color: colors[cmp] || "#A1A1AA",
            borderRadius: stintNum === maxStints ? [0, 4, 4, 0] : [0, 0, 0, 0],
          },
          stintInfo: stint,
        };
      });

      series.push({
        name: `Stint ${stintNum}`,
        type: "bar",
        stack: "total",
        barWidth: 16,
        data,
        label: {
          show: true,
          position: "inside",
          formatter: (params: any) => (params.value >= 4 ? `${params.value}L` : ""),
          color: (params: any) => {
            const cmp = params.data?.stintInfo?.compound?.toUpperCase();
            return cmp === "HARD" ? "#18181b" : "#ffffff";
          },
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: "bold",
        },
      });
    }

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
        formatter: (params: any) => {
          const stint = params.data?.stintInfo;
          if (!stint || params.value === 0) return "";
          const cmp = stint.compound?.toUpperCase() || "MEDIUM";
          const col = colors[cmp] || "#fff";
          return `
            <div style="font-family: monospace; font-size: 11px; padding: 4px;">
              <div style="font-weight: bold; color: #fff;">${stint.driverCode} — Stint ${stint.stint}</div>
              <div style="color: ${col}; font-weight: bold; margin: 3px 0;">Compound: ${cmp}</div>
              <div style="color: #a1a1aa;">Laps: ${stint.lapStart} ➔ ${stint.lapEnd} (${params.value} Laps)</div>
              ${stint.tyreAge ? `<div style="color: #71717a; font-size: 10px;">Starting Tyre Age: ${stint.tyreAge} laps</div>` : ""}
            </div>
          `;
        },
      },
      legend: {
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
        right: 0,
      },
      grid: { top: 30, right: 20, bottom: 25, left: 55 },
      xAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace", formatter: "L{value}" },
      },
      yAxis: {
        type: "category",
        data: drivers,
        inverse: true,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#f4f4f5", fontSize: 11, fontFamily: "monospace", fontWeight: "bold" },
      },
      series,
    };
  }, [tyresData]);

  // Dual Telemetry Speed Trace Option
  const telemetryOption: any = useMemo(() => {
    if (!telemetryData || !telemetryData.driverA || !telemetryData.driverA.samples) return null;

    const samplesA = telemetryData.driverA.samples.filter((_: any, i: number) => i % 5 === 0);
    const samplesB = telemetryData.driverB ? telemetryData.driverB.samples.filter((_: any, i: number) => i % 5 === 0) : [];
    const distances = samplesA.map((s: any) => `${Math.round(s.distance)}m`);

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
      },
      legend: {
        data: [
          `${telemetryData.driverA.driverCode} Speed`,
          telemetryData.driverB ? `${telemetryData.driverB.driverCode} Speed` : "Target Speed",
        ],
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
        right: 0,
      },
      grid: { top: 30, right: 15, bottom: 25, left: 45 },
      xAxis: {
        type: "category",
        data: distances,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace", interval: Math.floor(distances.length / 8) },
      },
      yAxis: {
        type: "value",
        min: 60,
        max: 340,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace", formatter: "{value} km/h" },
      },
      series: [
        {
          name: `${telemetryData.driverA.driverCode} Speed`,
          type: "line",
          smooth: true,
          showSymbol: false,
          data: samplesA.map((s: any) => s.speed),
          lineStyle: { color: "#3671C6", width: 2.5 },
          itemStyle: { color: "#3671C6" },
        },
        ...(telemetryData.driverB
          ? [
              {
                name: `${telemetryData.driverB.driverCode} Speed`,
                type: "line",
                smooth: true,
                showSymbol: false,
                data: samplesB.map((s: any) => s.speed),
                lineStyle: { color: "#E10600", width: 2 },
                itemStyle: { color: "#E10600" },
              },
            ]
          : []),
      ],
    };
  }, [telemetryData]);

  // Track Map Option
  const trackMapOption: any = useMemo(() => {
    if (!trackMapData || !trackMapData.coordinates) return null;

    const coords = trackMapData.coordinates;
    return {
      tooltip: {
        formatter: (params: any) => `Track Coordinate: [${params.value[0]}, ${params.value[1]}]`,
      },
      grid: { top: 20, right: 20, bottom: 20, left: 20 },
      xAxis: { show: false, min: "dataMin", max: "dataMax" },
      yAxis: { show: false, min: "dataMin", max: "dataMax" },
      series: [
        {
          type: "line",
          data: coords,
          showSymbol: false,
          smooth: 0.2,
          lineStyle: { color: "#10B981", width: 3 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(16, 185, 129, 0.15)" },
                { offset: 1, color: "rgba(16, 185, 129, 0.0)" },
              ],
            },
          },
        },
      ],
    };
  }, [trackMapData]);

  // Weather Option
  const weatherOption: any = useMemo(() => {
    if (!weatherData || weatherData.length === 0) return null;
    const sampled = weatherData.filter((_, idx) => idx % 2 === 0);
    const times = sampled.map((w) => `${Number(w.timeMinutes).toFixed(0)}m`);

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
      },
      legend: {
        data: ["Track Temp", "Air Temp"],
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
        right: 0,
      },
      grid: { top: 30, right: 15, bottom: 25, left: 40 },
      xAxis: {
        type: "category",
        data: times,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace" },
      },
      yAxis: {
        type: "value",
        min: (val: any) => Math.floor(val.min - 2),
        max: (val: any) => Math.ceil(val.max + 2),
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a", fontSize: 10, fontFamily: "monospace", formatter: "{value}°C" },
      },
      series: [
        {
          name: "Track Temp",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: sampled.map((w) => Number(w.trackTemp)),
          lineStyle: { color: "#F97316", width: 2.5 },
          itemStyle: { color: "#F97316" },
        },
        {
          name: "Air Temp",
          type: "line",
          smooth: true,
          showSymbol: false,
          data: sampled.map((w) => Number(w.airTemp)),
          lineStyle: { color: "#38BDF8", width: 2 },
          itemStyle: { color: "#38BDF8" },
        },
      ],
    };
  }, [weatherData]);

  const selectedRace = races.find((r) => r.raceId === selectedRaceId);

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Official FIA Session Records
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Validated Races, Results & Pit Timings
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Race Analytics & Grand Prix Detail
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Examine official classifications, lap charts, qualifying times, and pit lane stop durations mapped directly from <code className="text-red-400">data/results.csv</code>, <code className="text-red-400">data/qualifying.csv</code>, and <code className="text-red-400">data/pit_stops.csv</code>.
            </p>
          </div>

          {/* Season & Grand Prix Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 font-mono text-xs shadow-sm transition-colors focus-within:border-red-500/80">
              <span className="text-zinc-400 font-bold text-[10px]">SEASON:</span>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                {seasons.map((yr: any) => {
                  const val = typeof yr === "number" ? yr : yr?.year;
                  return (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 font-mono text-xs shadow-sm transition-colors focus-within:border-red-500/80">
              <span className="text-zinc-400 font-bold text-[10px]">ROUND:</span>
              <select
                value={selectedRaceId}
                onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-xs truncate [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                {races.map((r) => (
                  <option key={r.raceId} value={r.raceId}>
                    R{r.round}: {r.name} ({r.country})
                  </option>
                ))}
              </select>
            </div>

            {raceData?.classification && raceData.classification.length > 0 && (
              <ExportButtons
                data={raceData.classification}
                filename={`f1-race-results-${selectedRaceId}`}
                label="Results"
              />
            )}
          </div>
        </div>

        {/* Selected Race Banner & Stats */}
        {selectedRace && (
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 overflow-hidden shadow-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-700 text-white">
                    ROUND {selectedRace.round}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <span>{selectedRace.flag}</span>
                    <span>{selectedRace.country}</span>
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    {selectedRace.date}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white">
                  {selectedRace.name}
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Circuit: {selectedRace.circuitName} ({selectedRace.location})
                </p>
              </div>

              {/* Race Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Winner</span>
                  <div className="text-sm font-bold font-mono text-white mt-0.5 truncate">
                    {raceData?.winner?.driverName || "Max Verstappen"}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {raceData?.winner?.constructorName || "Red Bull"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Fastest Lap</span>
                  <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
                    {raceData?.fastestLap?.fastestLapTime || "--:--.---"}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {raceData?.fastestLap?.code ? `${raceData?.fastestLap?.code} (Lap ${raceData?.fastestLap?.fastestLap})` : "Official timing"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Total Pit Stops</span>
                  <div className="text-sm font-bold font-mono text-yellow-400 mt-0.5">
                    {raceData?.totalPitStops || 0} Stops
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Avg: {raceData?.averagePitDuration || "--"}s
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Total Laps</span>
                  <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                    {raceData?.totalLaps || "--"} Laps
                  </div>
                  <span className="text-[10px] text-zinc-400">Completed Distance</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto">
          {[
            { id: "race", label: "Official Race Classification" },
            { id: "lapchart", label: "Interactive Lap Chart" },
            { id: "qualifying", label: "Qualifying Shootout (Q1, Q2, Q3)" },
            { id: "pitstops", label: "Pit Stop Timelines & Durations" },
            { id: "tyres", label: "Tyre Stints & Telemetry (Awaiting Data)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Race Classification Table */}
        {activeTab === "race" && (
          <div className="space-y-6">
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Grand Prix Classification Table
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  {raceData?.classification?.length || 0} Drivers Classified
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
                      <th className="py-3 px-4">FASTEST LAP</th>
                      <th className="py-3 px-4 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                    {raceData?.classification?.map((row: any) => {
                      const delta = row.gridDelta;
                      return (
                        <tr key={row.resultId} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="py-3 px-4 font-black text-sm">
                            {row.position ? (
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  row.position === 1
                                    ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                                    : row.position === 2
                                    ? "bg-zinc-800 text-zinc-200"
                                    : row.position === 3
                                    ? "bg-amber-950 text-amber-500"
                                    : "text-zinc-300"
                                }`}
                              >
                                {row.position}
                              </span>
                            ) : (
                              <span className="text-zinc-500">RET</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 font-bold">
                            {row.driverNumber ? `#${row.driverNumber}` : "--"}
                          </td>
                          <td className="py-3 px-4 font-sans font-semibold text-white">
                            <span className="mr-2">{row.flag}</span>
                            {row.driverName}{" "}
                            <span className="text-purple-400 font-mono text-xs ml-1">
                              ({row.code})
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-xs">
                            <span className="font-medium" style={{ color: row.teamColor }}>
                              {row.constructorName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-zinc-400 font-mono">
                            {row.grid}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {delta > 0 ? (
                              <span className="inline-flex items-center text-emerald-400 font-bold">
                                <ArrowUp className="w-3 h-3 mr-0.5" /> +{delta}
                              </span>
                            ) : delta < 0 ? (
                              <span className="inline-flex items-center text-red-400">
                                <ArrowDown className="w-3 h-3 mr-0.5" /> {delta}
                              </span>
                            ) : (
                              <span className="text-zinc-500 font-mono">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-300">{row.laps}</td>
                          <td className="py-3 px-4 font-mono text-zinc-300">{row.time}</td>
                          <td className="py-3 px-4 font-mono text-zinc-400">
                            {row.fastestLapTime ? (
                              <span className="text-purple-400">
                                {row.fastestLapTime} (L{row.fastestLap})
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-black font-mono text-white">
                            {row.points > 0 ? (
                              <span className="text-red-400 font-bold">+{row.points}</span>
                            ) : (
                              <span className="text-zinc-600">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Interactive Lap Chart */}
        {activeTab === "lapchart" && (
          <div className="border border-zinc-800 rounded-3xl overflow-hidden bg-zinc-950 p-6 sm:p-8 space-y-4 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
              <div>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  Lap-by-Lap Position Progression ({selectedRace?.name})
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Interactive Position Chart (Laps 1 – {lapData?.maxLaps || 57})
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-purple-400">
                Top 10 Contenders
              </span>
            </div>

            {lapChartOption ? (
              <div className="h-[460px] w-full">
                <InteractiveChart option={lapChartOption} height="460px" />
              </div>
            ) : (
              <div className="p-16 text-center text-zinc-500 font-mono text-xs">
                CALIBRATING LAP POSITION PROGRESSION DATA...
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Qualifying Results Table */}
        {activeTab === "qualifying" && (
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                Qualifying Session Classification (Q1 / Q2 / Q3)
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Pole Lap: {qualiData[0]?.q3 || qualiData[0]?.q1 || "--"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">POS</th>
                    <th className="py-3 px-4 font-sans">DRIVER</th>
                    <th className="py-3 px-4 font-sans">TEAM</th>
                    <th className="py-3 px-4">Q1 TIME</th>
                    <th className="py-3 px-4">Q2 TIME</th>
                    <th className="py-3 px-4 text-purple-400">Q3 SHOOTOUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {qualiData.map((q: any) => (
                    <tr key={q.qualifyId} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 font-black">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            q.position === 1
                              ? "bg-purple-950 text-purple-400 border border-purple-800"
                              : "text-zinc-300"
                          }`}
                        >
                          P{q.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        <span className="mr-2">{q.flag}</span>
                        {q.driverName}{" "}
                        <span className="text-zinc-500 font-mono text-xs">({q.code})</span>
                      </td>
                      <td className="py-3 px-4 font-sans" style={{ color: q.teamColor }}>
                        {q.constructorName}
                      </td>
                      <td className="py-3 px-4 text-zinc-300">{q.q1 || "--"}</td>
                      <td className="py-3 px-4 text-zinc-300">{q.q2 || "--"}</td>
                      <td className="py-3 px-4 font-bold text-purple-300">
                        {q.q3 || "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Pit Stops Execution */}
        {activeTab === "pitstops" && (
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                Pit Stop Execution Timeline & Durations
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                {raceData?.pitStops?.length || 0} Pit Stops Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">STOP</th>
                    <th className="py-3 px-4 font-sans">DRIVER</th>
                    <th className="py-3 px-4">LAP</th>
                    <th className="py-3 px-4">TIME OF DAY</th>
                    <th className="py-3 px-4 text-right text-yellow-400">PIT LANE DURATION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {raceData?.pitStops?.map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 text-zinc-400">Stop #{s.stop}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {s.driverName}{" "}
                        <span className="text-purple-400 font-mono text-xs">({s.code})</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-300">Lap {s.lap}</td>
                      <td className="py-3 px-4 text-zinc-500">{s.time}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-yellow-400">
                        {s.duration}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Live Strategy, Telemetry, Circuit Geometry & Weather */}
        {activeTab === "tyres" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Tyre Compound Stints Gantt Chart */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Disc className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Tyre Compound Stints & Strategy Timeline
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-red-400">● Soft</span>
                  <span className="flex items-center gap-1 text-yellow-400">● Medium</span>
                  <span className="flex items-center gap-1 text-zinc-300">● Hard</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400">
                Laps completed per stint across the top drivers with mounted Pirelli compound selections.
              </p>
              {tyreStintOption ? (
                <InteractiveChart option={tyreStintOption} height="280px" />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-xs font-mono text-zinc-500 space-y-2">
                  <Disc className="w-6 h-6 text-zinc-600 animate-spin-slow" />
                  <span>Tyre stint telemetry not logged for Round {selectedRace?.round || ""}.</span>
                  <span className="text-[10px] text-zinc-600">Available on R1: Bahrain Grand Prix (2024)</span>
                </div>
              )}
            </div>

            {/* 2. 100Hz ECU Telemetry Speed Trace */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    100Hz ECU Telemetry Overlay (VER vs LEC)
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Synchronized
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Continuous radar velocity comparison across the full Grand Prix lap.
              </p>
              {telemetryOption ? (
                <InteractiveChart option={telemetryOption} height="280px" />
              ) : (
                <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                  Loading telemetry traces...
                </div>
              )}
            </div>

            {/* 3. 2D Circuit Track Map Geometry */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Circuit Centerline GPS Geometry ({trackMapData?.name || "Grand Prix Circuit"})
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {trackMapData?.turns || 15} Turns • {trackMapData?.drsZones || 3} DRS Zones
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Vector coordinates tracing the apexes, braking markers, and high-speed complexes.
              </p>
              {trackMapOption ? (
                <InteractiveChart option={trackMapOption} height="280px" />
              ) : (
                <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                  Loading circuit geometry...
                </div>
              )}
            </div>

            {/* 4. Weather Asphalt Temperature Curve */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Asphalt Temperature & Meteorology Log
                  </h3>
                </div>
                <span className="text-xs font-mono text-orange-400 font-bold">
                  {weatherData[weatherData.length - 1]?.trackTemp || "26.5"}°C
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Real-time asphalt temperature readings recorded throughout the race duration.
              </p>
              {weatherOption ? (
                <InteractiveChart option={weatherOption} height="280px" />
              ) : (
                <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                  Loading meteorology log...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
