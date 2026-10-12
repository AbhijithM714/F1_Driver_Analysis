"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DriverRecord } from "@/lib/driversService";
import InteractiveChart from "@/components/charts/InteractiveChart";
import {
  User,
  GitCompare,
  ArrowLeft,
  Calendar,
  Flag,
  Shield,
  Hash,
  Activity,
  ExternalLink,
  ChevronRight,
  Database,
  Award,
  Trophy,
  BarChart2,
  TrendingUp,
  Flame,
  FileText,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import ExportButtons from "@/components/ExportButtons";
import { generateDriverPdfReport } from "@/lib/exportUtils";

export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params?.id as string;

  const [driver, setDriver] = useState<any>(null);
  const [allDrivers, setAllDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareTarget, setCompareTarget] = useState<string>("");
  const [driverTelemetry, setDriverTelemetry] = useState<any[]>([]);
  const [driverStints, setDriverStints] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDriverData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/drivers/${driverId}`);
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setDriver(d);

          // Fetch telemetry & stints for this driver
          if (d.code) {
            fetch(`/api/telemetry?driver1=${d.code}`)
              .then((r) => r.json())
              .then((tJson) => {
                if (tJson.success && tJson.data?.driver1?.points) {
                  setDriverTelemetry(tJson.data.driver1.points);
                }
              })
              .catch(console.error);

            fetch(`/api/tyres?driver=${d.code}`)
              .then((r) => r.json())
              .then((sJson) => {
                if (sJson.success && sJson.data?.stints) {
                  setDriverStints(sJson.data.stints);
                }
              })
              .catch(console.error);
          }
        }

        // Fetch all drivers for comparison options
        const allRes = await fetch("/api/drivers");
        const allJson = await allRes.json();
        if (allJson.success) {
          setAllDrivers(allJson.data);
        }
      } catch (err) {
        console.error("Failed loading driver data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (driverId) {
      fetchDriverData();
    }
  }, [driverId]);

  const radarChartOption: any = useMemo(() => {
    if (!driver?.stats?.radar && !driver?.stats?.skillsRadar) return null;
    const radarAxes = driver.stats.radar;
    const r = driver.stats.skillsRadar;

    const indicators = radarAxes
      ? radarAxes.map((axis: any) => ({ name: axis.label, max: 100 }))
      : [
          { name: "Race Pace", max: 100 },
          { name: "Qualifying Speed", max: 100 },
          { name: "Consistency", max: 100 },
          { name: "Racecraft", max: 100 },
          { name: "Reliability", max: 100 },
        ];

    const values = radarAxes
      ? radarAxes.map((axis: any) => axis.value)
      : [r.racePace, r.qualifyingSpeed, r.consistency, r.racecraft, r.reliability];

    return {
      tooltip: {
        trigger: "item",
      },
      radar: {
        indicator: indicators,
        shape: "polygon",
        splitNumber: 4,
        axisName: {
          color: "#d4d4d8",
          fontFamily: "monospace",
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: "#27272a",
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ["rgba(24, 24, 27, 0.4)", "rgba(9, 9, 11, 0.6)"],
          },
        },
        axisLine: {
          lineStyle: {
            color: "#3f3f46",
          },
        },
      },
      series: [
        {
          name: driver.fullName,
          type: "radar",
          data: [
            {
              value: values,
              name: driver.fullName,
              symbol: "circle",
              symbolSize: 4,
              itemStyle: {
                color: driver.teamColor || "#ef4444",
              },
              areaStyle: {
                color: (driver.teamColor || "#ef4444") + "33",
              },
              lineStyle: {
                width: 2.5,
                color: driver.teamColor || "#ef4444",
              },
            },
          ],
        },
      ],
    };
  }, [driver]);

  const pointsHistoryOption: any = useMemo(() => {
    if (!driver?.stats?.pointsByYear || driver.stats.pointsByYear.length === 0) return null;
    const years = driver.stats.pointsByYear.map((p: any) => String(p.year));
    const points = driver.stats.pointsByYear.map((p: any) => p.points);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const item = params[0];
          return `<div style="font-family: monospace; font-size: 11px; padding: 4px;"><b>${item.name} Season:</b> <span style="color: #ef4444; font-weight: bold;">${item.value} PTS</span></div>`;
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
        data: years,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", fontSize: 10 },
      },
      yAxis: {
        type: "value" as const,
        axisLine: { lineStyle: { color: "#27272a" } },
        splitLine: { lineStyle: { color: "#18181b" } },
        axisLabel: { color: "#71717a" },
      },
      series: [
        {
          name: "Points",
          type: "bar",
          barWidth: "45%",
          itemStyle: {
            color: driver.teamColor || "#ef4444",
          },
          data: points,
        },
      ],
    };
  }, [driver]);

  const driverTelemetryChartOption: any = useMemo(() => {
    if (!driverTelemetry || driverTelemetry.length === 0) return null;

    const xAxisData = driverTelemetry.map((p) => `${Math.round(p.distance)}m`);
    const speeds = driverTelemetry.map((p) => p.speed);
    const throttles = driverTelemetry.map((p) => p.throttle);
    const brakes = driverTelemetry.map((p) => (p.brake ? 100 : 0));

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (params: any) => {
          let html = `<div style="font-family: monospace; font-size: 11px; padding: 4px;">`;
          html += `<div style="font-weight: bold; color: #fff; margin-bottom: 2px;">Distance: ${params[0].name}</div>`;
          params.forEach((p: any) => {
            html += `<div style="color: ${p.color};">${p.seriesName}: ${p.value}</div>`;
          });
          html += `</div>`;
          return html;
        },
      },
      legend: {
        data: ["Speed (km/h)", "Throttle (%)", "Brake (%)"],
        textStyle: { color: "#a1a1aa", fontSize: 10, fontFamily: "monospace" },
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
        data: xAxisData,
        axisLine: { lineStyle: { color: "#27272a" } },
        axisLabel: { color: "#71717a", interval: Math.floor(xAxisData.length / 8) },
      },
      yAxis: [
        {
          type: "value" as const,
          name: "km/h",
          min: 0,
          max: 340,
          axisLine: { lineStyle: { color: "#27272a" } },
          splitLine: { lineStyle: { color: "#18181b" } },
          axisLabel: { color: "#71717a" },
        },
        {
          type: "value" as const,
          name: "%",
          min: 0,
          max: 100,
          show: false,
        },
      ],
      series: [
        {
          name: "Speed (km/h)",
          type: "line",
          smooth: 0.15,
          showSymbol: false,
          lineStyle: { width: 2.5, color: driver?.teamColor || "#38bdf8" },
          itemStyle: { color: driver?.teamColor || "#38bdf8" },
          data: speeds,
        },
        {
          name: "Throttle (%)",
          type: "line",
          yAxisIndex: 1,
          smooth: 0.1,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#22c55e" },
          itemStyle: { color: "#22c55e" },
          data: throttles,
        },
        {
          name: "Brake (%)",
          type: "line",
          yAxisIndex: 1,
          smooth: 0.1,
          showSymbol: false,
          lineStyle: { width: 2, color: "#ef4444" },
          itemStyle: { color: "#ef4444" },
          data: brakes,
        },
      ],
    };
  }, [driverTelemetry, driver]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400 font-mono text-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          CALIBRATING DRIVER TELEMETRY PROFILE...
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-4">
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-center max-w-md">
          <h2 className="text-lg font-bold text-white mb-2">Driver Record Not Found</h2>
          <p className="text-xs text-zinc-400 mb-4">
            Could not find an entry matching &ldquo;{driverId}&rdquo; in the official drivers dataset.
          </p>
          <Link
            href="/drivers"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-semibold text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Drivers Roster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-2">
            <Link href="/drivers" className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Drivers Roster
            </Link>
            <span>/</span>
            <span className="text-zinc-200">{driver.fullName}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => generateDriverPdfReport(driver)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E10600] hover:bg-[#b80500] text-white text-xs font-medium transition-colors shadow-sm"
              title="Download career telemetry PDF report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Career PDF Report</span>
            </button>

            <FavoriteButton
              type="driver"
              id={driver.driverRef}
              name={driver.fullName}
              subtitle={driver.constructorName}
              flag={driver.flag}
              color={driver.teamColor}
            />

            <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              OFFICIAL ERGAST ID: #{driver.driverId}
            </span>
          </div>
        </div>

        {/* Hero Banner with Livery Gradient */}
        <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden p-6 sm:p-10 shadow-panel">
          {/* Background Watermark & Livery Glow */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: driver.teamColor }}
          />
          <div className="absolute right-6 -bottom-8 font-black font-mono text-8xl sm:text-9xl text-zinc-900/60 select-none pointer-events-none">
            {driver.number ? `#${driver.number}` : driver.code}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Driver Official Portrait Frame */}
              <div
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-zinc-900/90 border-2 overflow-hidden shrink-0 flex items-center justify-center shadow-2xl"
                style={{ borderColor: driver.teamColor || "#E10600" }}
              >
                <div
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at top, ${driver.teamColor || "#E10600"}, transparent 75%)`,
                  }}
                />
                {driver.imageUrl ? (
                  <img
                    src={driver.imageUrl}
                    alt={driver.fullName}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                    className="relative z-10 w-full h-full object-cover object-top scale-110"
                  />
                ) : (
                  <span
                    className="relative z-10 font-mono text-2xl font-black tracking-tighter"
                    style={{ color: driver.teamColor || "#E10600" }}
                  >
                    {driver.number ? `#${driver.number}` : driver.code}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* Top Badges */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-white shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: driver.teamColor }} />
                    {driver.code}
                  </span>

                  {driver.number && (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-900/90 border border-zinc-800 text-zinc-200">
                      PERMANENT CAR #{driver.number}
                    </span>
                  )}

                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                    <span className="text-base leading-none">{driver.flag}</span>
                    <span>{driver.nationality}</span>
                  </span>

                  {driver.isCurrentGrid && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950/80 text-red-400 border border-red-800">
                      ACTIVE 2024 GRID
                    </span>
                  )}

                  {Boolean(driver.stats?.titles && driver.stats.titles > 0) && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {driver.stats.titles}x WORLD CHAMPION
                    </span>
                  )}
                </div>

                {/* Driver Full Name */}
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  {driver.fullName}
                </h1>

                {/* Team Association */}
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Shield className="w-4 h-4 text-zinc-400" />
                  <span className="font-semibold" style={{ color: driver.teamColor }}>
                    {driver.constructorName}
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-400 font-mono text-xs">
                    Chassis Association
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions / External Bio */}
            <div className="flex items-center gap-3 shrink-0">
              {driver.url && (
                <a
                  href={driver.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                >
                  <span>Biography & Records</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Profile Attributes & Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Date of Birth</span>
            <div className="text-base font-bold font-mono text-white mt-1">
              {driver.dob}
            </div>
            <span className="text-[11px] text-zinc-400">
              {driver.age ? `${driver.age} Years Old` : "Official Birthdate"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Permanent Number</span>
            <div className="text-base font-bold font-mono text-white mt-1">
              {driver.number ? `#${driver.number}` : "Unassigned"}
            </div>
            <span className="text-[11px] text-zinc-400">Official FIA Car Reg</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Timing Code</span>
            <div className="text-base font-bold font-mono text-purple-400 mt-1">
              {driver.code}
            </div>
            <span className="text-[11px] text-zinc-400">3-Letter Broadcast Code</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Nationality</span>
            <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
              <span>{driver.flag}</span>
              <span>{driver.nationality}</span>
            </div>
            <span className="text-[11px] text-zinc-400">Licensing Nation</span>
          </div>
        </div>

        {/* Head-to-Head Comparison Bar */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Compare {driver.fullName} With Another Driver
              </h3>
              <p className="text-xs text-zinc-400">
                Select any grid competitor or historical champion for side-by-side analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={compareTarget}
              onChange={(e) => setCompareTarget(e.target.value)}
              className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-white font-mono font-medium focus:outline-none focus:border-red-500/80 cursor-pointer shadow-sm transition-colors w-full sm:w-60 [&>option]:bg-zinc-950 [&>option]:text-white"
            >
              <option value="">Choose Driver To Compare...</option>
              {allDrivers
                .filter((d) => d.driverRef !== driver.driverRef)
                .map((d) => (
                  <option key={d.driverRef} value={d.driverRef}>
                    {d.fullName} ({d.code}) #{d.number || "--"}
                  </option>
                ))}
            </select>

            <button
              disabled={!compareTarget}
              onClick={() => {
                if (compareTarget) {
                  router.push(`/drivers?compareA=${driver.driverRef}&compareB=${compareTarget}`);
                }
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 text-xs font-semibold text-white shrink-0 transition-all shadow-sm"
            >
              Compare
            </button>
          </div>
        </div>

        {/* Career Statistics KPI Grid (Authentic results.csv & qualifying.csv data) */}
        {driver.stats && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Trophy className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                Career Performance Telemetry & Official Records
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Starts</span>
                <span className="text-xl font-bold text-white mt-0.5 block">{driver.stats.totalStarts}</span>
                <span className="text-[10px] text-zinc-500">Grand Prix</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Wins</span>
                <span className="text-xl font-bold text-red-400 mt-0.5 block">{driver.stats.totalWins}</span>
                <span className="text-[10px] text-zinc-500">{driver.stats.winRate}% Rate</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Podiums</span>
                <span className="text-xl font-bold text-cyan-400 mt-0.5 block">{driver.stats.totalPodiums}</span>
                <span className="text-[10px] text-zinc-500">{driver.stats.podiumRate}% Rate</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Poles</span>
                <span className="text-xl font-bold text-purple-400 mt-0.5 block">{driver.stats.totalPoles}</span>
                <span className="text-[10px] text-zinc-500">P1 Quali</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Points</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{driver.stats.totalPoints}</span>
                <span className="text-[10px] text-zinc-500">Career Pts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Fastest Laps</span>
                <span className="text-xl font-bold text-yellow-400 mt-0.5 block">{driver.stats.totalFastestLaps}</span>
                <span className="text-[10px] text-zinc-500">Purple Laps</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Avg Finish</span>
                <span className="text-xl font-bold text-white mt-0.5 block">P{driver.stats.averageFinish}</span>
                <span className="text-[10px] text-zinc-500">Grid: P{driver.stats.averageGrid}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span className="text-[10px] uppercase text-zinc-500 block">Reliability</span>
                <span className="text-xl font-bold text-emerald-400 mt-0.5 block">{driver.stats.reliabilityRate}%</span>
                <span className="text-[10px] text-zinc-500">{driver.stats.dnfCount} DNFs</span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Charts: Performance Radar & Points Progression */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {radarChartOption && (
            <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Driver Skill Dynamics Radar
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  5-Axis Multi-Skill Index
                </span>
              </div>
              <div className="h-[320px] w-full">
                <InteractiveChart option={radarChartOption} height="320px" />
              </div>
            </div>
          )}

          {pointsHistoryOption && (
            <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    Points By Season Progression
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  Career Championship Output
                </span>
              </div>
              <div className="h-[320px] w-full">
                <InteractiveChart option={pointsHistoryOption} height="320px" />
              </div>
            </div>
          )}
        </div>

        {/* Recent Grand Prix Classifications Table */}
        {driver.stats?.recentRaces && driver.stats.recentRaces.length > 0 && (
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                Recent Grand Prix Classifications
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Official Results from data/results.csv
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">YEAR & ROUND</th>
                    <th className="py-3 px-4 font-sans">GRAND PRIX</th>
                    <th className="py-3 px-4 font-sans">TEAM</th>
                    <th className="py-3 px-4 text-center">GRID</th>
                    <th className="py-3 px-4 text-center">FINISH</th>
                    <th className="py-3 px-4 text-right">POINTS</th>
                    <th className="py-3 px-4 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {driver.stats.recentRaces.map((r: any) => (
                    <tr key={r.resultId} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 text-zinc-400">
                        {r.year} R{r.round}
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {r.raceName}
                      </td>
                      <td className="py-3 px-4 font-sans" style={{ color: r.teamColor }}>
                        {r.constructorName}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-400">
                        P{r.grid || "--"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            r.position === 1
                              ? "bg-yellow-950 text-yellow-400 border border-yellow-800"
                              : r.position === 2 || r.position === 3
                              ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                              : "text-zinc-200"
                          }`}
                        >
                          {typeof r.position === "number" ? `P${r.position}` : r.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-red-400">
                        +{r.points}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400">
                        {r.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* High-Frequency Subsystem Telemetry & Tyre Strategy Section */}
        <div className="space-y-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
              High-Frequency Subsystem Telemetry & Strategy Channels
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Telemetry Sensor Trace */}
            <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    {driver.fullName} 100Hz ECU Telemetry Trace (Speed & Pedals)
                  </h3>
                </div>
                <Link
                  href="/telemetry"
                  className="text-xs font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  Dual-Car Comparator <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {driverTelemetryChartOption ? (
                <div className="h-[320px] w-full">
                  <InteractiveChart option={driverTelemetryChartOption} height="320px" />
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-mono text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                  <Activity className="w-6 h-6 text-amber-500/70 mx-auto" />
                  <div className="text-zinc-200 font-bold">
                    100Hz ECU Telemetry Not Imported for {driver.code || driver.fullName}
                  </div>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                    High-frequency ECU sensor telemetry in <code className="text-zinc-400">data/telemetry.csv</code> currently covers drivers with recorded 2024 sessions (VER, LEC, HAM, NOR, PIA, SAI, RUS, PER). Career radar, points progression, and race results are fully tracked above.
                  </p>
                  <Link
                    href="/telemetry"
                    className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-400 font-semibold mt-2"
                  >
                    Open Telemetry Suite <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Live Tyre Stint Strategy Breakdown */}
            <div className="border border-zinc-800 rounded-3xl bg-zinc-950/80 p-6 shadow-panel space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                    {driver.fullName} Official Tyre Stints & Degradation Strategy
                  </h3>
                </div>
                <Link
                  href="/tyres"
                  className="text-xs font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  Full Strategy Engine <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {driverStints && driverStints.length > 0 ? (
                <div className="space-y-3 font-mono text-xs">
                  {driverStints.map((s: any, idx: number) => {
                    const compoundColor =
                      s.compound === "SOFT"
                        ? "#ef4444"
                        : s.compound === "MEDIUM"
                        ? "#eab308"
                        : s.compound === "HARD"
                        ? "#f4f4f5"
                        : "#22c55e";

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-black"
                            style={{ backgroundColor: compoundColor }}
                          >
                            {s.compound}
                          </span>
                          <div>
                            <span className="text-white font-bold block">
                              Stint {s.stint}: Laps {s.lapStart} ➔ {s.lapEnd}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Duration: {s.lapCount} Laps Completed
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-zinc-400 block text-[11px]">
                            Initial Tyre Age: {s.tyreAge} Laps
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            {s.tyreAge > 0 ? "Scrubbed Set" : "Fresh Sticker Set"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-mono text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
                  <Flame className="w-6 h-6 text-orange-500/70 mx-auto" />
                  <div className="text-zinc-200 font-bold">
                    Pirelli Stint Logs Not Available for {driver.code || driver.fullName}
                  </div>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                    Stint records in <code className="text-zinc-400">data/tyre_stints.csv</code> cover drivers recorded in imported sessions. You can model real tyre degradation curves and pit stop windows across all Grand Prix rounds in the Strategy Engine.
                  </p>
                  <Link
                    href="/tyres"
                    className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-400 font-semibold mt-2"
                  >
                    Launch Strategy Engine <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

