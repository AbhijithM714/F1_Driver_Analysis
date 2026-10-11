"use client";

import React, { useState, useEffect } from "react";
import { Clock, MapPin, ChevronRight, X } from "lucide-react";
import Link from "next/link";

export default function CountdownBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 12,
    minutes: 38,
    seconds: 45,
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("f1_hide_countdown") === "true") {
        setDismissed(true);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("f1_hide_countdown", "true");
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800/80 py-2.5 px-4 text-xs font-mono relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 pr-6">
        {/* Left: Next Grand Prix Details */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-semibold tracking-wider text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            NEXT GRAND PRIX
          </span>
          <div className="flex items-center gap-2 text-zinc-200 font-sans font-medium text-xs sm:text-sm">
            <span>FORMULA 1 UNITED STATES GRAND PRIX 2024</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-zinc-500 text-xs font-mono">
              <MapPin className="w-3 h-3 text-zinc-400" /> Circuit of The Americas, Austin
            </span>
          </div>
        </div>

        {/* Right: Live Telemetry Countdown Ticker */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-white font-bold min-w-[24px] text-center">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-zinc-500 text-[10px]">D</span>
              <span className="text-zinc-600">:</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-white font-bold min-w-[24px] text-center">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-zinc-500 text-[10px]">H</span>
              <span className="text-zinc-600">:</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-white font-bold min-w-[24px] text-center">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-zinc-500 text-[10px]">M</span>
              <span className="text-zinc-600">:</span>
              <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 font-bold min-w-[24px] text-center">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-zinc-500 text-[10px]">S</span>
            </div>
          </div>

          <Link
            href="/race-analytics"
            className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
          >
            Track Insights
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        title="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

