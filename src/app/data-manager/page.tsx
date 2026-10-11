"use client";

import React, { useState } from "react";
import {
  DATASET_REQUIREMENTS,
  DatasetRequirement,
} from "@/lib/datasetRequirements";
import { useDatasetStore } from "@/lib/datasetStore";
import {
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  Trash2,
  FileSpreadsheet,
  Info,
} from "lucide-react";

export default function DataManagerPage() {
  const {
    isClient,
    statuses,
    loadedCount,
    totalCount,
    uploadFile,
    clearDataset,
  } = useDatasetStore();

  const [activeTab, setActiveTab] = useState<string>("drivers");
  const [uploadFeedback, setUploadFeedback] = useState<{
    id: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedReq =
    DATASET_REQUIREMENTS.find((r) => r.id === activeTab) ||
    DATASET_REQUIREMENTS[0];

  const handleFileUpload = async (
    req: DatasetRequirement,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await uploadFile(req, text);
      if (res.success) {
        setUploadFeedback({
          id: req.id,
          type: "success",
          message: `Successfully ingested ${res.count} records for ${req.name}!`,
        });
      } else {
        setUploadFeedback({
          id: req.id,
          type: "error",
          message: res.error || "Validation failed.",
        });
      }
    } catch (err: any) {
      setUploadFeedback({
        id: req.id,
        type: "error",
        message: err.message || "File read error.",
      });
    }
  };

  const downloadSampleCsv = (req: DatasetRequirement) => {
    const headers = req.expectedColumns.map((c) => c.name).join(",");
    const sampleValues = req.expectedColumns
      .map((c) => {
        const val = req.samplePreview[c.name];
        return val !== undefined ? `"${val}"` : '""';
      })
      .join(",");
    const csvContent = `${headers}\n${sampleValues}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${req.id}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#080808] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950 text-red-400 border border-red-800/80">
                Official Ingestion Hub
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Strict Zero-Synthetic Rule
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Formula 1 Dataset Governance Center
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              To guarantee race engineering accuracy, fake data is strictly prohibited. Upload verified datasets from official timing feeds, FastF1, Ergast/Jolpica, or OpenF1 to activate each analytics module.
            </p>
          </div>

          {/* Overall Health Pill */}
          <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono text-zinc-500 uppercase">
                Pipeline Health
              </span>
              <span className="text-base font-bold font-mono text-white">
                {isClient ? loadedCount : 0} / {totalCount} Active
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500">
              <Database className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Upload Feedback Toast */}
        {uploadFeedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
              uploadFeedback.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-300"
                : "bg-red-950/70 border-red-800 text-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {uploadFeedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span className="text-sm">{uploadFeedback.message}</span>
            </div>
            <button
              onClick={() => setUploadFeedback(null)}
              className="text-xs underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Ingestion Hub Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Dataset Checklist (20 items) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 px-1 font-semibold flex items-center justify-between">
              <span>Required Datasets (1 to 20)</span>
              <span className="text-zinc-600">Select to inspect</span>
            </div>

            <div className="space-y-1.5 max-h-[750px] overflow-y-auto pr-1">
              {DATASET_REQUIREMENTS.map((req) => {
                const isLoaded = Boolean(statuses[req.id]?.isLoaded);
                const rowCount = statuses[req.id]?.rowCount || 0;
                const isSelected = activeTab === req.id;

                return (
                  <button
                    key={req.id}
                    onClick={() => setActiveTab(req.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-zinc-900 border-zinc-700 shadow-md ring-1 ring-zinc-600"
                        : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[11px] flex items-center justify-center shrink-0">
                        {req.order}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-zinc-200">
                          {req.name}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500">
                          {req.fileFormat}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isLoaded ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {rowCount} rows
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 border border-red-900/60 text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Dataset Inspection & Ingestion Panel */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl p-6 shadow-2xl space-y-6">
              {/* Dataset Details Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                      STEP {selectedReq.order} OF 20
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      FORMAT: {selectedReq.fileFormat}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {selectedReq.name}
                  </h2>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0">
                  {statuses[selectedReq.id]?.isLoaded ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-950 border border-emerald-800 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ACTIVE ({statuses[selectedReq.id].rowCount} ROWS)
                      </span>
                      <button
                        onClick={() => clearDataset(selectedReq.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-800 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete uploaded data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium bg-red-950/80 border border-red-800 text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      AWAITING UPLOAD
                    </span>
                  )}
                </div>
              </div>

              {/* 1. Why Needed */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                  1. Why This Dataset Is Needed
                </h3>
                <p className="text-sm text-zinc-300 bg-zinc-900/60 border border-zinc-800/80 p-3.5 rounded-xl leading-relaxed">
                  {selectedReq.whyNeeded}
                </p>
              </div>

              {/* 2. Expected Columns Schema */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>2. Expected Columns Schema</span>
                  <button
                    onClick={() => downloadSampleCsv(selectedReq)}
                    className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-sans"
                  >
                    <Download className="w-3 h-3" />
                    Download CSV Template
                  </button>
                </h3>
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3">Column</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Requirement</th>
                        <th className="py-2.5 px-3 font-sans">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {selectedReq.expectedColumns.map((col) => (
                        <tr key={col.name} className="hover:bg-zinc-900/40">
                          <td className="py-2 px-3 text-white font-semibold">
                            {col.name}
                          </td>
                          <td className="py-2 px-3 text-cyan-400">{col.type}</td>
                          <td className="py-2 px-3">
                            {col.required ? (
                              <span className="text-red-400 font-bold">Required</span>
                            ) : (
                              <span className="text-zinc-500">Optional</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-sans text-zinc-400">
                            {col.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Where To Obtain Dataset */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  3. Recommended Official & Open Data Sources
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReq.recommendedSources.map((source) => (
                    <a
                      key={source.name}
                      href={source.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-200 group-hover:text-red-400 transition-colors">
                          {source.name}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        {source.description}
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              {/* 4. Upload Ingestion Area */}
              <div className="pt-4 border-t border-zinc-800/80">
                <label className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-zinc-800 hover:border-red-600/80 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all cursor-pointer group">
                  <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform mb-3 text-red-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-200 group-hover:text-white">
                    Click to browse or drag & drop {selectedReq.name} ({selectedReq.fileFormat})
                  </span>
                  <span className="text-xs text-zinc-500 mt-1 font-mono">
                    Validates required headers: {selectedReq.expectedColumns.filter(c => c.required).map(c => c.name).join(", ")}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={(e) => handleFileUpload(selectedReq, e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

