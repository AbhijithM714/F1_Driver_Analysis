"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Flag,
  Wrench,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Eye,
  Radio,
  MapPin,
  Flame,
} from "lucide-react";

export interface ReplayDriverState {
  driverId: number;
  driverName: string;
  code: string;
  constructorName: string;
  teamColor: string;
  position: number;
  lapTime: string;
  cumulativeMs: number;
  gapToLeader: string;
  intervalToAhead: string;
  isPitting: boolean;
  isOut: boolean;
}

export interface TrackGeometry {
  name: string;
  country: string;
  lengthKm?: number;
  turns?: number;
  drsZones?: number;
  coordinates: [number, number][];
}

export interface TrackSectionDef {
  id: number;
  name: string;
  shortName: string;
  sector: 1 | 2 | 3;
  color: string;
}

export const TRACK_SECTIONS: TrackSectionDef[] = [
  { id: 1, name: "Main Straight & Turn 1", shortName: "S1", sector: 1, color: "#38bdf8" },
  { id: 2, name: "Sector 1 Mid (Esses)", shortName: "S2", sector: 1, color: "#38bdf8" },
  { id: 3, name: "Sector 1 Exit / Sector 2 Entry", shortName: "S3", sector: 2, color: "#fbbf24" },
  { id: 4, name: "Sector 2 Mid (Hairpin)", shortName: "S4", sector: 2, color: "#fbbf24" },
  { id: 5, name: "Sector 2 Backstraight", shortName: "S5", sector: 2, color: "#fbbf24" },
  { id: 6, name: "Sector 2 Exit / Sector 3 Entry", shortName: "S6", sector: 3, color: "#f43f5e" },
  { id: 7, name: "Sector 3 Chicanes", shortName: "S7", sector: 3, color: "#f43f5e" },
  { id: 8, name: "Final Corner & Finish Approach", shortName: "S8", sector: 3, color: "#f43f5e" },
];

const TOTAL_WAYPOINTS = 640;
const WP_PER_SECTION = 80;

// Official bacinger/f1-circuits GeoJSON IDs for all Formula 1 circuits
const CIRCUIT_GEOJSON_MAP: Record<string, string> = {
  bahrain: "bh-2002",
  jeddah: "sa-2021",
  albert_park: "au-1953",
  suzuka: "jp-1962",
  shanghai: "cn-2004",
  miami: "us-2022",
  imola: "it-1953",
  monaco: "mc-1929",
  villeneuve: "ca-1978",
  catalunya: "es-1991",
  red_bull_ring: "at-1969",
  silverstone: "gb-1948",
  hungaroring: "hu-1986",
  spa: "be-1925",
  zandvoort: "nl-1948",
  monza: "it-1922",
  baku: "az-2016",
  marina_bay: "sg-2008",
  americas: "us-2012",
  rodriguez: "mx-1962",
  interlagos: "br-1940",
  vegas: "us-2023",
  losail: "qa-2004",
  yas_marina: "ae-2009",
  ricard: "fr-1969",
  mugello: "it-1914",
  portimao: "pt-2008",
  istanbul: "tr-2005",
  sochi: "ru-2014",
  nurburgring: "de-1927",
  hockenheimring: "de-1932",
  sepang: "my-1999",
  magny_cours: "fr-1960",
  indianapolis: "us-1909",
  fuji: "jp-1965",
  yeongam: "kr-2010",
  buddh: "in-2011",
  valencia: "es-2008",
  jerez: "es-1985",
  estoril: "pt-1972",
  adelaide: "au-1985",
  kyalami: "za-1961",
};

const geoJsonMemoryCache: Record<string, [number, number][]> = {};

interface RaceTrackReplayMapProps {
  trackGeometry: TrackGeometry | null;
  circuitRef?: string;
  circuitName: string;
  drivers: ReplayDriverState[];
  currentLap: number;
  totalLaps: number;
  currentSection?: number;
  onSectionChange?: (section: number) => void;
  isPlaying?: boolean;
  selectedDriverCode?: string | null;
  onSelectDriver?: (driverCode: string) => void;
}

/**
 * Normalizes raw circuit coordinates (either WGS84 [lon, lat] degrees or Cartesian XY)
 * to fit accurately inside the 1000x600 SVG canvas while preserving real aspect ratio.
 */
function normalizeCoordinates(
  rawCoords: [number, number][],
  targetW = 840,
  targetH = 440,
  padX = 80,
  padY = 80
): [number, number][] {
  if (!rawCoords || rawCoords.length < 3) {
    return [
      [180, 460],
      [180, 180],
      [300, 110],
      [500, 110],
      [680, 170],
      [820, 270],
      [820, 410],
      [680, 460],
      [520, 360],
      [360, 460],
    ];
  }

  const rawYs = rawCoords.map((c) => c[1]);
  const minRawY = Math.min(...rawYs);
  const maxRawY = Math.max(...rawYs);
  const rawXs = rawCoords.map((c) => c[0]);
  const minRawX = Math.min(...rawXs);
  const maxRawX = Math.max(...rawXs);

  // Detect WGS84 [lon, lat] degrees and apply equirectangular cosine latitude correction
  const isGpsDegrees =
    Math.abs(maxRawY) <= 90 &&
    Math.abs(minRawY) <= 90 &&
    Math.abs(maxRawX) <= 180 &&
    maxRawX - minRawX < 2 &&
    maxRawY - minRawY < 2;

  const midLatRad = (((minRawY + maxRawY) / 2) * Math.PI) / 180;
  const cosLat = isGpsDegrees ? Math.max(0.2, Math.cos(midLatRad)) : 1;

  const projected: [number, number][] = rawCoords.map((c) => [c[0] * cosLat, c[1]]);

  const xs = projected.map((c) => c[0]);
  const ys = projected.map((c) => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(1e-7, maxX - minX);
  const spanY = Math.max(1e-7, maxY - minY);

  const scale = Math.min(targetW / spanX, targetH / spanY);
  const ox = padX + (targetW - spanX * scale) / 2;
  const oy = padY + (targetH - spanY * scale) / 2;

  return projected.map((c) => [
    Math.round((ox + (c[0] - minX) * scale) * 100) / 100,
    Math.round((oy + (maxY - c[1]) * scale) * 100) / 100,
  ]);
}

/**
 * Generates TOTAL_WAYPOINTS (640) equally spaced waypoints along the closed circuit perimeter
 * using Equal Euclidean Arc-Length Resampling + subtle corner smoothing.
 * Guarantees zero spline overshoot loops and ensures every driver dot lies strictly on the track path.
 */
function generateWaypoints(rawCoords: [number, number][]): [number, number][] {
  const norm = normalizeCoordinates(rawCoords);
  if (norm.length < 3) return norm;

  // Filter out near-duplicate consecutive vertices in SVG pixel space
  const clean: [number, number][] = [norm[0]];
  for (let i = 1; i < norm.length; i++) {
    const prev = clean[clean.length - 1];
    if (Math.hypot(norm[i][0] - prev[0], norm[i][1] - prev[1]) > 0.5) {
      clean.push(norm[i]);
    }
  }
  if (
    clean.length > 2 &&
    Math.hypot(
      clean[0][0] - clean[clean.length - 1][0],
      clean[0][1] - clean[clean.length - 1][1]
    ) <= 1.0
  ) {
    clean.pop();
  }

  const n = clean.length;
  if (n < 3) return norm;

  // Compute cumulative Euclidean arc length around the closed polygon loop
  const segLengths: number[] = [];
  const cumLengths: number[] = [0];
  let totalLength = 0;

  for (let i = 0; i < n; i++) {
    const p1 = clean[i];
    const p2 = clean[(i + 1) % n];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    segLengths.push(len);
    totalLength += len;
    cumLengths.push(totalLength);
  }

  if (totalLength <= 0) return clean;

  // Resample into TOTAL_WAYPOINTS equidistant points along the perimeter
  const resampled: [number, number][] = [];
  let segIdx = 0;

  for (let w = 0; w < TOTAL_WAYPOINTS; w++) {
    const targetDist = (w / TOTAL_WAYPOINTS) * totalLength;
    while (segIdx < n - 1 && cumLengths[segIdx + 1] < targetDist) {
      segIdx++;
    }
    const segStartDist = cumLengths[segIdx];
    const segLen = segLengths[segIdx];
    const t = segLen > 1e-6 ? (targetDist - segStartDist) / segLen : 0;

    const p1 = clean[segIdx];
    const p2 = clean[(segIdx + 1) % n];

    resampled.push([
      p1[0] + (p2[0] - p1[0]) * t,
      p1[1] + (p2[1] - p1[1]) * t,
    ]);
  }

  // Apply 2 passes of gentle 3-point Gaussian-like smoothing to round sharp polygon vertices
  // without introducing any Catmull-Rom overshoot on straightaways
  let current = resampled;
  for (let pass = 0; pass < 2; pass++) {
    const nextPass: [number, number][] = [];
    for (let i = 0; i < TOTAL_WAYPOINTS; i++) {
      const prev = current[(i - 1 + TOTAL_WAYPOINTS) % TOTAL_WAYPOINTS];
      const curr = current[i];
      const next = current[(i + 1) % TOTAL_WAYPOINTS];
      nextPass.push([
        Math.round((0.22 * prev[0] + 0.56 * curr[0] + 0.22 * next[0]) * 10) / 10,
        Math.round((0.22 * prev[1] + 0.56 * curr[1] + 0.22 * next[1]) * 10) / 10,
      ]);
    }
    current = nextPass;
  }

  return current;
}

export default function RaceTrackReplayMap({
  trackGeometry,
  circuitRef,
  circuitName,
  drivers,
  currentLap,
  totalLaps,
  currentSection = 1,
  onSectionChange,
  isPlaying = false,
  selectedDriverCode,
  onSelectDriver,
}: RaceTrackReplayMapProps) {
  const [labelMode, setLabelMode] = useState<"code" | "position">("code");
  const [hoveredDriver, setHoveredDriver] = useState<ReplayDriverState | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [highResCoords, setHighResCoords] = useState<[number, number][] | null>(null);

  // Automatically fetch full-resolution official GeoJSON coordinates if local track has < 45 vertices
  useEffect(() => {
    setHighResCoords(null);
    const refKey = circuitRef?.toLowerCase().trim() || "";
    const geoId = CIRCUIT_GEOJSON_MAP[refKey];
    if (!geoId) return;

    const existingCount = trackGeometry?.coordinates?.length || 0;
    if (existingCount >= 45) return;

    if (geoJsonMemoryCache[geoId]) {
      setHighResCoords(geoJsonMemoryCache[geoId]);
      return;
    }

    let cancelled = false;
    fetch(`https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/${geoId}.geojson`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const coords =
          data?.features?.[0]?.geometry?.coordinates || data?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length >= 20) {
          const cleanCoords: [number, number][] = coords.map((pt: number[]) => [
            Number(pt[0]),
            Number(pt[1]),
          ]);
          geoJsonMemoryCache[geoId] = cleanCoords;
          setHighResCoords(cleanCoords);
        }
      })
      .catch(() => {
        // Fallback silently to local coordinates in data/track_maps.json
      });

    return () => {
      cancelled = true;
    };
  }, [circuitRef, trackGeometry]);

  // Generate 640 equidistant smooth waypoints along the closed circuit
  const waypoints = useMemo(() => {
    const activeCoords = highResCoords || trackGeometry?.coordinates || [];
    return generateWaypoints(activeCoords);
  }, [highResCoords, trackGeometry]);

  // SVG Path string directly connecting waypoints
  const pathD = useMemo(() => {
    if (waypoints.length === 0) return "";
    let d = `M ${waypoints[0][0]} ${waypoints[0][1]}`;
    for (let i = 1; i < waypoints.length; i++) {
      d += ` L ${waypoints[i][0]} ${waypoints[i][1]}`;
    }
    d += " Z";
    return d;
  }, [waypoints]);

  // Section waypoints & metadata
  const sectionWaypoints = useMemo(() => {
    return TRACK_SECTIONS.map((sec, idx) => {
      const wpIdx = idx * WP_PER_SECTION;
      const pt = waypoints[wpIdx] || [100, 100];
      return {
        ...sec,
        wpIdx,
        x: pt[0],
        y: pt[1],
        isActive: sec.id === currentSection,
      };
    });
  }, [waypoints, currentSection]);

  // Start / Finish Line perpendicular geometry
  const startFinishLine = useMemo(() => {
    if (waypoints.length < 10) return null;
    const p0 = waypoints[0];
    const p1 = waypoints[4];
    const angle = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const perp = angle + Math.PI / 2;
    const len = 18;

    return {
      x1: p0[0] - Math.cos(perp) * len,
      y1: p0[1] - Math.sin(perp) * len,
      x2: p0[0] + Math.cos(perp) * len,
      y2: p0[1] + Math.sin(perp) * len,
      cx: p0[0],
      cy: p0[1],
    };
  }, [waypoints]);

  // Active section metadata
  const activeSectionInfo = useMemo(() => {
    return (
      TRACK_SECTIONS.find((s) => s.id === currentSection) || TRACK_SECTIONS[0]
    );
  }, [currentSection]);

  // Leader driver
  const leaderDriver = drivers.find((d) => d.position === 1) || drivers[0];

  // Compute exact coordinates for every driver strictly on the 2D track
  const driverPositions = useMemo(() => {
    if (waypoints.length === 0 || drivers.length === 0) return [];

    // The leader's waypoint index is anchored directly to the active section
    const leaderWpIdx = (currentSection - 1) * WP_PER_SECTION;

    let prevDeltaWp = 0;

    return drivers.map((driver) => {
      let gapSec = 0;
      if (driver.gapToLeader && driver.gapToLeader.startsWith("+")) {
        const parsed = parseFloat(driver.gapToLeader.replace("+", "").replace("s", ""));
        if (!isNaN(parsed)) gapSec = parsed;
      }

      // Convert seconds to waypoint delta (baseline ~90s lap = 640 waypoints)
      let deltaWp = Math.round((gapSec / 90) * TOTAL_WAYPOINTS);

      // Maintain visual separation between cars along the track line
      if (driver.position > 1) {
        deltaWp = Math.max(deltaWp, prevDeltaWp + 14);
      }
      prevDeltaWp = deltaWp;

      // Exact waypoint index along the circuit
      const wpIdx =
        (leaderWpIdx - deltaWp + TOTAL_WAYPOINTS * 10) % TOTAL_WAYPOINTS;

      const pt = waypoints[wpIdx] || [0, 0];
      const nextPt = waypoints[(wpIdx + 2) % TOTAL_WAYPOINTS] || pt;
      const angle =
        Math.atan2(nextPt[1] - pt[1], nextPt[0] - pt[0]) * (180 / Math.PI);

      return {
        ...driver,
        x: pt[0],
        y: pt[1],
        angle,
        wpIdx,
        isLeader: driver.position === 1,
      };
    });
  }, [drivers, currentSection, waypoints]);

  return (
    <div className="relative w-full rounded-2xl border border-zinc-800 bg-[#070709] overflow-hidden shadow-2xl flex flex-col">
      {/* Top HUD: Circuit Info, Mode Toggles, and Section Tracker */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-zinc-850 bg-zinc-950/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800/80 text-[#E10600] font-mono text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            2D Track Simulation
          </div>
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-tight block">
              {trackGeometry?.name || circuitName}
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              {trackGeometry?.lengthKm ? `${trackGeometry.lengthKm} KM` : "Grand Prix Circuit"} ·{" "}
              {trackGeometry?.turns ? `${trackGeometry.turns} Turns` : "8 Track Sections"} ·{" "}
              Lap {currentLap} of {totalLaps}
            </span>
          </div>
        </div>

        {/* Live Broadcast Pill: Current Section & Leader Alert */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-zinc-400">Section:</span>
            <strong className="text-white font-bold">
              {activeSectionInfo.shortName} · {activeSectionInfo.name}
            </strong>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
              style={{
                backgroundColor: `${activeSectionInfo.color}20`,
                color: activeSectionInfo.color,
                border: `1px solid ${activeSectionInfo.color}40`,
              }}
            >
              Sector {activeSectionInfo.sector}
            </span>
          </div>

          {/* Toggle Broadcast Code vs Track Position */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-[11px] font-mono">
            <button
              onClick={() => setLabelMode("code")}
              className={`px-2 py-0.5 rounded transition-colors ${
                labelMode === "code"
                  ? "bg-zinc-800 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Show driver 3-letter broadcast codes (VER, HAM)"
            >
              Code
            </button>
            <button
              onClick={() => setLabelMode("position")}
              className={`px-2 py-0.5 rounded transition-colors ${
                labelMode === "position"
                  ? "bg-zinc-800 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Show track running positions (P1, P2)"
            >
              Pos
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG 2D Circuit Map Canvas */}
      <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[520px] flex items-center justify-center p-2 overflow-hidden select-none bg-radial from-zinc-950 via-[#060608] to-black">
        {/* Ambient Subtle Grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, #080808 1px)",
            backgroundSize: "28px 28px",
            backgroundPosition: "0 0, 14px 14px",
          }}
        />

        {/* Live Leaderboard Overlay HUD */}
        <div className="absolute top-4 left-4 z-10 hidden sm:flex flex-col gap-1 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur text-xs font-mono max-w-[210px] shadow-2xl">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-800 pb-1 mb-0.5 flex items-center justify-between">
            <span>Running Order</span>
            <Trophy className="w-3 h-3 text-yellow-400" />
          </div>
          {drivers.slice(0, 5).map((d) => (
            <div
              key={d.driverId}
              onClick={() => onSelectDriver && onSelectDriver(d.code)}
              className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                selectedDriverCode === d.code
                  ? "bg-zinc-800 text-white font-bold ring-1 ring-zinc-600"
                  : "hover:bg-zinc-900 text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 w-3.5">P{d.position}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: d.teamColor }}
                />
                <span className="font-bold text-[11px]">{d.code}</span>
              </div>
              <span className="text-[10px] text-zinc-400">
                {d.isPitting ? "PIT" : d.position === 1 ? "LEADER" : d.gapToLeader}
              </span>
            </div>
          ))}
        </div>

        {/* Live Broadcast Leader Alert Pill */}
        <div className="absolute top-4 right-4 z-10 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur text-xs font-mono text-zinc-300 shadow-xl">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Leader:</span>
          <strong className="text-white font-bold">
            {leaderDriver ? leaderDriver.driverName : "Verstappen"} ({leaderDriver?.code})
          </strong>
          <span className="text-zinc-500">· Crossing {activeSectionInfo.shortName}</span>
        </div>

        {/* SVG Track Display */}
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full max-h-full transition-transform duration-300 ease-out"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft Shadow Glow for Tarmac */}
            <filter id="trackSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Driver Marker Glow */}
            <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer 1: Ambient Track Runoff Outline */}
          <path
            d={pathD}
            fill="none"
            stroke="#18181b"
            strokeWidth="30"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />

          {/* Layer 2: Kerbs Border Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#27272a"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Layer 3: Main Asphalt Tarmac Surface */}
          <path
            d={pathD}
            fill="none"
            stroke="#0d0d10"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Layer 4: Dashed Racing Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#3f3f46"
            strokeWidth="2"
            strokeDasharray="6 8"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Start / Finish Line Checkered Marker */}
          {startFinishLine && (
            <g>
              <line
                x1={startFinishLine.x1}
                y1={startFinishLine.y1}
                x2={startFinishLine.x2}
                y2={startFinishLine.y2}
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="square"
              />
              <line
                x1={startFinishLine.x1}
                y1={startFinishLine.y1}
                x2={startFinishLine.x2}
                y2={startFinishLine.y2}
                stroke="#E10600"
                strokeWidth="3.5"
                strokeDasharray="3 3"
                strokeLinecap="square"
              />
              <text
                x={startFinishLine.cx + 10}
                y={startFinishLine.cy - 12}
                fill="#71717a"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                START / FINISH
              </text>
            </g>
          )}

          {/* Section Checkpoint Badges on Track */}
          {sectionWaypoints.map((sec) => (
            <g
              key={sec.id}
              transform={`translate(${sec.x}, ${sec.y})`}
              className="cursor-pointer transition-transform"
              onClick={() => onSectionChange && onSectionChange(sec.id)}
            >
              {sec.isActive && (
                <circle
                  r="18"
                  fill="none"
                  stroke={sec.color}
                  strokeWidth="1.5"
                  opacity="0.7"
                  className="animate-ping"
                />
              )}
              <circle
                r={sec.isActive ? "11" : "8"}
                fill={sec.isActive ? sec.color : "#18181b"}
                stroke={sec.isActive ? "#ffffff" : "#3f3f46"}
                strokeWidth={sec.isActive ? "2" : "1"}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={sec.isActive ? "#000000" : "#a1a1aa"}
                fontSize={sec.isActive ? "7.5" : "6.5"}
                fontWeight="900"
                fontFamily="monospace"
              >
                {sec.shortName}
              </text>
            </g>
          ))}

          {/* Dynamic Driver Markers strictly on track */}
          {driverPositions.map((driver) => {
            const isHovered = hoveredDriver?.driverId === driver.driverId;
            const isSelected = selectedDriverCode === driver.code;
            const r = driver.isLeader ? 13 : 11;

            return (
              <g
                key={driver.driverId}
                transform={`translate(${driver.x}, ${driver.y})`}
                className="cursor-pointer transition-transform duration-300 ease-out"
                onMouseEnter={(e) => {
                  setHoveredDriver(driver);
                  setHoverPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setHoverPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredDriver(null)}
                onClick={() => onSelectDriver && onSelectDriver(driver.code)}
              >
                {/* Leader Outer Pulse Halo */}
                {driver.isLeader && (
                  <circle
                    r={r * 1.6}
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Selected Driver White Halo */}
                {isSelected && (
                  <circle
                    r={r * 1.8}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Team Livery Glow */}
                <circle
                  r={r * 1.3}
                  fill={driver.teamColor}
                  opacity={driver.isLeader || isSelected || isHovered ? 0.45 : 0.2}
                />

                {/* Primary Car Body Bubble */}
                <circle
                  r={r}
                  fill={driver.teamColor}
                  stroke={driver.isLeader ? "#eab308" : isSelected ? "#ffffff" : "#09090b"}
                  strokeWidth={driver.isLeader || isSelected ? 2.5 : 1.5}
                  filter="url(#markerGlow)"
                />

                {/* Broadcast Timing Code or Track Position Text */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={driver.isLeader ? 7.5 : 6.5}
                  fontWeight="900"
                  fontFamily="monospace"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
                >
                  {labelMode === "code" ? driver.code : `P${driver.position}`}
                </text>

                {/* Pit Stop Icon Tag */}
                {driver.isPitting && (
                  <g transform={`translate(${r * 0.9}, ${-r * 0.9})`}>
                    <circle r="5" fill="#ea580c" stroke="#09090b" strokeWidth="1" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="5"
                      fontWeight="bold"
                    >
                      P
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Inspection Tooltip Card */}
        {hoveredDriver && hoverPosition && (
          <div
            className="fixed pointer-events-none z-50 p-2.5 rounded-xl bg-zinc-950/95 border border-zinc-700/80 backdrop-blur shadow-2xl text-xs font-mono space-y-1"
            style={{
              left: `${hoverPosition.x + 15}px`,
              top: `${hoverPosition.y - 45}px`,
            }}
          >
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: hoveredDriver.teamColor }}
              />
              <span className="font-bold text-white text-sm">
                P{hoveredDriver.position} · {hoveredDriver.driverName}
              </span>
              <span className="text-[10px] text-zinc-400">({hoveredDriver.code})</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-zinc-300">
              <span className="text-zinc-500">Team:</span>
              <span className="text-right font-medium text-white truncate max-w-[110px]">
                {hoveredDriver.constructorName}
              </span>
              <span className="text-zinc-500">Lap Time:</span>
              <span className="text-right font-bold text-zinc-200">{hoveredDriver.lapTime}</span>
              <span className="text-zinc-500">Gap to P1:</span>
              <span className="text-right font-bold text-amber-400">
                {hoveredDriver.position === 1 ? "LEADER" : hoveredDriver.gapToLeader}
              </span>
              <span className="text-zinc-500">Interval Ahead:</span>
              <span className="text-right text-zinc-400">
                {hoveredDriver.position === 1 ? "—" : hoveredDriver.intervalToAhead}
              </span>
              {hoveredDriver.isPitting && (
                <div className="col-span-2 text-center text-amber-400 font-bold bg-amber-950/50 py-0.5 rounded mt-1 border border-amber-800/40">
                  IN PIT LANE (STOP ACTIVE)
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-zinc-850 bg-zinc-950/90 backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-400">Jump to Track Section:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (onSectionChange) {
                  const prev = currentSection > 1 ? currentSection - 1 : 8;
                  onSectionChange(prev);
                }
              }}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Previous section"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {TRACK_SECTIONS.map((sec) => {
              const isActive = sec.id === currentSection;
              return (
                <button
                  key={sec.id}
                  onClick={() => onSectionChange && onSectionChange(sec.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    isActive
                      ? "bg-[#E10600] text-white shadow-lg shadow-red-900/30 scale-105"
                      : "bg-zinc-900/90 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                  title={`${sec.name} (Sector ${sec.sector})`}
                >
                  {sec.shortName}
                </button>
              );
            })}

            <button
              onClick={() => {
                if (onSectionChange) {
                  const next = currentSection < 8 ? currentSection + 1 : 1;
                  onSectionChange(next);
                }
              }}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Next section"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 ring-2 ring-yellow-400/30" />
            <span>Leader (P1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Track Driver</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-1 ring-orange-300" />
            <span>Pit Activity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
