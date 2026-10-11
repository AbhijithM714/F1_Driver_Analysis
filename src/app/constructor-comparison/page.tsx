"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowRightLeft, Trophy, Gauge, Award, Wrench, CheckCircle } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportButtons from "@/components/ExportButtons";

interface TeamOption {
  constructorId: number;
  constructorRef: string;
  name: string;
}

export default function ConstructorComparisonPage() {
  const [constructorsList, setConstructorsList] = useState<TeamOption[]>([]);
  const [teamA, setTeamA] = useState("ferrari");
  const [teamB, setTeamB] = useState("mercedes");
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch list of all constructors for dropdown
  useEffect(() => {
    fetch("/api/constructors")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setConstructorsList(
            json.data.map((c: any) => ({
              constructorId: c.constructorId,
              constructorRef: c.constructorRef,
              name: c.name,
            }))
          );
        }
      })
      .catch((e) => console.error("Error loading teams list", e));
  }, []);

  const fetchComparison = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/constructors/compare?a=${encodeURIComponent(teamA)}&b=${encodeURIComponent(teamB)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setComparison(json.data);
        } else {
          throw new Error(json.error || "Failed to compare constructors");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (teamA && teamB) {
      fetchComparison();
    }
  }, [teamA, teamB]);

  const a = comparison?.a;
  const b = comparison?.b;
  const h2h = comparison?.headToHead;

  const compareMetrics = a && b ? [
    { label: "World Championships", valA: a.championships, valB: b.championships, format: (v: any) => String(v) },
    { label: "Grand Prix Wins", valA: a.totalWins, valB: b.totalWins, format: (v: any) => String(v) },
    { label: "Podium Finishes", valA: a.totalPodiums, valB: b.totalPodiums, format: (v: any) => String(v) },
    { label: "Pole Positions", valA: a.totalPoles, valB: b.totalPoles, format: (v: any) => String(v) },
    { label: "Total Points", valA: a.totalPoints, valB: b.totalPoints, format: (v: any) => `${v.toLocaleString()} pts` },
    { label: "Race Entries", valA: a.raceEntries, valB: b.raceEntries, format: (v: any) => `${v} GPs` },
    { label: "Win Rate", valA: a.winRate, valB: b.winRate, format: (v: any) => `${v}%` },
    { label: "Podium Rate", valA: a.podiumRate, valB: b.podiumRate, format: (v: any) => `${v}%` },
    { label: "Reliability Score", valA: a.reliabilityScore, valB: b.reliabilityScore, format: (v: any) => `${v}%` },
    { label: "Average Finish", valA: a.averageFinish ?? 99, valB: b.averageFinish ?? 99, format: (v: any) => `P${v}`, lowerBetter: true },
    { label: "Median Pit Stop Duration", valA: a.pitStops?.medianSeconds ?? 99, valB: b.pitStops?.medianSeconds ?? 99, format: (v: any) => v !== 99 ? `${v}s` : "N/A", lowerBetter: true },
  ] : [];

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#E10600] uppercase tracking-widest mb-1.5 font-semibold">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Head-to-Head Constructor Analytics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Constructor Comparison
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Official side-by-side engineering and performance comparison between two Formula 1 constructors. All numbers dynamically aggregated across complete Grand Prix archives.
            </p>
          </div>

          {a && b && (
            <ExportButtons
              data={[
                { metric: "Team", [a.name]: a.name, [b.name]: b.name },
                ...compareMetrics.map((m) => ({
                  metric: m.label,
                  [a.name]: m.valA,
                  [b.name]: m.valB,
                })),
              ]}
              filename={`${teamA}_vs_${teamB}_comparison`}
            />
          )}
        </div>

        {/* Team Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-2xl">
          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 mb-1.5 block font-semibold">
              Select Primary Constructor:
            </label>
            <select
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm font-medium text-zinc-100 focus:outline-none focus:border-[#E10600] [&>option]:bg-zinc-950"
            >
              {constructorsList.map((c) => (
                <option key={c.constructorRef} value={c.constructorRef}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 mb-1.5 block font-semibold">
              Select Rival Constructor:
            </label>
            <select
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm font-medium text-zinc-100 focus:outline-none focus:border-[#E10600] [&>option]:bg-zinc-950"
            >
              {constructorsList.map((c) => (
                <option key={c.constructorRef} value={c.constructorRef}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Content */}
        {loading ? (
          <LoadingState type="page" message="Calculating constructor head-to-head metrics..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchComparison} />
        ) : a && b ? (
          <div className="space-y-8">
            {/* Versus Hero Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A Card */}
              <div
                className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
                style={{ borderTop: `4px solid ${a.color || "#E10600"}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{a.flag}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold">
                    {a.isActive ? "Current Active Grid" : "Historic Constructor"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">{a.name}</h2>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  {a.nationality} · Active {a.firstYear}–{a.lastYear} ({a.seasonsCompeted} Seasons)
                </p>
                <div className="mt-4 pt-4 border-t border-zinc-900 flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">TITLES</span>
                    <span className="text-base font-bold text-white">{a.championships}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">WINS</span>
                    <span className="text-base font-bold text-white">{a.totalWins}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">PODIUMS</span>
                    <span className="text-base font-bold text-white">{a.totalPodiums}</span>
                  </div>
                </div>
              </div>

              {/* Team B Card */}
              <div
                className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden"
                style={{ borderTop: `4px solid ${b.color || "#00D2BE"}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{b.flag}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold">
                    {b.isActive ? "Current Active Grid" : "Historic Constructor"}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase">{b.name}</h2>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  {b.nationality} · Active {b.firstYear}–{b.lastYear} ({b.seasonsCompeted} Seasons)
                </p>
                <div className="mt-4 pt-4 border-t border-zinc-900 flex gap-4 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">TITLES</span>
                    <span className="text-base font-bold text-white">{b.championships}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">WINS</span>
                    <span className="text-base font-bold text-white">{b.totalWins}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">PODIUMS</span>
                    <span className="text-base font-bold text-white">{b.totalPodiums}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Head to Head Box */}
            {h2h && h2h.sharedRaces > 0 && (
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-4">
                <span className="text-[11px] font-mono uppercase text-[#E10600] font-semibold tracking-wider">
                  Direct In-Race Rivalry · {h2h.sharedRaces} Shared Grands Prix
                </span>
                <div className="flex items-center justify-center gap-8 font-mono">
                  <div className="text-right">
                    <span className="text-3xl sm:text-4xl font-black text-white">{h2h.aAheadInRace}</span>
                    <span className="block text-xs text-zinc-400 mt-1">{a.name} Finished Ahead</span>
                  </div>
                  <div className="text-zinc-600 font-black text-xl">VS</div>
                  <div className="text-left">
                    <span className="text-3xl sm:text-4xl font-black text-white">{h2h.bAheadInRace}</span>
                    <span className="block text-xs text-zinc-400 mt-1">{b.name} Finished Ahead</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Comparison Table */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 border-b border-zinc-900 pb-3">
                Full Performance Metrics Breakdown
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase">
                      <th className="pb-3 text-left w-1/3 text-zinc-200">{a.name}</th>
                      <th className="pb-3 text-center w-1/3 text-zinc-400">Metric</th>
                      <th className="pb-3 text-right w-1/3 text-zinc-200">{b.name}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {compareMetrics.map((m) => {
                      const aBetter = m.lowerBetter ? m.valA < m.valB : m.valA > m.valB;
                      const bBetter = m.lowerBetter ? m.valB < m.valA : m.valB > m.valA;

                      return (
                        <tr key={m.label} className="hover:bg-zinc-900/30 transition-colors">
                          <td className={`py-3.5 text-left font-bold ${aBetter ? "text-emerald-400" : "text-zinc-300"}`}>
                            {m.format(m.valA)}
                          </td>
                          <td className="py-3.5 text-center font-sans font-medium text-zinc-400">
                            {m.label}
                          </td>
                          <td className={`py-3.5 text-right font-bold ${bBetter ? "text-emerald-400" : "text-zinc-300"}`}>
                            {m.format(m.valB)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

