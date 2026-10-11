"use client";

import React from "react";
import Link from "next/link";
import { Heart, User, Shield, Compass, Trash2, ArrowRight } from "lucide-react";
import { useFavorites, toggleFavorite } from "@/lib/favorites";
import EmptyState from "@/components/EmptyState";

export default function FavoritesPage() {
  const { favorites, drivers, constructors, circuits, isReady } = useFavorites();

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#E10600] uppercase tracking-widest mb-1.5 font-semibold">
              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              <span>Personal Saved Telemetry Roster</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Favorites & Bookmarks
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Quick access to your saved Formula 1 drivers, constructors, and Grand Prix circuits. Saved locally in your browser.
            </p>
          </div>

          <div className="text-xs font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg">
            {favorites.length} TOTAL ITEMS SAVED
          </div>
        </div>

        {!isReady ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-xs">
            Loading saved bookmarks...
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            type="no_results"
            title="No Favorites Saved Yet"
            message="Click the heart icon on any Driver card, Constructor profile, or Circuit page to bookmark them for fast access."
            actionHref="/drivers"
            actionLabel="Explore Drivers Roster"
          />
        ) : (
          <div className="space-y-10">
            {/* Drivers Section */}
            {drivers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <User className="w-4 h-4 text-[#E10600]" />
                  <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
                    Saved Drivers ({drivers.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drivers.map((d) => (
                    <div
                      key={d.id}
                      className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between group transition-all"
                    >
                      <Link href={`/drivers/${d.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-300 shrink-0">
                          {d.flag || d.code || "DRV"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-[#E10600] truncate transition-colors">
                            {d.name}
                          </h3>
                          <p className="text-xs text-zinc-500 truncate">{d.subtitle || "Formula 1 Driver"}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => toggleFavorite(d)}
                        title="Remove favorite"
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constructors Section */}
            {constructors.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
                    Saved Constructors ({constructors.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {constructors.map((c) => (
                    <div
                      key={c.id}
                      className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between group transition-all"
                    >
                      <Link href={`/constructors/${c.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-lg border border-zinc-800 flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${c.color || "#09090b"}20` }}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c.color || "#E10600" }}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-400 truncate transition-colors">
                            {c.name}
                          </h3>
                          <p className="text-xs text-zinc-500 truncate">{c.subtitle || "Constructor"}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => toggleFavorite(c)}
                        title="Remove favorite"
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Circuits Section */}
            {circuits.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wide">
                    Saved Circuits ({circuits.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {circuits.map((circ) => (
                    <div
                      key={circ.id}
                      className="bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between group transition-all"
                    >
                      <Link href={`/circuits/${circ.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg shrink-0">
                          {circ.flag || "🏁"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 truncate transition-colors">
                            {circ.name}
                          </h3>
                          <p className="text-xs text-zinc-500 truncate">{circ.subtitle || "Circuit"}</p>
                        </div>
                      </Link>

                      <button
                        onClick={() => toggleFavorite(circ)}
                        title="Remove favorite"
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

