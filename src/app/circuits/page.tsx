"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Search, MapPin, Gauge, Trophy, CornerDownRight, Calendar, ArrowRight } from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ExportButtons from "@/components/ExportButtons";
import FavoriteButton from "@/components/FavoriteButton";
import type { CircuitSummary } from "@/services/circuitAnalytics";

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState<CircuitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");

  const fetchCircuits = () => {
    setLoading(true);
    setError(null);
    fetch("/api/circuits")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setCircuits(json.data);
        } else {
          throw new Error(json.error || "Failed to load circuits");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCircuits();
  }, []);

  const countries = Array.from(new Set(circuits.map((c) => c.country).filter(Boolean))).sort();

  const filteredCircuits = circuits.filter((c) => {
    const matchesCountry = selectedCountry === "all" || c.country === selectedCountry;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.circuitRef.toLowerCase().includes(q);
    return matchesCountry && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#E10600] uppercase tracking-widest mb-1.5 font-semibold">
              <Compass className="w-4 h-4" />
              <span>World Championship Tracks · 1950–2024</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Grand Prix Circuits
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Official catalog of historical and active Formula 1 racing circuits. Track geometry, official lap records, and Grand Prix history derived dynamically from telemetry datasets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButtons
              data={circuits.map((c) => ({
                circuitId: c.circuitId,
                name: c.name,
                location: c.location,
                country: c.country,
                totalRaces: c.totalRaces,
                firstGrandPrix: c.firstGrandPrixYear,
                latestGrandPrix: c.latestGrandPrixYear,
                lengthKm: c.lengthKm ?? "N/A",
                turns: c.turns ?? "N/A",
                lapRecord: c.lapRecord?.time ?? "N/A",
                recordHolder: c.lapRecord?.driverName ?? "N/A",
              }))}
              filename="f1_circuits_catalog"
            />
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Search circuit name, city, or country (e.g. Monza, Silverstone, Suzuka)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#E10600] font-sans"
            />
          </div>

          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-[#E10600] [&>option]:bg-zinc-950"
            >
              <option value="all">All Countries ({countries.length})</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content State */}
        {loading ? (
          <LoadingState type="cards" message="Loading circuit telemetry & lap records..." count={9} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCircuits} />
        ) : filteredCircuits.length === 0 ? (
          <EmptyState
            type="no_results"
            title="No Circuits Found"
            message={`No circuits matched your query "${searchQuery}".`}
            actionHref="/circuits"
            actionLabel="Reset search"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCircuits.map((circ) => {
              return (
                <div
                  key={circ.circuitId}
                  className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/50 group relative"
                >
                  <div>
                    {/* Header: Flag, Country & Favorite */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <span className="text-base">{circ.flag}</span>
                        <span>{circ.country}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-500">{circ.location}</span>
                      </div>
                      <FavoriteButton
                        type="circuit"
                        id={circ.circuitRef}
                        name={circ.name}
                        subtitle={`${circ.location}, ${circ.country}`}
                        flag={circ.flag}
                        size="sm"
                      />
                    </div>

                    {/* Circuit Name */}
                    <Link
                      href={`/circuits/${circ.circuitRef}`}
                      className="block group-hover:text-[#E10600] transition-colors"
                    >
                      <h3 className="text-lg font-bold text-zinc-100 tracking-tight leading-snug">
                        {circ.name}
                      </h3>
                    </Link>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-2.5">
                        <span className="text-[10px] text-zinc-500 uppercase block">Track Length</span>
                        <span className="text-zinc-200 font-bold">
                          {circ.lengthKm ? `${circ.lengthKm} km` : "N/A"}
                        </span>
                      </div>

                      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-2.5">
                        <span className="text-[10px] text-zinc-500 uppercase block">Corners</span>
                        <span className="text-zinc-200 font-bold">
                          {circ.turns ? `${circ.turns} turns` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Lap Record Highlight */}
                    {circ.lapRecord ? (
                      <div className="mt-3 bg-zinc-900/40 border border-zinc-800/50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-zinc-500 font-semibold mb-1">
                          <Gauge className="w-3 h-3 text-[#E10600]" />
                          <span>Official Lap Record</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-black font-mono text-white">
                            {circ.lapRecord.time}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {circ.lapRecord.driverName} ({circ.lapRecord.year})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 bg-zinc-900/20 border border-zinc-900 rounded-lg p-2 text-center text-[11px] text-zinc-500 font-mono">
                        Lap times tracked via results
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3.5 border-t border-zinc-900/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {circ.totalRaces} Grands Prix (First: {circ.firstGrandPrixYear || "1950"})
                    </span>

                    <Link
                      href={`/circuits/${circ.circuitRef}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#E10600] hover:text-[#ff3833] group-hover:translate-x-0.5 transition-all"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

