"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";
import { Download, Image as ImageIcon } from "lucide-react";

// Dynamically import ReactECharts with SSR disabled
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface InteractiveChartProps {
  option: EChartsOption;
  height?: string | number;
  className?: string;
  theme?: "dark";
  onEvents?: Record<string, Function>;
  title?: string;
  allowExport?: boolean;
}

export default function InteractiveChart({
  option,
  height = "360px",
  className = "",
  theme = "dark",
  onEvents,
  title = "f1_chart",
  allowExport = true,
}: InteractiveChartProps) {
  const [mounted, setMounted] = useState(false);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportPng = () => {
    if (!chartInstanceRef.current) return;
    try {
      const url = chartInstanceRef.current.getDataURL({
        type: "png",
        pixelRatio: 2,
        backgroundColor: "#09090b",
      });
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to export chart PNG", e);
    }
  };

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className={`w-full flex items-center justify-center bg-zinc-950/40 rounded-xl border border-zinc-800/40 ${className}`}
      >
        <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
          INITIALIZING TELEMETRY ENGINE...
        </div>
      </div>
    );
  }

  // Base options for Formula 1 engineering telemetry look & feel
  const styledOption: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: "Inter, sans-serif",
      color: "#a1a1aa",
    },
    ...option,
  };

  return (
    <div className={`w-full relative group ${className}`} style={{ height }}>
      {allowExport && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleExportPng}
            title="Download Chart (PNG HD)"
            className="p-1.5 rounded-md bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/80 shadow-md text-[11px] font-mono flex items-center gap-1"
          >
            <Download className="w-3 h-3 text-[#E10600]" />
            <span>PNG</span>
          </button>
        </div>
      )}

      <ReactECharts
        onChartReady={(instance) => {
          chartInstanceRef.current = instance;
        }}
        option={styledOption}
        theme={theme}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={onEvents}
      />
    </div>
  );
}
