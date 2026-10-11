import React from "react";
import Link from "next/link";
import { Flag, ArrowLeft, Home, Search, Compass } from "lucide-react";

export const metadata = {
  title: "404 · Off Track (Page Not Found)",
  description: "The requested Formula 1 telemetry route or resource could not be found.",
};

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] bg-[#080808] text-zinc-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-xs font-mono text-red-400 uppercase tracking-widest">
          <Flag className="w-3.5 h-3.5" />
          <span>Track Limits Exceeded · HTTP 404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white font-mono">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-200 uppercase tracking-tight">
            Route Not Found in Pit Wall Telemetry
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            The requested Grand Prix analytical view, driver dossier, or circuit profile does not exist or has been relocated.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E10600] hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/drivers"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Drivers</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>STATUS: OFF_TRACK_LIMITS</span>
          <Link href="/data-manager" className="text-zinc-400 hover:text-white inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Verify Datasets</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

