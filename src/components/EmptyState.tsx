"use client";

import React from "react";
import { Database, Search, FileQuestion, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  type?: "missing_dataset" | "no_results" | "no_data";
  title?: string;
  message?: string;
  datasetName?: string;
  requiredColumns?: string[];
  sourceGuide?: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function EmptyState({
  type = "no_results",
  title,
  message,
  datasetName,
  requiredColumns,
  sourceGuide,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  if (type === "missing_dataset") {
    return (
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto my-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                Dataset Not Imported
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-100 mb-1">
              {title || `${datasetName || "Required"} Dataset Unavailable`}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-4">
              {message ||
                "This module requires supplementary race data that has not yet been placed into the `/data` directory. The platform does not generate synthetic telemetry."}
            </p>

            {requiredColumns && requiredColumns.length > 0 && (
              <div className="mb-4 bg-zinc-900/80 border border-zinc-800/80 rounded-lg p-3">
                <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2 font-semibold">
                  Expected CSV Schema Columns:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {requiredColumns.map((col) => (
                    <span
                      key={col}
                      className="text-[10px] font-mono bg-zinc-800/90 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700/60"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sourceGuide && (
              <p className="text-xs text-zinc-400 mb-4 bg-zinc-900/50 p-2.5 rounded border border-zinc-800/50">
                <span className="text-zinc-300 font-semibold">How to obtain: </span>
                {sourceGuide}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Link
                href="/data-manager"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E10600] hover:text-[#ff3b36] transition-colors"
              >
                Inspect Data Hub & Setup Guide
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[30vh] flex flex-col items-center justify-center p-8 text-center bg-zinc-950/40 border border-zinc-800/60 rounded-xl my-4">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
        {type === "no_results" ? <Search className="w-6 h-6" /> : <FileQuestion className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-zinc-200 mb-1">{title || "No Records Found"}</h4>
      <p className="text-xs text-zinc-400 max-w-md leading-relaxed mb-4">
        {message || "No matching items were found for your current filter criteria or search query."}
      </p>
      {actionHref && (
        <Link
          href={actionHref}
          className="text-xs text-[#E10600] hover:underline flex items-center gap-1"
        >
          {actionLabel || "Reset filters"}
        </Link>
      )}
    </div>
  );
}

