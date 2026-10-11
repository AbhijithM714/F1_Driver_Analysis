"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, Database } from "lucide-react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[80vh] bg-[#080808] text-zinc-100 flex items-center justify-center px-4 py-16">
      <div
        role="alert"
        aria-live="assertive"
        className="max-w-xl w-full bg-zinc-950/90 border border-red-900/60 rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-2xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-xs font-mono text-red-400 uppercase tracking-widest">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Red Flag · System Exception (HTTP 500)</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            Telemetry Processing Interrupted
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            {error?.message ||
              "An unexpected runtime exception occurred while computing Formula 1 race analytics."}
          </p>
          {error?.digest && (
            <p className="text-[11px] font-mono text-zinc-500">
              Incident Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Calculation</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            href="/data-manager"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dataset Status</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

