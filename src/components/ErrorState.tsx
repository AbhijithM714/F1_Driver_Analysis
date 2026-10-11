"use client";

import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

export default function ErrorState({
  title = "Telemetry Data Error",
  message = "Failed to load the requested Formula 1 statistics.",
  error,
  onRetry,
  backHref = "/",
  backLabel = "Return to Dashboard",
}: ErrorStateProps) {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center bg-zinc-950/60 border border-zinc-800/80 rounded-2xl max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-800/50 flex items-center justify-center text-red-500 mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-bold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{message}</p>

      {error && (
        <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 mb-6 text-left">
          <p className="text-[11px] font-mono text-red-400 break-words">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Request
          </button>
        )}

        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-2 px-4 py-2 bg-[#E10600] hover:bg-[#b80500] text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

