/**
 * Historical record analytics service
 * -----------------------------------
 * All-time milestones, streaks, youngest/oldest records, circuit lap records,
 * and championship counts generated 100% dynamically from CSV datasets.
 */
import {
  CORE_FILES,
  formatLapMs,
  getDataset,
  getLapIndex,
  memo,
  readJsonFile,
  readTable,
} from "./dataStore";
import { getPoleCounts } from "./aggregates";
import { flagForNationality } from "@/lib/flags";
import { getTeamColor } from "@/lib/f1Themes";

export interface DriverRecordEntry {
  driverId: number;
  driverRef: string;
  name: string;
  code: string;
  nationality: string;
  flag: string;
  count: number;
  percentage?: number;
}

export interface ConstructorRecordEntry {
  constructorId: number;
  constructorRef: string;
  name: string;
  nationality: string;
  color: string;
  count: number;
}

export interface StreakEntry {
  entityId: number;
  name: string;
  code?: string;
  flag?: string;
  color?: string;
  streak: number;
  startYear: number;
  endYear: number;
  startRace: string;
  endRace: string;
}

export interface AgeRecordEntry {
  driverId: number;
  name: string;
  code: string;
  flag: string;
  raceName: string;
  year: number;
  date: string;
  ageYears: number;
  ageDays: number;
  ageFormatted: string;
}

export interface DynamicCircuitRecord {
  circuitId: number;
  circuitRef: string;
  name: string;
  country: string;
  flag: string;
  lengthKm: number | null;
  turns: number | null;
  drsZones: number | null;
  lapRecord: string | null;
  lapRecordMs: number | null;
  recordHolder: string | null;
  recordYear: number | null;
  recordTeam: string | null;
  speedKmh: number | null;
}

export interface HistoricalRecordsData {
  topWins: DriverRecordEntry[];
  topPoles: DriverRecordEntry[];
  topPodiums: DriverRecordEntry[];
  topChampionships: DriverRecordEntry[];
  topStarts: DriverRecordEntry[];
  topFastestLaps: DriverRecordEntry[];
  topConstructorWins: ConstructorRecordEntry[];
  topConstructorChampionships: ConstructorRecordEntry[];
  longestWinStreaks: StreakEntry[];
  youngestWinners: AgeRecordEntry[];
  oldestWinners: AgeRecordEntry[];
  circuitRecords: DynamicCircuitRecord[];
  recentFastestLaps: any[];
  milestones: {
    mostWinsCount: number;
    mostWinsHolder: string;
    mostPolesCount: number;
    mostPolesHolder: string;
    mostConstructorWinsCount: number;
    mostConstructorWinsHolder: string;
    longestWinStreakCount: number;
    longestWinStreakHolder: string;
    longestWinStreakYear: number;
    totalSeasons: number;
    firstSeason: number;
    latestSeason: number;
  };
}

export function calculateHistoricalRecords(): HistoricalRecordsData {
  return memo("historicalRecords", CORE_FILES, () => {
    const ds = getDataset();

    // 1. Wins, Podiums, Fastest Laps, Starts by Driver
    const driverWins = new Map<number, number>();
    const driverPodiums = new Map<number, number>();
    const driverFastestLaps = new Map<number, number>();
    const driverStarts = new Map<number, number>();
    const constructorWins = new Map<number, number>();

    ds.results.forEach((r) => {
      driverStarts.set(r.driverId, (driverStarts.get(r.driverId) || 0) + 1);

      if (r.position === 1) {
        driverWins.set(r.driverId, (driverWins.get(r.driverId) || 0) + 1);
        constructorWins.set(r.constructorId, (constructorWins.get(r.constructorId) || 0) + 1);
      }
      if (r.position !== null && r.position >= 1 && r.position <= 3) {
        driverPodiums.set(r.driverId, (driverPodiums.get(r.driverId) || 0) + 1);
      }
      if (r.rank === 1) {
        driverFastestLaps.set(r.driverId, (driverFastestLaps.get(r.driverId) || 0) + 1);
      }
    });

    // 2. Poles
    const polesMap = getPoleCounts().byDriver;

    // 3. Driver championships
    const driverTitles = new Map<number, number>();
    ds.driverChampionByYear.forEach((dId) => {
      driverTitles.set(dId, (driverTitles.get(dId) || 0) + 1);
    });

    // 4. Constructor championships
    const constructorTitles = new Map<number, number>();
    ds.constructorChampionByYear.forEach((cId) => {
      constructorTitles.set(cId, (constructorTitles.get(cId) || 0) + 1);
    });

    // Format top lists
    const formatDriverList = (map: Map<number, number>, limit = 10): DriverRecordEntry[] => {
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([dId, count]) => {
          const d = ds.driverById.get(dId);
          return {
            driverId: dId,
            driverRef: d?.driverRef || "",
            name: d?.fullName || `Driver #${dId}`,
            code: d?.code || (d ? d.surname.substring(0, 3).toUpperCase() : "DRV"),
            nationality: d?.nationality || "",
            flag: flagForNationality(d?.nationality || ""),
            count,
          };
        });
    };

    const topWins = formatDriverList(driverWins);
    const topPoles = formatDriverList(polesMap);
    const topPodiums = formatDriverList(driverPodiums);
    const topChampionships = formatDriverList(driverTitles);
    const topStarts = formatDriverList(driverStarts);
    const topFastestLaps = formatDriverList(driverFastestLaps);

    const topConstructorWins: ConstructorRecordEntry[] = [...constructorWins.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cId, count]) => {
        const c = ds.constructorById.get(cId);
        return {
          constructorId: cId,
          constructorRef: c?.constructorRef || "",
          name: c?.name || `Constructor #${cId}`,
          nationality: c?.nationality || "",
          color: getTeamColor(c?.constructorRef),
          count,
        };
      });

    const topConstructorChampionships: ConstructorRecordEntry[] = [...constructorTitles.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cId, count]) => {
        const c = ds.constructorById.get(cId);
        return {
          constructorId: cId,
          constructorRef: c?.constructorRef || "",
          name: c?.name || `Constructor #${cId}`,
          nationality: c?.nationality || "",
          color: getTeamColor(c?.constructorRef),
          count,
        };
      });

    // 5. Streaks (Longest consecutive wins across chronological races)
    const chronologicalRaces = ds.races;
    const raceWinner = new Map<number, number>();
    ds.results.forEach((r) => {
      if (r.position === 1) raceWinner.set(r.raceId, r.driverId);
    });

    const winStreaks: { driverId: number; streak: number; startIdx: number; endIdx: number }[] = [];
    let currentStreakDriver = -1;
    let currentStreakCount = 0;
    let streakStartIdx = 0;

    for (let i = 0; i < chronologicalRaces.length; i++) {
      const wId = raceWinner.get(chronologicalRaces[i].raceId);
      if (wId && wId === currentStreakDriver) {
        currentStreakCount++;
      } else {
        if (currentStreakCount >= 5 && currentStreakDriver !== -1) {
          winStreaks.push({
            driverId: currentStreakDriver,
            streak: currentStreakCount,
            startIdx: streakStartIdx,
            endIdx: i - 1,
          });
        }
        currentStreakDriver = wId ?? -1;
        currentStreakCount = wId ? 1 : 0;
        streakStartIdx = i;
      }
    }
    if (currentStreakCount >= 5 && currentStreakDriver !== -1) {
      winStreaks.push({
        driverId: currentStreakDriver,
        streak: currentStreakCount,
        startIdx: streakStartIdx,
        endIdx: chronologicalRaces.length - 1,
      });
    }

    winStreaks.sort((a, b) => b.streak - a.streak);
    const longestWinStreaks: StreakEntry[] = winStreaks.slice(0, 8).map((s) => {
      const d = ds.driverById.get(s.driverId);
      const startRace = chronologicalRaces[s.startIdx];
      const endRace = chronologicalRaces[s.endIdx];
      return {
        entityId: s.driverId,
        name: d?.fullName || "Driver",
        code: d?.code || "DRV",
        flag: flagForNationality(d?.nationality || ""),
        streak: s.streak,
        startYear: startRace.year,
        endYear: endRace.year,
        startRace: startRace.name,
        endRace: endRace.name,
      };
    });

    // 6. Youngest & Oldest Race Winners
    const winAges: {
      driverId: number;
      raceId: number;
      ageDays: number;
      date: string;
    }[] = [];

    const recordedWinners = new Set<string>();

    ds.results.forEach((r) => {
      if (r.position !== 1) return;
      const d = ds.driverById.get(r.driverId);
      const race = ds.raceById.get(r.raceId);
      if (!d || !d.dob || !race || !race.date) return;

      const birth = new Date(d.dob);
      const raceDate = new Date(race.date);
      if (isNaN(birth.getTime()) || isNaN(raceDate.getTime())) return;

      const ageMs = raceDate.getTime() - birth.getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      if (ageDays <= 0) return;

      // Unique by driver + race
      const key = `${r.driverId}:${r.raceId}`;
      if (!recordedWinners.has(key)) {
        recordedWinners.add(key);
        winAges.push({
          driverId: r.driverId,
          raceId: r.raceId,
          ageDays,
          date: race.date,
        });
      }
    });

    // Youngest: first win of youngest drivers
    winAges.sort((a, b) => a.ageDays - b.ageDays);
    const youngestSeen = new Set<number>();
    const youngestWinners: AgeRecordEntry[] = [];
    for (const item of winAges) {
      if (!youngestSeen.has(item.driverId)) {
        youngestSeen.add(item.driverId);
        const d = ds.driverById.get(item.driverId)!;
        const race = ds.raceById.get(item.raceId)!;
        const y = Math.floor(item.ageDays / 365.25);
        const dRemain = Math.floor(item.ageDays % 365.25);
        youngestWinners.push({
          driverId: item.driverId,
          name: d.fullName,
          code: d.code,
          flag: flagForNationality(d.nationality),
          raceName: race.name,
          year: race.year,
          date: race.date,
          ageYears: y,
          ageDays: dRemain,
          ageFormatted: `${y} yrs, ${dRemain} days`,
        });
        if (youngestWinners.length >= 10) break;
      }
    }

    // Oldest: latest win of oldest drivers
    winAges.sort((a, b) => b.ageDays - a.ageDays);
    const oldestSeen = new Set<number>();
    const oldestWinners: AgeRecordEntry[] = [];
    for (const item of winAges) {
      if (!oldestSeen.has(item.driverId)) {
        oldestSeen.add(item.driverId);
        const d = ds.driverById.get(item.driverId)!;
        const race = ds.raceById.get(item.raceId)!;
        const y = Math.floor(item.ageDays / 365.25);
        const dRemain = Math.floor(item.ageDays % 365.25);
        oldestWinners.push({
          driverId: item.driverId,
          name: d.fullName,
          code: d.code,
          flag: flagForNationality(d.nationality),
          raceName: race.name,
          year: race.year,
          date: race.date,
          ageYears: y,
          ageDays: dRemain,
          ageFormatted: `${y} yrs, ${dRemain} days`,
        });
        if (oldestWinners.length >= 10) break;
      }
    }

    // 7. Dynamic Circuit Lap Records (derived from lap_times.csv + track_maps.json)
    const trackMaps = readJsonFile<Record<string, any>>("track_maps.json") || {};
    const lapIndex = getLapIndex();

    // Map each circuitId to its fastest recorded lap in lap_times
    const circuitBestLap = new Map<number, { ms: number; driverId: number; raceId: number }>();
    lapIndex.forEach((rl, rId) => {
      const race = ds.raceById.get(rId);
      if (!race) return;
      for (let i = 0; i < rl.length; i++) {
        const ms = rl.ms[i];
        if (ms > 40000 && ms < 300000) {
          const cur = circuitBestLap.get(race.circuitId);
          if (!cur || ms < cur.ms) {
            circuitBestLap.set(race.circuitId, { ms, driverId: rl.driverId[i], raceId: rId });
          }
        }
      }
    });

    const circuitRecords: DynamicCircuitRecord[] = ds.circuits.map((circ) => {
      const best = circuitBestLap.get(circ.circuitId);
      const tm = trackMaps[circ.circuitRef.toLowerCase()];

      let holderName: string | null = null;
      let holderYear: number | null = null;
      let holderTeam: string | null = null;
      let speedKmh: number | null = null;

      if (best) {
        const d = ds.driverById.get(best.driverId);
        const race = ds.raceById.get(best.raceId);
        holderName = d?.fullName || null;
        holderYear = race?.year || null;

        // Team from results
        const res = (ds.resultsByRace.get(best.raceId) || []).find((r) => r.driverId === best.driverId);
        if (res) {
          const c = ds.constructorById.get(res.constructorId);
          holderTeam = c?.name || null;
        }

        if (tm?.lengthKm && best.ms > 0) {
          speedKmh = Math.round((tm.lengthKm / (best.ms / 3600000)) * 100) / 100;
        }
      }

      return {
        circuitId: circ.circuitId,
        circuitRef: circ.circuitRef,
        name: circ.name,
        country: circ.country,
        flag: flagForNationality(circ.country),
        lengthKm: tm?.lengthKm ?? null,
        turns: tm?.turns ?? null,
        drsZones: tm?.drsZones ?? null,
        lapRecord: best ? formatLapMs(best.ms) : null,
        lapRecordMs: best ? best.ms : null,
        recordHolder: holderName,
        recordYear: holderYear,
        recordTeam: holderTeam,
        speedKmh,
      };
    }).filter((cr) => cr.lapRecord !== null).sort((a, b) => (b.recordYear ?? 0) - (a.recordYear ?? 0));

    // 8. Recent fastest laps from fastest_laps.csv
    const rawFl = readTable("fastest_laps.csv");
    const recentFastestLaps = rawFl.map((fl) => {
      const d = ds.driverById.get(Number(fl.driverId));
      return {
        driverId: Number(fl.driverId),
        driverName: d?.fullName || fl.driverCode || "Driver",
        code: fl.driverCode || d?.code || "DRV",
        flag: flagForNationality(d?.nationality || ""),
        lapNumber: Number(fl.lapNumber),
        rank: Number(fl.rank),
        lapTime: fl.lapTime,
        avgSpeedKmh: Number(fl.avgSpeedKmh),
      };
    }).sort((a, b) => a.rank - b.rank);

    // Milestones summary
    const milestones = {
      mostWinsCount: topWins[0]?.count || 0,
      mostWinsHolder: topWins[0]?.name || "None",
      mostPolesCount: topPoles[0]?.count || 0,
      mostPolesHolder: topPoles[0]?.name || "None",
      mostConstructorWinsCount: topConstructorWins[0]?.count || 0,
      mostConstructorWinsHolder: topConstructorWins[0]?.name || "None",
      longestWinStreakCount: longestWinStreaks[0]?.streak || 0,
      longestWinStreakHolder: longestWinStreaks[0]?.name || "None",
      longestWinStreakYear: longestWinStreaks[0]?.endYear || 0,
      totalSeasons: ds.years.length,
      firstSeason: ds.firstYear,
      latestSeason: ds.latestYear,
    };

    return {
      topWins,
      topPoles,
      topPodiums,
      topChampionships,
      topStarts,
      topFastestLaps,
      topConstructorWins,
      topConstructorChampionships,
      longestWinStreaks,
      youngestWinners,
      oldestWinners,
      circuitRecords,
      recentFastestLaps,
      milestones,
    };
  });
}

