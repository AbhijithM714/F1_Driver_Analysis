"use client";

import React, { useState, useEffect, useMemo } from "react";
import InteractiveChart from "@/components/charts/InteractiveChart";
import {
  Activity,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Gauge,
  Compass,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  MapPin,
  Flame,
  Radio,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/LoadingState";
import ExportButtons from "@/components/ExportButtons";

type TelemetryChannel = "speed" | "throttle" | "brake" | "gear" | "rpm" | "drs";

export default function TelemetryPage() {
  const [driver1, setDriver1] = useState("VER");
  const [driver2, setDriver2] = useState("LEC");
  const [session, setSession] = useState("Fastest Lap");
  const [hasTelemetry, setHasTelemetry] = useState(true);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [availableDrivers, setAvailableDrivers] = useState<string[]>(["VER", "LEC", "NOR", "HAM", "SAI", "RUS", "PIA"]);
  const [loading, setLoading] = useState(true);
  const [missingInfo, setMissingInfo] = useState<any>(null);
  const [activeChannel, setActiveChannel] = useState<TelemetryChannel>("speed");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/telemetry?driver1=${driver1}&driver2=${driver2}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.isAvailable && json.data) {
          setTelemetryData(json.data);
          if (Array.isArray(json.data.availableDrivers) && json.data.availableDrivers.length > 0) {
            setAvailableDrivers(json.data.availableDrivers);
          }
          const d1Has = json.data.driver1?.points?.length > 0;
          const d2Has = json.data.driver2?.points?.length > 0;
          setHasTelemetry(d1Has || d2Has);
          setMissingInfo(null);
        } else {
          setHasTelemetry(false);
          setMissingInfo({
            error: json.error || "Telemetry dataset not imported",
            requiredColumns: json.requiredColumns || [
              "raceId",
              "driverCode",
              "lapNumber",
              "distance",
              "speed",
              "throttle",
              "brake",
              "gear",
              "rpm",
              "drs",
              "x",
              "y",
            ],
            sourceGuide:
              json.sourceGuide ||
              "Telemetry data can be exported using the Python FastF1 library: `session = fastf1.get_session(2024, 1, 'R'); session.load(); tel = session.laps.pick_fastest().get_telemetry()`",
          });
        }
      })
      .catch((err) => {
        console.error("Telemetry fetch error:", err);
        setHasTelemetry(false);
      })
      .finally(() => setLoading(false));
  }, [driver1, driver2]);

  // Main Sensor Channel Chart (Speed / Throttle / Brake / Gear / RPM / DRS)
  const channelChartOption: any = useMemo(() => {
    if (!telemetryData || !telemetryData.driver1 || !telemetryData.driver2) return null;

    const d1Points = telemetryData.driver1.points || [];
    const d2Points = telemetryData.driver2.points || [];

    if (d1Points.length === 0 && d2Points.length === 0) return null;

    const refPoints = d1Points.length >= d2Points.length ? d1Points : d2Points;
    const xAxisData = refPoints.map((p: any) => `${Math.round(p.distance)}m`);

    const getValue = (p: any) => {
      if (!p) return 0;
      if (activeChannel === "speed") return Number(p.speed) || 0;
      if (activeChannel === "throttle") return Number(p.throttle) || 0;
      if (activeChannel === "brake") return p.brake ? 100 : 0;
      if (activeChannel === "gear") return Number(p.gear) || 0;
      if (activeChannel === "rpm") return Number(p.rpm) || 0;
      if (activeChannel === "drs") return Number(p.drs) > 0 ? 1 : 0;
      return Number(p.speed) || 0;
    };

    const d1Values = d1Points.map(getValue);
    const d2Values = d2Points.map(getValue);

    let yMin = 0;
    let yMax: number | undefined = 100;
    let unit = "";

    if (activeChannel === "speed") {
      yMin = 60;
      yMax = 350;
      unit = " km/h";
    } else if (activeChannel === "gear") {
      yMin = 1;
      yMax = 8;
      unit = "";
    } else if (activeChannel === "rpm") {
      yMin = 8000;
      yMax = 13500;
      unit = " RPM";
    } else if (activeChannel === "drs") {
      yMin = 0;
      yMax = 1;
      unit = "";
    }

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross", crossStyle: { color: "#e10600" } },
        formatter: (params: any) => {
          if (!params || params.length === 0) return "";
          const dist = params[0].name;
          let html = `<div style="font-family: monospace; font-size: 11px; padding: 4px;">`;
          html += `<div style="font-weight: bold; color: #fff; margin-bottom: 4px;">Track Distance: ${dist}</div>`;
          params.forEach((p: any) => {
            const displayVal =
              activeChannel === "drs"
                ? p.value === 1 ? "OPEN (Active)" : "CLOSED"
                : `${p.value}${unit}`;
            html += `<div style="color: ${p.color}; font-weight: 600;">${p.seriesName}: ${displayVal}</div>`;
          });
          html += `</div>`;
          return html;
        },
      },
      legend: {
        data: [`${driver1} (Car 1)`, `${driver2} (Car 2)`],
        textStyle: { color: "#d4d4d8", fontFamily: "monospace" },
        top: 0,
      },
      grid: {
        left: "4%",
        right: "4%",
        bottom: "8%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: xAxisData,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", interval: Math.floor(xAxisData.length / 10) },
      },
      yAxis: {
        type: "value" as const,
        min: yMin,
        max: yMax,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: {
          color: "#71717a",
          formatter: (val: number) => {
            if (activeChannel === "gear") return `G${val}`;
            if (activeChannel === "drs") return val === 1 ? "DRS" : "OFF";
            if (activeChannel === "rpm") return `${(val / 1000).toFixed(0)}k`;
            return `${val}${unit}`;
          },
        },
      },
      series: [
        {
          name: `${driver1} (Car 1)`,
          type: "line",
          smooth: 0.15,
          showSymbol: false,
          lineStyle: { width: 2.5, color: "#3b82f6" },
          itemStyle: { color: "#3b82f6" },
          data: d1Values,
        },
        {
          name: `${driver2} (Car 2)`,
          type: "line",
          smooth: 0.15,
          showSymbol: false,
          lineStyle: { width: 2.5, color: "#f97316" },
          itemStyle: { color: "#f97316" },
          data: d2Values,
        },
      ],
    };
  }, [telemetryData, activeChannel, driver1, driver2]);

  // Secondary Synchronized Throttle & Brake Pedals Chart
  const pedalsChartOption: any = useMemo(() => {
    if (!telemetryData || !telemetryData.driver1 || !telemetryData.driver2) return null;

    const d1Points = telemetryData.driver1.points || [];
    const d2Points = telemetryData.driver2.points || [];

    if (d1Points.length === 0) return null;

    const refPoints = d1Points.length >= d2Points.length ? d1Points : d2Points;
    const xAxisData = refPoints.map((p: any) => `${Math.round(p.distance)}m`);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross", crossStyle: { color: "#e10600" } },
      },
      legend: {
        data: [`${driver1} Throttle`, `${driver1} Brake`, `${driver2} Throttle`, `${driver2} Brake`],
        textStyle: { color: "#71717a", fontSize: 10, fontFamily: "monospace" },
        top: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "8%",
        top: "16%",
        containLabel: true,
      },
      xAxis: {
        type: "category" as const,
        data: xAxisData,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", interval: Math.floor(xAxisData.length / 10) },
      },
      yAxis: {
        type: "value" as const,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a", formatter: (val: number) => `${val}%` },
      },
      series: [
        {
          name: `${driver1} Throttle`,
          type: "line",
          smooth: 0.1,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#22c55e" },
          itemStyle: { color: "#22c55e" },
          data: d1Points.map((p: any) => p.throttle),
        },
        {
          name: `${driver1} Brake`,
          type: "line",
          smooth: 0.1,
          showSymbol: false,
          lineStyle: { width: 2, color: "#ef4444" },
          itemStyle: { color: "#ef4444" },
          data: d1Points.map((p: any) => (p.brake ? 100 : 0)),
        },
        {
          name: `${driver2} Throttle`,
          type: "line",
          smooth: 0.1,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#86efac", type: "dashed" },
          itemStyle: { color: "#86efac" },
          data: d2Points.map((p: any) => p.throttle),
        },
        {
          name: `${driver2} Brake`,
          type: "line",
          smooth: 0.1,
          showSymbol: false,
          lineStyle: { width: 2, color: "#f87171", type: "dashed" },
          itemStyle: { color: "#f87171" },
          data: d2Points.map((p: any) => (p.brake ? 100 : 0)),
        },
      ],
    };
  }, [telemetryData, driver1, driver2]);

  // Mini 2D GPS Track Map
  const trackMapOption: any = useMemo(() => {
    if (!telemetryData?.trackMap?.coordinates || telemetryData.trackMap.coordinates.length === 0) return null;
    const coords = telemetryData.trackMap.coordinates;

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => `Apex Point (${params.value[0]}, ${params.value[1]})`,
      },
      grid: {
        left: "5%",
        right: "5%",
        top: "5%",
        bottom: "5%",
      },
      xAxis: {
        type: "value" as const,
        show: false,
      },
      yAxis: {
        type: "value" as const,
        show: false,
      },
      series: [
        {
          name: "Circuit Geometry",
          type: "line",
          data: coords,
          smooth: 0.1,
          showSymbol: false,
          lineStyle: {
            width: 3.5,
            color: "#e10600",
            shadowColor: "rgba(225, 6, 0, 0.4)",
            shadowBlur: 10,
          },
        },
      ],
    };
  }, [telemetryData]);

  const exportTelemetryPoints = telemetryData?.driver1?.points || [];

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                High-Frequency Telemetry Suite
              </span>
              <span className="text-xs font-mono text-zinc-500">
                100Hz FastF1 ECU Sensor Feeds
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Synchronized Dual-Driver Telemetry
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Overlay Speed, Throttle, Brake, Gear, RPM, and DRS channels with synchronized distance crosshairs and live telemetry cursor sync.
            </p>
          </div>

          {/* Telemetry Driver Selectors & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 font-mono text-xs shadow-sm transition-colors focus-within:border-blue-500/80">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-zinc-400 font-bold text-[10px]">CAR 1:</span>
              <select
                value={driver1}
                onChange={(e) => setDriver1(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                {availableDrivers.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 font-mono text-xs shadow-sm transition-colors focus-within:border-orange-500/80">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-zinc-400 font-bold text-[10px]">CAR 2:</span>
              <select
                value={driver2}
                onChange={(e) => setDriver2(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                {availableDrivers.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 font-mono text-xs text-zinc-300 shadow-sm transition-colors focus-within:border-red-500/80">
              <span className="text-zinc-400 font-bold text-[10px]">SESSION:</span>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer [&>option]:bg-zinc-950 [&>option]:text-white"
              >
                <option value="Fastest Lap">Fastest Session Lap</option>
              </select>
            </div>

            {exportTelemetryPoints.length > 0 && (
              <ExportButtons
                data={exportTelemetryPoints}
                filename={`f1-telemetry-${driver1}-vs-${driver2}`}
                label="Trace"
              />
            )}
          </div>
        </div>

        {/* Telemetry Channel Tabs (6 required channels: speed, throttle, brake, gear, rpm, drs) */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto">
          {[
            { id: "speed", label: "Speed Trace (km/h)" },
            { id: "throttle", label: "Throttle (0-100%)" },
            { id: "brake", label: "Brake Pressure" },
            { id: "gear", label: "Gear Selection (1-8)" },
            { id: "rpm", label: "Engine RPM" },
            { id: "drs", label: "DRS Activation" },
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id as TelemetryChannel)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                activeChannel === ch.id
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        {/* Dual Driver Head-to-Head Telemetry Comparison Bar */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs font-mono font-bold text-white">
                {driver1} (Car 1)
              </span>
            </div>
            <span className="text-zinc-600 font-mono">VS</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs font-mono font-bold text-white">
                {driver2} (Car 2)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-emerald-400">
              100Hz ECU Sync Active
            </span>
            <span className="text-zinc-500">Track: Sakhir (5,412m)</span>
          </div>
        </div>

        {loading ? (
          <LoadingState type="chart" message="Ingesting 100Hz ECU telemetry streams and synchronizing trace..." />
        ) : !hasTelemetry ? (
          <EmptyState
            type="missing_dataset"
            title="Telemetry Dataset Not Imported"
            message={
              missingInfo?.error ||
              `High-frequency telemetry stream is not available for ${driver1} and ${driver2}. The platform adheres to an uncompromising zero synthetic data policy.`
            }
            requiredColumns={
              missingInfo?.requiredColumns || [
                "raceId",
                "driverCode",
                "lapNumber",
                "distance",
                "speed",
                "throttle",
                "brake",
                "gear",
                "rpm",
                "drs",
                "x",
                "y",
              ]
            }
            sourceGuide={
              missingInfo?.sourceGuide ||
              "Telemetry data can be exported using the Python FastF1 library: `session = fastf1.get_session(2024, 1, 'R'); session.load(); tel = session.laps.pick_fastest().get_telemetry()`"
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Primary Channel Chart */}
            <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Primary Telemetry Channel: {activeChannel.toUpperCase()} vs Track Distance
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  Cursor X-Crosshair Synchronized
                </span>
              </div>
              <div className="h-[380px] w-full">
                <InteractiveChart option={channelChartOption} height="380px" />
              </div>
            </div>

            {/* Split Grid: Pedals Overlay + Mini Track Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Secondary Pedals Application Chart */}
              <div className="lg:col-span-2 border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                      Throttle (Green) vs Trail Braking (Red)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    Dual Pedal Overlap Trace
                  </span>
                </div>
                <div className="h-[280px] w-full">
                  <InteractiveChart option={pedalsChartOption} height="280px" />
                </div>
              </div>

              {/* 2D Circuit Apex Map */}
              <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-3 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                      Circuit Apex Map
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">
                    GPS Geometry
                  </span>
                </div>
                <div className="h-[240px] w-full flex items-center justify-center">
                  {trackMapOption ? (
                    <InteractiveChart option={trackMapOption} height="240px" />
                  ) : (
                    <span className="text-xs font-mono text-zinc-500">Track GPS Map Active</span>
                  )}
                </div>
                <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex justify-between">
                  <span>Corners: 15 Turns</span>
                  <span className="text-red-400">DRS Zones: 3</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
