"use client";

import React, { useState, useEffect, useMemo } from "react";
import InteractiveChart from "@/components/charts/InteractiveChart";
import { TYRE_COMPOUNDS } from "@/lib/f1Themes";
import {
  Flame,
  Clock,
  BarChart2,
  Calendar,
  AlertTriangle,
  Info,
  TrendingDown,
  Activity,
  Layers,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ExportButtons from "@/components/ExportButtons";

export default function TyreStrategyPage() {
  const [season, setSeason] = useState(2024);
  const [seasons, setSeasons] = useState<number[]>([2024, 2023, 2022, 2021]);
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number>(1121);
  const [raceData, setRaceData] = useState<any>(null);
  const [stintsData, setStintsData] = useState<any[]>([]);
  const [hasTyreData, setHasTyreData] = useState<boolean>(true);
  const [missingInfo, setMissingInfo] = useState<any>(null);
  const [pitWindows, setPitWindows] = useState<any[]>([]);
  const [compoundDegradation, setCompoundDegradation] = useState<any[]>([]);
  const [selectedCompound, setSelectedCompound] = useState<string>("SOFT");
  const [loading, setLoading] = useState(true);

  // Fetch available seasons
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

  // Load races for season
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

  // Load selected race details and tyre strategy
  useEffect(() => {
    if (!selectedRaceId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/races/${selectedRaceId}`).then((r) => r.json()),
      fetch(`/api/tyres?raceId=${selectedRaceId}`).then((r) => r.json()),
    ])
      .then(([raceRes, tyresRes]) => {
        if (raceRes.success) setRaceData(raceRes.data);
        if (tyresRes.success && tyresRes.data) {
          setHasTyreData(Boolean(tyresRes.data.hasTyreData));
          setStintsData(tyresRes.data.stints || []);
          setPitWindows(tyresRes.data.pitWindows || []);
          setCompoundDegradation(tyresRes.data.compoundDegradation || []);
          setMissingInfo(tyresRes.data.missingInfo || null);
        } else {
          setHasTyreData(false);
          setStintsData([]);
          setCompoundDegradation([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setHasTyreData(false);
      })
      .finally(() => setLoading(false));
  }, [selectedRaceId]);

  const selectedRace = races.find((r) => r.raceId === selectedRaceId);

  // Stint Progression Gantt Chart for drivers
  const stintsChartOption: any = useMemo(() => {
    if (!stintsData || stintsData.length === 0) return null;

    const driversList = Array.from(new Set(stintsData.map((s) => s.driverCode))).slice(0, 16);
    const maxLaps = raceData?.totalLaps || 57;

    const compoundColors: Record<string, string> = {
      SOFT: "#ef4444",
      MEDIUM: "#eab308",
      HARD: "#f4f4f5",
      INTERMEDIATE: "#22c55e",
      WET: "#3b82f6",
    };

    const series = [
      {
        name: "Tyre Stint",
        type: "custom" as const,
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(0);
          const startLap = api.value(1);
          const endLap = api.value(2);
          const compound = api.value(3);

          const startPoint = api.coord([startLap, categoryIndex]);
          const endPoint = api.coord([endLap, categoryIndex]);
          const height = api.size([0, 1])[1] * 0.65;
          const rectWidth = Math.max(endPoint[0] - startPoint[0], 2);

          return {
            type: "rect",
            shape: {
              x: startPoint[0],
              y: startPoint[1] - height / 2,
              width: rectWidth,
              height: height,
              r: [4, 4, 4, 4],
            },
            style: {
              fill: compoundColors[compound] || "#a1a1aa",
              stroke: "#080808",
              lineWidth: 1.5,
            },
          };
        },
        data: stintsData
          .filter((s) => driversList.includes(s.driverCode))
          .map((s) => [
            driversList.indexOf(s.driverCode),
            s.lapStart,
            s.lapEnd,
            s.compound,
            s.driverCode,
            s.lapCount,
            s.stint,
          ]),
      },
    ];

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const val = params.value;
          const driver = val[4];
          const stint = val[6];
          const compound = val[3];
          const start = val[1];
          const end = val[2];
          const laps = val[5];
          const color = compoundColors[compound] || "#fff";

          return `
            <div style="font-family: monospace; font-size: 11px; padding: 4px;">
              <div style="font-weight: bold; color: #fff;">${driver} — Stint ${stint}</div>
              <div style="color: ${color}; font-weight: bold; margin-top: 2px;">
                Compound: ${compound}
              </div>
              <div style="color: #a1a1aa;">Laps: ${start} ➔ ${end} (${laps} Laps)</div>
            </div>
          `;
        },
      },
      grid: {
        left: "8%",
        right: "4%",
        bottom: "8%",
        top: "8%",
        containLabel: true,
      },
      xAxis: {
        type: "value" as const,
        min: 1,
        max: maxLaps,
        interval: 5,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          formatter: (v: number) => `L${v}`,
        },
      },
      yAxis: {
        type: "category" as const,
        data: driversList,
        inverse: true,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: {
          color: "#d4d4d8",
          fontWeight: "bold",
          fontFamily: "monospace",
        },
      },
      series,
    };
  }, [stintsData, raceData]);

  // Degradation curve chart dynamically derived from actual lap times on compound
  const degradationChartOption: any = useMemo(() => {
    if (!compoundDegradation || compoundDegradation.length === 0) return null;

    const compoundColors: Record<string, string> = {
      SOFT: "#ef4444",
      MEDIUM: "#eab308",
      HARD: "#f4f4f5",
      INTERMEDIATE: "#22c55e",
      WET: "#3b82f6",
    };

    // Find max age across all compounds
    let maxAge = 0;
    compoundDegradation.forEach((cd) => {
      cd.lapsOnCompound.forEach((l: any) => {
        if (l.tyreAge > maxAge) maxAge = l.tyreAge;
      });
    });

    if (maxAge === 0) return null;
    const xAxisLabels = Array.from({ length: Math.min(maxAge, 35) }, (_, i) => `${i + 1}`);

    const series = compoundDegradation.map((cd) => {
      const color = compoundColors[cd.compound] || "#a1a1aa";
      const baseLapMs = cd.lapsOnCompound[0]?.avgLapTimeMs || cd.avgLapTimeMs;

      const data = xAxisLabels.map((_, i) => {
        const age = i + 1;
        const entry = cd.lapsOnCompound.find((l: any) => l.tyreAge === age);
        if (!entry) return null;
        // Degradation delta relative to baseline lap
        const deltaSec = ((entry.avgLapTimeMs - baseLapMs) / 1000);
        return Number(deltaSec.toFixed(3));
      });

      return {
        name: `${cd.compound} (${cd.totalLapsTracked} laps)`,
        type: "line",
        smooth: 0.2,
        connectNulls: true,
        showSymbol: true,
        symbolSize: 4,
        lineStyle: { width: 2.5, color },
        itemStyle: { color },
        data,
      };
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (params: any) => {
          let html = `<div style="font-family: monospace; font-size: 11px; padding: 4px;">`;
          html += `<div style="font-weight: bold; color: #fff; margin-bottom: 4px;">Tyre Age: Lap ${params[0]?.name}</div>`;
          params.forEach((p: any) => {
            if (p.value !== null && p.value !== undefined) {
              const sign = p.value >= 0 ? "+" : "";
              html += `<div style="color: ${p.color};">${p.seriesName}: ${sign}${p.value}s/lap delta</div>`;
            }
          });
          html += `</div>`;
          return html;
        },
      },
      legend: {
        data: series.map((s) => s.name),
        textStyle: { color: "#a1a1aa", fontSize: 11 },
        top: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "8%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: xAxisLabels,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", interval: 3 },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          formatter: (v: number) => `+${v}s`,
        },
      },
      series,
    };
  }, [compoundDegradation]);

  const fastestPit = raceData?.pitStops?.fastestPitStop || null;

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Pirelli Tyre Dynamics & Strategy
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Official FastF1 & Pit Stops Ingestion
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Tyre Strategy & Degradation Engine
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Model authentic compound degradation curves, optimal pit stop windows, and undercut margins. Seamlessly correlates tyre life with real pit stop durations from <code className="text-red-400">data/pit_stops.csv</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Season Selector */}
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

            {/* Grand Prix Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 font-mono text-xs shadow-sm transition-colors focus-within:border-red-500/80">
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

            {/* Export Buttons */}
            {stintsData.length > 0 && (
              <ExportButtons
                data={stintsData}
                filename={`f1-tyre-stints-${selectedRaceId}`}
                label="Stints"
              />
            )}
          </div>
        </div>

        {/* Compound Selector & Pirelli Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(TYRE_COMPOUNDS).map(([key, compound]) => {
            const isSelected = selectedCompound === key;
            return (
              <div
                key={key}
                onClick={() => setSelectedCompound(key)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                  isSelected
                    ? "bg-zinc-900 border-zinc-600 ring-1 ring-zinc-500 shadow-lg"
                    : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-black text-sm shrink-0"
                  style={{
                    borderColor: compound.color,
                    color: compound.color,
                    backgroundColor: compound.bg,
                  }}
                >
                  {compound.code}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{compound.name}</div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {key === "SOFT"
                      ? "C5 / Red (High Grip)"
                      : key === "MEDIUM"
                      ? "C4 / Yellow (Balanced)"
                      : key === "HARD"
                      ? "C3 / White (Endurance)"
                      : key === "INTERMEDIATE"
                      ? "Green / Wet Surface"
                      : "Blue / Heavy Water"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loading ? (
          <LoadingState type="chart" message="Analyzing tyre degradation and stint timelines..." />
        ) : !hasTyreData ? (
          /* Graceful Degradation / Empty State when Tyre Stints is missing for this race */
          <EmptyState
            type="missing_dataset"
            title={`Tyre Strategy Unavailable for ${selectedRace?.name || "Selected Race"}`}
            message={
              missingInfo?.reason ||
              "Tyre stint progression data (tyre_stints.csv) has not been imported for this Grand Prix. The platform maintains a strict zero synthetic data policy."
            }
            requiredColumns={
              missingInfo?.requiredColumns || [
                "raceId",
                "driverCode",
                "stint",
                "compound",
                "lapStart",
                "lapEnd",
                "lapCount",
                "tyreAge",
              ]
            }
            sourceGuide={
              missingInfo?.sourceGuide ||
              "Export official Pirelli stint telemetry via the FastF1 Python library (`session.laps[['Driver', 'Stint', 'Compound', ...]]`)."
            }
          />
        ) : (
          <>
            {/* Official Stint Progression Gantt Chart */}
            {stintsChartOption && (
              <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                      Official Tyre Stint Progression Timeline ({selectedRace?.name || "Grand Prix"})
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Soft
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Medium
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-100" /> Hard
                    </span>
                  </div>
                </div>

                <div className="h-[440px] w-full">
                  <InteractiveChart option={stintsChartOption} height="440px" />
                </div>
              </div>
            )}

            {/* Real Compound Degradation Curves Chart */}
            {degradationChartOption && (
              <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                      Calculated Compound Degradation Drop-off (Seconds Delta / Lap)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    Calculated from actual lap times across stints
                  </span>
                </div>

                <div className="h-[340px] w-full">
                  <InteractiveChart option={degradationChartOption} height="340px" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Real Pit Window Insights Derived From data/pit_stops.csv */}
        {raceData && raceData.pitStops && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 space-y-4 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-xs font-mono text-zinc-500 uppercase">
                  Real Pit Stop Execution Analysis ({selectedRace?.name || "Grand Prix"})
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Observed Pit Windows & Stationary Delta
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-yellow-400">
                  {raceData.pitStops.totalPitStops || 0} Total Stops
                </span>
                {raceData.pitStops.averagePitDuration && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-cyan-400">
                    Mean Duration: {raceData.pitStops.averagePitDuration}s
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pitWindows && pitWindows.length > 0 ? (
                pitWindows.slice(0, 2).map((pw: any) => (
                  <div
                    key={pw.stop}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1"
                  >
                    <span className="text-[10px] font-mono uppercase text-zinc-500">
                      Stint {pw.stop} Pit Window
                    </span>
                    <div className="text-lg font-bold font-mono text-white">
                      Laps {pw.minLap} – {pw.maxLap}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Median stop lap: <span className="text-white font-mono">L{pw.medianLap}</span> ({pw.count} cars pitted).
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Pit Windows</span>
                  <div className="text-sm font-medium text-zinc-400">
                    No pit stop data recorded for this Grand Prix.
                  </div>
                </div>
              )}

              {/* Fastest Pit Stop */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Fastest Pit Stop</span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {fastestPit?.duration ? `${fastestPit.duration}s` : "--"}
                </div>
                <p className="text-[11px] text-zinc-400">
                  {fastestPit?.driverName
                    ? `${fastestPit.driverName} on Lap ${fastestPit.lap}`
                    : "Stationary box execution recorded in pit lane data."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
