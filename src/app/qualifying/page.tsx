"use client";

import React, { useState, useEffect, useMemo } from "react";
import InteractiveChart from "@/components/charts/InteractiveChart";
import { Gauge, Clock, ChevronRight, Zap, TrendingUp, Layers, Calendar, Flag, BarChart2, Activity } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";

function parseLapTimeToSeconds(timeStr: string | null): number | null {
  if (!timeStr || timeStr === "\\N") return null;
  const parts = timeStr.split(":");
  if (parts.length === 2) {
    const min = parseFloat(parts[0]);
    const sec = parseFloat(parts[1]);
    return min * 60 + sec;
  }
  const sec = parseFloat(timeStr);
  return isNaN(sec) ? null : sec;
}

export default function QualifyingPage() {
  const [season, setSeason] = useState<number>(2024);
  const [seasons, setSeasons] = useState<number[]>([2024, 2023, 2022, 2021]);
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number>(1121);
  const [qualiData, setQualiData] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!selectedRaceId) return;
    setLoading(true);
    fetch(`/api/races/${selectedRaceId}/qualifying`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setQualiData(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    fetch(`/api/races/${selectedRaceId}/sectors`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) setSectors(json.data);
      })
      .catch((err) => console.error(err));

    fetch(`/api/telemetry?driverA=VER&driverB=LEC&raceId=${selectedRaceId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTelemetry(json.data);
      })
      .catch((err) => console.error(err));
  }, [selectedRaceId]);

  const selectedRace = races.find((r) => r.raceId === selectedRaceId);
  const poleLap = qualiData[0]?.q3 || qualiData[0]?.q1 || "--";

  const deltaChartOption: any = useMemo(() => {
    const q3Drivers = qualiData.filter((q) => q.q3);
    const targetDrivers = q3Drivers.length > 0 ? q3Drivers : qualiData.slice(0, 10);
    if (targetDrivers.length === 0) return null;

    const validDrivers = targetDrivers
      .map((q) => ({
        ...q,
        lapTime: q.q3 || q.q1,
        seconds: parseLapTimeToSeconds(q.q3 || q.q1),
      }))
      .filter((q) => q.seconds !== null);

    if (validDrivers.length === 0) return null;

    const poleSeconds = validDrivers[0].seconds!;
    const driverCodes = validDrivers.map((d) => d.code);
    const deltas = validDrivers.map((d) => {
      const delta = Math.max(0, d.seconds! - poleSeconds);
      return {
        value: Number(delta.toFixed(3)),
        itemStyle: {
          color: d.position === 1 ? "#a855f7" : d.teamColor || "#ef4444",
        },
        driverName: d.driverName,
        time: d.lapTime,
        team: d.constructorName,
      };
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const item = params[0];
          const data = item?.data;
          if (!data) return "";
          return `
            <div style="font-family: monospace; font-size: 12px; padding: 4px;">
              <div style="font-weight: bold; color: #fff;">${data.driverName}</div>
              <div style="color: #a1a1aa; font-size: 11px;">${data.team}</div>
              <div style="color: #c084fc; margin-top: 4px;">Session Lap: ${data.time}</div>
              <div style="color: #f87171; font-weight: bold;">Delta to Pole: +${data.value.toFixed(3)}s</div>
            </div>
          `;
        },
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
        data: driverCodes,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#d4d4d8", fontWeight: "bold" },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          formatter: (val: number) => `+${val.toFixed(2)}s`,
        },
      },
      series: [
        {
          name: "Delta to Pole",
          type: "bar",
          barWidth: "42%",
          data: deltas,
          label: {
            show: true,
            position: "top",
            formatter: (p: any) => (p.value === 0 ? "POLE" : `+${p.value.toFixed(3)}s`),
            color: "#a1a1aa",
            fontSize: 10,
            fontFamily: "monospace",
          },
        },
      ],
    };
  }, [qualiData]);

  // Pole Shootout Telemetry Option
  const poleTelemetryOption: any = useMemo(() => {
    if (!telemetry || !telemetry.driverA || !telemetry.driverA.samples) return null;
    const samplesA = telemetry.driverA.samples.filter((_: any, i: number) => i % 4 === 0);
    const samplesB = telemetry.driverB ? telemetry.driverB.samples.filter((_: any, i: number) => i % 4 === 0) : [];
    const distances = samplesA.map((s: any) => `${Math.round(s.distance)}m`);

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
      },
      legend: {
        data: [`${telemetry.driverA.driverCode} Pole Speed`, telemetry.driverB ? `${telemetry.driverB.driverCode} P2 Speed` : "Target Speed"],
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
          name: `${telemetry.driverA.driverCode} Pole Speed`,
          type: "line",
          smooth: true,
          showSymbol: false,
          data: samplesA.map((s: any) => s.speed),
          lineStyle: { color: "#A855F7", width: 2.5 },
          itemStyle: { color: "#A855F7" },
        },
        ...(telemetry.driverB
          ? [
              {
                name: `${telemetry.driverB.driverCode} P2 Speed`,
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
  }, [telemetry]);

  const sectorSummary = useMemo(() => {
    if (!sectors || sectors.length === 0) return [];
    const map: Record<string, any> = {};
    sectors.forEach((s) => {
      if (!map[s.driverCode]) map[s.driverCode] = s;
    });
    return Object.values(map).slice(0, 8);
  }, [sectors]);

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Official FIA Qualifying Sessions
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Validated Q1, Q2 & Q3 Shootout Times
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Qualifying Delta & Sector Progression
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Authentic qualifying classifications, elimination thresholds, and pole position times mapped directly from <code className="text-red-400">data/qualifying.csv</code>.
            </p>
          </div>

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
                    R{r.round}: {r.name}
                  </option>
                ))}
              </select>
            </div>

            {qualiData.length > 0 && (
              <ExportButtons
                data={qualiData}
                filename={`f1-qualifying-results-${selectedRaceId}`}
                label="Quali"
              />
            )}
          </div>
        </div>

        {/* Selected Session Highlights */}
        {selectedRace && (
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 overflow-hidden shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-zinc-500">
                  {selectedRace.date} • {selectedRace.circuitName}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {selectedRace.name} — Qualifying Shootout
                </h2>
              </div>

              <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Pole Position</span>
                  <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                    {qualiData[0]?.driverName || "--"}
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    Time: {poleLap}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interactive ECharts Delta to Pole Graph */}
        {deltaChartOption && (
          <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Shootout Delta to Pole Position (Seconds Gap)
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Pole Lap Reference: <span className="text-purple-400 font-bold">{poleLap}</span>
              </span>
            </div>
            <div className="h-[340px] w-full">
              <InteractiveChart option={deltaChartOption} height="340px" />
            </div>
          </div>
        )}

        {/* Qualifying Table */}
        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
              Official Qualifying Results
            </h3>
            <span className="text-xs font-mono text-zinc-500">
              {qualiData.length} Drivers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">GRID POS</th>
                  <th className="py-3 px-4 font-sans">DRIVER</th>
                  <th className="py-3 px-4 font-sans">TEAM</th>
                  <th className="py-3 px-4">Q1 CUTOFF</th>
                  <th className="py-3 px-4">Q2 CUTOFF</th>
                  <th className="py-3 px-4 text-purple-400">Q3 POLE SHOOTOUT</th>
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
                      <span className="text-purple-400 font-mono text-xs">({q.code})</span>
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

        {/* Authentic Sector Matrix & Pole Telemetry Trace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Micro-Sector 1, 2, 3 Pace Matrix */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Micro-Sector Splits & Speed Traps
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">Official FIA Sectors</span>
            </div>
            <p className="text-xs text-zinc-400">
              Sector 1, 2, and 3 split benchmarks and speed traps recorded during qualifying shootout runs.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">DRIVER</th>
                    <th className="py-2.5 px-3">S1 (s)</th>
                    <th className="py-2.5 px-3">S2 (s)</th>
                    <th className="py-2.5 px-3">S3 (s)</th>
                    <th className="py-2.5 px-3 text-right">ST (km/h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {sectorSummary.length > 0 ? (
                    sectorSummary.map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/50">
                        <td className="py-2.5 px-3 font-bold text-white">{s.driverCode}</td>
                        <td className="py-2.5 px-3 text-zinc-300 font-mono">{s.sector1Time}</td>
                        <td className="py-2.5 px-3 text-zinc-300 font-mono">{s.sector2Time}</td>
                        <td className="py-2.5 px-3 text-zinc-300 font-mono">{s.sector3Time}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-400 font-mono">
                          {s.speedST || "--"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-zinc-500">
                        Loading sector timing benchmarks...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Pole Position Lap Speed & Delta Trace */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Pole Position Lap Speed & Delta Trace
                </h3>
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">VER vs LEC</span>
            </div>
            <p className="text-xs text-zinc-400">
              100Hz ECU speed channel of Max Verstappen's pole position shootout lap compared to Charles Leclerc.
            </p>
            {poleTelemetryOption ? (
              <InteractiveChart option={poleTelemetryOption} height="260px" />
            ) : (
              <div className="h-64 flex items-center justify-center text-xs font-mono text-zinc-500">
                Loading pole shootout telemetry trace...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
