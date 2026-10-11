/**
 * Data Processing Layer
 * ---------------------
 * CSV dataset  ->  typed rows  ->  indexes  ->  (analytics services)  ->  API  ->  UI
 *
 * - Every table is read from /data and cached on `globalThis`.
 * - Caches are invalidated automatically when a file's mtime/size changes, so dropping a
 *   new CSV into /data updates the whole application without a restart.
 * - The Ergast `\N` null marker is normalised to `null`.
 */
import fs from "fs";
import path from "path";
import Papa from "papaparse";

// Statically traceable default data directory for Next.js / Vercel / Netlify serverless bundling
const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");

export const DATA_DIR = process.env.DATA_DIRECTORY
  ? path.isAbsolute(process.env.DATA_DIRECTORY)
    ? process.env.DATA_DIRECTORY
    : path.join(process.cwd(), process.env.DATA_DIRECTORY)
  : DEFAULT_DATA_DIR;

const REVALIDATE_MS = 1500;

/**
 * Resolves a filename inside DATA_DIR while strictly preventing path traversal
 * and preserving Next.js Output File Tracing compatibility.
 */
export function safeDataPath(file: string): string {
  const sanitized = path.basename(file);
  const candidate = path.join(DEFAULT_DATA_DIR, sanitized);
  if (!process.env.DATA_DIRECTORY || process.env.DATA_DIRECTORY === "data") {
    return candidate;
  }
  const resolved = path.resolve(DATA_DIR, sanitized);
  const baseResolved = path.resolve(DATA_DIR);
  if (!resolved.startsWith(baseResolved)) {
    throw new Error("Invalid dataset file path");
  }
  return resolved;
}

// ---------------------------------------------------------------------------------------
// Cache plumbing
// ---------------------------------------------------------------------------------------
interface CacheEntry {
  stamp: string;
  checkedAt: number;
  value: unknown;
}

const g = globalThis as unknown as { __f1Cache?: Map<string, CacheEntry> };
const CACHE: Map<string, CacheEntry> = g.__f1Cache || (g.__f1Cache = new Map());

function stampOf(files: string[]): string {
  return files
    .map((f) => {
      try {
        const s = fs.statSync(safeDataPath(f));
        return `${f}:${s.mtimeMs}:${s.size}`;
      } catch {
        return `${f}:missing`;
      }
    })
    .join("|");
}

/** Memoise `build()` until any of `files` changes on disk. */
export function memo<T>(key: string, files: string[], build: () => T): T {
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.checkedAt < REVALIDATE_MS) return hit.value as T;
  const stamp = stampOf(files);
  if (hit && hit.stamp === stamp) {
    hit.checkedAt = now;
    return hit.value as T;
  }
  const value = build();
  CACHE.set(key, { stamp, checkedAt: now, value });
  return value;
}

export function dataFileExists(file: string): boolean {
  try {
    return fs.existsSync(safeDataPath(file));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------------------
// Raw CSV / JSON readers
// ---------------------------------------------------------------------------------------
export type RawRow = Record<string, any>;

export function readCsvFile(file: string): RawRow[] {
  const full = safeDataPath(file);
  if (!fs.existsSync(full)) return [];
  try {
    let content = fs.readFileSync(full, "utf-8");
    if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
    const parsed = Papa.parse<RawRow>(content, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transform: (v) => (v === "\\N" ? "" : v),
    });
    return parsed.data || [];
  } catch {
    return [];
  }
}

/** Cached CSV table (re-read when the file changes). */
export function readTable(file: string): RawRow[] {
  return memo(`csv:${file}`, [file], () => readCsvFile(file));
}

export function readJsonFile<T = any>(file: string): T | null {
  return memo(`json:${file}`, [file], () => {
    const full = safeDataPath(file);
    if (!fs.existsSync(full)) return null;
    try {
      return JSON.parse(fs.readFileSync(full, "utf-8")) as T;
    } catch {
      return null;
    }
  });
}

// ---------------------------------------------------------------------------------------
// Typed rows
// ---------------------------------------------------------------------------------------
const num = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: any): string => (v === null || v === undefined ? "" : String(v).trim());

export interface DriverRow {
  driverId: number;
  driverRef: string;
  number: number | null;
  code: string;
  forename: string;
  surname: string;
  fullName: string;
  dob: string | null;
  nationality: string;
  url: string;
}
export interface ConstructorRow {
  constructorId: number;
  constructorRef: string;
  name: string;
  nationality: string;
  url: string;
}
export interface CircuitRow {
  circuitId: number;
  circuitRef: string;
  name: string;
  location: string;
  country: string;
  lat: number | null;
  lng: number | null;
  alt: number | null;
  url: string;
}
export interface RaceRow {
  raceId: number;
  year: number;
  round: number;
  circuitId: number;
  name: string;
  date: string;
  time: string | null;
  url: string;
  hasSprint: boolean;
}
export interface ResultRow {
  resultId: number;
  raceId: number;
  driverId: number;
  constructorId: number;
  number: number | null;
  grid: number;
  position: number | null;
  positionText: string;
  positionOrder: number;
  points: number;
  laps: number;
  time: string | null;
  milliseconds: number | null;
  fastestLap: number | null;
  rank: number | null;
  fastestLapTime: string | null;
  fastestLapSpeed: number | null;
  statusId: number;
}
export interface QualiRow {
  qualifyId: number;
  raceId: number;
  driverId: number;
  constructorId: number;
  number: number | null;
  position: number;
  q1: string | null;
  q2: string | null;
  q3: string | null;
}
export interface StandingRow {
  raceId: number;
  driverId?: number;
  constructorId?: number;
  points: number;
  position: number;
  wins: number;
}
export interface PitStopRow {
  raceId: number;
  driverId: number;
  stop: number;
  lap: number;
  time: string;
  durationSeconds: number | null;
}

export interface Dataset {
  version: string;
  drivers: DriverRow[];
  driverById: Map<number, DriverRow>;
  driverByRef: Map<string, DriverRow>;
  driverByCode: Map<string, DriverRow>;
  constructors: ConstructorRow[];
  constructorById: Map<number, ConstructorRow>;
  constructorByRef: Map<string, ConstructorRow>;
  circuits: CircuitRow[];
  circuitById: Map<number, CircuitRow>;
  circuitByRef: Map<string, CircuitRow>;
  /** chronological */
  races: RaceRow[];
  raceById: Map<number, RaceRow>;
  racesByYear: Map<number, RaceRow[]>;
  racesByCircuit: Map<number, RaceRow[]>;
  /** years that have at least one classified result */
  years: number[];
  latestYear: number;
  firstYear: number;
  results: ResultRow[];
  resultsByDriver: Map<number, ResultRow[]>;
  resultsByConstructor: Map<number, ResultRow[]>;
  resultsByRace: Map<number, ResultRow[]>;
  qualifying: QualiRow[];
  qualiByRace: Map<number, QualiRow[]>;
  sprintResults: RawRow[];
  statusById: Map<number, string>;
  driverStandings: StandingRow[];
  constructorStandings: StandingRow[];
  /** last race of each season that has driver standings */
  finalRaceByYear: Map<number, number>;
  /** pole-sitter per race (qualifying P1, otherwise starting grid P1) */
  poleByRace: Map<number, { driverId: number; constructorId: number }>;
  /** champion per season (final driver / constructor standings, position 1) */
  driverChampionByYear: Map<number, number>;
  constructorChampionByYear: Map<number, number>;
  pitStops: PitStopRow[];
}

export const CORE_FILES = [
  "drivers.csv",
  "constructors.csv",
  "circuits.csv",
  "races.csv",
  "results.csv",
  "qualifying.csv",
  "sprint_results.csv",
  "status.csv",
  "driver_standings.csv",
  "constructor_standings.csv",
  "pit_stops.csv",
];

function groupBy<T, K>(rows: T[], key: (r: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const r of rows) {
    const k = key(r);
    const arr = m.get(k);
    if (arr) arr.push(r);
    else m.set(k, [r]);
  }
  return m;
}

function buildDataset(): Dataset {
  const drivers: DriverRow[] = readTable("drivers.csv")
    .filter((r) => r.driverId !== null && r.driverId !== undefined)
    .map((r) => {
      const surname = str(r.surname);
      const forename = str(r.forename);
      return {
        driverId: Number(r.driverId),
        driverRef: str(r.driverRef),
        number: num(r.number),
        code: str(r.code) ? str(r.code).toUpperCase() : surname.substring(0, 3).toUpperCase() || "DRV",
        forename,
        surname,
        fullName: `${forename} ${surname}`.trim(),
        dob: str(r.dob) || null,
        nationality: str(r.nationality),
        url: str(r.url),
      };
    });

  const constructors: ConstructorRow[] = readTable("constructors.csv")
    .filter((r) => r.constructorId !== null && r.constructorId !== undefined)
    .map((r) => ({
      constructorId: Number(r.constructorId),
      constructorRef: str(r.constructorRef).toLowerCase(),
      name: str(r.name),
      nationality: str(r.nationality),
      url: str(r.url),
    }));

  const circuits: CircuitRow[] = readTable("circuits.csv")
    .filter((r) => r.circuitId !== null && r.circuitId !== undefined)
    .map((r) => ({
      circuitId: Number(r.circuitId),
      circuitRef: str(r.circuitRef),
      name: str(r.name),
      location: str(r.location),
      country: str(r.country),
      lat: num(r.lat),
      lng: num(r.lng),
      alt: num(r.alt),
      url: str(r.url),
    }));

  const races: RaceRow[] = readTable("races.csv")
    .filter((r) => r.raceId !== null && r.raceId !== undefined)
    .map((r) => ({
      raceId: Number(r.raceId),
      year: Number(r.year),
      round: Number(r.round),
      circuitId: Number(r.circuitId),
      name: str(r.name),
      date: str(r.date),
      time: str(r.time) || null,
      url: str(r.url),
      hasSprint: Boolean(str(r.sprint_date)),
    }))
    .sort((a, b) => (a.date === b.date ? a.round - b.round : a.date < b.date ? -1 : 1));

  const results: ResultRow[] = readTable("results.csv")
    .filter((r) => r.raceId !== null && r.driverId !== null)
    .map((r) => ({
      resultId: Number(r.resultId),
      raceId: Number(r.raceId),
      driverId: Number(r.driverId),
      constructorId: Number(r.constructorId),
      number: num(r.number),
      grid: num(r.grid) ?? 0,
      position: num(r.position),
      positionText: str(r.positionText),
      positionOrder: num(r.positionOrder) ?? 99,
      points: num(r.points) ?? 0,
      laps: num(r.laps) ?? 0,
      time: str(r.time) || null,
      milliseconds: num(r.milliseconds),
      fastestLap: num(r.fastestLap),
      rank: num(r.rank),
      fastestLapTime: str(r.fastestLapTime) || null,
      fastestLapSpeed: num(r.fastestLapSpeed),
      statusId: num(r.statusId) ?? 0,
    }));

  const qualifying: QualiRow[] = readTable("qualifying.csv")
    .filter((r) => r.raceId !== null && r.driverId !== null)
    .map((r) => ({
      qualifyId: Number(r.qualifyId),
      raceId: Number(r.raceId),
      driverId: Number(r.driverId),
      constructorId: Number(r.constructorId),
      number: num(r.number),
      position: num(r.position) ?? 99,
      q1: str(r.q1) || null,
      q2: str(r.q2) || null,
      q3: str(r.q3) || null,
    }));

  const statusById = new Map<number, string>();
  readTable("status.csv").forEach((r) => {
    if (r.statusId !== null && r.statusId !== undefined) statusById.set(Number(r.statusId), str(r.status));
  });

  const driverStandings: StandingRow[] = readTable("driver_standings.csv")
    .filter((r) => r.raceId !== null && r.driverId !== null)
    .map((r) => ({
      raceId: Number(r.raceId),
      driverId: Number(r.driverId),
      points: num(r.points) ?? 0,
      position: num(r.position) ?? 99,
      wins: num(r.wins) ?? 0,
    }));

  const constructorStandings: StandingRow[] = readTable("constructor_standings.csv")
    .filter((r) => r.raceId !== null && r.constructorId !== null)
    .map((r) => ({
      raceId: Number(r.raceId),
      constructorId: Number(r.constructorId),
      points: num(r.points) ?? 0,
      position: num(r.position) ?? 99,
      wins: num(r.wins) ?? 0,
    }));

  const pitStops: PitStopRow[] = readTable("pit_stops.csv")
    .filter((r) => r.raceId !== null && r.driverId !== null)
    .map((r) => {
      const ms = num(r.milliseconds);
      const dur = num(r.duration);
      return {
        raceId: Number(r.raceId),
        driverId: Number(r.driverId),
        stop: num(r.stop) ?? 0,
        lap: num(r.lap) ?? 0,
        time: str(r.time),
        durationSeconds: dur !== null ? dur : ms !== null ? ms / 1000 : null,
      };
    });

  // -- indexes -----------------------------------------------------------------------
  const driverById = new Map(drivers.map((d) => [d.driverId, d]));
  const driverByRef = new Map(drivers.map((d) => [d.driverRef.toLowerCase(), d]));
  const driverByCode = new Map<string, DriverRow>();
  drivers.forEach((d) => {
    const prev = driverByCode.get(d.code);
    // when a code is shared prefer the higher driverId (more recent driver)
    if (!prev || d.driverId > prev.driverId) driverByCode.set(d.code, d);
  });
  const constructorById = new Map(constructors.map((c) => [c.constructorId, c]));
  const constructorByRef = new Map(constructors.map((c) => [c.constructorRef, c]));
  const circuitById = new Map(circuits.map((c) => [c.circuitId, c]));
  const circuitByRef = new Map(circuits.map((c) => [c.circuitRef.toLowerCase(), c]));
  const raceById = new Map(races.map((r) => [r.raceId, r]));
  const racesByYear = groupBy(races, (r) => r.year);
  racesByYear.forEach((arr) => arr.sort((a, b) => a.round - b.round));
  const racesByCircuit = groupBy(races, (r) => r.circuitId);

  const resultsByDriver = groupBy(results, (r) => r.driverId);
  const resultsByConstructor = groupBy(results, (r) => r.constructorId);
  const resultsByRace = groupBy(results, (r) => r.raceId);
  const qualiByRace = groupBy(qualifying, (q) => q.raceId);

  const raceIdsWithResults = new Set(resultsByRace.keys());
  const years = Array.from(
    new Set(races.filter((r) => raceIdsWithResults.has(r.raceId)).map((r) => r.year))
  ).sort((a, b) => a - b);
  const latestYear = years.length ? years[years.length - 1] : new Date().getFullYear();
  const firstYear = years.length ? years[0] : latestYear;

  // final race per season = last round that has driver standings
  const raceIdsWithStandings = new Set(driverStandings.map((s) => s.raceId));
  const finalRaceByYear = new Map<number, number>();
  racesByYear.forEach((arr, year) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (raceIdsWithStandings.has(arr[i].raceId)) {
        finalRaceByYear.set(year, arr[i].raceId);
        break;
      }
    }
  });

  const driverChampionByYear = new Map<number, number>();
  const constructorChampionByYear = new Map<number, number>();
  const finalIds = new Set(finalRaceByYear.values());
  const yearOfRace = (raceId: number) => raceById.get(raceId)?.year;
  driverStandings.forEach((s) => {
    if (s.position === 1 && finalIds.has(s.raceId)) {
      const y = yearOfRace(s.raceId);
      if (y !== undefined) driverChampionByYear.set(y, s.driverId!);
    }
  });
  const raceIdsWithCStandings = new Set(constructorStandings.map((s) => s.raceId));
  const finalCRaceByYear = new Map<number, number>();
  racesByYear.forEach((arr, year) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (raceIdsWithCStandings.has(arr[i].raceId)) {
        finalCRaceByYear.set(year, arr[i].raceId);
        break;
      }
    }
  });
  const finalCIds = new Set(finalCRaceByYear.values());
  constructorStandings.forEach((s) => {
    if (s.position === 1 && finalCIds.has(s.raceId)) {
      const y = yearOfRace(s.raceId);
      if (y !== undefined) constructorChampionByYear.set(y, s.constructorId!);
    }
  });

  // pole sitters: qualifying P1 where available, starting grid P1 otherwise
  const poleByRace = new Map<number, { driverId: number; constructorId: number }>();
  qualiByRace.forEach((rows, raceId) => {
    const p1 = rows.find((q) => q.position === 1);
    if (p1) poleByRace.set(raceId, { driverId: p1.driverId, constructorId: p1.constructorId });
  });
  resultsByRace.forEach((rows, raceId) => {
    if (poleByRace.has(raceId)) return;
    const p1 = rows.find((r) => r.grid === 1);
    if (p1) poleByRace.set(raceId, { driverId: p1.driverId, constructorId: p1.constructorId });
  });

  return {
    version: stampOf(CORE_FILES),
    drivers,
    driverById,
    driverByRef,
    driverByCode,
    constructors,
    constructorById,
    constructorByRef,
    circuits,
    circuitById,
    circuitByRef,
    races,
    raceById,
    racesByYear,
    racesByCircuit,
    years,
    latestYear,
    firstYear,
    results,
    resultsByDriver,
    resultsByConstructor,
    resultsByRace,
    qualifying,
    qualiByRace,
    sprintResults: readTable("sprint_results.csv"),
    statusById,
    driverStandings,
    constructorStandings,
    finalRaceByYear,
    poleByRace,
    driverChampionByYear,
    constructorChampionByYear,
    pitStops,
  };
}

/** The fully indexed core dataset (cached, auto-refreshing). */
export function getDataset(): Dataset {
  return memo("dataset", CORE_FILES, buildDataset);
}

// ---------------------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------------------
/** Classified = "Finished" or lapped ("+1 Lap"). Everything else is a non-finish. */
export function isClassifiedStatus(status: string | undefined): boolean {
  if (!status) return true;
  const s = status.toLowerCase();
  return s.includes("finished") || s.includes("+") || s.includes("lap");
}

export function isFinished(ds: Dataset, r: ResultRow): boolean {
  return isClassifiedStatus(ds.statusById.get(r.statusId));
}

export function formatLapMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return "--";
  const minutes = Math.floor(ms / 60000);
  const seconds = (ms - minutes * 60000) / 1000;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds.toFixed(3)}`;
}

export function parseLapTime(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d+):(\d{1,2})\.(\d{1,3})$/.exec(t.trim());
  if (!m) return null;
  return Number(m[1]) * 60000 + Number(m[2]) * 1000 + Number(m[3].padEnd(3, "0"));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function avg(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

// ---------------------------------------------------------------------------------------
// Lap-time index (lap_times.csv is ~590k rows -> kept in compact typed arrays per race)
// ---------------------------------------------------------------------------------------
export interface RaceLaps {
  driverId: Int32Array;
  lap: Int16Array;
  position: Int16Array;
  ms: Int32Array;
  length: number;
}

export function getLapIndex(): Map<number, RaceLaps> {
  return memo("lapIndex", ["lap_times.csv"], () => {
    const out = new Map<number, RaceLaps>();
    const full = path.join(DATA_DIR, "lap_times.csv");
    if (!fs.existsSync(full)) return out;

    const content = fs.readFileSync(full, "utf-8");
    const buckets = new Map<number, number[]>();
    let start = content.indexOf("\n") + 1; // skip header
    const len = content.length;
    while (start < len) {
      let end = content.indexOf("\n", start);
      if (end === -1) end = len;
      if (end > start) {
        const line = content.slice(start, end);
        const p = line.split(",");
        if (p.length >= 6) {
          const raceId = Number(p[0]);
          const ms = Number(p[5]);
          if (Number.isFinite(raceId) && Number.isFinite(ms)) {
            let arr = buckets.get(raceId);
            if (!arr) {
              arr = [];
              buckets.set(raceId, arr);
            }
            arr.push(Number(p[1]), Number(p[2]), Number(p[3]), ms);
          }
        }
      }
      start = end + 1;
    }

    buckets.forEach((arr, raceId) => {
      const n = arr.length / 4;
      const rl: RaceLaps = {
        driverId: new Int32Array(n),
        lap: new Int16Array(n),
        position: new Int16Array(n),
        ms: new Int32Array(n),
        length: n,
      };
      for (let i = 0; i < n; i++) {
        rl.driverId[i] = arr[i * 4];
        rl.lap[i] = arr[i * 4 + 1];
        rl.position[i] = arr[i * 4 + 2];
        rl.ms[i] = arr[i * 4 + 3];
      }
      out.set(raceId, rl);
    });
    return out;
  });
}

/** Fastest recorded lap in every race that has lap_times data. */
export function getRaceFastestLaps(): Map<number, { ms: number; driverId: number; lap: number }> {
  return memo("raceFastestLaps", ["lap_times.csv"], () => {
    const out = new Map<number, { ms: number; driverId: number; lap: number }>();
    getLapIndex().forEach((rl, raceId) => {
      let best = -1;
      for (let i = 0; i < rl.length; i++) {
        if (rl.ms[i] > 0 && (best === -1 || rl.ms[i] < rl.ms[best])) best = i;
      }
      if (best >= 0) out.set(raceId, { ms: rl.ms[best], driverId: rl.driverId[best], lap: rl.lap[best] });
    });
    return out;
  });
}
