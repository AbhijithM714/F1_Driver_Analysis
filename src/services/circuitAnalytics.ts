/**
 * Circuit analytics service
 * -------------------------
 * Dynamic circuit catalog, historical winners, constructor records,
 * and track profile using circuits.csv, races.csv, results.csv, and track_maps.json.
 */
import {
  CORE_FILES,
  CircuitRow,
  formatLapMs,
  getDataset,
  getLapIndex,
  memo,
  readJsonFile,
} from "./dataStore";
import { flagForNationality } from "@/lib/flags";
import { getTeamColor } from "@/lib/f1Themes";

export interface CircuitSummary {
  circuitId: number;
  circuitRef: string;
  name: string;
  location: string;
  country: string;
  flag: string;
  lat: number | null;
  lng: number | null;
  alt: number | null;
  url: string;
  totalRaces: number;
  firstGrandPrixYear: number | null;
  latestGrandPrixYear: number | null;
  lengthKm: number | null;
  turns: number | null;
  drsZones: number | null;
  lapRecord: {
    time: string;
    ms: number;
    driverName: string;
    driverCode: string;
    constructorName: string;
    year: number;
  } | null;
  mostSuccessfulDriver: {
    driverId: number;
    name: string;
    code: string;
    wins: number;
  } | null;
  mostSuccessfulConstructor: {
    constructorId: number;
    name: string;
    color: string;
    wins: number;
  } | null;
}

export interface CircuitProfileData {
  circuit: CircuitSummary;
  races: {
    raceId: number;
    year: number;
    round: number;
    name: string;
    date: string;
    winner: {
      driverId: number;
      name: string;
      code: string;
      constructorName: string;
      teamColor: string;
      time: string;
      grid: number;
    } | null;
    pole: {
      driverId: number;
      name: string;
      code: string;
    } | null;
  }[];
  driverLeaderboard: {
    driverId: number;
    name: string;
    code: string;
    flag: string;
    wins: number;
    podiums: number;
    starts: number;
    poles: number;
  }[];
  constructorLeaderboard: {
    constructorId: number;
    name: string;
    color: string;
    wins: number;
    podiums: number;
    starts: number;
  }[];
  trackGeometry: any | null;
}

export function getAllCircuitSummaries(): CircuitSummary[] {
  return memo("allCircuitSummaries", CORE_FILES, () => {
    const ds = getDataset();
    const trackMaps = readJsonFile<Record<string, any>>("track_maps.json") || {};
    const lapIndex = getLapIndex();

    return ds.circuits.map((circ) => {
      const races = ds.racesByCircuit.get(circ.circuitId) || [];
      const sortedRaces = [...races].sort((a, b) => a.year - b.year || a.round - b.round);
      const firstGrandPrixYear = sortedRaces.length > 0 ? sortedRaces[0].year : null;
      const latestGrandPrixYear = sortedRaces.length > 0 ? sortedRaces[sortedRaces.length - 1].year : null;

      const tm = trackMaps[circ.circuitRef.toLowerCase()];

      // Tally wins per driver & constructor at this circuit
      const driverWins = new Map<number, number>();
      const constructorWins = new Map<number, number>();

      races.forEach((r) => {
        const res = ds.resultsByRace.get(r.raceId) || [];
        const win = res.find((row) => row.position === 1);
        if (win) {
          driverWins.set(win.driverId, (driverWins.get(win.driverId) || 0) + 1);
          constructorWins.set(win.constructorId, (constructorWins.get(win.constructorId) || 0) + 1);
        }
      });

      // Best driver
      let topDriver: { driverId: number; name: string; code: string; wins: number } | null = null;
      let maxDWins = 0;
      driverWins.forEach((wins, dId) => {
        if (wins > maxDWins) {
          maxDWins = wins;
          const d = ds.driverById.get(dId);
          topDriver = {
            driverId: dId,
            name: d?.fullName || "Driver",
            code: d?.code || "DRV",
            wins,
          };
        }
      });

      // Best constructor
      let topConstructor: { constructorId: number; name: string; color: string; wins: number } | null = null;
      let maxCWins = 0;
      constructorWins.forEach((wins, cId) => {
        if (wins > maxCWins) {
          maxCWins = wins;
          const c = ds.constructorById.get(cId);
          topConstructor = {
            constructorId: cId,
            name: c?.name || "Constructor",
            color: getTeamColor(c?.constructorRef),
            wins,
          };
        }
      });

      // Fastest lap recorded at this circuit
      let bestLap: {
        time: string;
        ms: number;
        driverName: string;
        driverCode: string;
        constructorName: string;
        year: number;
      } | null = null;

      races.forEach((r) => {
        const rl = lapIndex.get(r.raceId);
        if (rl) {
          for (let i = 0; i < rl.length; i++) {
            const ms = rl.ms[i];
            if (ms > 40000 && ms < 300000) {
              if (!bestLap || ms < bestLap.ms) {
                const d = ds.driverById.get(rl.driverId[i]);
                const res = (ds.resultsByRace.get(r.raceId) || []).find((row) => row.driverId === rl.driverId[i]);
                const c = res ? ds.constructorById.get(res.constructorId) : null;
                bestLap = {
                  time: formatLapMs(ms),
                  ms,
                  driverName: d?.fullName || "Driver",
                  driverCode: d?.code || "DRV",
                  constructorName: c?.name || "Constructor",
                  year: r.year,
                };
              }
            }
          }
        }
      });

      return {
        circuitId: circ.circuitId,
        circuitRef: circ.circuitRef,
        name: circ.name,
        location: circ.location,
        country: circ.country,
        flag: flagForNationality(circ.country),
        lat: circ.lat,
        lng: circ.lng,
        alt: circ.alt,
        url: circ.url,
        totalRaces: races.length,
        firstGrandPrixYear,
        latestGrandPrixYear,
        lengthKm: tm?.lengthKm ?? null,
        turns: tm?.turns ?? null,
        drsZones: tm?.drsZones ?? null,
        lapRecord: bestLap,
        mostSuccessfulDriver: topDriver,
        mostSuccessfulConstructor: topConstructor,
      };
    }).sort((a, b) => b.totalRaces - a.totalRaces);
  });
}

export function resolveCircuit(idOrRef: string): CircuitRow | null {
  const ds = getDataset();
  const key = idOrRef.toLowerCase().trim();
  if (/^\d+$/.test(key)) return ds.circuitById.get(Number(key)) || null;
  return ds.circuitByRef.get(key) || null;
}

export function getCircuitProfile(circuitIdOrRef: number | string): CircuitProfileData | null {
  const row = typeof circuitIdOrRef === "number" ? getDataset().circuitById.get(circuitIdOrRef) : resolveCircuit(circuitIdOrRef);
  if (!row) return null;
  const circuitId = row.circuitId;
  const summaries = getAllCircuitSummaries();
  const summary = summaries.find((s) => s.circuitId === circuitId);
  if (!summary) return null;

  const ds = getDataset();
  const races = (ds.racesByCircuit.get(circuitId) || []).sort((a, b) => b.year - a.year || b.round - a.round);
  const trackMaps = readJsonFile<Record<string, any>>("track_maps.json") || {};
  const trackGeometry = trackMaps[summary.circuitRef.toLowerCase()] || null;

  // Race history
  const raceHistory = races.map((r) => {
    const res = ds.resultsByRace.get(r.raceId) || [];
    const winnerRow = res.find((row) => row.position === 1);
    const wDriver = winnerRow ? ds.driverById.get(winnerRow.driverId) : null;
    const wConstructor = winnerRow ? ds.constructorById.get(winnerRow.constructorId) : null;

    const poleEntry = ds.poleByRace.get(r.raceId);
    const poleDriver = poleEntry ? ds.driverById.get(poleEntry.driverId) : null;

    return {
      raceId: r.raceId,
      year: r.year,
      round: r.round,
      name: r.name,
      date: r.date,
      winner: winnerRow
        ? {
            driverId: winnerRow.driverId,
            name: wDriver?.fullName || "Driver",
            code: wDriver?.code || "DRV",
            constructorName: wConstructor?.name || "Constructor",
            teamColor: getTeamColor(wConstructor?.constructorRef),
            time: winnerRow.time || "Finished",
            grid: winnerRow.grid,
          }
        : null,
      pole: poleDriver
        ? {
            driverId: poleDriver.driverId,
            name: poleDriver.fullName,
            code: poleDriver.code,
          }
        : null,
    };
  });

  // Driver leaderboard at this track
  const dStats = new Map<number, { wins: number; podiums: number; starts: number; poles: number }>();
  // Constructor leaderboard
  const cStats = new Map<number, { wins: number; podiums: number; starts: number }>();

  races.forEach((r) => {
    const res = ds.resultsByRace.get(r.raceId) || [];
    const pole = ds.poleByRace.get(r.raceId);

    res.forEach((row) => {
      const d = dStats.get(row.driverId) || { wins: 0, podiums: 0, starts: 0, poles: 0 };
      d.starts++;
      if (row.position === 1) d.wins++;
      if (row.position !== null && row.position >= 1 && row.position <= 3) d.podiums++;
      if (pole && pole.driverId === row.driverId) d.poles++;
      dStats.set(row.driverId, d);

      const c = cStats.get(row.constructorId) || { wins: 0, podiums: 0, starts: 0 };
      c.starts++;
      if (row.position === 1) c.wins++;
      if (row.position !== null && row.position >= 1 && row.position <= 3) c.podiums++;
      cStats.set(row.constructorId, c);
    });
  });

  const driverLeaderboard = [...dStats.entries()]
    .map(([dId, stats]) => {
      const d = ds.driverById.get(dId);
      return {
        driverId: dId,
        name: d?.fullName || `Driver #${dId}`,
        code: d?.code || "DRV",
        flag: flagForNationality(d?.nationality || ""),
        ...stats,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || b.starts - a.starts)
    .slice(0, 15);

  const constructorLeaderboard = [...cStats.entries()]
    .map(([cId, stats]) => {
      const c = ds.constructorById.get(cId);
      return {
        constructorId: cId,
        name: c?.name || `Constructor #${cId}`,
        color: getTeamColor(c?.constructorRef),
        ...stats,
      };
    })
    .sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || b.starts - a.starts)
    .slice(0, 15);

  return {
    circuit: summary,
    races: raceHistory,
    driverLeaderboard,
    constructorLeaderboard,
    trackGeometry,
  };
}

