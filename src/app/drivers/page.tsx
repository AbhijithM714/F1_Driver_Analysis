"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DriverRecord } from "@/lib/driversService";
import { F1_TEAMS } from "@/lib/f1Themes";
import InteractiveChart from "@/components/charts/InteractiveChart";
import {
  User,
  GitCompare,
  Search,
  ChevronRight,
  Shield,
  Hash,
  Flag,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  ExternalLink,
  Activity,
  Trophy,
  Award,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import ExportButtons from "@/components/ExportButtons";

function DriversContent() {
  const searchParams = useSearchParams();
  const initialCompareA = searchParams?.get("compareA") || "";
  const initialCompareB = searchParams?.get("compareB") || "";

  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "modern" | "champions" | "all">("current");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedNationality, setSelectedNationality] = useState<string>("ALL");
  const [selectedEra, setSelectedEra] = useState<string>("ALL");

  // Comparison State
  const [compareA, setCompareA] = useState<string>(initialCompareA);
  const [compareB, setCompareB] = useState<string>(initialCompareB);
  const [statsA, setStatsA] = useState<any>(null);
  const [statsB, setStatsB] = useState<any>(null);
  const [compTelemetry, setCompTelemetry] = useState<any>(null);
  const [compLoading, setCompLoading] = useState<boolean>(false);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(
    Boolean(initialCompareA && initialCompareB)
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [driversRes, seasonsRes] = await Promise.all([
          fetch("/api/drivers").then((r) => r.json()),
          fetch("/api/seasons").then((r) => r.json()).catch(() => null),
        ]);

        if (driversRes?.success) {
          setDrivers(driversRes.data);
        }
        if (seasonsRes?.success && Array.isArray(seasonsRes.data?.years)) {
          setSeasons(seasonsRes.data.years);
        }
      } catch (err) {
        console.error("Failed loading data from API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Unique Nationalities
  const nationalities = useMemo(() => {
    return Array.from(new Set(drivers.map((d) => d.nationality))).filter(Boolean).sort();
  }, [drivers]);

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      // Season filter (highest precedence)
      if (selectedSeason !== "ALL") {
        const sYear = Number(selectedSeason);
        if (!d.seasons || !d.seasons.includes(sYear)) return false;
      } else {
        // Tab filter only applies when "ALL" seasons is chosen
        if (activeTab === "current" && !d.isCurrentGrid) return false;
      }

      if (activeTab === "modern" && !d.isModern) return false;
      if (activeTab === "champions" && (!d.titles || d.titles <= 0)) return false;

      // Era filter
      if (selectedEra !== "ALL") {
        const last = d.lastYear ?? 0;
        const first = d.firstYear ?? 0;
        if (selectedEra === "2020s" && last < 2020) return false;
        if (selectedEra === "2010s" && (last < 2010 || first >= 2020)) return false;
        if (selectedEra === "2000s" && (last < 2000 || first >= 2010)) return false;
        if (selectedEra === "classic" && last >= 2000) return false;
      }

      // Team filter
      if (selectedTeam !== "ALL" && d.constructorId !== selectedTeam) return false;

      // Nationality filter
      if (selectedNationality !== "ALL" && d.nationality !== selectedNationality) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = d.fullName.toLowerCase().includes(q);
        const matchesCode = d.code.toLowerCase().includes(q);
        const matchesNat = d.nationality.toLowerCase().includes(q);
        const matchesNum = String(d.number).includes(q);
        const matchesRef = d.driverRef.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesNat && !matchesNum && !matchesRef) {
          return false;
        }
      }

      return true;
    });
  }, [drivers, selectedSeason, activeTab, selectedTeam, selectedNationality, selectedEra, searchQuery]);

  const driverAData = drivers.find((d) => d.driverRef === compareA);
  const driverBData = drivers.find((d) => d.driverRef === compareB);

  useEffect(() => {
    if (!driverAData || !driverBData) return;

    setCompLoading(true);

    Promise.all([
      fetch(`/api/drivers/${driverAData.driverId}`).then((r) => r.json()),
      fetch(`/api/drivers/${driverBData.driverId}`).then((r) => r.json()),
      fetch(
        `/api/telemetry?driver1=${driverAData.code}&driver2=${driverBData.code}&driverA=${driverAData.code}&driverB=${driverBData.code}`
      ).then((r) => r.json()),
    ])
      .then(([resA, resB, telRes]) => {
        if (resA?.success && (resA.data?.stats || resA.data?.career)) {
          setStatsA(resA.data.stats || resA.data.career);
        }
        if (resB?.success && (resB.data?.stats || resB.data?.career)) {
          setStatsB(resB.data.stats || resB.data.career);
        }
        if (telRes?.success && telRes.data) {
          setCompTelemetry(telRes.data);
        }
      })
      .catch((err) => console.error("Error fetching comparison data:", err))
      .finally(() => setCompLoading(false));
  }, [driverAData, driverBData]);

  const compTelemetryOption: any = useMemo(() => {
    if (!compTelemetry) return null;
    const dA = compTelemetry.driverA || compTelemetry.driver1;
    const dB = compTelemetry.driverB || compTelemetry.driver2;
    const samplesA = dA?.samples || dA?.points || [];
    const samplesB = dB?.samples || dB?.points || [];

    const filteredA = samplesA.filter((_: any, i: number) => i % 4 === 0);
    const filteredB = samplesB.filter((_: any, i: number) => i % 4 === 0);

    if (filteredA.length === 0 && filteredB.length === 0) return null;

    const baseSamples = filteredA.length > 0 ? filteredA : filteredB;
    const distances = baseSamples.map((s: any) => `${Math.round(s.distance)}m`);

    const legendData: string[] = [];
    const seriesList: any[] = [];

    if (filteredA.length > 0) {
      legendData.push(`${driverAData?.code} Speed`);
      seriesList.push({
        name: `${driverAData?.code} Speed`,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: filteredA.map((s: any) => s.speed),
        lineStyle: { color: driverAData?.teamColor || "#3671C6", width: 2.5 },
        itemStyle: { color: driverAData?.teamColor || "#3671C6" },
      });
    }

    if (filteredB.length > 0) {
      legendData.push(`${driverBData?.code} Speed`);
      seriesList.push({
        name: `${driverBData?.code} Speed`,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: filteredB.map((s: any) => s.speed),
        lineStyle: { color: driverBData?.teamColor || "#E10600", width: 2 },
        itemStyle: { color: driverBData?.teamColor || "#E10600" },
      });
    }

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(9, 9, 11, 0.95)",
        borderColor: "#27272a",
        textStyle: { color: "#f4f4f5", fontFamily: "Inter, sans-serif", fontSize: 12 },
      },
      legend: {
        data: legendData,
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
      series: seriesList,
    };
  }, [compTelemetry, driverAData, driverBData]);

  const handleToggleCompare = (driverRef: string) => {
    if (compareA === driverRef) {
      setCompareA("");
    } else if (compareB === driverRef) {
      setCompareB("");
    } else if (!compareA) {
      setCompareA(driverRef);
    } else if (!compareB) {
      setCompareB(driverRef);
      setShowCompareModal(true);
    } else {
      // Replace slot B
      setCompareB(driverRef);
      setShowCompareModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Official Ergast Drivers Dataset
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {drivers.length} Drivers Archived (1950 – 2024)
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Formula 1 Drivers Intelligence
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Explore official driver profiles, permanent car numbers, three-letter timing codes, nationalities, and head-to-head comparisons mapped directly from <code className="text-red-400">data/drivers.csv</code>.
            </p>
          </div>

          {/* Quick Actions: Compare Bar & Export */}
          <div className="flex items-center gap-3">
            <ExportButtons
              data={filteredDrivers.map((d) => ({
                driverId: d.driverId,
                name: d.fullName,
                code: d.code,
                number: d.number ?? "N/A",
                team: d.constructorName,
                nationality: d.nationality,
                isActive: d.isCurrentGrid ? "YES" : "NO",
                starts: d.starts ?? "N/A",
                wins: d.wins ?? "N/A",
                podiums: d.podiums ?? "N/A",
                titles: d.titles ?? 0,
              }))}
              filename="f1_drivers_roster"
            />

            <button
              onClick={() => setShowCompareModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-colors shadow-sm"
            >
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <span>Compare Drivers</span>
              {(compareA || compareB) && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-[10px] font-mono">
                  {[compareA, compareB].filter(Boolean).length}/2
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Left: Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 shrink-0 overflow-x-auto">
            <button
              onClick={() => {
                setSelectedSeason("ALL");
                setActiveTab("current");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === "current" && selectedSeason === "ALL"
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              2024 Active ({drivers.filter((d) => d.isCurrentGrid).length})
            </button>
            <button
              onClick={() => {
                setSelectedSeason("ALL");
                setActiveTab("modern");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === "modern" && selectedSeason === "ALL"
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Modern (2010+)
            </button>
            <button
              onClick={() => {
                setSelectedSeason("ALL");
                setActiveTab("champions");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === "champions" && selectedSeason === "ALL"
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              World Champions ({drivers.filter((d) => (d.titles ?? 0) > 0).length})
            </button>
            <button
              onClick={() => {
                setSelectedSeason("ALL");
                setActiveTab("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === "all" && selectedSeason === "ALL"
                  ? "bg-red-600 text-white font-semibold shadow-glow-red"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Historic ({drivers.length})
            </button>
          </div>

          {/* Right: Search Input & Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 md:justify-end">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, code (VER), #, nation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Season Selector */}
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-white font-mono font-medium focus:outline-none focus:border-red-500/80 cursor-pointer shadow-sm transition-colors [&>option]:bg-zinc-950 [&>option]:text-white"
            >
              <option value="ALL">All Seasons</option>
              {seasons.map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr} Season
                </option>
              ))}
            </select>

            {/* Era Dropdown */}
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-white font-mono font-medium focus:outline-none focus:border-red-500/80 cursor-pointer shadow-sm transition-colors [&>option]:bg-zinc-950 [&>option]:text-white"
            >
              <option value="ALL">All Eras</option>
              <option value="2020s">2020s Era</option>
              <option value="2010s">2010s Era</option>
              <option value="2000s">2000s Era</option>
              <option value="classic">Classic (&lt;2000)</option>
            </select>

            {/* Team Dropdown */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-white font-mono font-medium focus:outline-none focus:border-red-500/80 cursor-pointer shadow-sm transition-colors [&>option]:bg-zinc-950 [&>option]:text-white"
            >
              <option value="ALL">All Teams</option>
              {Object.keys(F1_TEAMS).map((key) => (
                <option key={key} value={key}>
                  {F1_TEAMS[key].shortName}
                </option>
              ))}
            </select>

            {/* Nationality Dropdown */}
            <select
              value={selectedNationality}
              onChange={(e) => setSelectedNationality(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-white font-mono font-medium focus:outline-none focus:border-red-500/80 cursor-pointer shadow-sm transition-colors [&>option]:bg-zinc-950 [&>option]:text-white"
            >
              <option value="ALL">All Nationalities</option>
              {nationalities.map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drivers Grid */}
        {loading ? (
          <div className="p-16 text-center text-zinc-500 font-mono text-sm">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-ping mx-auto mb-3" />
            PARSING & VALIDATING DATA/DRIVERS.CSV...
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="p-16 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center">
            <User className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">No Drivers Found</h3>
            <p className="text-xs text-zinc-500 mt-1">
              No entries matching your search &ldquo;{searchQuery}&rdquo; and active filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDrivers.map((driver) => {
              const isSelectedA = compareA === driver.driverRef;
              const isSelectedB = compareB === driver.driverRef;
              const isSelected = isSelectedA || isSelectedB;

              return (
                <div
                  key={driver.driverRef}
                  className={`group relative rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-panel ${
                    isSelected
                      ? "bg-zinc-900 border-cyan-500/80 ring-1 ring-cyan-500"
                      : "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-950"
                  }`}
                >
                  {/* Top Team Color Livery Accent Line */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: driver.teamColor }}
                  />

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    {/* Header: Permanent Number, Timing Code & Compare Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {driver.number ? (
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-black text-white bg-zinc-900 border border-zinc-800">
                            #{driver.number}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-850">
                            HISTORIC
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wider bg-zinc-900 text-purple-400 border border-zinc-800">
                          {driver.code}
                        </span>
                      </div>

                      {/* Card Actions: Compare & Favorite */}
                      <div className="flex items-center gap-1.5">
                        <FavoriteButton
                          type="driver"
                          id={driver.driverRef}
                          name={driver.fullName}
                          subtitle={`${driver.constructorName} · #${driver.number || driver.code}`}
                          flag={driver.flag}
                          color={driver.teamColor}
                          size="sm"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleCompare(driver.driverRef);
                          }}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                            isSelected
                              ? "bg-cyan-950 text-cyan-400 border-cyan-800"
                              : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                          }`}
                          title="Toggle for head-to-head comparison"
                        >
                          <GitCompare className="w-3 h-3" />
                          {isSelected ? "COMPARING" : "+ COMPARE"}
                        </button>
                      </div>
                    </div>

                    {/* Driver Name & Nationality */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors tracking-tight">
                        {driver.fullName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 font-sans">
                        <span className="text-sm">{driver.flag}</span>
                        <span>{driver.nationality}</span>
                        {driver.age && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="font-mono text-[11px] text-zinc-500">
                              {driver.age}y
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Team Association */}
                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium truncate max-w-[190px]">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: driver.teamColor }}
                        />
                        <span
                          className="truncate text-[11px] font-mono"
                          style={{ color: driver.teamColor }}
                        >
                          {driver.constructorName}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-600 uppercase">
                        ID: {driver.driverId}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Link */}
                  <Link
                    href={`/drivers/${driver.driverRef}`}
                    className="px-5 py-2.5 bg-zinc-900/60 hover:bg-zinc-900 border-t border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                  >
                    <span>View Driver Profile & Telemetry</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Head-to-Head Comparison Drawer / Modal */}
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-400">
                    <GitCompare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Head-to-Head Driver Comparison
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Compare profiles, biometric data, permanent numbers, and telemetry capabilities.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Driver Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Driver A Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Driver 1:
                  </label>
                  <select
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-white font-mono font-medium focus:outline-none focus:border-red-500/80 cursor-pointer shadow-sm transition-colors [&>option]:bg-zinc-950 [&>option]:text-white"
                  >
                    <option value="">Select Driver 1...</option>
                    {drivers.map((d) => (
                      <option key={d.driverRef} value={d.driverRef}>
                        {d.fullName} ({d.code}) {d.number ? `#${d.number}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Driver B Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Driver 2:
                  </label>
                  <select
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-500 text-xs text-white font-mono font-medium focus:outline-none focus:border-red-500/80 cursor-pointer shadow-sm transition-colors [&>option]:bg-zinc-950 [&>option]:text-white"
                  >
                    <option value="">Select Driver 2...</option>
                    {drivers.map((d) => (
                      <option key={d.driverRef} value={d.driverRef}>
                        {d.fullName} ({d.code}) {d.number ? `#${d.number}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Side-by-Side Comparison Profile Cards */}
              {driverAData && driverBData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Driver A Card */}
                    <div
                      className="p-5 rounded-2xl border bg-zinc-900/60 space-y-4"
                      style={{ borderColor: `${driverAData.teamColor}60` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black font-mono" style={{ color: driverAData.teamColor }}>
                          {driverAData.number ? `#${driverAData.number}` : driverAData.code}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-950 text-purple-400 border border-zinc-800">
                          {driverAData.code}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">
                          {driverAData.fullName}
                        </h4>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                          <span>{driverAData.flag}</span>
                          <span>{driverAData.nationality}</span>
                          <span>•</span>
                          <span>{driverAData.age ? `${driverAData.age} Years` : "DOB " + driverAData.dob}</span>
                        </div>
                      </div>
                      <div className="text-xs font-mono" style={{ color: driverAData.teamColor }}>
                        {driverAData.constructorName}
                      </div>
                    </div>

                    {/* Driver B Card */}
                    <div
                      className="p-5 rounded-2xl border bg-zinc-900/60 space-y-4"
                      style={{ borderColor: `${driverBData.teamColor}60` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black font-mono" style={{ color: driverBData.teamColor }}>
                          {driverBData.number ? `#${driverBData.number}` : driverBData.code}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-950 text-purple-400 border border-zinc-800">
                          {driverBData.code}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">
                          {driverBData.fullName}
                        </h4>
                        <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                          <span>{driverBData.flag}</span>
                          <span>{driverBData.nationality}</span>
                          <span>•</span>
                          <span>{driverBData.age ? `${driverBData.age} Years` : "DOB " + driverBData.dob}</span>
                        </div>
                      </div>
                      <div className="text-xs font-mono" style={{ color: driverBData.teamColor }}>
                        {driverBData.constructorName}
                      </div>
                    </div>
                  </div>

                  {/* Authentic Head-to-Head Metrics & Telemetry Trace */}
                  <div className="space-y-6">
                    {/* 1. Comparative Metrics Bars */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        Career Head-to-Head Statistics
                      </h4>
                      {compLoading && !statsA && !statsB ? (
                        <div className="py-8 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          Synchronizing career timing records...
                        </div>
                      ) : (
                        <div className="space-y-3 font-mono text-xs">
                          {[
                            { label: "Grand Prix Starts", a: statsA?.totalStarts ?? 0, b: statsB?.totalStarts ?? 0 },
                            { label: "Race Victories", a: statsA?.totalWins ?? 0, b: statsB?.totalWins ?? 0 },
                            { label: "Podium Finishes", a: statsA?.totalPodiums ?? 0, b: statsB?.totalPodiums ?? 0 },
                            { label: "Pole Positions", a: statsA?.totalPoles ?? 0, b: statsB?.totalPoles ?? 0 },
                            { label: "Championship Points", a: statsA?.totalPoints ?? 0, b: statsB?.totalPoints ?? 0 },
                          ].map((m, idx) => {
                            const total = Number(m.a) + Number(m.b) || 1;
                            const pctA = Math.round((Number(m.a) / total) * 100);
                            const pctB = 100 - pctA;
                            return (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold" style={{ color: driverAData.teamColor }}>
                                    {m.a}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                                    {m.label}
                                  </span>
                                  <span className="font-bold" style={{ color: driverBData.teamColor }}>
                                    {m.b}
                                  </span>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-zinc-900">
                                  <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                      width: `${pctA}%`,
                                      backgroundColor: driverAData.teamColor,
                                    }}
                                  />
                                  <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                      width: `${pctB}%`,
                                      backgroundColor: driverBData.teamColor,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. 100Hz ECU Telemetry Channel Overlay */}
                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-red-500" />
                          100Hz ECU Telemetry Speed Trace ({driverAData.code} vs {driverBData.code})
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500">Synchronized Radar Lap</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Direct speed comparison across the lap distance measuring cornering apex speeds and straight-line drag.
                      </p>
                      {compLoading ? (
                        <div className="h-48 flex items-center justify-center text-xs font-mono text-zinc-500">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                            Synchronizing 100Hz ECU telemetry channels ({driverAData.code} vs {driverBData.code})...
                          </div>
                        </div>
                      ) : compTelemetryOption ? (
                        <div className="space-y-3">
                          <InteractiveChart option={compTelemetryOption} height="260px" />
                          {(!compTelemetry?.driverA?.hasData && !compTelemetry?.driver1?.hasData) ||
                          (!compTelemetry?.driverB?.hasData && !compTelemetry?.driver2?.hasData) ? (
                            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] font-mono text-amber-300/90 flex items-start gap-2">
                              <span>⚠️</span>
                              <span>
                                Telemetry speed trace rendered for{" "}
                                {compTelemetry?.driverA?.hasData || compTelemetry?.driver1?.hasData
                                  ? driverAData.code
                                  : driverBData.code}
                                . Sensor telemetry for{" "}
                                {!compTelemetry?.driverA?.hasData && !compTelemetry?.driver1?.hasData
                                  ? driverAData.code
                                  : driverBData.code}{" "}
                                is not in this sampled session (Bahrain GP sample contains: VER, LEC, HAM, NOR, PIA, SAI, RUS, PER).
                              </span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-center space-y-2.5">
                          <Activity className="w-5 h-5 text-zinc-500 mx-auto" />
                          <div className="text-xs font-semibold text-zinc-300">
                            100Hz ECU Telemetry Not Archived for {driverAData.code} & {driverBData.code}
                          </div>
                          <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed">
                            The Bahrain GP telemetry sample archives high-frequency ECU channels for VER, LEC, HAM, NOR, PIA, SAI, RUS, and PER. Full career racing records and head-to-head metrics are computed above.
                          </p>
                          <Link
                            href="/telemetry"
                            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-mono mt-1 font-semibold"
                          >
                            <span>Open Telemetry Diagnostic Lab</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs border border-zinc-800 rounded-xl">
                  Please select both Driver 1 and Driver 2 from the dropdown menus above to view the head-to-head comparison.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriversPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-400 font-mono text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            LOADING FORMULA 1 DRIVERS ROSTER...
          </div>
        </div>
      }
    >
      <DriversContent />
    </Suspense>
  );
}
