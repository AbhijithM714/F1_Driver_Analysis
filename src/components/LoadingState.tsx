"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  type?: "page" | "cards" | "chart" | "table" | "inline";
  message?: string;
  count?: number;
}

export default function LoadingState({
  type = "page",
  message = "Loading Formula 1 telemetry & statistics...",
  count = 6,
}: LoadingStateProps) {
  if (type === "inline") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400 py-3">
        <Loader2 className="w-4 h-4 animate-spin text-[#E10600]" />
        <span>{message}</span>
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className="w-full h-[380px] bg-zinc-950/80 border border-zinc-800/80 rounded-xl flex flex-col items-center justify-center relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        <Loader2 className="w-8 h-8 animate-spin text-[#E10600] mb-3" />
        <p className="text-xs uppercase font-mono tracking-wider text-zinc-400">{message}</p>
        <div className="flex gap-2 mt-4">
          <div className="w-16 h-3 bg-zinc-800 rounded" />
          <div className="w-20 h-3 bg-zinc-800 rounded" />
          <div className="w-14 h-3 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center h-10 border-b border-zinc-900 last:border-0">
              <div className="w-8 h-4 bg-zinc-800 rounded" />
              <div className="w-40 h-4 bg-zinc-800 rounded" />
              <div className="w-24 h-4 bg-zinc-800 rounded" />
              <div className="w-16 h-4 bg-zinc-800 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-44 bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between animate-pulse"
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-zinc-800" />
              <div className="w-16 h-4 bg-zinc-800 rounded" />
            </div>
            <div className="space-y-2">
              <div className="w-3/4 h-5 bg-zinc-800 rounded" />
              <div className="w-1/2 h-3 bg-zinc-800 rounded" />
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-900">
              <div className="w-16 h-3 bg-zinc-800 rounded" />
              <div className="w-12 h-3 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Full page skeleton
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-zinc-800 border-t-[#E10600] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-[#E10600]">
          F1
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-base font-semibold text-zinc-200">{message}</h3>
        <p className="text-xs text-zinc-500 font-mono tracking-wide">
          Streaming telemetry & calculating official race metrics...
        </p>
      </div>
    </div>
  );
}

