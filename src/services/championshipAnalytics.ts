/**
 * Championship analytics service
 * ------------------------------
 * Dynamic championship standings, round-by-round progression,
 * season titles, mathematical title clinching, and season metadata.
 */
import {
  CORE_FILES,
  getDataset,
  memo,
} from "./dataStore";
import { flagForNationality } from "@/lib/flags";
import { getTeamColor } from "@/lib/f1Themes";

export interface DriverStandingEntry {
  driverId: number;
  driverRef: string;
  driverName: string;
  code: string;
  nationality: string;
  flag: string;
  constructorId: number;
  constructorName: string;
  teamColor: string;
  points: number;
  position: number;
  wins: number;
}

export interface ConstructorStandingEntry {
  constructorId: number;
  constructorRef: string;
  constructorName: string;
  nationality: string;
  teamColor: string;
  points: number;
  position: number;
  wins: number;
}

export interface ChampionshipStandingsResult {
  year: number;
  drivers: DriverStandingEntry[];
  constructors: ConstructorStandingEntry[];
  lastRace: {
    raceId: number;
    year: number;
    round: number;
    name: string;
    date: string;
  } | null;
  seasonSummary: {
    totalRaces: number;
    completedRaces: number;
    remainingRaces: number;
    maxPointsRemaining: number;
    isFinished: boolean;
    leaderGap: number;
  };
}

export interface ProgressionSeries {
  driverId?: number;
  constructorId?: number;
  name: string;
  code?: string;
  color?: string;
  data: number[];
}

export interface ChampionshipProgressionResult {
  rounds: string[];
  roundNames: string[];
  drivers: ProgressionSeries[];
  constructors: ProgressionSeries[];
}

export interface SeasonInfo {
  year: number;
  totalRaces: number;
  driverChampion: { driverId: number; name: string } | null;
  constructorChampion: { constructorId: number; name: string } | null;
}

export function getAvailableSeasons(): SeasonInfo[] {
  return memo("availableSeasons", CORE_FILES, () => {
    const ds = getDataset();
    return [...ds.years].sort((a, b) => b - a).map((year) => {
      const races = ds.racesByYear.get(year) || [];
      const dChampId = ds.driverChampionByYear.get(year);
      const cChampId = ds.constructorChampionByYear.get(year);

      const dChamp = dChampId ? ds.driverById.get(dChampId) : null;
      const cChamp = cChampId ? ds.constructorById.get(cChampId) : null;

      return {
        year,
        totalRaces: races.length,
        driverChampion: dChamp ? { driverId: dChamp.driverId, name: dChamp.fullName } : null,
        constructorChampion: cChamp ? { constructorId: cChamp.constructorId, name: cChamp.name } : null,
      };
    });
  });
}

export function calculateChampionshipStandings(year: number): ChampionshipStandingsResult {
  const ds = getDataset();
  const races = ds.racesByYear.get(year) || [];
  if (races.length === 0) {
    return {
      year,
      drivers: [],
      constructors: [],
      lastRace: null,
      seasonSummary: {
        totalRaces: 0,
        completedRaces: 0,
        remainingRaces: 0,
        maxPointsRemaining: 0,
        isFinished: false,
        leaderGap: 0,
      },
    };
  }

  // Find last race with standings or results
  const racesWithStandings = races.filter((r) => {
    return (
      ds.driverStandings.some((s) => s.raceId === r.raceId) ||
      (ds.resultsByRace.get(r.raceId) || []).length > 0
    );
  });

  const lastRace = racesWithStandings.length > 0 ? racesWithStandings[racesWithStandings.length - 1] : races[races.length - 1];
  const lastRaceId = lastRace.raceId;

  // Driver standings
  const rawDriverStandings = ds.driverStandings.filter((s) => s.raceId === lastRaceId);
  const driverEntries: DriverStandingEntry[] = [];

  if (rawDriverStandings.length > 0) {
    rawDriverStandings.forEach((s) => {
      const driver = s.driverId ? ds.driverById.get(s.driverId) : null;
      if (!driver) return;

      // Find driver's constructor in this race or latest in this year
      let constructorId = 0;
      let constructorName = "Unknown";
      let constructorRef = "";
      const raceResults = ds.resultsByRace.get(lastRaceId) || [];
      const driverResult = raceResults.find((r) => r.driverId === driver.driverId);

      if (driverResult) {
        constructorId = driverResult.constructorId;
        const c = ds.constructorById.get(constructorId);
        if (c) {
          constructorName = c.name;
          constructorRef = c.constructorRef;
        }
      } else {
        // Fallback to latest constructor in this year
        for (let i = racesWithStandings.length - 1; i >= 0; i--) {
          const pastRes = (ds.resultsByRace.get(racesWithStandings[i].raceId) || []).find(
            (r) => r.driverId === driver.driverId
          );
          if (pastRes) {
            constructorId = pastRes.constructorId;
            const c = ds.constructorById.get(constructorId);
            if (c) {
              constructorName = c.name;
              constructorRef = c.constructorRef;
            }
            break;
          }
        }
      }

      driverEntries.push({
        driverId: driver.driverId,
        driverRef: driver.driverRef,
        driverName: driver.fullName,
        code: driver.code || driver.surname.substring(0, 3).toUpperCase(),
        nationality: driver.nationality,
        flag: flagForNationality(driver.nationality),
        constructorId,
        constructorName,
        teamColor: getTeamColor(constructorRef),
        points: s.points,
        position: s.position,
        wins: s.wins,
      });
    });
  } else {
    // If no explicit driver_standings for this race, accumulate points from results
    const driverPointsMap = new Map<number, { points: number; wins: number }>();
    racesWithStandings.forEach((r) => {
      const res = ds.resultsByRace.get(r.raceId) || [];
      res.forEach((row) => {
        const cur = driverPointsMap.get(row.driverId) || { points: 0, wins: 0 };
        cur.points += row.points;
        if (row.position === 1) cur.wins += 1;
        driverPointsMap.set(row.driverId, cur);
      });
    });

    const sortedDrivers = Array.from(driverPointsMap.entries()).sort((a, b) => b[1].points - a[1].points || b[1].wins - a[1].wins);
    sortedDrivers.forEach(([dId, stats], idx) => {
      const driver = ds.driverById.get(dId);
      if (!driver) return;
      driverEntries.push({
        driverId: driver.driverId,
        driverRef: driver.driverRef,
        driverName: driver.fullName,
        code: driver.code || driver.surname.substring(0, 3).toUpperCase(),
        nationality: driver.nationality,
        flag: flagForNationality(driver.nationality),
        constructorId: 0,
        constructorName: "F1 Team",
        teamColor: "#E10600",
        points: Math.round(stats.points * 10) / 10,
        position: idx + 1,
        wins: stats.wins,
      });
    });
  }

  driverEntries.sort((a, b) => a.position - b.position);

  // Constructor standings
  const rawConstructorStandings = ds.constructorStandings.filter((s) => s.raceId === lastRaceId);
  const constructorEntries: ConstructorStandingEntry[] = [];

  if (rawConstructorStandings.length > 0) {
    rawConstructorStandings.forEach((s) => {
      const c = s.constructorId ? ds.constructorById.get(s.constructorId) : null;
      if (!c) return;
      constructorEntries.push({
        constructorId: c.constructorId,
        constructorRef: c.constructorRef,
        constructorName: c.name,
        nationality: c.nationality,
        teamColor: getTeamColor(c.constructorRef),
        points: s.points,
        position: s.position,
        wins: s.wins,
      });
    });
  } else {
    // Accumulate from results
    const cPointsMap = new Map<number, { points: number; wins: number }>();
    racesWithStandings.forEach((r) => {
      const res = ds.resultsByRace.get(r.raceId) || [];
      res.forEach((row) => {
        const cur = cPointsMap.get(row.constructorId) || { points: 0, wins: 0 };
        cur.points += row.points;
        if (row.position === 1) cur.wins += 1;
        cPointsMap.set(row.constructorId, cur);
      });
    });

    const sortedTeams = Array.from(cPointsMap.entries()).sort((a, b) => b[1].points - a[1].points || b[1].wins - a[1].wins);
    sortedTeams.forEach(([cId, stats], idx) => {
      const c = ds.constructorById.get(cId);
      if (!c) return;
      constructorEntries.push({
        constructorId: c.constructorId,
        constructorRef: c.constructorRef,
        constructorName: c.name,
        nationality: c.nationality,
        teamColor: getTeamColor(c.constructorRef),
        points: Math.round(stats.points * 10) / 10,
        position: idx + 1,
        wins: stats.wins,
      });
    });
  }

  constructorEntries.sort((a, b) => a.position - b.position);

  const completedRaces = racesWithStandings.length;
  const totalRaces = races.length;
  const remainingRaces = Math.max(0, totalRaces - completedRaces);

  // Calculate max points remaining in season:
  // After 2019: 25 win + 1 fastest lap = 26 per GP + 8 sprint if sprint race
  // Prior to 2010: different points system, but for remaining races (modern era):
  let maxPointsRemaining = 0;
  for (let i = completedRaces; i < totalRaces; i++) {
    const r = races[i];
    maxPointsRemaining += 26; // 25 + 1
    if (r.hasSprint) maxPointsRemaining += 8;
  }

  const leaderPoints = driverEntries[0]?.points || 0;
  const secondPoints = driverEntries[1]?.points || 0;
  const leaderGap = Math.round((leaderPoints - secondPoints) * 10) / 10;
  const isFinished = remainingRaces === 0;

  return {
    year,
    drivers: driverEntries,
    constructors: constructorEntries,
    lastRace: lastRace
      ? {
          raceId: lastRace.raceId,
          year: lastRace.year,
          round: lastRace.round,
          name: lastRace.name,
          date: lastRace.date,
        }
      : null,
    seasonSummary: {
      totalRaces,
      completedRaces,
      remainingRaces,
      maxPointsRemaining,
      isFinished,
      leaderGap,
    },
  };
}

export function calculateChampionshipProgression(year: number): ChampionshipProgressionResult {
  const ds = getDataset();
  const races = (ds.racesByYear.get(year) || []).sort((a, b) => a.round - b.round);
  if (races.length === 0) {
    return { rounds: [], roundNames: [], drivers: [], constructors: [] };
  }

  const standings = calculateChampionshipStandings(year);
  const topDrivers = standings.drivers.slice(0, 8);
  const topConstructors = standings.constructors.slice(0, 8);

  const driverStandingsByRace = new Map<number, Map<number, number>>();
  ds.driverStandings.forEach((s) => {
    if (!s.driverId) return;
    let m = driverStandingsByRace.get(s.raceId);
    if (!m) {
      m = new Map();
      driverStandingsByRace.set(s.raceId, m);
    }
    m.set(s.driverId, s.points);
  });

  const constructorStandingsByRace = new Map<number, Map<number, number>>();
  ds.constructorStandings.forEach((s) => {
    if (!s.constructorId) return;
    let m = constructorStandingsByRace.get(s.raceId);
    if (!m) {
      m = new Map();
      constructorStandingsByRace.set(s.raceId, m);
    }
    m.set(s.constructorId, s.points);
  });

  // Build progression series
  const driverSeries: ProgressionSeries[] = topDrivers.map((d) => {
    let lastKnown = 0;
    const data = races.map((r) => {
      const racePts = driverStandingsByRace.get(r.raceId)?.get(d.driverId);
      if (racePts !== undefined) {
        lastKnown = racePts;
      }
      return lastKnown;
    });

    return {
      driverId: d.driverId,
      name: d.driverName,
      code: d.code,
      color: d.teamColor,
      data,
    };
  });

  const constructorSeries: ProgressionSeries[] = topConstructors.map((c) => {
    let lastKnown = 0;
    const data = races.map((r) => {
      const racePts = constructorStandingsByRace.get(r.raceId)?.get(c.constructorId);
      if (racePts !== undefined) {
        lastKnown = racePts;
      }
      return lastKnown;
    });

    return {
      constructorId: c.constructorId,
      name: c.constructorName,
      color: c.teamColor,
      data,
    };
  });

  return {
    rounds: races.map((r) => `R${r.round}`),
    roundNames: races.map((r) => r.name),
    drivers: driverSeries,
    constructors: constructorSeries,
  };
}

