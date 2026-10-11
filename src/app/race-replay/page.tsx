"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Wrench,
  Gauge,
  ChevronRight,
  Sliders,
  Calendar,
} from "lucide-react";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import ExportButtons from "@/components/ExportButtons";
import RaceTrackReplayMap from "@/components/RaceTrackReplayMap";

interface RaceOption {
  raceId: number;
  year: number;
  round: number;
  name: string;
  circuitName: string;
}

export default function RaceReplayPage() {
  const [availableRaces, setAvailableRaces] = useState<RaceOption[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(2024);
  const [selectedRaceId, setSelectedRaceId] = useState<number>(1121); // 2024 Bahrain by default
  const [replayData, setReplayData] = useState<any>(null);
  const [currentLap, setCurrentLap] = useState<number>(1);
  const [currentSection, setCurrentSection] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // 1s per section
  const [selectedDriverCode, setSelectedDriverCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const availableSeasons = [
    2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
    2014, 2013, 2012, 2011, 2010, 2008, 2005, 2000, 1996
  ];

  // Load races that have lap timing data for selected season
  useEffect(() => {
    fetch(`/api/races?hasLapsOnly=true&year=${selectedSeason}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && json.data.length > 0) {
          setAvailableRaces(json.data);
          setSelectedRaceId(json.data[0].raceId);
        }
      })
      .catch((e) => console.error("Error loading replay races", e));
  }, [selectedSeason]);

  // Fetch replay frames for selected race
  const fetchReplay = (rId: number) => {
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    fetch(`/api/races/${rId}/replay`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setReplayData(json.data);
          setCurrentLap(1);
          setCurrentSection(1);
        } else {
          throw new Error(json.error || "Replay simulation data unavailable");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedRaceId) {
      fetchReplay(selectedRaceId);
    }
  }, [selectedRaceId]);

  // Section-by-section playback timer
  useEffect(() => {
    if (isPlaying && replayData) {
      timerRef.current = setInterval(() => {
        setCurrentSection((prevSec) => {
          if (prevSec < 8) {
            return prevSec + 1;
          }
          // Completed section 8 -> advance to next lap, section 1
          setCurrentLap((prevLap) => {
            if (prevLap >= replayData.totalLaps) {
              setIsPlaying(false);
              return replayData.totalLaps;
            }
            return prevLap + 1;
          });
          return 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, replayData, playbackSpeed]);

  const frame = replayData?.frames?.find((f: any) => f.lap === currentLap);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#E10600] uppercase tracking-widest mb-1.5 font-semibold">
              <Sliders className="w-4 h-4" />
              <span>Telemetry Simulation · 1996–2024 Lap Archive</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              Race Replay Simulator
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Lap-by-lap running order simulation powered directly by official <code className="text-zinc-300">lap_times.csv</code> and pit stop archives. Observe positions, gap progression, and pit deltas across any Grand Prix.
            </p>
          </div>

          {frame && (
            <ExportButtons
              data={frame.drivers.map((d: any) => ({
                lap: currentLap,
                position: d.position,
                driver: d.driverName,
                code: d.code,
                team: d.constructorName,
                gapToLeader: d.gapToLeader,
                interval: d.intervalToAhead,
                lapTime: d.lapTime,
                isPitting: d.isPitting ? "YES" : "NO",
              }))}
              filename={`lap_${currentLap}_race_replay`}
            />
          )}
        </div>

        {/* Controls Bar: Race Selector, Play/Pause, Slider */}
        <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Season and Grand Prix Selectors */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Season Select */}
              <div className="w-full sm:w-32">
                <label className="text-[11px] font-mono uppercase text-zinc-400 mb-1 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-red-500" />
                  Season:
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-[#E10600] [&>option]:bg-zinc-950"
                >
                  {availableSeasons.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grand Prix Select */}
              <div className="w-full sm:w-80">
                <label className="text-[11px] font-mono uppercase text-zinc-400 block mb-1 font-semibold">
                  Grand Prix Event:
                </label>
                <select
                  value={selectedRaceId}
                  onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-[#E10600] [&>option]:bg-zinc-950"
                >
                  {availableRaces.map((r) => (
                    <option key={r.raceId} value={r.raceId}>
                      {r.name} ({r.circuitName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Playback Control Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E10600] hover:bg-[#b80500] text-white text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-lg shadow-red-900/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlaying ? "Pause" : "Play Replay"}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentLap(1);
                  setCurrentSection(1);
                }}
                title="Restart simulation"
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-2.5 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-300 focus:outline-none [&>option]:bg-zinc-950"
              >
                <option value={1500}>0.75x Speed</option>
                <option value={1000}>1.0x Speed</option>
                <option value={500}>2.0x Speed</option>
                <option value={250}>4.0x Speed</option>
              </select>
            </div>
          </div>

          {/* Interactive Lap Slider */}
          {replayData && (
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">
                  CURRENT RUNNING LAP:{" "}
                  <strong className="text-white text-sm font-black">
                    LAP {currentLap}
                  </strong>{" "}
                  / {replayData.totalLaps}
                  <span className="text-zinc-500 ml-2">· Section {currentSection} / 8</span>
                </span>
                <span className="text-zinc-500">
                  {Math.round((currentLap / replayData.totalLaps) * 100)}% Race Completed
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={replayData.totalLaps}
                value={currentLap}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentLap(Number(e.target.value));
                  setCurrentSection(1);
                }}
                className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E10600]"
              />

              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>Start (Lap 1)</span>
                <span>Chequered Flag (Lap {replayData.totalLaps})</span>
              </div>
            </div>
          )}
        </div>

        {/* Replay Visualization State */}
        {loading ? (
          <LoadingState type="table" message="Loading race replay timing frames..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchReplay(selectedRaceId)} />
        ) : !frame ? (
          <EmptyState
            type="no_data"
            title="No Frame Data"
            message="Unable to calculate frame for this lap."
          />
        ) : (
          <div className="space-y-6">
            {/* 2D Circuit Track Map Visualization with Live Car Positions */}
            <RaceTrackReplayMap
              trackGeometry={replayData?.trackGeometry}
              circuitRef={replayData?.circuitRef}
              circuitName={replayData?.circuitName || "Grand Prix Circuit"}
              drivers={frame.drivers}
              currentLap={currentLap}
              totalLaps={replayData.totalLaps}
              currentSection={currentSection}
              onSectionChange={setCurrentSection}
              isPlaying={isPlaying}
              selectedDriverCode={selectedDriverCode}
              onSelectDriver={(code) =>
                setSelectedDriverCode((prev) => (prev === code ? null : code))
              }
            />

            {/* Running Classification Table */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                    Running Classification · Lap {currentLap} (Section {currentSection} of 8)
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  {selectedDriverCode && (
                    <button
                      onClick={() => setSelectedDriverCode(null)}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                    >
                      Clear Focus ({selectedDriverCode})
                    </button>
                  )}
                  <span className="text-zinc-400">
                    {frame.drivers.length} Cars on Track
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] uppercase text-zinc-500">
                      <th className="pb-3 w-12 text-center">Pos</th>
                      <th className="pb-3">Driver</th>
                      <th className="pb-3">Team</th>
                      <th className="pb-3 text-right">Last Lap Time</th>
                      <th className="pb-3 text-right">Gap to Leader</th>
                      <th className="pb-3 text-right">Interval Ahead</th>
                      <th className="pb-3 text-center w-24">Pit Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {frame.drivers.map((d: any) => {
                      const isSelected = selectedDriverCode === d.code;
                      return (
                        <tr
                          key={d.driverId}
                          onClick={() =>
                            setSelectedDriverCode((prev) => (prev === d.code ? null : d.code))
                          }
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-zinc-800/80 text-white font-bold ring-1 ring-zinc-600"
                              : d.isPitting
                              ? "bg-amber-950/20 hover:bg-zinc-900/40"
                              : "hover:bg-zinc-900/40"
                          }`}
                        >
                          <td className="py-3 text-center font-black text-sm text-zinc-200">
                            {d.position === 1 ? (
                              <span className="text-amber-400">P1</span>
                            ) : (
                              `P${d.position}`
                            )}
                          </td>
                          <td className="py-3 font-sans font-medium text-white flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: d.teamColor }}
                            />
                            <Link
                              href={`/drivers/${d.driverId}`}
                              className="hover:text-[#E10600] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {d.driverName}
                            </Link>
                            <span className="text-[10px] font-mono text-zinc-500">({d.code})</span>
                          </td>
                      <td className="py-3 font-sans text-zinc-400 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: d.teamColor }}
                        />
                        <span>{d.constructorName}</span>
                      </td>
                      <td className="py-3 text-right text-zinc-200">{d.lapTime}</td>
                      <td className="py-3 text-right font-bold text-zinc-300">
                        {d.gapToLeader}
                      </td>
                      <td className="py-3 text-right text-zinc-400">{d.intervalToAhead}</td>
                      <td className="py-3 text-center">
                        {d.isPitting ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded animate-pulse">
                            <Wrench className="w-3 h-3" />
                            PIT IN
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

