/**
 * Formula 1 Data Service Facade
 * ------------------------------
 * High-level facade delegating to the specialized Analytics Service Layer.
 * Preserves legacy function signatures while powering them with dynamic data.
 */
import {
  getDataset,
  readJsonFile,
  readTable,
} from "@/services/dataStore";
import {
  calculateDriverCareerStats,
} from "@/services/driverAnalytics";
import {
  getConstructorSummaries,
} from "@/services/constructorAnalytics";
import {
  getAllCircuitSummaries,
} from "@/services/circuitAnalytics";
import {
  calculateChampionshipProgression,
  calculateChampionshipStandings,
} from "@/services/championshipAnalytics";
import {
  calculateLapProgression,
  calculateRaceSummary,
} from "@/services/raceAnalytics";
import {
  calculateHistoricalRecords,
} from "@/services/recordAnalytics";
import { flagForNationality } from "./flags";
import { getTeamColor } from "./f1Themes";

export function getStatusMap(): Record<string, string> {
  const ds = getDataset();
  const map: Record<string, string> = {};
  ds.statusById.forEach((val, key) => {
    map[String(key)] = val;
  });
  return map;
}

export function getAllConstructors() {
  const summaries = getConstructorSummaries();
  return summaries.map(({ constructor: c, stats, championships, titleYears, raceEntries }) => {
    return {
      constructorId: c.constructorId,
      constructorRef: c.constructorRef,
      name: c.name,
      nationality: c.nationality,
      flag: flagForNationality(c.nationality),
      url: c.url,
      color: getTeamColor(c.constructorRef),
      accentColor: "#E10600",
      totalWins: stats.wins,
      totalPodiums: stats.podiums,
      totalPoints: stats.points,
      totalStarts: stats.starts,
      totalDnfs: stats.dnfs,
      reliabilityScore: stats.reliabilityRate,
      isCurrentGrid: stats.lastYear === getDataset().latestYear,
      championships,
      titleYears,
      raceEntries,
      firstYear: stats.firstYear,
      lastYear: stats.lastYear,
    };
  });
}

export function getAllCircuits() {
  const summaries = getAllCircuitSummaries();
  return summaries.map((s) => ({
    circuitId: s.circuitId,
    circuitRef: s.circuitRef,
    name: s.name,
    location: s.location,
    country: s.country,
    flag: s.flag,
    lat: s.lat || 0,
    lng: s.lng || 0,
    alt: s.alt || 0,
    url: s.url,
    totalRaces: s.totalRaces,
    firstGrandPrixYear: s.firstGrandPrixYear,
    latestGrandPrixYear: s.latestGrandPrixYear,
    lengthKm: s.lengthKm,
    turns: s.turns,
    drsZones: s.drsZones,
    lapRecord: s.lapRecord,
  }));
}

export function getAllRaces(year?: number) {
  const ds = getDataset();
  const races = year ? ds.racesByYear.get(year) || [] : ds.races;

  return races.map((r) => {
    const c = ds.circuitById.get(r.circuitId);
    return {
      raceId: r.raceId,
      year: r.year,
      round: r.round,
      circuitId: r.circuitId,
      circuitName: c?.name || "Grand Prix Circuit",
      location: c?.location || "",
      country: c?.country || "",
      flag: flagForNationality(c?.country || ""),
      name: r.name,
      date: r.date,
      time: r.time || "",
      url: r.url,
      hasSprint: r.hasSprint,
    };
  });
}

export function getAllResults() {
  return getDataset().results;
}

export function getAllQualifying() {
  return getDataset().qualifying;
}

export function getAllPitStops() {
  return getDataset().pitStops;
}

export function getRaceOverview(raceId: number) {
  const summary = calculateRaceSummary(raceId);
  if (!summary) return null;

  return {
    race: summary.race,
    classification: summary.classification,
    totalLaps: summary.totalLaps,
    winner: summary.winner,
    podium: summary.podium,
    fastestLap: summary.fastestLap,
    pitStops: summary.pitStops.stops,
    totalPitStops: summary.pitStops.totalPitStops,
    averagePitDuration: summary.pitStops.averagePitDuration,
  };
}

export function getQualifyingResults(raceId: number) {
  const ds = getDataset();
  const qualiRows = ds.qualiByRace.get(raceId) || [];

  return qualiRows
    .map((q) => {
      const d = ds.driverById.get(q.driverId);
      const c = ds.constructorById.get(q.constructorId);
      return {
        qualifyId: q.qualifyId,
        raceId: q.raceId,
        driverId: q.driverId,
        driverRef: d?.driverRef || "",
        driverName: d?.fullName || `Driver #${q.driverId}`,
        code: d?.code || (d ? d.surname.substring(0, 3).toUpperCase() : "DRV"),
        flag: flagForNationality(d?.nationality || ""),
        constructorName: c?.name || "Constructor",
        teamColor: getTeamColor(c?.constructorRef),
        number: q.number,
        position: q.position,
        q1: q.q1,
        q2: q.q2,
        q3: q.q3,
      };
    })
    .sort((a, b) => a.position - b.position);
}

export function getChampionshipStandings(year: number) {
  return calculateChampionshipStandings(year);
}

export function getChampionshipProgression(year: number) {
  return calculateChampionshipProgression(year);
}

export function getHistoricalRecords() {
  return calculateHistoricalRecords();
}

export function getRaceLapTimes(raceId: number) {
  return calculateLapProgression(raceId);
}

export function getDriverCareerStats(driverId: number) {
  return calculateDriverCareerStats(driverId);
}

// Strict per-race filters for optional datasets (no fake fallback!)
export function getRaceWeather(raceId: number) {
  const rows = readTable("weather.csv");
  return rows.filter((r) => Number(r.raceId) === raceId);
}

export function getRaceEvents(raceId: number) {
  const scRows = readTable("safety_car_events.csv").filter((r) => Number(r.raceId) === raceId);
  const penRows = readTable("penalties.csv").filter((r) => Number(r.raceId) === raceId);
  return {
    safetyCars: scRows,
    penalties: penRows,
  };
}

export function getRaceSectors(raceId: number) {
  const rows = readTable("sector_times.csv");
  return rows.filter((r) => Number(r.raceId) === raceId);
}

export function getRaceDrs(raceId: number) {
  const rows = readTable("drs_usage.csv");
  return rows.filter((r) => Number(r.raceId) === raceId);
}

export function getTrackMaps() {
  return readJsonFile("track_maps.json");
}
