"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Compass,
  ArrowLeft,
  Trophy,
  Gauge,
  MapPin,
  Calendar,
  Shield,
  User,
  Flag,
} from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ExportButtons from "@/components/ExportButtons";
import FavoriteButton from "@/components/FavoriteButton";
import type { CircuitProfileData } from "@/services/circuitAnalytics";

export default function CircuitProfilePage() {
  const params = useParams();
  const circuitIdParam = String(params.id || "");

  const [profile, setProfile] = useState<CircuitProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/circuits/${encodeURIComponent(circuitIdParam)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Circuit not found (HTTP ${res.status})`);
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setProfile(json.data);
        } else {
          throw new Error(json.error || "Circuit profile data unavailable");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (circuitIdParam) fetchProfile();
  }, [circuitIdParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-zinc-100 py-12 px-4 sm:px-6">
        <LoadingState type="page" message="Loading circuit track information & race history..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#080808] text-zinc-100 py-12 px-4 sm:px-6">
        <ErrorState
          title="Circuit Profile Not Found"
          message={`Unable to load track telemetry for circuit ID "${circuitIdParam}".`}
          error={error || undefined}
          onRetry={fetchProfile}
          backHref="/circuits"
          backLabel="Back to Circuits Catalog"
        />
      </div>
    );
  }

  const { circuit, races, driverLeaderboard, constructorLeaderboard } = profile;

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/circuits"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Circuits Catalog</span>
          </Link>

          <div className="flex items-center gap-3">
            <FavoriteButton
              type="circuit"
              id={circuit.circuitRef}
              name={circuit.name}
              subtitle={`${circuit.location}, ${circuit.country}`}
              flag={circuit.flag}
            />

            <ExportButtons
              data={races.map((r) => ({
                year: r.year,
                round: r.round,
                raceName: r.name,
                date: r.date,
                winner: r.winner?.name ?? "N/A",
                constructor: r.winner?.constructorName ?? "N/A",
                poleSitter: r.pole?.name ?? "N/A",
              }))}
              filename={`${circuit.circuitRef}_race_history`}
            />
          </div>
        </div>

        {/* Hero Track Header */}
        <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2 font-semibold">
                <span className="text-xl">{circuit.flag}</span>
                <span>{circuit.country}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300">{circuit.location}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
                {circuit.name}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 mt-3 font-mono">
                Formula 1 Grand Prix host from {circuit.firstGrandPrixYear || 1950} to {circuit.latestGrandPrixYear || 2024} · {circuit.totalRaces} Official World Championship Events
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Track Length</span>
                <span className="text-base font-bold text-white">
                  {circuit.lengthKm ? `${circuit.lengthKm} km` : "N/A"}
                </span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Corners</span>
                <span className="text-base font-bold text-white">
                  {circuit.turns ? `${circuit.turns} turns` : "N/A"}
                </span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">DRS Zones</span>
                <span className="text-base font-bold text-white">
                  {circuit.drsZones ? `${circuit.drsZones} zones` : "N/A"}
                </span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-center">
                <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Grands Prix</span>
                <span className="text-base font-bold text-[#E10600]">
                  {circuit.totalRaces}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Official Lap Record Card */}
        {circuit.lapRecord && (
          <div className="bg-gradient-to-r from-red-950/30 via-zinc-950 to-zinc-950 border border-red-900/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-[#E10600] shrink-0">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-semibold block">
                  Official All-Time Lap Record
                </span>
                <div className="text-2xl font-black font-mono text-white tracking-tight">
                  {circuit.lapRecord.time}
                </div>
              </div>
            </div>

            <div className="text-sm font-mono text-right sm:border-l sm:border-zinc-800/80 sm:pl-6 text-zinc-400">
              <p className="text-zinc-200 font-bold">{circuit.lapRecord.driverName}</p>
              <p className="text-xs text-zinc-400">
                {circuit.lapRecord.constructorName} · {circuit.lapRecord.year} Season
              </p>
            </div>
          </div>
        )}

        {/* Leaderboards Grid (Drivers & Constructors) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Driver Leaderboard */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#E10600]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                  Most Successful Drivers
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Ranked by Wins</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-[10px] font-mono uppercase text-zinc-500">
                    <th className="pb-2">Driver</th>
                    <th className="pb-2 text-right">Starts</th>
                    <th className="pb-2 text-right">Poles</th>
                    <th className="pb-2 text-right">Podiums</th>
                    <th className="pb-2 text-right text-[#E10600] font-bold">Wins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 font-mono">
                  {driverLeaderboard.slice(0, 8).map((d) => (
                    <tr key={d.driverId} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 font-sans font-medium text-zinc-200 flex items-center gap-1.5">
                        <span>{d.flag}</span>
                        <Link href={`/drivers/${d.driverId}`} className="hover:text-[#E10600]">
                          {d.name}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right text-zinc-400">{d.starts}</td>
                      <td className="py-2.5 text-right text-zinc-400">{d.poles}</td>
                      <td className="py-2.5 text-right text-zinc-300">{d.podiums}</td>
                      <td className="py-2.5 text-right font-black text-white">{d.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Constructor Leaderboard */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                  Constructor Honors
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Ranked by Team Wins</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-[10px] font-mono uppercase text-zinc-500">
                    <th className="pb-2">Constructor</th>
                    <th className="pb-2 text-right">Entries</th>
                    <th className="pb-2 text-right">Podiums</th>
                    <th className="pb-2 text-right text-cyan-400 font-bold">Wins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 font-mono">
                  {constructorLeaderboard.slice(0, 8).map((c) => (
                    <tr key={c.constructorId} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 font-sans font-medium text-zinc-200 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span>{c.name}</span>
                      </td>
                      <td className="py-2.5 text-right text-zinc-400">{c.starts}</td>
                      <td className="py-2.5 text-right text-zinc-300">{c.podiums}</td>
                      <td className="py-2.5 text-right font-black text-white">{c.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Full Historical Grands Prix Table */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                Grand Prix Race History ({races.length} Races)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">Chronological Results</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-[10px] font-mono uppercase text-zinc-500">
                  <th className="pb-2">Season</th>
                  <th className="pb-2">Grand Prix</th>
                  <th className="pb-2">Winner</th>
                  <th className="pb-2">Constructor</th>
                  <th className="pb-2">Pole Sitter</th>
                  <th className="pb-2 text-right">Winning Time</th>
                  <th className="pb-2 text-right">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 font-mono">
                {races.map((r) => (
                  <tr key={r.raceId} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 font-bold text-zinc-200">{r.year}</td>
                    <td className="py-3 font-sans text-zinc-300">{r.name}</td>
                    <td className="py-3 font-sans text-white font-medium">
                      {r.winner?.name || "Unclassified"}
                    </td>
                    <td className="py-3 font-sans text-zinc-400 flex items-center gap-1.5">
                      {r.winner?.teamColor && (
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: r.winner.teamColor }}
                        />
                      )}
                      <span>{r.winner?.constructorName || "--"}</span>
                    </td>
                    <td className="py-3 font-sans text-zinc-400">
                      {r.pole?.name || "--"}
                    </td>
                    <td className="py-3 text-right text-zinc-300">
                      {r.winner?.time || "Completed"}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/race-analytics?raceId=${r.raceId}`}
                        className="text-xs text-[#E10600] hover:underline font-sans font-medium"
                      >
                        Inspect Race
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

