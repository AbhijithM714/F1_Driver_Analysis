"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, FileJson, FileText, Check } from "lucide-react";
import { exportTableToCsv, exportTableToJson } from "@/lib/exportUtils";

interface ExportButtonsProps {
  data: any[];
  filename: string;
  label?: string;
  pdfAction?: () => void;
  pdfLabel?: string;
  className?: string;
}

export default function ExportButtons({
  data,
  filename,
  label,
  pdfAction,
  pdfLabel = "Export PDF",
  className = "",
}: ExportButtonsProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const handleCsv = () => {
    exportTableToCsv(data, filename);
    setCopiedFormat("csv");
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleJson = () => {
    exportTableToJson(data, filename);
    setCopiedFormat("json");
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleCsv}
        disabled={!data || data.length === 0}
        title="Download CSV table"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 text-xs font-mono transition-colors disabled:opacity-50"
      >
        {copiedFormat === "csv" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-[#E10600]" />}
        <span>{label ? `${label} CSV` : "CSV"}</span>
      </button>

      <button
        onClick={handleJson}
        disabled={!data || data.length === 0}
        title="Download JSON data"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 text-xs font-mono transition-colors disabled:opacity-50"
      >
        {copiedFormat === "json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileJson className="w-3.5 h-3.5 text-amber-400" />}
        <span>{label ? `${label} JSON` : "JSON"}</span>
      </button>

      {pdfAction && (
        <button
          onClick={pdfAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E10600] hover:bg-[#b80500] text-white text-xs font-medium transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{pdfLabel}</span>
        </button>
      )}
    </div>
  );
}

