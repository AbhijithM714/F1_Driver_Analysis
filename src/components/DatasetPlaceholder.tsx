"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DATASET_REQUIREMENTS } from "@/lib/datasetRequirements";
import { useDatasetStore } from "@/lib/datasetStore";
import { AlertTriangle, Upload, FileText, ExternalLink, CheckCircle2 } from "lucide-react";

interface DatasetPlaceholderProps {
  datasetId: string;
  title?: string;
  description?: string;
  heightClass?: string;
  children?: React.ReactNode;
}

export default function DatasetPlaceholder({
  datasetId,
  title,
  description,
  heightClass = "min-h-[380px]",
  children,
}: DatasetPlaceholderProps) {
  const { isClient, isLoaded, uploadFile } = useDatasetStore();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const req = DATASET_REQUIREMENTS.find((r) => r.id === datasetId);

  if (!req) return null;

  const dataAvailable = isClient && isLoaded(datasetId);

  // If data has been uploaded and children is provided, render the actual content!
  if (dataAvailable && children) {
    return <>{children}</>;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const text = await file.text();
      const res = await uploadFile(req, text);
      if (res.success) {
        setUploadSuccess(true);
      } else {
        setUploadError(res.error || "Failed to process dataset file.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed reading uploaded file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md p-6 flex flex-col justify-between overflow-hidden group shadow-panel`}
    >
      {/* Background accent telemetry grid */}
      <div className="absolute inset-0 bg-carbon-mesh opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide bg-red-950/60 border border-red-800/60 text-red-400">
              <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
              AWAITING REAL DATASET: {req.name.toUpperCase()}
            </span>
            <span className="text-xs font-mono text-zinc-500">FORMAT: {req.fileFormat}</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">
            {title || req.name}
          </h3>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            {description || req.whyNeeded}
          </p>
        </div>

        {/* Action badges / Source recommendations */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/data-manager"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            View Data Hub
          </Link>
        </div>
      </div>

      {/* Middle Specs & Expected Columns */}
      <div className="relative z-10 my-4 p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/60 font-mono text-xs text-zinc-400">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">
          Required Columns Schema:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {req.expectedColumns.map((col) => (
            <span
              key={col.name}
              className={`px-2 py-1 rounded border text-[11px] ${
                col.required
                  ? "bg-zinc-800/90 text-zinc-200 border-zinc-700"
                  : "bg-zinc-900/40 text-zinc-500 border-zinc-800/80"
              }`}
              title={col.description}
            >
              {col.name}
              {col.required && <span className="text-red-400 ml-1 font-bold">*</span>}
              <span className="text-[9px] text-zinc-500 ml-1">({col.type})</span>
            </span>
          ))}
        </div>

        {/* Source Hint */}
        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
          <span className="text-zinc-500">Recommended Sources:</span>
          {req.recommendedSources.slice(0, 3).map((source) => (
            <a
              key={source.name}
              href={source.url || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
            >
              {source.name}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom Drop Zone / Upload Input */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-zinc-400 font-sans">
          {uploadSuccess ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Dataset uploaded successfully! Refreshing telemetry...
            </span>
          ) : uploadError ? (
            <span className="text-red-400 font-medium">Error: {uploadError}</span>
          ) : (
            <span className="text-zinc-500">
              No fake Formula 1 data is displayed. Please upload the authentic {req.name} ({req.fileFormat}) to activate this analysis.
            </span>
          )}
        </div>

        <label className="relative cursor-pointer shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-950/50 transition-all active:scale-95">
          <Upload className="w-3.5 h-3.5" />
          {isUploading ? "Validating & Ingesting..." : `Upload ${req.name}`}
          <input
            type="file"
            accept=".csv,.json,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

