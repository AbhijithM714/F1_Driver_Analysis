"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Award,
  Crown,
  Flame,
  Sparkles,
  Shield,
  Medal,
  ChevronRight,
  Zap,
  Compass,
  Clock,
  Timer,
  Calendar,
  Gauge,
} from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportButtons from "@/components/ExportButtons";
import type { HistoricalRecordsData } from "@/services/recordAnalytics";

type RecordTab =
  | "wins"
  | "poles"
  | "podiums"
  | "championships"
  | "starts"
  | "constructors"
  | "constructorChampionships"
  | "streaks"
  | "youngest"
  | "oldest";

export default function RecordsPage() {
  const [records, setRecords] = useState<HistoricalRecordsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RecordTab>("wins");

  const fetchRecords = () => {
    setLoading(true);
    setError(null);
    fetch("/api/records")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setRecords(json.data);
        } else {
          throw new Error(json.error || "Failed to load records");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const milestones = records?.milestones;

  // Active table rows for export
  const getActiveExportData = () => {
    if (!records) return [];
    switch (activeTab) {
      case "wins":
        return records.topWins;
      case "poles":
        return records.topPoles;
      case "podiums":
        return records.topPodiums;
      case "championships":
        return records.topChampionships;
      case "starts":
        return records.topStarts;
      case "constructors":
        return records.topConstructorWins;
      case "constructorChampionships":
        return records.topConstructorChampionships;
      case "streaks":
        return records.longestWinStreaks;
      case "youngest":
        return records.youngestWinners;
      case "oldest":
        return records.oldestWinners;
      default:
        return [];
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
                Formula 1 Hall of Fame · {milestones?.firstSeason || 1950}–{milestones?.latestSeason || 2024}
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {milestones?.totalSeasons || 75} World Championship Seasons
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
              All-Time Formula 1 Records
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Authentic historical records computed dynamically from complete Grand Prix archives in <code className="text-red-400">results.csv</code>, <code className="text-red-400">qualifying.csv</code>, and <code className="text-red-400">driver_standings.csv</code>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButtons data={getActiveExportData()} filename={`f1_records_${activeTab}`} />
          </div>
        </div>

        {/* Milestone Cards Grid (100% Dynamic!) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Most Wins</div>
              <div className="text-base font-bold text-white font-mono truncate">
                {milestones ? `${milestones.mostWinsCount} Wins` : "--"}
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                {milestones?.mostWinsHolder || "Loading..."}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Most Poles</div>
              <div className="text-base font-bold text-white font-mono truncate">
                {milestones ? `${milestones.mostPolesCount} Poles` : "--"}
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                {milestones?.mostPolesHolder || "Loading..."}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-500">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Most Team Wins</div>
              <div className="text-base font-bold text-white font-mono truncate">
                {milestones ? `${milestones.mostConstructorWinsCount} Wins` : "--"}
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                {milestones?.mostConstructorWinsHolder || "Loading..."}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-800/60 text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Winning Streak</div>
              <div className="text-base font-bold text-white font-mono truncate">
                {milestones ? `${milestones.longestWinStreakCount} in a Row` : "--"}
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                {milestones ? `${milestones.longestWinStreakHolder} (${milestones.longestWinStreakYear})` : "Loading..."}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800/80 pb-3 overflow-x-auto text-xs font-medium">
          {[
            { id: "wins", label: "Grand Prix Wins" },
            { id: "poles", label: "Pole Positions" },
            { id: "podiums", label: "Podium Finishes" },
            { id: "championships", label: "World Championships" },
            { id: "starts", label: "Career Starts" },
            { id: "constructors", label: "Constructor Wins" },
            { id: "constructorChampionships", label: "Constructor Titles" },
            { id: "streaks", label: "Winning Streaks" },
            { id: "youngest", label: "Youngest Winners" },
            { id: "oldest", label: "Oldest Winners" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-mono text-[11px] ${
                activeTab === tab.id
                  ? "bg-[#E10600] text-white font-bold shadow-sm"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Record Tables */}
        {loading ? (
          <LoadingState type="table" message="Aggregating 75 years of Formula 1 record benchmarks..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRecords} />
        ) : !records ? null : (
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/80 shadow-panel">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 w-16">RANK</th>
                    <th className="py-3 px-4 font-sans">
                      {activeTab.includes("constructor") ? "CONSTRUCTOR" : "DRIVER"}
                    </th>
                    <th className="py-3 px-4">
                      {activeTab === "streaks" ? "SPAN / GRANDS PRIX" : activeTab === "youngest" || activeTab === "oldest" ? "RACE / DATE" : "NATIONALITY"}
                    </th>
                    <th className="py-3 px-4 text-right">
                      {activeTab === "wins"
                        ? "GRAND PRIX WINS"
                        : activeTab === "poles"
                        ? "POLE POSITIONS"
                        : activeTab === "podiums"
                        ? "PODIUM FINISHES"
                        : activeTab === "championships" || activeTab === "constructorChampionships"
                        ? "WORLD CHAMPIONSHIPS"
                        : activeTab === "starts"
                        ? "CAREER STARTS"
                        : activeTab === "constructors"
                        ? "CONSTRUCTOR WINS"
                        : activeTab === "streaks"
                        ? "CONSECUTIVE WINS"
                        : "AGE AT VICTORY"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {/* Standard Driver / Constructor Top Lists */}
                  {(activeTab === "wins"
                    ? records.topWins
                    : activeTab === "poles"
                    ? records.topPoles
                    : activeTab === "podiums"
                    ? records.topPodiums
                    : activeTab === "championships"
                    ? records.topChampionships
                    : activeTab === "starts"
                    ? records.topStarts
                    : activeTab === "constructors"
                    ? records.topConstructorWins
                    : activeTab === "constructorChampionships"
                    ? records.topConstructorChampionships
                    : []
                  ).map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 font-black">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            idx === 0
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : idx === 1
                              ? "bg-zinc-800 text-zinc-200"
                              : idx === 2
                              ? "bg-amber-950 text-amber-500"
                              : "text-zinc-500"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        <span className="mr-2">{r.flag}</span>
                        {r.driverRef ? (
                          <Link href={`/drivers/${r.driverRef}`} className="hover:text-[#E10600]">
                            {r.name}
                          </Link>
                        ) : r.constructorRef ? (
                          <Link href={`/constructors/${r.constructorRef}`} className="hover:text-cyan-400">
                            {r.name}
                          </Link>
                        ) : (
                          r.name
                        )}
                        {r.code && (
                          <span className="text-zinc-500 font-mono text-xs ml-1.5">
                            ({r.code})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {r.nationality || "Formula 1"}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-white text-sm">
                        {r.count}
                      </td>
                    </tr>
                  ))}

                  {/* Streaks Tab */}
                  {activeTab === "streaks" &&
                    records.longestWinStreaks.map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/50">
                        <td className="py-3 px-4 font-black">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 text-[11px]">
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-white">
                          <span className="mr-2">{s.flag}</span>
                          <span>{s.name}</span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {s.startRace} ({s.startYear}) → {s.endRace} ({s.endYear})
                        </td>
                        <td className="py-3 px-4 text-right font-black font-mono text-[#E10600] text-sm">
                          {s.streak} in a row
                        </td>
                      </tr>
                    ))}

                  {/* Youngest / Oldest Tab */}
                  {(activeTab === "youngest" || activeTab === "oldest") &&
                    (activeTab === "youngest" ? records.youngestWinners : records.oldestWinners).map((a, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/50">
                        <td className="py-3 px-4 font-black">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 text-[11px]">
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-white">
                          <span className="mr-2">{a.flag}</span>
                          <Link href={`/drivers/${a.driverId}`} className="hover:text-[#E10600]">
                            {a.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {a.raceName} ({a.year}) · {a.date}
                        </td>
                        <td className="py-3 px-4 text-right font-black font-mono text-emerald-400 text-sm">
                          {a.ageFormatted}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic Circuit Lap Records (derived from lap_times.csv + track_maps.json) */}
        {records && records.circuitRecords && records.circuitRecords.length > 0 && (
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-panel">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#E10600]" />
                <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
                  Official Circuit Lap Records (Derived from Lap Timing Dataset)
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {records.circuitRecords.length} Circuit Records
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Official race lap records computed directly from over 589,000 recorded laps in <code className="text-zinc-300">lap_times.csv</code>. Track length and turns integrated only when available in geometry files.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">CIRCUIT</th>
                    <th className="py-3 px-4">LOCATION</th>
                    <th className="py-3 px-4">RECORD HOLDER</th>
                    <th className="py-3 px-4">CONSTRUCTOR</th>
                    <th className="py-3 px-4 text-right">LAP TIME</th>
                    <th className="py-3 px-4 text-right">AVG SPEED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                  {records.circuitRecords.slice(0, 12).map((cr) => (
                    <tr key={cr.circuitId} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4 font-sans font-bold text-white">
                        <Link href={`/circuits/${cr.circuitRef}`} className="hover:text-[#E10600]">
                          {cr.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {cr.flag} {cr.country}
                      </td>
                      <td className="py-3 px-4 font-sans text-zinc-200">
                        {cr.recordHolder || "Unknown"} ({cr.recordYear || "--"})
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-sans">
                        {cr.recordTeam || "--"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-white">
                        {cr.lapRecord}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-400">
                        {cr.speedKmh ? `${cr.speedKmh} km/h` : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
