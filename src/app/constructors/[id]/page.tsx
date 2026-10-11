"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  Trophy,
  Award,
  Wrench,
  Gauge,
  Calendar,
  Users,
  CheckCircle,
} from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportButtons from "@/components/ExportButtons";
import FavoriteButton from "@/components/FavoriteButton";
import type { ConstructorStats } from "@/services/constructorAnalytics";

export default function ConstructorProfilePage() {
  const params = useParams();
  const idParam = String(params.id || "");

  const [stats, setStats] = useState<ConstructorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConstructor = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/constructors/${encodeURIComponent(idParam)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Constructor not found (HTTP ${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setStats(json.data);
        } else {
          throw new Error(json.error || "Constructor details unavailable");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (idParam) fetchConstructor();
  }, [idParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-zinc-100 py-12 px-4 sm:px-6">
        <LoadingState type="page" message="Loading constructor history & performance metrics..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-[#080808] text-zinc-100 py-12 px-4 sm:px-6">
        <ErrorState
          title="Constructor Profile Not Found"
          message={`Unable to load statistics for constructor ID "${idParam}".`}
          error={error || undefined}
          onRetry={fetchConstructor}
          backHref="/constructors"
          backLabel="Back to Constructors Roster"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/constructors"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Constructors</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/constructor-comparison?a=${stats.constructorRef}&b=ferrari`}
              className="text-xs font-mono text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              Compare with Rival
            </Link>

            <FavoriteButton
              type="constructor"
              id={stats.constructorRef}
              name={stats.name}
              subtitle={`${stats.nationality} Constructor`}
              color={stats.color}
            />

            <ExportButtons
              data={stats.seasons.map((s) => ({
                year: s.year,
                races: s.races,
                starts: s.starts,
                wins: s.wins,
                podiums: s.podiums,
                poles: s.poles,
                points: s.points,
              }))}
              filename={`${stats.constructorRef}_season_history`}
            />
          </div>
        </div>

        {/* Hero Constructor Header */}
        <div
          className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden"
          style={{ borderTop: `4px solid ${stats.color || "#E10600"}` }}
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2 font-semibold">
                <span className="text-xl">{stats.flag}</span>
                <span>{stats.nationality}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300">
                  {stats.isActive ? "Current Active Grid" : "Historic Team"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
                {stats.name}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 mt-3 font-mono">
                Competed {stats.firstYear}–{stats.lastYear} · {stats.seasonsCompeted} Seasons · {stats.raceEntries} Grand Prix Entries
              </p>

              {stats.championships > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg w-fit">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    {stats.championships}x Constructors&apos; World Champion ({stats.titleYears.join(", ")})
                  </span>
                </div>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Victories</span>
                <span className="text-xl font-bold text-white">{stats.totalWins}</span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Podiums</span>
                <span className="text-xl font-bold text-white">{stats.totalPodiums}</span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Career Points</span>
                <span className="text-xl font-bold text-[#E10600]">{stats.totalPoints.toLocaleString()}</span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Reliability</span>
                <span className="text-xl font-bold text-emerald-400">{stats.reliabilityScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pit Stop Efficiency Box */}
        {stats.pitStops?.available && (
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  Pit Stop Engineering Performance
                </h4>
                <p className="text-xs text-zinc-400 font-mono">
                  Aggregated across {stats.pitStops.stops} recorded pit stops
                </p>
              </div>
            </div>

            <div className="flex gap-6 font-mono text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Median Duration</span>
                <span className="font-bold text-white">{stats.pitStops.medianSeconds}s</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Fastest Stop</span>
                <span className="font-bold text-emerald-400">{stats.pitStops.fastestSeconds}s</span>
              </div>
            </div>
          </div>
        )}

        {/* Season by Season Progression Table */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#E10600]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                Season-by-Season Championship Archive
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {stats.seasons.length} Seasons Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] uppercase text-zinc-500">
                  <th className="pb-3">Year</th>
                  <th className="pb-3 text-right">Races</th>
                  <th className="pb-3 text-right">Starts</th>
                  <th className="pb-3 text-right text-white">Wins</th>
                  <th className="pb-3 text-right">Podiums</th>
                  <th className="pb-3 text-right">Poles</th>
                  <th className="pb-3 text-right text-emerald-400 font-bold">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {stats.seasons.map((s) => (
                  <tr key={s.year} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2.5 font-bold text-zinc-200">
                      <Link href={`/championship?year=${s.year}`} className="hover:text-[#E10600]">
                        {s.year}
                      </Link>
                    </td>
                    <td className="py-2.5 text-right text-zinc-400">{s.races}</td>
                    <td className="py-2.5 text-right text-zinc-400">{s.starts}</td>
                    <td className="py-2.5 text-right font-black text-white">{s.wins}</td>
                    <td className="py-2.5 text-right text-zinc-300">{s.podiums}</td>
                    <td className="py-2.5 text-right text-zinc-400">{s.poles}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historic Drivers Roster */}
        {stats.drivers.length > 0 && (
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                  Drivers Who Competed For {stats.name} ({stats.driverCount})
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {stats.drivers.map((d) => (
                <Link
                  key={d.driverId}
                  href={`/drivers/${d.driverRef}`}
                  className="p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 rounded-lg text-xs font-mono transition-colors group"
                >
                  <span className="text-white font-bold block truncate group-hover:text-[#E10600]">
                    {d.fullName || d.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase">{d.code || "DRV"}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

